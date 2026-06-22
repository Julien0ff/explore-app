import React from 'react';

export type LiquidGlassEffect = 'clear' | 'regular' | 'none';

/**
 * Utility CSS class generator for liquid glass styling.
 * Can be used with `style` attribute directly on any element.
 */
export function getLiquidGlassStyle(options?: {
  dark?: boolean;
  effect?: LiquidGlassEffect;
  radius?: number;
  tintColor?: string;
}): React.CSSProperties {
  const { dark = true, effect = 'regular', radius = 20, tintColor } = options || {};

  if (effect === 'none') return {};

  const isRegular = effect === 'regular';
  const blur = isRegular ? 44 : 32;
  const saturation = isRegular ? 180 : 200;

  const bg = dark
    ? tintColor || (isRegular ? 'rgba(20, 22, 28, 0.55)' : 'rgba(20, 22, 28, 0.35)')
    : tintColor || (isRegular ? 'rgba(255, 255, 255, 0.60)' : 'rgba(255, 255, 255, 0.45)');

  const borderHighlight = dark
    ? isRegular
      ? '0 1px 0 0 rgba(255,255,255,0.14) inset, 0 0 0 0.5px rgba(255,255,255,0.10) inset'
      : '0 1px 0 0 rgba(255,255,255,0.10) inset, 0 0 0 0.5px rgba(255,255,255,0.06) inset'
    : isRegular
      ? '0 1px 0 0 rgba(255,255,255,0.65) inset, 0 0 0 0.5px rgba(255,255,255,0.35) inset'
      : '0 1px 0 0 rgba(255,255,255,0.50) inset, 0 0 0 0.5px rgba(255,255,255,0.25) inset';

  const shadow = dark
    ? '0 20px 60px -22px rgba(0,0,0,0.55)'
    : '0 20px 60px -22px rgba(0,0,0,0.15)';

  return {
    backgroundColor: bg,
    backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
    boxShadow: `${borderHighlight}, ${shadow}`,
    borderRadius: radius,
  };
}
