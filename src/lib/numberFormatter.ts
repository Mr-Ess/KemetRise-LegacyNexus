/**
 * Utility functions for number formatting with Arabic/English support
 */

/**
 * Arabic numerals (٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩)
 */
const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * English numerals (0 1 2 3 4 5 6 7 8 9)
 */
const ENGLISH_NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Convert a number to Arabic numerals
 * @param value - Number or string to convert
 * @returns Converted string with Arabic numerals
 */
export const toArabicNumerals = (value: number | string): string => {
  const str = String(value);
  return str.replace(/\d/g, (digit) => ARABIC_NUMERALS[parseInt(digit, 10)]);
};

/**
 * Convert Arabic numerals to English numerals
 * @param value - String to convert
 * @returns Converted string with English numerals
 */
export const toEnglishNumerals = (value: string): string => {
  return value.replace(/[٠-٩]/g, (digit) =>
    ENGLISH_NUMERALS[ARABIC_NUMERALS.indexOf(digit)]
  );
};

/**
 * Format a number based on language preference
 * @param value - Number to format
 * @param language - Language preference ('en' or 'ar')
 * @returns Formatted number string
 */
export const formatNumber = (value: number | string, language: 'en' | 'ar' = 'en'): string => {
  if (language === 'ar') {
    return toArabicNumerals(value);
  }
  return toEnglishNumerals(String(value));
};

/**
 * Format percentage with language support
 * @param value - Percentage value (0-100)
 * @param language - Language preference
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, language: 'en' | 'ar' = 'en'): string => {
  const formattedValue = formatNumber(Math.round(value), language);
  return language === 'ar' ? `${formattedValue}%` : `${formattedValue}%`;
};

/**
 * Format currency with language support
 * @param value - Amount to format
 * @param currency - Currency code (e.g., 'EGP', 'USD')
 * @param language - Language preference
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency: string = 'EGP',
  language: 'en' | 'ar' = 'en'
): string => {
  const formattedValue = formatNumber(value.toFixed(2), language);
  return language === 'ar' ? `${formattedValue} ${currency}` : `${currency} ${formattedValue}`;
};

/**
 * Format time (ms) with language support
 * @param ms - Time in milliseconds
 * @param language - Language preference
 * @returns Formatted time string
 */
export const formatTime = (ms: number, language: 'en' | 'ar' = 'en'): string => {
  if (ms < 1000) {
    return language === 'ar' ? `${formatNumber(ms, 'ar')}ms` : `${ms}ms`;
  }
  const seconds = Math.round(ms / 1000);
  return language === 'ar'
    ? `${formatNumber(seconds, 'ar')}s`
    : `${seconds}s`;
};
