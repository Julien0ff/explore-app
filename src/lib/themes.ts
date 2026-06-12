export interface ExploreTheme {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  author: string;
  colors: {
    // Main backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    // Sidebar & topbar
    sidebarBg: string;
    topbarBg: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    // Borders
    borderColor: string;
    borderSubtle: string;
    // Accent overrides
    accent: string;
    accentHover: string;
    accentText: string;
    // Special
    inputBg: string;
    cardBg: string;
    hoverBg: string;
  };
  // Optional wallpaper
  wallpaper?: string;
  // Preview gradient for the store card
  preview: string;
  // Is it a dark or light base
  mode: 'dark' | 'light';
}

export const PREDEFINED_THEMES: ExploreTheme[] = [
  {
    id: 'midnight-aurora',
    name: 'Aurore de Minuit',
    nameEn: 'Midnight Aurora',
    description: 'Un thème sombre profond avec des reflets d\'aurora boréale',
    descriptionEn: 'A deep dark theme with northern aurora reflections',
    author: 'Explore Team',
    mode: 'dark',
    preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    colors: {
      bgPrimary: '#0f0c29',
      bgSecondary: '#161236',
      bgTertiary: '#1d1745',
      sidebarBg: '#0d0a24',
      topbarBg: '#0d0a24',
      textPrimary: '#e8e6f0',
      textSecondary: '#a09cb8',
      textMuted: '#6b6584',
      borderColor: 'rgba(139, 92, 246, 0.15)',
      borderSubtle: 'rgba(139, 92, 246, 0.08)',
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      accentText: '#c4b5fd',
      inputBg: 'rgba(139, 92, 246, 0.08)',
      cardBg: 'rgba(139, 92, 246, 0.05)',
      hoverBg: 'rgba(139, 92, 246, 0.1)',
    }
  },
  {
    id: 'ocean-breeze',
    name: 'Brise Océane',
    nameEn: 'Ocean Breeze',
    description: 'Comme une plongée dans les profondeurs marines',
    descriptionEn: 'Like diving into the ocean depths',
    author: 'Explore Team',
    mode: 'dark',
    preview: 'linear-gradient(135deg, #0a1628 0%, #0d2847 50%, #1a4060 100%)',
    colors: {
      bgPrimary: '#0a1628',
      bgSecondary: '#0d2137',
      bgTertiary: '#122d4a',
      sidebarBg: '#081320',
      topbarBg: '#081320',
      textPrimary: '#d4e8f7',
      textSecondary: '#7ba8c9',
      textMuted: '#4a7a9b',
      borderColor: 'rgba(56, 189, 248, 0.15)',
      borderSubtle: 'rgba(56, 189, 248, 0.06)',
      accent: '#38bdf8',
      accentHover: '#0ea5e9',
      accentText: '#7dd3fc',
      inputBg: 'rgba(56, 189, 248, 0.08)',
      cardBg: 'rgba(56, 189, 248, 0.04)',
      hoverBg: 'rgba(56, 189, 248, 0.1)',
    }
  },
  {
    id: 'rosewood',
    name: 'Bois de Rose',
    nameEn: 'Rosewood',
    description: 'Chaleureux et élégant, aux tons roses délicats',
    descriptionEn: 'Warm and elegant, with delicate rose tones',
    author: 'Explore Team',
    mode: 'dark',
    preview: 'linear-gradient(135deg, #1a0a14 0%, #2d1424 50%, #4a1942 100%)',
    colors: {
      bgPrimary: '#1a0a14',
      bgSecondary: '#22101c',
      bgTertiary: '#2d1424',
      sidebarBg: '#150810',
      topbarBg: '#150810',
      textPrimary: '#f0d5e3',
      textSecondary: '#c08da5',
      textMuted: '#845c72',
      borderColor: 'rgba(236, 72, 153, 0.15)',
      borderSubtle: 'rgba(236, 72, 153, 0.07)',
      accent: '#ec4899',
      accentHover: '#db2777',
      accentText: '#f9a8d4',
      inputBg: 'rgba(236, 72, 153, 0.08)',
      cardBg: 'rgba(236, 72, 153, 0.04)',
      hoverBg: 'rgba(236, 72, 153, 0.1)',
    }
  },
  {
    id: 'emerald-forest',
    name: 'Forêt d\'Émeraude',
    nameEn: 'Emerald Forest',
    description: 'Un voyage au cœur d\'une forêt tropicale',
    descriptionEn: 'A journey to the heart of a tropical forest',
    author: 'Explore Team',
    mode: 'dark',
    preview: 'linear-gradient(135deg, #0a1a0f 0%, #0d2a18 50%, #1a4a28 100%)',
    colors: {
      bgPrimary: '#0a1a0f',
      bgSecondary: '#0d2215',
      bgTertiary: '#12301d',
      sidebarBg: '#08150c',
      topbarBg: '#08150c',
      textPrimary: '#d4f0de',
      textSecondary: '#7ac098',
      textMuted: '#4a8a68',
      borderColor: 'rgba(16, 185, 129, 0.15)',
      borderSubtle: 'rgba(16, 185, 129, 0.06)',
      accent: '#10b981',
      accentHover: '#059669',
      accentText: '#6ee7b7',
      inputBg: 'rgba(16, 185, 129, 0.08)',
      cardBg: 'rgba(16, 185, 129, 0.04)',
      hoverBg: 'rgba(16, 185, 129, 0.1)',
    }
  },
  {
    id: 'sunset-glow',
    name: 'Lueur du Crépuscule',
    nameEn: 'Sunset Glow',
    description: 'Les tons chauds d\'un coucher de soleil sur la mer',
    descriptionEn: 'The warm tones of a sunset over the sea',
    author: 'Explore Team',
    mode: 'dark',
    preview: 'linear-gradient(135deg, #1a0f0a 0%, #2a1a0d 50%, #3d2414 100%)',
    colors: {
      bgPrimary: '#1a0f0a',
      bgSecondary: '#22150d',
      bgTertiary: '#2d1c12',
      sidebarBg: '#150c08',
      topbarBg: '#150c08',
      textPrimary: '#f0ddd4',
      textSecondary: '#c09a80',
      textMuted: '#84654a',
      borderColor: 'rgba(251, 146, 60, 0.15)',
      borderSubtle: 'rgba(251, 146, 60, 0.07)',
      accent: '#fb923c',
      accentHover: '#f97316',
      accentText: '#fdba74',
      inputBg: 'rgba(251, 146, 60, 0.08)',
      cardBg: 'rgba(251, 146, 60, 0.04)',
      hoverBg: 'rgba(251, 146, 60, 0.1)',
    }
  },
  {
    id: 'arctic-snow',
    name: 'Neige Arctique',
    nameEn: 'Arctic Snow',
    description: 'Un thème clair, pur et minimaliste',
    descriptionEn: 'A clean, pure and minimalist light theme',
    author: 'Explore Team',
    mode: 'light',
    preview: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    colors: {
      bgPrimary: '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgTertiary: '#e2e8f0',
      sidebarBg: '#ffffff',
      topbarBg: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      borderColor: 'rgba(148, 163, 184, 0.3)',
      borderSubtle: 'rgba(148, 163, 184, 0.15)',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentText: '#2563eb',
      inputBg: '#f1f5f9',
      cardBg: '#ffffff',
      hoverBg: 'rgba(59, 130, 246, 0.06)',
    }
  },
  {
    id: 'lavender-dream',
    name: 'Rêve de Lavande',
    nameEn: 'Lavender Dream',
    description: 'Un thème clair avec une touche de mauve apaisant',
    descriptionEn: 'A light theme with a soothing touch of lavender',
    author: 'Explore Team',
    mode: 'light',
    preview: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 50%, #ddd6fe 100%)',
    colors: {
      bgPrimary: '#faf5ff',
      bgSecondary: '#f3edff',
      bgTertiary: '#ede9fe',
      sidebarBg: '#fdfcff',
      topbarBg: '#fdfcff',
      textPrimary: '#1e1b4b',
      textSecondary: '#4c1d95',
      textMuted: '#8b5cf6',
      borderColor: 'rgba(139, 92, 246, 0.2)',
      borderSubtle: 'rgba(139, 92, 246, 0.1)',
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      accentText: '#6d28d9',
      inputBg: '#f3edff',
      cardBg: '#ffffff',
      hoverBg: 'rgba(139, 92, 246, 0.06)',
    }
  },
  {
    id: 'neon-cyberpunk',
    name: 'Néon Cyberpunk',
    nameEn: 'Neon Cyberpunk',
    description: 'Un thème futuriste aux néons électriques',
    descriptionEn: 'A futuristic theme with electric neons',
    author: 'Explore Team',
    mode: 'dark',
    preview: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a1a2e 100%)',
    colors: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#111111',
      bgTertiary: '#1a1a1a',
      sidebarBg: '#050505',
      topbarBg: '#050505',
      textPrimary: '#e0f2fe',
      textSecondary: '#67e8f9',
      textMuted: '#22d3ee',
      borderColor: 'rgba(6, 182, 212, 0.25)',
      borderSubtle: 'rgba(6, 182, 212, 0.1)',
      accent: '#06b6d4',
      accentHover: '#22d3ee',
      accentText: '#67e8f9',
      inputBg: 'rgba(6, 182, 212, 0.08)',
      cardBg: 'rgba(6, 182, 212, 0.04)',
      hoverBg: 'rgba(6, 182, 212, 0.12)',
    }
  },
];

