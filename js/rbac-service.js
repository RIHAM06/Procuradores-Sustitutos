/**
 * ============================================================================
 * CONTROL DE ACCESO BASADO EN ROLES (RBAC) - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Matriz de permisos cliente-servidor para Administradores, Editores y Lectores.
 */

import { AuthService } from './auth-service.js';
import { getSupabaseClient } from './supabase-client.js';

export const ROLES = {
    ADMIN: 'admin',
    EDITOR: 'editor',
    READER: 'reader'
};

const PERMISSIONS = {
    // Lectura de información pública
    'courts:read': [ROLES.ADMIN, ROLES.EDITOR, ROLES.READER],
    'substitutes:read': [ROLES.ADMIN, ROLES.EDITOR, ROLES.READER],
    'rates:read': [ROLES.ADMIN, ROLES.EDITOR, ROLES.READER],
    'assignments:read': [ROLES.ADMIN, ROLES.EDITOR, ROLES.READER],

    // Escritura / Edición
    'courts:create': [ROLES.ADMIN, ROLES.EDITOR],
    'courts:edit': [ROLES.ADMIN, ROLES.EDITOR],
    'substitutes:create': [ROLES.ADMIN, ROLES.EDITOR],
    'substitutes:edit': [ROLES.ADMIN, ROLES.EDITOR],
    'rates:create': [ROLES.ADMIN, ROLES.EDITOR],
    'rates:edit': [ROLES.ADMIN, ROLES.EDITOR],
    'assignments:create': [ROLES.ADMIN, ROLES.EDITOR],
    'assignments:edit': [ROLES.ADMIN, ROLES.EDITOR],

    // Eliminación crítica
    'courts:delete': [ROLES.ADMIN],
    'substitutes:delete': [ROLES.ADMIN],
    'rates:delete': [ROLES.ADMIN, ROLES.EDITOR],
    'assignments:delete': [ROLES.ADMIN, ROLES.EDITOR],

    // Administración del sistema
    'users:manage': [ROLES.ADMIN],
    'roles:assign': [ROLES.ADMIN],
    'audit:read': [ROLES.ADMIN],
    'system:backup': [ROLES.ADMIN],
    'system:migrate': [ROLES.ADMIN]
};

export const RBACService = {
    /**
     * Verificar si el usuario actual posee un permiso específico
     */
    can(permission) {
        const role = AuthService.getRole();
        const allowedRoles = PERMISSIONS[permission] || [];
        return allowedRoles.includes(role);
    },

    isAdmin() {
        return AuthService.getRole() === ROLES.ADMIN;
    },

    isEditor() {
        const r = AuthService.getRole();
        return r === ROLES.ADMIN || r === ROLES.EDITOR;
    },

    isReader() {
        return AuthService.getRole() === ROLES.READER;
    },

    getRoleLabel(roleId) {
        switch (roleId) {
            case ROLES.ADMIN: return 'Administrador';
            case ROLES.EDITOR: return 'Editor';
            case ROLES.READER: return 'Lector';
            default: return 'Invitado';
        }
    },

    /**
     * Listar todos los usuarios y sus roles asignados (Solo Administrador)
     */
    async listUsers() {
        if (!this.can('users:manage')) {
            throw new Error('Acceso no autorizado: Solo administradores pueden gestionar usuarios.');
        }

        const client = getSupabaseClient();
        if (!client) {
            // Usuarios mock para entorno demostración
            return [
                {
                    id: 'usr-1',
                    email: 'admin@procuradoressustitutos.es',
                    first_name: 'Super',
                    last_name: 'Administrador',
                    role_id: 'admin',
                    created_at: '2026-01-10T10:00:00Z',
                    status: 'active'
                },
                {
                    id: 'usr-2',
                    email: 'editor@colegioprocuradores.es',
                    first_name: 'Editor',
                    last_name: 'Colegial',
                    role_id: 'editor',
                    created_at: '2026-02-15T12:00:00Z',
                    status: 'active'
                },
                {
                    id: 'usr-3',
                    email: 'lector@despacho.com',
                    first_name: 'Consulta',
                    last_name: 'Jurídica',
                    role_id: 'reader',
                    created_at: '2026-03-01T08:30:00Z',
                    status: 'active'
                }
            ];
        }

        const { data, error } = await client
            .from('profiles')
            .select(`
                id,
                email,
                first_name,
                last_name,
                phone,
                status,
                created_at,
                memberships (
                    role_id
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Error consultando usuarios: ${error.message}`);
        }

        return data.map(u => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            phone: u.phone,
            status: u.status,
            created_at: u.created_at,
            role_id: u.memberships?.[0]?.role_id || 'reader'
        }));
    },

    /**
     * Cambiar el rol de un usuario (Solo Administrador)
     */
    async updateUserRole(userId, newRoleId) {
        if (!this.can('roles:assign')) {
            throw new Error('Acceso denegado: Se requiere rol de Administrador.');
        }

        const client = getSupabaseClient();
        if (!client) {
            console.log(`[RBAC Mock] Rol de ${userId} actualizado a ${newRoleId}`);
            return true;
        }

        const { error } = await client
            .from('memberships')
            .update({ role_id: newRoleId, updated_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (error) {
            throw new Error(`Error asignando rol: ${error.message}`);
        }

        return true;
    },

    /**
     * Desactivar o activar cuenta de usuario
     */
    async updateUserStatus(userId, newStatus) {
        if (!this.can('users:manage')) {
            throw new Error('Acceso denegado: Se requiere rol de Administrador.');
        }

        const client = getSupabaseClient();
        if (!client) return true;

        const { error } = await client
            .from('profiles')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) {
            throw new Error(`Error actualizando estado del usuario: ${error.message}`);
        }

        return true;
    }
};

window.RBACService = RBACService;

