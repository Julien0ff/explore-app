/**
 * LiquidGlass — CSS-based glassmorphism inspired by iOS 26 liquid glass.
 *
 * Uses pure CSS backdrop-filter + inset box-shadows for a real translucent glass
 * effect, following the patterns from liquidglassdesign.com.
 *
 * The old SVG displacement filter approach was invisible in practice.
 * This CSS approach is both more performant and visually stunning.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { LiquidGlassEffect } from '../../lib/liquidGlass';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  /** Border radius of the glass container */
  radius?: number;
  /** Glass effect mode */
  effect?: LiquidGlassEffect;
  /** Optional tint color overlay (CSS color value) */
  tintColor?: string;
  /** Toggle to enable/disable the glass effect entirely */
  enabled?: boolean;
  /** Dark mode */
  dark?: boolean;
  /** Make interactive (hover lift effect) */
  interactive?: boolean;
  /** Custom style overrides */
  style?: React.CSSProperties;
}

export function LiquidGlass({
  children,
  className,
  radius = 20,
  effect = 'regular',
  tintColor,
  enabled = true,
  dark = true,
  interactive = false,
  style,
}: LiquidGlassProps) {

  // When disabled or effect is 'none', render a simple container
  if (!enabled || effect === 'none') {
    return (
      <div
        className={clsx("relative overflow-hidden", className)}
        style={{ borderRadius: radius, ...style }}
      >
        {children}
      </div>
    );
  }

  // Glass parameters based on effect mode
  const params = effect === 'clear'
    ? {
        bg: dark
          ? tintColor || 'rgba(20, 22, 28, 0.35)'
          : tintColor || 'rgba(255, 255, 255, 0.45)',
        blur: 32,
        saturation: 200,
        borderHighlight: dark
          ? '0 1px 0 0 rgba(255,255,255,0.10) inset, 0 0 0 0.5px rgba(255,255,255,0.06) inset'
          : '0 1px 0 0 rgba(255,255,255,0.50) inset, 0 0 0 0.5px rgba(255,255,255,0.25) inset',
        shadow: dark
          ? '0 8px 32px -8px rgba(0,0,0,0.4)'
          : '0 8px 32px -8px rgba(0,0,0,0.12)',
      }
    : {
        bg: dark
          ? tintColor || 'rgba(20, 22, 28, 0.55)'
          : tintColor || 'rgba(255, 255, 255, 0.60)',
        blur: 44,
        saturation: 180,
        borderHighlight: dark
          ? '0 1px 0 0 rgba(255,255,255,0.14) inset, 0 0 0 0.5px rgba(255,255,255,0.10) inset'
          : '0 1px 0 0 rgba(255,255,255,0.65) inset, 0 0 0 0.5px rgba(255,255,255,0.35) inset',
        shadow: dark
          ? '0 20px 60px -22px rgba(0,0,0,0.55)'
          : '0 20px 60px -22px rgba(0,0,0,0.15)',
      };

  const glassStyle: React.CSSProperties = {
    backgroundColor: params.bg,
    backdropFilter: `blur(${params.blur}px) saturate(${params.saturation}%)`,
    WebkitBackdropFilter: `blur(${params.blur}px) saturate(${params.saturation}%)`,
    boxShadow: `${params.borderHighlight}, ${params.shadow}`,
    borderRadius: radius,
    transition: interactive
      ? 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease'
      : 'background-color 0.3s ease',
    ...style,
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden",
        interactive && "hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
        className
      )}
      style={glassStyle}
    >
      {children}
    </div>
  );
}


