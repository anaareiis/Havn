/**
 * Havn brand palette. Ocean blue conveys stability/trust, harbor gold marks
 * highlights and calls to action. Every pair below meets WCAG AA (4.5:1) for
 * text on its matching background.
 */
export const palette = {
  blue900: '#08243D',
  blue700: '#0F4C81',
  blue600: '#1868AC',
  blue400: '#4A9FDE',
  blue200: '#BFE0FA',
  blue100: '#E6F4FE',

  gold700: '#8A6A22',
  gold500: '#C79A45',
  gold300: '#E0B563',
  gold100: '#F5E6C8',

  green600: '#1F7A54',
  green400: '#2E9E6C',
  green300: '#4CC38A',

  red600: '#B03A3A',
  red400: '#D14343',
  red300: '#E5726B',

  navy900: '#0B1520',
  navy800: '#121F2E',
  navy700: '#223247',
  slate500: '#5B6B7C',
  slate400: '#93A5B8',
  slate200: '#E1E6EC',
  slate100: '#F6F8FB',
  white: '#FFFFFF',
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
  textOnAccent: string;
  primary: string;
  primaryPressed: string;
  accent: string;
  accentPressed: string;
  success: string;
  danger: string;
}

export const lightColors: ThemeColors = {
  background: palette.slate100,
  surface: palette.white,
  surfaceAlt: palette.blue100,
  border: palette.slate200,
  textPrimary: palette.navy900,
  textSecondary: palette.slate500,
  textOnPrimary: palette.white,
  textOnAccent: palette.navy900,
  primary: palette.blue700,
  primaryPressed: palette.blue600,
  accent: palette.gold500,
  accentPressed: palette.gold700,
  success: palette.green400,
  danger: palette.red400,
};

export const darkColors: ThemeColors = {
  background: palette.navy900,
  surface: palette.navy800,
  surfaceAlt: palette.blue900,
  border: palette.navy700,
  textPrimary: palette.slate100,
  textSecondary: palette.slate400,
  textOnPrimary: palette.navy900,
  textOnAccent: palette.navy900,
  primary: palette.blue400,
  primaryPressed: palette.blue200,
  accent: palette.gold300,
  accentPressed: palette.gold100,
  success: palette.green300,
  danger: palette.red300,
};
