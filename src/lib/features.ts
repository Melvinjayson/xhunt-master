export type MaturityTier = 'starter' | 'growth' | 'enterprise';

export interface NavFlags {
  outcomes: boolean;
  analytics: boolean;
  agents: boolean;
  knowledgeGraph: boolean;
  xilHub: boolean;
  economy: boolean;
  audience: boolean;
  rewards: boolean;
  marketplace: boolean;
  governance: boolean;
  developers: boolean;
}

export interface FeatureToggles {
  advancedAnalytics: boolean;
  customAgents: boolean;
  knowledgeGraph: boolean;
  xilIntelligence: boolean;
  economyProtocol: boolean;
  marketplace: boolean;
  governance: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  sso: boolean;
}

export interface BrandingSettings {
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  appName: string | null;
}

export interface TenantFeatureConfig {
  maturity: MaturityTier;
  theme: 'dark' | 'light' | 'system';
  nav: NavFlags;
  features: FeatureToggles;
  branding: BrandingSettings;
}

const STARTER_NAV: NavFlags = {
  outcomes: true,
  analytics: false,
  agents: false,
  knowledgeGraph: false,
  xilHub: false,
  economy: false,
  audience: false,
  rewards: false,
  marketplace: false,
  governance: false,
  developers: false,
};

const GROWTH_NAV: NavFlags = {
  outcomes: true,
  analytics: true,
  agents: true,
  knowledgeGraph: false,
  xilHub: false,
  economy: false,
  audience: true,
  rewards: true,
  marketplace: true,
  governance: false,
  developers: false,
};

const ENTERPRISE_NAV: NavFlags = {
  outcomes: true,
  analytics: true,
  agents: true,
  knowledgeGraph: true,
  xilHub: true,
  economy: true,
  audience: true,
  rewards: true,
  marketplace: true,
  governance: true,
  developers: true,
};

const STARTER_FEATURES: FeatureToggles = {
  advancedAnalytics: false,
  customAgents: false,
  knowledgeGraph: false,
  xilIntelligence: false,
  economyProtocol: false,
  marketplace: false,
  governance: false,
  apiAccess: false,
  whiteLabel: false,
  sso: false,
};

const GROWTH_FEATURES: FeatureToggles = {
  advancedAnalytics: true,
  customAgents: true,
  knowledgeGraph: false,
  xilIntelligence: false,
  economyProtocol: false,
  marketplace: true,
  governance: false,
  apiAccess: false,
  whiteLabel: false,
  sso: false,
};

const ENTERPRISE_FEATURES: FeatureToggles = {
  advancedAnalytics: true,
  customAgents: true,
  knowledgeGraph: true,
  xilIntelligence: true,
  economyProtocol: true,
  marketplace: true,
  governance: true,
  apiAccess: true,
  whiteLabel: true,
  sso: true,
};

export const MATURITY_DEFAULTS: Record<MaturityTier, TenantFeatureConfig> = {
  starter: {
    maturity: 'starter',
    theme: 'dark',
    nav: STARTER_NAV,
    features: STARTER_FEATURES,
    branding: { logoUrl: null, primaryColor: null, accentColor: null, appName: null },
  },
  growth: {
    maturity: 'growth',
    theme: 'dark',
    nav: GROWTH_NAV,
    features: GROWTH_FEATURES,
    branding: { logoUrl: null, primaryColor: null, accentColor: null, appName: null },
  },
  enterprise: {
    maturity: 'enterprise',
    theme: 'dark',
    nav: ENTERPRISE_NAV,
    features: ENTERPRISE_FEATURES,
    branding: { logoUrl: null, primaryColor: null, accentColor: null, appName: null },
  },
};

export function getDefaultConfig(plan: string): TenantFeatureConfig {
  if (plan === 'enterprise') return { ...MATURITY_DEFAULTS.enterprise };
  if (plan === 'growth') return { ...MATURITY_DEFAULTS.growth };
  return { ...MATURITY_DEFAULTS.starter };
}

export function mergeFeatureConfig(
  base: TenantFeatureConfig,
  overrides: Partial<TenantFeatureConfig>
): TenantFeatureConfig {
  return {
    ...base,
    ...overrides,
    nav: { ...base.nav, ...(overrides.nav ?? {}) },
    features: { ...base.features, ...(overrides.features ?? {}) },
    branding: { ...base.branding, ...(overrides.branding ?? {}) },
  };
}
