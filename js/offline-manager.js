/**
 * ============================================================================
 * GESTOR DE ESTADO DE RED Y CONECTIVIDAD - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Supervisa la conexión, actualiza el indicador visual y previene escrituras ciegas.
 */

import { testConnection } from './supabase-client.js';

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let connectionDetails = { status: 'idle', message: 'Iniciando...' };
const statusListeners = new Set();

export const OfflineManager = {
    init() {
        window.addEventListener('online', () => {
            isOnline = true;
            this.checkServer();
        });

        window.addEventListener('offline', () => {
            isOnline = false;
            this._setStatus('offline', 'Sin conexión a Internet (Modo Solo Lectura)');
        });

        // Verificación inicial
        this.checkServer();

        // Sondeo periódico cada 60 segundos
        setInterval(() => this.checkServer(), 60000);
    },

    async checkServer() {
        if (!navigator.onLine) {
            isOnline = false;
            this._setStatus('offline', 'Sin conexión a Internet (Modo Solo Lectura)');
            return;
        }

        this._setStatus('syncing', 'Verificando enlace con servidor...');
        const res = await testConnection();

        if (res.ok) {
            isOnline = true;
            this._setStatus('connected', `PostgreSQL en línea (${res.latency}ms)`);
        } else if (res.status === 'unconfigured') {
            isOnline = true;
            this._setStatus('unconfigured', 'Supabase pendiente de configuración');
        } else {
            isOnline = false;
            this._setStatus('error', `Error de servidor: ${res.message}`);
        }
    },

    _setStatus(status, message) {
        connectionDetails = { status, message };
        this._updateUiBadge();
        statusListeners.forEach(cb => {
            try { cb(connectionDetails); } catch (e) {}
        });
    },

    _updateUiBadge() {
        const badge = document.getElementById('connection-status-badge');
        if (!badge) return;

        badge.className = `status-pill status-${connectionDetails.status}`;
        let icon = '🟢';
        if (connectionDetails.status === 'offline') icon = '🔴';
        if (connectionDetails.status === 'syncing') icon = '🟡';
        if (connectionDetails.status === 'unconfigured') icon = '⚪';
        if (connectionDetails.status === 'error') icon = '⚠️';

        badge.innerHTML = `<span class="status-dot"></span> <span class="status-text">${connectionDetails.message}</span>`;
    },

    subscribe(callback) {
        statusListeners.add(callback);
        callback(connectionDetails);
        return () => statusListeners.delete(callback);
    },

    isNetworkAvailable() {
        return isOnline && connectionDetails.status !== 'offline';
    },

    /**
     * Guardia de seguridad de operaciones de escritura:
     * Lanza error si no hay conexión real para nunca mentirle al usuario
     */
    assertCanWrite() {
        if (!navigator.onLine || connectionDetails.status === 'offline') {
            throw new Error(
                'Sin conexión a Internet. La operación no se ha guardado para evitar discrepancias y pérdida de datos.'
            );
        }
    }
};

window.OfflineManager = OfflineManager;
