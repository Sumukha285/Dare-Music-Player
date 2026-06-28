export type ThemeId = 'immersive' | 'synthwave' | 'cyberpunk' | 'forest' | 'royal' | 'glass' | 'vinyl';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  emoji: string;
  fontSans: string;
  fontDisplay: string;
  fontMono: string;
  bgClass: string;
  cardClass: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string; // Tailwind color class like 'violet-500' or hex/rgb
  accentHex: string; // CSS compatible hex
  visualizerStyle: 'immersive-glow' | 'neon-bars' | 'digital-matrix' | 'organic-leaves' | 'golden-rings' | 'glass-wave' | 'analog-vu';
  equalizerColor: string; // Tailwind color class for equalizer sliders
  vinylAnimate: boolean; // spin vinyl animation
  additionalStyles?: string; // Custom inline rules or custom classes
}

export interface Caption {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number; // in seconds
  url?: string; // empty or specific URL. If empty, uses procedural synthesizer
  coverUrl?: string; // cover image path/placeholder
  captions?: Caption[];
}

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 7 numbers representing -12 to 12 dB for each band
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  isEditable?: boolean;
}

export const EQUALIZER_BANDS = [60, 150, 400, 1000, 3000, 8000, 15000] as const;
export type EqualizerBand = typeof EQUALIZER_BANDS[number];
