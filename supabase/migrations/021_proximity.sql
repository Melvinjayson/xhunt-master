-- 021_proximity.sql
-- Proximity intelligence: add geolocation fields to missions and user_profiles

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS location_type    text CHECK (location_type IN ('remote', 'local', 'hybrid')),
  ADD COLUMN IF NOT EXISTS location_city    text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS lat              double precision,
  ADD COLUMN IF NOT EXISTS lng              double precision,
  ADD COLUMN IF NOT EXISTS radius_km        integer DEFAULT 50 CHECK (radius_km > 0 AND radius_km <= 500);

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS location_city    text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS lat              double precision,
  ADD COLUMN IF NOT EXISTS lng              double precision;

-- Indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_missions_latlong
  ON public.missions (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_missions_location_type
  ON public.missions (location_type)
  WHERE location_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_latlong
  ON public.user_profiles (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Haversine distance in km between two points (used by server-side ranking)
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) RETURNS double precision
LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT 6371.0 * 2 * ASIN(SQRT(
    POW(SIN(RADIANS(lat2 - lat1) / 2), 2) +
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
    POW(SIN(RADIANS(lng2 - lng1) / 2), 2)
  ))
$$;

-- Helper: find missions within radius_km of a point
CREATE OR REPLACE FUNCTION public.missions_near(
  user_lat  double precision,
  user_lng  double precision,
  max_km    double precision DEFAULT 50
)
RETURNS TABLE (
  id        uuid,
  title     text,
  distance_km double precision
)
LANGUAGE sql STABLE AS $$
  SELECT id, title,
         public.haversine_km(user_lat, user_lng, lat, lng) AS distance_km
  FROM public.missions
  WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND public.haversine_km(user_lat, user_lng, lat, lng) <= max_km
  ORDER BY distance_km ASC
$$;
