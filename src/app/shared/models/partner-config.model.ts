export interface PartnerThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
}

export interface PartnerThemeTypography {
  fontFamily: string;
  fontFamilyHeading: string;
  fontSizeBase: string;
  fontWeightNormal: string;
  fontWeightBold: string;
}

export interface PartnerThemeShape {
  borderRadius: string;
  borderRadiusLg: string;
}

export interface PartnerTheme {
  colors: PartnerThemeColors;
  typography: PartnerThemeTypography;
  shape: PartnerThemeShape;
}

export interface PartnerBranding {
  logoHeader: string;
  logoFooter: string;
  logoIconUrl?: string;
  faviconUrl: string;
  brandName: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  websiteUrl?: string;
}

export interface PartnerUrls {
  privacyPolicy?: string;
  terms?: string;
  website?: string;
  homeCards: string[];
}

export interface PartnerParams {
  locale: string;
  currency?: string;
  dateFormat?: string;
  defaultRoute?: string;
  socialLinks?: Record<string, string>;
  urls: PartnerUrls;
}

export interface PartnerAuth {
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  keycloakClientIdRedirect: string;
}

export interface HomeCard {
  badge: string;
  title: string;
  buttonLabel: string;
}

export interface PartnerTexts {
  common: Record<string, string>;
  home: {
    pageTitle: string;
    cards: HomeCard[];
  };
  auth: Record<string, string>;
  errors: Record<string, string>;
  footer: Record<string, string>;
}

export interface PartnerConfig {
  id: string;
  isActive: boolean;
  branding: PartnerBranding;
  theme: PartnerTheme;
  params: PartnerParams;
  auth: PartnerAuth;
  texts: PartnerTexts;
}
