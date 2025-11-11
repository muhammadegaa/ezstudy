import { getContrastRatio, checkWCAGAA } from '@/lib/accessibility';

describe('Accessibility Utilities', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0); // Perfect contrast
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#000000', '#000000');
      expect(ratio).toBe(1);
    });

    it('should handle hex colors without #', () => {
      const ratio = getContrastRatio('000000', 'ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });
  });

  describe('checkWCAGAA', () => {
    it('should pass AAA for black on white', () => {
      const result = checkWCAGAA('#000000', '#ffffff');
      expect(result.pass).toBe(true);
      expect(result.level).toBe('AAA');
    });

    it('should pass AA for dark gray on white', () => {
      const result = checkWCAGAA('#525252', '#ffffff'); // gray-600 on white
      expect(result.pass).toBe(true);
      expect(result.level).toBe('AA');
    });

    it('should fail for light gray on white', () => {
      const result = checkWCAGAA('#d4d4d4', '#ffffff'); // gray-300 on white
      expect(result.pass).toBe(false);
      expect(result.level).toBe('FAIL');
    });

    it('should require lower ratio for large text', () => {
      const result = checkWCAGAA('#737373', '#ffffff', true); // gray-500 on white, large text
      expect(result.pass).toBe(true); // Should pass for large text (3:1 requirement)
    });
  });
});

