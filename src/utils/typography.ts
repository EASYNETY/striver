import { Platform } from 'react-native';
import { FONTS } from '../constants/theme';

export const getFontFamily = (
  fontType: 'display' | 'body',
  weight: 'bold' | 'semiBold' | 'medium' | 'regular' | 'light' = 'regular'
): string => {
  try {
    const fontFamily = FONTS[fontType][weight];
    if (!fontFamily) {
      console.warn(`Font ${fontType}.${weight} not found, using fallback`);
      return Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: 'sans-serif',
      }) as string;
    }
    return fontFamily;
  } catch (error) {
    console.error('Font loading error:', error);
    return Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'sans-serif',
    }) as string;
  }
};

export const validateThemeConfig = (config: any): boolean => {
  if (!config.FONTS?.display || !config.FONTS?.body) {
    if (__DEV__) {
      console.error('Theme configuration missing font definitions');
    }
    return false;
  }
  return true;
};

export const TEXT_STYLES = {
  h1: {
    fontFamily: FONTS.display.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: FONTS.display.semiBold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: FONTS.display.medium,
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: FONTS.body.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FONTS.body.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONTS.body.light,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontFamily: FONTS.display.medium,
    fontSize: 16,
    lineHeight: 24,
  },
};
