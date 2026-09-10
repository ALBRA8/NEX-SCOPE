// This file previously contained mock data.
// All views now use real API endpoints (Z.ai + YouTube Data API).
// The only remaining export is `categories` which is used as a reference list.
// If no view imports from this file, it can be safely deleted.

export type CategoryType = 'Tecnología' | 'Finanzas' | 'Salud' | 'Entretenimiento' | 'Educación' | 'Gaming' | 'Cocina' | 'Viajes' | 'Moda' | 'Productividad' | 'Arte' | 'Música';

export const categories: CategoryType[] = [
  'Tecnología', 'Finanzas', 'Salud', 'Entretenimiento',
  'Educación', 'Gaming', 'Cocina', 'Viajes', 'Moda',
  'Productividad', 'Arte', 'Música'
];
