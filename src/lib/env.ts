import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY:  z.string().min(1),
  GROQ_API_KEY:               z.string().min(1),
  ANTHROPIC_API_KEY:          z.string().optional(),
  STRIPE_SECRET_KEY:          z.string().min(1),
  STRIPE_WEBHOOK_SECRET:      z.string().min(1),
  STRIPE_PRO_PRICE_ID:        z.string().min(1),
  SESSION_SECRET:             z.string().min(32).optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:              z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY:         z.string().min(1),
  NEXT_PUBLIC_FIREBASE_API_KEY:          z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:      z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:       z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:   z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID:           z.string().min(1),
});

export const env = {
  groqApiKey:             process.env.GROQ_API_KEY ?? '',
  anthropicApiKey:        process.env.ANTHROPIC_API_KEY ?? '',
  stripeSecretKey:        process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret:    process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripeProPriceId:       process.env.STRIPE_PRO_PRICE_ID ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  sessionSecret:          process.env.SESSION_SECRET ?? '',
} as const;

export const publicEnv = {
  supabaseUrl:                  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey:              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  firebaseApiKey:               process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  firebaseAuthDomain:           process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  firebaseProjectId:            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  firebaseStorageBucket:        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  firebaseMessagingSenderId:    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  firebaseAppId:                process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
} as const;

export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const serverResult = serverSchema.safeParse(process.env);
  if (!serverResult.success) {
    const issues = serverResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Production env validation failed: ${issues}`);
  }

  const publicResult = publicSchema.safeParse(process.env);
  if (!publicResult.success) {
    const issues = publicResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Production public env validation failed: ${issues}`);
  }
}
