/**
 * Color Utilities
 */
export const Colors = {
    /**
     * Array of vibrant, pleasing colors for objects
     */
    PALETTE: [
        '#ef4444', // Red
        '#f97316', // Orange
        '#f59e0b', // Amber
        '#84cc16', // Lime
        '#10b981', // Emerald
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#d946ef', // Fuchsia
        '#f43f5e'  // Rose
    ],

    /**
     * Get a random color from the palette
     */
    random: (): string => {
        return Colors.PALETTE[Math.floor(Math.random() * Colors.PALETTE.length)] as string;
    },

    /**
     * Convert hex to rgba
     */
    hexToRgba: (hex: string, alpha: number = 1): string => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};
