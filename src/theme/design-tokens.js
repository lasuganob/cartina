/**
 * Centralized design tokens for the application.
 * These are used across the theme and components to ensure consistency 
 * between mobile and desktop versions.
 */
export const tokens = {
  // Border Radius
  radius: {
    mobile: 8,      // borderRadius: 1
    desktop: 16,     // borderRadius: 2
    pill: 999
  },

  // Spacing & Padding
  spacing: {
    mobilePadding: 16,
    desktopPadding: 24
  },

  // Typography
  fontSize: {
    tiny: '10px',
    small: '12px',
    normal: '14px',
    large: '16px',
    xl: '20px'
  },

  // Colors (Shared Palette)
  colors: {
    forest: 'rgb(74, 101, 85)',
    forestLight: 'rgba(74, 101, 85, 0.8)',
    background: '#f5f7f2',
    textWhite: '#f5f7f2'
  },

  // Layout Constants
  layout: {
    drawerWidth: 260,
    topBarHeight: 64
  }
};
