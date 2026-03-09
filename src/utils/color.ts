/** Convert hex color string to 0xAARRGGBB decimal integer */
export function hexToArgbInt(hex: string, alpha = 0xff): number {
  const clean = hex.replace("#", "").replace("0x", "");

  if (clean.length === 8) {
    // Already AARRGGBB
    return parseInt(clean, 16) >>> 0;
  }

  if (clean.length === 6) {
    // RRGGBB -> add alpha
    return ((alpha << 24) | parseInt(clean, 16)) >>> 0;
  }

  throw new Error(`Invalid hex color: ${hex}`);
}

/** Convert 0xAARRGGBB decimal integer to hex string */
export function argbIntToHex(value: number): string {
  const unsigned = value >>> 0;
  return `#${unsigned.toString(16).padStart(8, "0").toUpperCase()}`;
}

/** Common Elastic Dashboard colors */
export const COLORS = {
  green: 4283215696, // 0xFF4CAF50
  red: 4294198070, // 0xFFF44336
  white: 4294967295, // 0xFFFFFFFF
  lightBlue: 4278238420, // 0xFF03DAC4
  yellow: 4294951175, // 0xFFFFEB3B
  blue: 4280391411, // 0xFF2196F3
} as const;
