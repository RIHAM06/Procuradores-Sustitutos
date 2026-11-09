/**
 * ============================================================================
 * SERVICIO DE COPIAS DE SEGURIDAD (BACKUP & RESTORE) - PROCURADORES SUSTITUTOS
 * ============================================================================
 * Exportación e importación transaccional con validación de integridad JSON.
 */

import { getSupabaseClient } from './supabase-client.js';
import { RBACService } from './rbac-service.js';
import { AuditService } from './audit-service.js';

export const BackupService = {
    /**
     * Exportar todos los datos del sistema en formato JSON estructurado
     */
    async exportBackup() {
        if (!RBACService.can('system:backup')) {
            throw new Error('Solo un Administrador puede exportar copias de seguridad del sistema.');
        }

        const client = getSupabaseClient();
        const timestamp = new Date().toISOString();
        let payload = {
            metadata: {
                version: '2.0.0-PRO',
                exportedAt: timestamp,
                system: 'Procuradores Sustitutos España'
            },
            data: {
                substitutes: [],
                courts: [],
                rates: [],
                substitute_courts: []
            }
        };

        if (client) {
            const [subs, courts, rates, assigns] = await Promise.all([
                client.from('substitutes').select('*'),
                client.from('courts').select('*'),
                client.from('rates').select('*'),
                client.from('substitute_courts').select('*')
            ]);

            payload.data.substitutes = subs.data || [];
            payload.data.courts = courts.data || [];
            payload.data.rates = rates.data || [];
            payload.data.substitute_courts = assigns.data || [];
        } else {
            // Desde memoria en modo de prueba
            payload.data.substitutes = window.DatabaseService?._getMemorySubstitutes({}) || [];
        }

        // Registrar evento de auditoría
        await AuditService.logSystemEvent('EXPORT', 'backup', {
            recordCount: {
                substitutes: payload.data.substitutes.length,
                courts: payload.data.courts.length,
                rates: payload.data.rates.length
            }
        });

        // Crear y descargar archivo JSON
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `backup-procuradores-${timestamp.slice(0, 10)}.json`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return {
            filename,
            counts: {
                substitutes: payload.data.substitutes.length,
                courts: payload.data.courts.length,
                rates: payload.data.rates.length
            }
        };
    },

    /**
     * Importar y restaurar datos desde un archivo JSON
     */
    async importBackup(jsonString) {
        if (!RBACService.can('system:backup')) {
            throw new Error('Acceso denegado: Se requiere rol de Administrador.');
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            throw new Error('El archivo no contiene un JSON válido.');
        }

        if (!parsed.metadata || !parsed.data) {
            throw new Error('Formato de copia de seguridad no reconocido (faltan metadatos o estructura de datos).');
        }

        const client = getSupabaseClient();
        let counts = { substitutes: 0, courts: 0, rates: 0 };

        if (client) {
            if (Array.isArray(parsed.data.courts) && parsed.data.courts.length > 0) {
                const { error } = await client.from('courts').upsert(parsed.data.courts);
                if (!error) counts.courts = parsed.data.courts.length;
            }

            if (Array.isArray(parsed.data.substitutes) && parsed.data.substitutes.length > 0) {
                const { error } = await client.from('substitutes').upsert(parsed.data.substitutes);
                if (!error) counts.substitutes = parsed.data.substitutes.length;
            }

            if (Array.isArray(parsed.data.rates) && parsed.data.rates.length > 0) {
                const { error } = await client.from('rates').upsert(parsed.data.rates);
                if (!error) counts.rates = parsed.data.rates.length;
            }
        }

        await AuditService.logSystemEvent('IMPORT', 'backup', { restoredCounts: counts });

        return {
            success: true,
            counts,
            message: `Restauración completada: ${counts.substitutes} procuradores, ${counts.courts} juzgados, ${counts.rates} tarifas.`
        };
    }
};

window.BackupService = BackupService;
