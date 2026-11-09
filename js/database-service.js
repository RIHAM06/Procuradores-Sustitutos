/**
 * ============================================================================
 * SERVICIO DE BASE DE DATOS (POSTGRESQL / SUPABASE) - PROCURADORES SUSTITUTOS
 * ============================================================================
 * Operaciones CRUD completas con control de concurrencia optimista,
 * auditoría y validación estricta en servidor.
 */

import { getSupabaseClient } from './supabase-client.js';
import { RBACService } from './rbac-service.js';
import { OfflineManager } from './offline-manager.js';
import { ValidationService } from './validation.js';

// Base de datos en memoria para el modo demostración cuando las claves no están configuradas
let memoryStore = {
    substitutes: [],
    courts: [],
    rates: [],
    substitute_courts: []
};

export const DatabaseService = {
    // ------------------------------------------------------------------------
    // PROCURADORES SUSTITUTOS (SUBSTITUTES)
    // ------------------------------------------------------------------------
    async getSubstitutes(filters = {}) {
        const client = getSupabaseClient();
        if (!client) {
            return this._getMemorySubstitutes(filters);
        }

        let query = client
            .from('substitutes')
            .select(`
                *,
                substitute_courts (
                    id,
                    court_id,
                    is_primary,
                    courts (
                        id,
                        name,
                        municipality,
                        province
                    )
                ),
                rates (
                    id,
                    service_type,
                    amount,
                    currency,
                    description
                )
            `)
            .eq('status', 'active')
            .order('last_name', { ascending: true });

        if (filters.province) {
            query = query.eq('province', filters.province);
        }

        if (filters.search) {
            const term = `%${filters.search}%`;
            query = query.or(`first_name.ilike.${term},last_name.ilike.${term},colegiate_number.ilike.${term}`);
        }

        const { data, error } = await query;
        if (error) {
            console.error('[DatabaseService] Error al obtener procuradores:', error);
            throw new Error(`Error en base de datos: ${error.message}`);
        }

        return data || [];
    },

    async getSubstituteById(id) {
        const client = getSupabaseClient();
        if (!client) {
            return memoryStore.substitutes.find(s => s.id === id) || null;
        }

        const { data, error } = await client
            .from('substitutes')
            .select(`
                *,
                substitute_courts (
                    id,
                    court_id,
                    is_primary,
                    courts (*)
                ),
                rates (*)
            `)
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async createSubstitute(subData) {
        OfflineManager.assertCanWrite();
        if (!RBACService.can('substitutes:create')) {
            throw new Error('Permisos insuficientes: Se requiere rol de Editor o Administrador.');
        }

        const val = ValidationService.validateSubstitute(subData);
        if (!val.isValid) {
            throw new Error(`Validación fallida: ${val.errors.join(' ')}`);
        }

        const client = getSupabaseClient();
        if (!client) {
            const newSub = {
                id: 'sub-' + Date.now(),
                ...subData,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            memoryStore.substitutes.push(newSub);
            return newSub;
        }

        const payload = {
            first_name: ValidationService.sanitize(subData.first_name),
            last_name: ValidationService.sanitize(subData.last_name),
            colegiate_number: ValidationService.sanitize(subData.colegiate_number),
            professional_association: ValidationService.sanitize(subData.professional_association || 'Ilustre Colegio de Procuradores'),
            phone: ValidationService.sanitize(subData.phone),
            email: ValidationService.sanitize(subData.email),
            province: ValidationService.sanitize(subData.province || ''),
            specialties: subData.specialties || [],
            notes: ValidationService.sanitize(subData.notes || ''),
            status: 'active'
        };

        const { data, error } = await client
            .from('substitutes')
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al registrar procurador en PostgreSQL: ${error.message}`);
        }

        return data;
    },

    async updateSubstitute(id, subData, expectedUpdatedAt = null) {
        OfflineManager.assertCanWrite();
        if (!RBACService.can('substitutes:edit')) {
            throw new Error('Permisos insuficientes: Se requiere rol de Editor o Administrador.');
        }

        const client = getSupabaseClient();
        if (!client) {
            const idx = memoryStore.substitutes.findIndex(s => s.id === id);
            if (idx === -1) throw new Error('Procurador no encontrado.');
            memoryStore.substitutes[idx] = {
                ...memoryStore.substitutes[idx],
                ...subData,
                updated_at: new Date().toISOString()
            };
            return memoryStore.substitutes[idx];
        }

        // Control de Concurrencia Optimista
        if (expectedUpdatedAt) {
            const { data: current, error: checkError } = await client
                .from('substitutes')
                .select('updated_at')
                .eq('id', id)
                .single();

            if (!checkError && current && current.updated_at !== expectedUpdatedAt) {
                throw new Error(
                    'Conflicto de concurrencia: Otro usuario modificó este registro mientras lo editabas. Por favor recarga los datos antes de guardar.'
                );
            }
        }

        const { data, error } = await client
            .from('substitutes')
            .update({
                ...subData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Error actualizando procurador en PostgreSQL: ${error.message}`);
        }

        return data;
    },

    async deleteSubstitute(id) {
        OfflineManager.assertCanWrite();
        if (!RBACService.can('substitutes:delete')) {
            throw new Error('Permisos insuficientes: Solo un Administrador puede eliminar registros.');
        }

        const client = getSupabaseClient();
        if (!client) {
            memoryStore.substitutes = memoryStore.substitutes.filter(s => s.id !== id);
            return true;
        }

        const { error } = await client
            .from('substitutes')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error eliminando procurador en PostgreSQL: ${error.message}`);
        }

        return true;
    },

    // ------------------------------------------------------------------------
    // JUZGADOS (COURTS)
    // ------------------------------------------------------------------------
    async getCourts(filters = {}) {
        const client = getSupabaseClient();
        if (!client) {
            return this._getMemoryCourts(filters);
        }

        let query = client
            .from('courts')
            .select('*')
            .eq('status', 'active')
            .order('province', { ascending: true })
            .order('name', { ascending: true });

        if (filters.province) {
            query = query.eq('province', filters.province);
        }

        if (filters.type) {
            query = query.eq('type', filters.type);
        }

        const { data, error } = await query;
        if (error) {
            throw new Error(`Error consultando juzgados: ${error.message}`);
        }

        return data || [];
    },

    // ------------------------------------------------------------------------
    // ASIGNACIONES PROCURADOR - JUZGADO (SUBSTITUTE_COURTS)
    // ------------------------------------------------------------------------
    async assignSubstituteToCourt(substituteId, courtId, isPrimary = false) {
        OfflineManager.assertCanWrite();
        if (!RBACService.can('assignments:create')) {
            throw new Error('Permisos insuficientes para asignar procuradores a juzgados.');
        }

        const client = getSupabaseClient();
        if (!client) {
            memoryStore.substitute_courts.push({
                id: 'sc-' + Date.now(),
                substitute_id: substituteId,
                court_id: courtId,
                is_primary: isPrimary
            });
            return true;
        }

        const { data, error } = await client
            .from('substitute_courts')
            .upsert({
                substitute_id: substituteId,
                court_id: courtId,
                is_primary: isPrimary,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Error creando asignación en base de datos: ${error.message}`);
        }

        return data;
    },

    async removeAssignment(substituteId, courtId) {
        OfflineManager.assertCanWrite();
        if (!RBACService.can('assignments:delete')) {
            throw new Error('Permisos insuficientes para revocar asignación.');
        }

        const client = getSupabaseClient();
        if (!client) {
            memoryStore.substitute_courts = memoryStore.substitute_courts.filter(
                a => !(a.substitute_id === substituteId && a.court_id === courtId)
            );
            return true;
        }

        const { error } = await client
            .from('substitute_courts')
            .delete()
            .match({ substitute_id: substituteId, court_id: courtId });

        if (error) {
            throw new Error(`Error eliminando asignación: ${error.message}`);
        }

        return true;
    },

    // ------------------------------------------------------------------------
    // TARIFAS (RATES)
    // ------------------------------------------------------------------------
    async getRatesBySubstitute(substituteId) {
        const client = getSupabaseClient();
        if (!client) {
            return memoryStore.rates.filter(r => r.substitute_id === substituteId);
        }

        const { data, error } = await client
            .from('rates')
            .select('*')
            .eq('substitute_id', substituteId)
            .eq('status', 'active')
            .order('amount', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    async saveRate(rateData) {
        OfflineManager.assertCanWrite();
        if (!RBACService.can('rates:create')) {
            throw new Error('Permisos insuficientes para crear o modificar tarifas.');
        }

        const val = ValidationService.validateRate(rateData);
        if (!val.isValid) {
            throw new Error(`Validación fallida: ${val.errors.join(' ')}`);
        }

        const client = getSupabaseClient();
        if (!client) {
            const newRate = {
                id: rateData.id || 'rate-' + Date.now(),
                ...rateData,
                status: 'active',
                created_at: new Date().toISOString()
            };
            memoryStore.rates.push(newRate);
            return newRate;
        }

        const payload = {
            substitute_id: rateData.substitute_id,
            court_id: rateData.court_id || null,
            service_type: ValidationService.sanitize(rateData.service_type),
            amount: Number(rateData.amount),
            currency: rateData.currency || 'EUR',
            description: ValidationService.sanitize(rateData.description || ''),
            status: 'active'
        };

        let result;
        if (rateData.id) {
            result = await client
                .from('rates')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', rateData.id)
                .select()
                .single();
        } else {
            result = await client
                .from('rates')
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) {
            throw new Error(`Error guardando tarifa en PostgreSQL: ${result.error.message}`);
        }

        return result.data;
    },

    async deleteRate(rateId) {
        OfflineManager.assertCanWrite();
        if (!RBACService.can('rates:delete')) {
            throw new Error('Permisos insuficientes para eliminar tarifa.');
        }

        const client = getSupabaseClient();
        if (!client) {
            memoryStore.rates = memoryStore.rates.filter(r => r.id !== rateId);
            return true;
        }

        const { error } = await client
            .from('rates')
            .delete()
            .eq('id', rateId);

        if (error) throw new Error(error.message);
        return true;
    },

    // ------------------------------------------------------------------------
    // MÉTODOS AUXILIARES PARA ENTORNO DE PRUEBA EN MEMORIA
    // ------------------------------------------------------------------------
    _getMemorySubstitutes(filters) {
        let list = [...memoryStore.substitutes];
        if (filters.province) {
            list = list.filter(s => s.province === filters.province);
        }
        if (filters.search) {
            const term = filters.search.toLowerCase();
            list = list.filter(s => 
                (s.first_name && s.first_name.toLowerCase().includes(term)) ||
                (s.last_name && s.last_name.toLowerCase().includes(term)) ||
                (s.colegiate_number && s.colegiate_number.toLowerCase().includes(term))
            );
        }
        return list;
    },

    _getMemoryCourts(filters) {
        let list = [...memoryStore.courts];
        if (filters.province) {
            list = list.filter(c => c.province === filters.province);
        }
        return list;
    },

    // Cargar datos preexistentes en memoria
    seedMemoryStore(data) {
        if (data.substitutes) memoryStore.substitutes = data.substitutes;
        if (data.courts) memoryStore.courts = data.courts;
        if (data.rates) memoryStore.rates = data.rates;
        if (data.substitute_courts) memoryStore.substitute_courts = data.substitute_courts;
    }
};

window.DatabaseService = DatabaseService;

