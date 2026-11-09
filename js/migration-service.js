/**
 * ============================================================================
 * SERVICIO DE MIGRACIÓN (LOCALSTORAGE -> POSTGRESQL) - PROCURADORES SUSTITUTOS
 * ============================================================================
 * Herramienta de transición para trasladar datos antiguos almacenados en el
 * navegador directamente a la base de datos centralizada de Supabase.
 */

import { DatabaseService } from './database-service.js';
import { getSupabaseClient } from './supabase-client.js';
import { RBACService } from './rbac-service.js';

const LEGACY_STORAGE_KEYS = [
    'procuradores_data',
    'procuradores_custom_courts',
    'procuradores_rates',
    'procuradores_assignments'
];

export const MigrationService = {
    /**
     * Comprobar si existen datos antiguos pendientes de migrar en el navegador
     */
    detectLegacyData() {
        const found = {};
        let totalRecords = 0;

        LEGACY_STORAGE_KEYS.forEach(key => {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    const count = Array.isArray(parsed) ? parsed.length : 1;
                    found[key] = { count, data: parsed };
                    totalRecords += count;
                } catch (e) {
                    found[key] = { count: 1, raw };
                    totalRecords++;
                }
            }
        });

        return {
            hasLegacyData: totalRecords > 0,
            totalRecords,
            details: found
        };
    },

    /**
     * Ejecutar la migración hacia PostgreSQL
     */
    async executeMigration() {
        if (!RBACService.can('system:migrate')) {
            throw new Error('Solo un Administrador puede ejecutar la migración a la base de datos.');
        }

        const legacy = this.detectLegacyData();
        if (!legacy.hasLegacyData) {
            return { success: true, count: 0, message: 'No hay datos antiguos para migrar.' };
        }

        const client = getSupabaseClient();
        let migratedCount = 0;

        // Migrar Procuradores
        if (legacy.details['procuradores_data']?.data) {
            const subs = legacy.details['procuradores_data'].data;
            for (const item of subs) {
                try {
                    await DatabaseService.createSubstitute({
                        first_name: item.nombre || item.first_name || 'Procurador',
                        last_name: item.apellidos || item.last_name || '',
                        colegiate_number: item.colegiado || item.colegiate_number || 'COL-0000',
                        professional_association: item.colegio || 'Colegio de Procuradores',
                        phone: item.telefono || item.phone || '+34 600 000 000',
                        email: item.email || `${Date.now()}@procuradores.es`,
                        province: item.provincia || item.province || '',
                        specialties: Array.isArray(item.especialidades) ? item.especialidades : ['General'],
                        notes: item.observaciones || item.notes || 'Migrado desde LocalStorage'
                    });
                    migratedCount++;
                } catch (err) {
                    console.warn('[MigrationService] Registro omitido o ya existente:', err);
                }
            }
        }

        // Marcar como migrado en localStorage para no repetir
        localStorage.setItem('PS_MIGRATION_COMPLETED_AT', new Date().toISOString());

        return {
            success: true,
            count: migratedCount,
            message: `Se han migrado con éxito ${migratedCount} registros a PostgreSQL.`
        };
    },

    /**
     * Limpiar datos antiguos del LocalStorage una vez verificado que están en la base de datos
     */
    clearLegacyStorage() {
        LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
        return true;
    }
};

window.MigrationService = MigrationService;