// Get active theme from localStorage
export function getActiveThemeId(): string | null {
  return localStorage.getItem('explore-theme-id');
}

// Save active theme
export function setActiveThemeId(id: string | null): void {
  if (id) {
    localStorage.setItem('explore-theme-id', id);
  } else {
    localStorage.removeItem('explore-theme-id');
  }
}

// Get the theme object by id
export function getActiveTheme(): ExploreTheme | null {
  const id = getActiveThemeId();
  if (!id) return null;
  return PREDEFINED_THEMES.find(t => t.id === id) || null;
}

// Apply theme as CSS variables on document root
export function applyTheme(theme: ExploreTheme | null): void {
  const root = document.documentElement;
  if (!theme) {
    // Remove all custom properties
    root.style.removeProperty('--theme-bg-primary');
    root.style.removeProperty('--theme-bg-secondary');
    root.style.removeProperty('--theme-bg-tertiary');
    root.style.removeProperty('--theme-sidebar-bg');
    root.style.removeProperty('--theme-topbar-bg');
    root.style.removeProperty('--theme-text-primary');
    root.style.removeProperty('--theme-text-secondary');
    root.style.removeProperty('--theme-text-muted');
    root.style.removeProperty('--theme-border-color');
    root.style.removeProperty('--theme-border-subtle');
    root.style.removeProperty('--theme-accent');
    root.style.removeProperty('--theme-accent-hover');
    root.style.removeProperty('--theme-accent-text');
    root.style.removeProperty('--theme-input-bg');
    root.style.removeProperty('--theme-card-bg');
    root.style.removeProperty('--theme-hover-bg');
    root.removeAttribute('data-explore-theme');
    return;
  }

  root.style.setProperty('--theme-bg-primary', theme.colors.bgPrimary);
  root.style.setProperty('--theme-bg-secondary', theme.colors.bgSecondary);
  root.style.setProperty('--theme-bg-tertiary', theme.colors.bgTertiary);
  root.style.setProperty('--theme-sidebar-bg', theme.colors.sidebarBg);
  root.style.setProperty('--theme-topbar-bg', theme.colors.topbarBg);
  root.style.setProperty('--theme-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--theme-text-muted', theme.colors.textMuted);
  root.style.setProperty('--theme-border-color', theme.colors.borderColor);
  root.style.setProperty('--theme-border-subtle', theme.colors.borderSubtle);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-accent-hover', theme.colors.accentHover);
  root.style.setProperty('--theme-accent-text', theme.colors.accentText);
  root.style.setProperty('--theme-input-bg', theme.colors.inputBg);
  root.style.setProperty('--theme-card-bg', theme.colors.cardBg);
  root.style.setProperty('--theme-hover-bg', theme.colors.hoverBg);
  root.setAttribute('data-explore-theme', theme.id);
}
