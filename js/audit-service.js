/**
 * ============================================================================
 * SERVICIO DE AUDITORÍA Y TRAZABILIDAD - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Registro y consulta de operaciones realizadas por usuarios en la base de datos.
 */

import { getSupabaseClient } from './supabase-client.js';
import { RBACService } from './rbac-service.js';

export const AuditService = {
    /**
     * Consultar historial de cambios para el Panel de Administración
     */
    async getLogs(filters = {}) {
        if (!RBACService.can('audit:read')) {
            throw new Error('Acceso denegado: Se requiere rol de Administrador para consultar auditoría.');
        }

        const client = getSupabaseClient();
        if (!client) {
            // Logs simulados para entorno demostración
            return [
                {
                    id: 'aud-1',
                    action: 'INSERT',
                    table_name: 'substitutes',
                    record_id: 's0000000-0000-0000-0000-000000000001',
                    user_email: 'admin@procuradoressustitutos.es',
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    new_data: { first_name: 'Elena', last_name: 'Gómez Fernández', colegiate_number: 'COL-28491' }
                },
                {
                    id: 'aud-2',
                    action: 'UPDATE',
                    table_name: 'rates',
                    record_id: 'r0000000-0000-0000-0000-000000000001',
                    user_email: 'editor@colegioprocuradores.es',
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    old_data: { amount: 50.00 },
                    new_data: { amount: 60.00 }
                },
                {
                    id: 'aud-3',
                    action: 'USER_SIGNUP',
                    table_name: 'profiles',
                    record_id: 'usr-demo-1',
                    user_email: 'nuevo.usuario@despacho.com',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    new_data: { role: 'reader', email: 'nuevo.usuario@despacho.com' }
                }
            ];
        }

        let query = client
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(filters.limit || 50);

        if (filters.table_name) {
            query = query.eq('table_name', filters.table_name);
        }

        if (filters.action) {
            query = query.eq('action', filters.action);
        }

        const { data, error } = await query;
        if (error) {
            throw new Error(`Error al cargar registro de auditoría: ${error.message}`);
        }

        return data || [];
    },

    /**
     * Registrar manualmente un evento especial de auditoría (ej: exportación de copias de seguridad)
     */
    async logSystemEvent(action, tableName, details) {
        const client = getSupabaseClient();
        if (!client) return;

        try {
            await client.from('audit_logs').insert({
                action,
                table_name: tableName,
                record_id: details.recordId || null,
                new_data: details
            });
        } catch (err) {
            console.warn('[AuditService] No se pudo registrar log manual:', err);
        }
    }
};

window.AuditService = AuditService;

