/** @type {const} */
const themeColors = {
  // Logo-derived palette: Deep navy, neon electric blue, warm gold
  primary: { light: '#0099FF', dark: '#00AAFF' },       // Neon Electric Blue (signature glow)
  background: { light: '#ffffff', dark: '#040810' },    // White / Deepest navy-black (logo bg)
  surface: { light: '#F8F9FA', dark: '#0A1628' },       // Light gray / Dark navy surface
  foreground: { light: '#111827', dark: '#F0F6FF' },    // Near black / Cool white
  muted: { light: '#6B7280', dark: '#5B8DB8' },         // Gray / Blue-tinted secondary text
  border: { light: '#E5E7EB', dark: 'rgba(0, 170, 255, 0.25)' }, // Neon blue border glow
  // Accent colors from logo
  accent: { light: '#DC2626', dark: '#FF2D2D' },        // Red (flag accent)
  glow: { light: '#3B82F6', dark: '#00CCFF' },          // Bright cyan glow
  gold: { light: '#D97706', dark: '#FFB800' },          // Gold (waveform accent)
  // Status colors
  success: { light: '#16A34A', dark: '#00FF88' },       // Neon green
  warning: { light: '#EAB308', dark: '#FFD600' },       // Warm yellow
  error: { light: '#DC2626', dark: '#FF4444' },         // Red
  // Active/tint
  tint: { light: '#0099FF', dark: '#00AAFF' },          // Neon blue for active states
};

module.exports = { themeColors };
