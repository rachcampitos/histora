export interface SpecialtyChipConfig {
  icon: string;
  family: 'blue' | 'purple' | 'rose' | 'green' | 'amber';
}

const SPECIALTY_MAP: Record<string, SpecialtyChipConfig> = {
  // Blue family
  'Enfermeria General': { icon: 'medical-outline', family: 'blue' },
  'Cuidados Intensivos': { icon: 'pulse-outline', family: 'blue' },
  'Cuidados Paliativos': { icon: 'flower-outline', family: 'blue' },
  // Purple family
  'Pediatria': { icon: 'happy-outline', family: 'purple' },
  'Geriatria': { icon: 'accessibility-outline', family: 'purple' },
  // Rose family
  'Cardiologia': { icon: 'heart-outline', family: 'rose' },
  'Oncologia': { icon: 'ribbon-outline', family: 'rose' },
  'Salud Mental': { icon: 'fitness-outline', family: 'rose' },
  // Green family
  'Rehabilitacion': { icon: 'body-outline', family: 'green' },
  'Traumatologia': { icon: 'bandage-outline', family: 'green' },
  // Amber family
  'Diabetes': { icon: 'water-outline', family: 'amber' },
  'Heridas y Ostomias': { icon: 'shield-checkmark-outline', family: 'amber' },
};

const FAMILY_COLORS = {
  blue:   { bgLight: '#dbeafe', textLight: '#1e40af', bgDark: '#1e3a5f', textDark: '#93c5fd' },
  purple: { bgLight: '#f3e8ff', textLight: '#7c3aed', bgDark: '#4c1d95', textDark: '#c4b5fd' },
  rose:   { bgLight: '#ffe4e6', textLight: '#be123c', bgDark: '#881337', textDark: '#fda4af' },
  green:  { bgLight: '#dcfce7', textLight: '#15803d', bgDark: '#14532d', textDark: '#86efac' },
  amber:  { bgLight: '#fef3c7', textLight: '#b45309', bgDark: '#78350f', textDark: '#fcd34d' },
};

const DEFAULT_CONFIG: SpecialtyChipConfig = { icon: 'medkit-outline', family: 'blue' };

export function getSpecialtyConfig(specialty: string): SpecialtyChipConfig {
  return SPECIALTY_MAP[specialty] || DEFAULT_CONFIG;
}

export function getSpecialtyColors(family: string, isDark: boolean): { bg: string; text: string } {
  const colors = FAMILY_COLORS[family as keyof typeof FAMILY_COLORS] || FAMILY_COLORS.blue;
  return isDark
    ? { bg: colors.bgDark, text: colors.textDark }
    : { bg: colors.bgLight, text: colors.textLight };
}
