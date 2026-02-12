/**
 * Environment configuration for dev/prod separation
 * 
 * Aplicando @clean-code: configuração centralizada e type-safe
 */

export const ENV = {
  mode: import.meta.env.MODE as 'development' | 'production',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  api: {
    base: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api',
    ws: import.meta.env.VITE_WS_BASE || 'ws://localhost:3000',
  },
  
  features: {
    // Dev-only features
    playground: import.meta.env.DEV,
    debugPanel: import.meta.env.DEV,
    mockData: import.meta.env.VITE_USE_MOCK === 'true',
    
    // Feature flags
    enableVirtualization: true,
    enableAnimations: true,
  },
} as const;

// Type-safe feature check
export function isFeatureEnabled(feature: keyof typeof ENV.features): boolean {
  return ENV.features[feature] === true;
}

// Dev-only helper
export function devOnly<T>(callback: () => T): T | undefined {
  if (ENV.isDev) {
    return callback();
  }
  return undefined;
}
