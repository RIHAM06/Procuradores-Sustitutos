/**
 * ============================================================================
 * CONFIGURACIÓN CENTRALIZADA - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Gestión de variables de entorno, credenciales de Supabase y estados del sistema.
 */

const STORAGE_KEYS = {
    SUPABASE_URL: 'PS_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'PS_SUPABASE_ANON_KEY',
    ACTIVE_ORG: 'PS_ACTIVE_ORG_ID',
    OFFLINE_DEMO: 'PS_OFFLINE_DEMO_ALLOWED'
};

// Detección en cascada: Window ENV -> LocalStorage -> Valores predeterminados
function getEnv(key, fallback = '') {
    if (typeof window !== 'undefined') {
        if (window.ENV && window.ENV[key]) return window.ENV[key];
        if (window[key]) return window[key];
        const stored = localStorage.getItem(STORAGE_KEYS[key]);
        if (stored) return stored;
    }
    return fallback;
}

export const APP_CONFIG = {
    version: '2.0.0-PRO',
    environment: 'production',
    
    // Configuración Supabase
    supabase: {
        url: getEnv('SUPABASE_URL', 'https://tu-proyecto.supabase.co'),
        anonKey: getEnv('SUPABASE_ANON_KEY', 'TU_SUPABASE_ANON_KEY'),
        isConfigured: function() {
            return this.url && 
                   this.url !== 'https://tu-proyecto.supabase.co' && 
                   this.anonKey && 
                   this.anonKey !== 'TU_SUPABASE_ANON_KEY';
        }
    },

    // Mapa y teselas: Esri World Street Map (100% libre, sin marcas de agua ni bloqueo 403)
    map: {
        defaultCenter: [40.4168, -3.7038], // Madrid
        defaultZoom: 6,
        tileLayer: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri &mdash; Fuentes: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
    },

    // Valores predeterminados del sistema
    defaults: {
        currency: 'EUR',
        currencySymbol: '€',
        pageSize: 50,
        defaultOrgId: '00000000-0000-0000-0000-000000000001'
    },

    // Guardar credenciales dinámicamente desde el Panel de Administración
    updateSupabaseCredentials(url, anonKey) {
        if (url) localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
        if (anonKey) localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
        this.supabase.url = url.trim();
        this.supabase.anonKey = anonKey.trim();
        return true;
    },

    // Restablecer a valores por defecto
    resetSupabaseCredentials() {
        localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
        localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
    }
};

window.APP_CONFIG = APP_CONFIG;
