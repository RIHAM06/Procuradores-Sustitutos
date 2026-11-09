/**
 * ============================================================================
 * SERVICIO EN TIEMPO REAL (SUPABASE REALTIME) - PROCURADORES SUSTITUTOS
 * ============================================================================
 * Sincronización instantánea multidispositivo entre navegadores y ordenadores
 * sin recargar la página.
 */

import { getSupabaseClient } from './supabase-client.js';

let realtimeChannel = null;
const eventListeners = new Set();

export const RealtimeService = {
    /**
     * Iniciar suscripción a canales de PostgreSQL
     */
    init() {
        const client = getSupabaseClient();
        if (!client) {
            console.log('[RealtimeService] Supabase no configurado, modo local activo');
            return;
        }

        try {
            // Canal centralizado para tablas operativas
            realtimeChannel = client
                .channel('db-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'substitutes' },
                    (payload) => this._handleRealtimeEvent('substitute', payload)
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'courts' },
                    (payload) => this._handleRealtimeEvent('court', payload)
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'rates' },
                    (payload) => this._handleRealtimeEvent('rate', payload)
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'substitute_courts' },
                    (payload) => this._handleRealtimeEvent('assignment', payload)
                )
                .subscribe((status) => {
                    console.log(`[RealtimeService] Estado del canal en tiempo real: ${status}`);
                });
        } catch (err) {
            console.error('[RealtimeService] Error conectando canal en tiempo real:', err);
        }
    },

    _handleRealtimeEvent(entity, payload) {
        console.log(`[RealtimeService] Evento recibido (${entity}):`, payload);

        // Despachar evento del navegador para que la interfaz se refresque automáticamente
        const customEvent = new CustomEvent(`realtime:${entity}-change`, {
            detail: {
                eventType: payload.eventType, // 'INSERT' | 'UPDATE' | 'DELETE'
                newRecord: payload.new,
                oldRecord: payload.old,
                entity
            }
        });
        window.dispatchEvent(customEvent);

        // Mostrar notificación visual
        this._showSyncToast(entity, payload.eventType);

        // Notificar a observadores registrados
        eventListeners.forEach(cb => {
            try { cb(entity, payload); } catch (e) {}
        });
    },

    _showSyncToast(entity, eventType) {
        let action = 'actualizado';
        if (eventType === 'INSERT') action = 'añadido';
        if (eventType === 'DELETE') action = 'eliminado';

        let name = 'Registro';
        if (entity === 'substitute') name = 'Procurador';
        if (entity === 'court') name = 'Juzgado';
        if (entity === 'rate') name = 'Tarifa';
        if (entity === 'assignment') name = 'Asignación';

        const toast = document.createElement('div');
        toast.className = 'realtime-toast animate-slide-up';
        toast.innerHTML = `
            <span class="toast-icon">⚡</span>
            <div class="toast-content">
                <strong>Sincronización en Vivo</strong>
                <p>${name} ${action} desde otro dispositivo.</p>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    },

    subscribe(callback) {
        eventListeners.add(callback);
        return () => eventListeners.delete(callback);
    },

    destroy() {
        if (realtimeChannel) {
            const client = getSupabaseClient();
            if (client) client.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
    }
};

window.RealtimeService = RealtimeService;
