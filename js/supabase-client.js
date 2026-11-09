/**
 * ============================================================================
 * CLIENTE SUPABASE - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Singleton del cliente oficial de Supabase con reconexión y monitorización.
 */

import { APP_CONFIG } from './config.js';

let supabaseClient = null;
let connectionStatus = 'idle'; // 'idle' | 'connected' | 'unconfigured' | 'error' | 'offline'

export function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    if (!APP_CONFIG.supabase.isConfigured()) {
        connectionStatus = 'unconfigured';
        return null;
    }

    try {
        // La librería oficial de Supabase se carga desde CDN en index.html como window.supabase
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(
                APP_CONFIG.supabase.url,
                APP_CONFIG.supabase.anonKey,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    },
                    realtime: {
                        params: {
                            eventsPerSecond: 10
                        }
                    }
                }
            );
            connectionStatus = 'connected';
            return supabaseClient;
        } else {
            console.warn('[SupabaseClient] Biblioteca @supabase/supabase-js no detectada en window');
            connectionStatus = 'error';
            return null;
        }
    } catch (err) {
        console.error('[SupabaseClient] Error inicializando cliente:', err);
        connectionStatus = 'error';
        return null;
    }
}

/**
 * Comprobar la conexión real ejecutando una consulta ligera a PostgreSQL
 */
export async function testConnection() {
    const client = getSupabaseClient();
    if (!client) {
        return {
            ok: false,
            status: connectionStatus,
            message: 'Supabase no está configurado con claves válidas.'
        };
    }

    try {
        const start = performance.now();
        const { count, error } = await client
            .from('roles')
            .select('*', { count: 'exact', head: true });

        const latency = Math.round(performance.now() - start);

        if (error) {
            connectionStatus = 'error';
            return {
                ok: false,
                status: 'error',
                latency,
                error: error.message,
                message: `Error de servidor PostgreSQL: ${error.message}`
            };
        }

        connectionStatus = 'connected';
        return {
            ok: true,
            status: 'connected',
            latency,
            message: `Conexión activa con PostgreSQL en Supabase (${latency}ms)`
        };
    } catch (err) {
        connectionStatus = 'offline';
        return {
            ok: false,
            status: 'offline',
            error: err.message,
            message: 'No se pudo conectar con el servidor (sin conexión o bloqueo de red).'
        };
    }
}

export function getConnectionStatus() {
    return connectionStatus;
}

window.getSupabaseClient = getSupabaseClient;
window.testConnection = testConnection;
