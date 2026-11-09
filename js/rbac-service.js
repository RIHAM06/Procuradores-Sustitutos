/**
 * ============================================================================
 * CONTROL DE ACCESO PRIVADO (PROPIETARIO ÚNICO) - PROCURADORES SUSTITUTOS
 * ============================================================================
 * En este sistema personal de uso privado exclusivo, no existen múltiples roles
 * ni jerarquías de lectores/editores/administradores.
 * El propietario autenticado posee permisos completos para gestionar su plataforma.
 * Las solicitudes no autenticadas tienen denegación estricta de acceso.
 */

import { AuthService } from './auth-service.js';

export const ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin'
};

export const RBACService = {
    /**
     * Verificar si el usuario actual posee un permiso
     * Requiere que el usuario esté debidamente autenticado
     */
    can(permission) {
        return AuthService.isAuthenticated();
    },

    isAdmin() {
        return AuthService.isAuthenticated();
    },

    isOwner() {
        return AuthService.isAuthenticated();
    },

    getRoleLabel(role) {
        if (!AuthService.isAuthenticated()) return 'No autenticado';
        return 'Acceso Personal';
    }
};

window.RBACService = RBACService;
