import { PrivyClientConfig } from '@privy-io/react-auth';

// IMPORTANT: Get your Privy App ID from https://privy.io
// For now, we'll use a demo mode if no valid App ID is provided
export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

// Obtener la URL base para redirect URIs
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // En producción, usar el dominio de Vercel
  return import.meta.env.VITE_APP_URL || 'https://cycle-sync-poze.vercel.app';
};

export const privyConfig = {
  appId: PRIVY_APP_ID,
  config: {
    // Métodos de login habilitados
    loginMethods: ['email', 'google', 'telegram', 'apple'],
    
    // Configuración de OAuth
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
    
    // Configuración de apariencia
    appearance: {
      theme: 'light',
      accentColor: '#16697A',
      logo: '/cyra-logo.png', // Plan4HER logo
    },
    
    // Configuración legal (requerida para producción)
    legal: {
      termsAndConditionsUrl: undefined,
      privacyPolicyUrl: undefined,
    },
    
    // Configuración de redirect URIs
    // Nota: Los redirect URIs también deben configurarse en el dashboard de Privy
    // Dashboard > Settings > OAuth > Redirect URIs
    // Agregar: http://localhost:8080, https://tu-dominio.com
  } as PrivyClientConfig,
};
