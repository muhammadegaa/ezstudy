/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance checking and utilities
 */

/**
 * Calculate relative luminance for a color
 * Based on WCAG 2.1 guidelines
 */
function getLuminance(hex: string): number {
  // Remove # if present
  const rgb = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(rgb.substring(0, 2), 16) / 255;
  const g = parseInt(rgb.substring(2, 4), 16) / 255;
  const b = parseInt(rgb.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * WCAG requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param color1 - Foreground color (hex)
 * @param color2 - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Object with pass status and ratio
 */
export function checkWCAGAA(
  color1: string,
  color2: string,
  isLargeText: boolean = false
): { pass: boolean; ratio: number; level: 'AA' | 'AAA' | 'FAIL' } {
  const ratio = getContrastRatio(color1, color2);
  const requiredRatio = isLargeText ? 3 : 4.5;
  const aaaRatio = isLargeText ? 4.5 : 7;

  if (ratio >= aaaRatio) {
    return { pass: true, ratio, level: 'AAA' };
  } else if (ratio >= requiredRatio) {
    return { pass: true, ratio, level: 'AA' };
  } else {
    return { pass: false, ratio, level: 'FAIL' };
  }
}

/**
 * Verify all color combinations in the design system meet WCAG AA
 */
export function verifyDesignSystemColors(): Array<{
  foreground: string;
  background: string;
  ratio: number;
  pass: boolean;
  level: 'AA' | 'AAA' | 'FAIL';
}> {
  const results: Array<{
    foreground: string;
    background: string;
    ratio: number;
    pass: boolean;
    level: 'AA' | 'AAA' | 'FAIL';
  }> = [];

  // Common text/background combinations from design system
  const combinations = [
    // Primary buttons
    { fg: '#ffffff', bg: '#2563eb', name: 'Primary button text' }, // primary-600
    { fg: '#ffffff', bg: '#1d4ed8', name: 'Primary button hover' }, // primary-700
    // Error states
    { fg: '#ffffff', bg: '#dc2626', name: 'Error button text' }, // error-600
    { fg: '#ffffff', bg: '#ef4444', name: 'Error text' }, // error-500
    // Success states
    { fg: '#ffffff', bg: '#16a34a', name: 'Success button text' }, // success-600
    // Text on white
    { fg: '#171717', bg: '#ffffff', name: 'Dark text on white' }, // gray-900 on white
    { fg: '#525252', bg: '#ffffff', name: 'Medium text on white' }, // gray-600 on white
    { fg: '#737373', bg: '#ffffff', name: 'Light text on white' }, // gray-500 on white
    // Text on gray backgrounds
    { fg: '#ffffff', bg: '#171717', name: 'White text on dark' }, // white on gray-900
    { fg: '#171717', bg: '#f5f5f5', name: 'Dark text on light gray' }, // gray-900 on gray-100
  ];

  combinations.forEach(({ fg, bg, name }) => {
    const result = checkWCAGAA(fg, bg);
    results.push({
      foreground: fg,
      background: bg,
      ratio: result.ratio,
      pass: result.pass,
      level: result.level,
    });
  });

  return results;
}

