import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
function luminance(hex: string) {
  const channels = [1, 3, 5].map(offset => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1]! + 0.05) / (values[0]! + 0.05);
}

for (const theme of ['light', 'dark']) {
  it(`${theme} semantic text, focus and form-boundary colors meet contrast targets`, () => {
    const block = theme === 'light' ? css.split('}')[0]! : css.split(":root[data-theme='dark'] {")[1]!.split('}')[0]!;
    const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/g)].map(match => [match[1]!, match[2]!]));
    for (const background of ['bg', 'surface', 'sidebar']) {
      for (const foreground of ['text', 'muted', 'accent', 'danger']) {
        expect(contrast(tokens[foreground]!, tokens[background]!)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(tokens['control-border']!, tokens[background]!)).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(tokens.success!, tokens['success-soft']!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.warning!, tokens['warning-soft']!)).toBeGreaterThanOrEqual(4.5);
  });
}
