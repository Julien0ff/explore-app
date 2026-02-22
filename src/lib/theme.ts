
export interface ThemeColors {
  text: string;
  bg: string;
  border: string;
  ring: string;
  bgSolid: string;
  bgHover: string;
  gradientFrom: string;
  gradientTo: string;
  focusBorder: string;
  focusShadow: string;
  shadow: string;
  borderSubtle: string;
  textHover: string;
  hex: string;
}

export const getAccentColorClass = (color: string, isDark: boolean): ThemeColors => {
  const colors: Record<string, ThemeColors> = {
    blue: {
      text: isDark ? 'text-blue-400' : 'text-blue-600',
      bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
      border: 'border-blue-500',
      ring: 'focus:ring-blue-500/50',
      bgSolid: 'bg-blue-500',
      bgHover: 'hover:bg-blue-600',
      gradientFrom: isDark ? 'from-blue-400' : 'from-blue-500',
      gradientTo: isDark ? 'to-blue-600' : 'to-blue-700',
      focusBorder: 'focus:border-blue-500/50',
      focusShadow: 'focus:shadow-blue-500/10',
      shadow: 'shadow-blue-500/20',
      borderSubtle: isDark ? 'border-blue-500/20' : 'border-blue-200',
      textHover: isDark ? 'hover:text-blue-400' : 'hover:text-blue-600',
      hex: '#3b82f6',
    },
    purple: {
      text: isDark ? 'text-purple-400' : 'text-purple-600',
      bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
      border: 'border-purple-500',
      ring: 'focus:ring-purple-500/50',
      bgSolid: 'bg-purple-500',
      bgHover: 'hover:bg-purple-600',
      gradientFrom: isDark ? 'from-purple-400' : 'from-purple-500',
      gradientTo: isDark ? 'to-purple-600' : 'to-purple-700',
      focusBorder: 'focus:border-purple-500/50',
      focusShadow: 'focus:shadow-purple-500/10',
      shadow: 'shadow-purple-500/20',
      borderSubtle: isDark ? 'border-purple-500/20' : 'border-purple-200',
      textHover: isDark ? 'hover:text-purple-400' : 'hover:text-purple-600',
      hex: '#a855f7',
    },
    green: {
      text: isDark ? 'text-green-400' : 'text-green-600',
      bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
      border: 'border-green-500',
      ring: 'focus:ring-green-500/50',
      bgSolid: 'bg-green-500',
      bgHover: 'hover:bg-green-600',
      gradientFrom: isDark ? 'from-green-400' : 'from-green-500',
      gradientTo: isDark ? 'to-green-600' : 'to-green-700',
      focusBorder: 'focus:border-green-500/50',
      focusShadow: 'focus:shadow-green-500/10',
      shadow: 'shadow-green-500/20',
      borderSubtle: isDark ? 'border-green-500/20' : 'border-green-200',
      textHover: isDark ? 'hover:text-green-400' : 'hover:text-green-600',
      hex: '#22c55e',
    },
    orange: {
      text: isDark ? 'text-orange-400' : 'text-orange-600',
      bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      border: 'border-orange-500',
      ring: 'focus:ring-orange-500/50',
      bgSolid: 'bg-orange-500',
      bgHover: 'hover:bg-orange-600',
      gradientFrom: isDark ? 'from-orange-400' : 'from-orange-500',
      gradientTo: isDark ? 'to-orange-600' : 'to-orange-700',
      focusBorder: 'focus:border-orange-500/50',
      focusShadow: 'focus:shadow-orange-500/10',
      shadow: 'shadow-orange-500/20',
      borderSubtle: isDark ? 'border-orange-500/20' : 'border-orange-200',
      textHover: isDark ? 'hover:text-orange-400' : 'hover:text-orange-600',
      hex: '#f97316',
    },
    pink: {
      text: isDark ? 'text-pink-400' : 'text-pink-600',
      bg: isDark ? 'bg-pink-500/10' : 'bg-pink-50',
      border: 'border-pink-500',
      ring: 'focus:ring-pink-500/50',
      bgSolid: 'bg-pink-500',
      bgHover: 'hover:bg-pink-600',
      gradientFrom: isDark ? 'from-pink-400' : 'from-pink-500',
      gradientTo: isDark ? 'to-pink-600' : 'to-pink-700',
      focusBorder: 'focus:border-pink-500/50',
      focusShadow: 'focus:shadow-pink-500/10',
      shadow: 'shadow-pink-500/20',
      borderSubtle: isDark ? 'border-pink-500/20' : 'border-pink-200',
      textHover: isDark ? 'hover:text-pink-400' : 'hover:text-pink-600',
      hex: '#ec4899',
    },
    red: {
      text: isDark ? 'text-red-400' : 'text-red-600',
      bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      border: 'border-red-500',
      ring: 'focus:ring-red-500/50',
      bgSolid: 'bg-red-500',
      bgHover: 'hover:bg-red-600',
      gradientFrom: isDark ? 'from-red-400' : 'from-red-500',
      gradientTo: isDark ? 'to-red-600' : 'to-red-700',
      focusBorder: 'focus:border-red-500/50',
      focusShadow: 'focus:shadow-red-500/10',
      shadow: 'shadow-red-500/20',
      borderSubtle: isDark ? 'border-red-500/20' : 'border-red-200',
      textHover: isDark ? 'hover:text-red-400' : 'hover:text-red-600',
      hex: '#ef4444',
    },
  };

  return colors[color] || colors.blue;
};
