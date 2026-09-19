export const googleMapsApiKey: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || undefined;

// AdvancedMarker needs a map ID; Google's demo ID works for development, set a real one for production styling.
export const googleMapId: string = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
