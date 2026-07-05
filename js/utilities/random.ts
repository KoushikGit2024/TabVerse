/**
 * Random Utilities
 */
export const Random = {
    /**
     * Random float between min and max
     */
    float: (min: number, max: number): number => Math.random() * (max - min) + min,

    /**
     * Random integer between min and max (inclusive)
     */
    int: (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min,

    /**
     * Get a random element from an array
     */
    element: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T,
    
    /**
     * Generate a unique ID (UUID v4 approximation for simplicity)
     */
    uuid: (): string => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};
