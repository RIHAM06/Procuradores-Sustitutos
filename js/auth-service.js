/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Manejo de sesiones, inicio de sesión, registro, recuperación y cierre seguro.
 * Reemplaza completamente la antigua clave maestra en texto plano.
 */

import { getSupabaseClient } from './supabase-client.js';
import { APP_CONFIG } from './config.js';

let currentUser = null;
let currentProfile = null;
let currentRole = 'reader';
const authListeners = new Set();

export const AuthService = {
    /**
     * Inicializar el servicio y escuchar cambios de sesión
     */
    async init() {
        const client = getSupabaseClient();
        if (!client) {
            // Modo inicial / sin claves configuradas
            this._checkDemoSession();
            return;
        }

        try {
            const { data: { session } } = await client.auth.getSession();
            if (session?.user) {
                await this._loadUserProfile(session.user);
            }

            client.auth.onAuthStateChange(async (event, session) => {
                console.log(`[AuthService] Evento de autenticación: ${event}`);
                if (session?.user) {
                    await this._loadUserProfile(session.user);
                } else {
                    currentUser = null;
                    currentProfile = null;
                    currentRole = 'reader';
                }
                this._notifyListeners();
            });
        } catch (err) {
            console.error('[AuthService] Error inicializando sesión:', err);
        }
    },

    /**
     * Iniciar sesión con Correo y Contraseña
     */
    async signIn(email, password) {
        const client = getSupabaseClient();
        if (!client) {
            // Modo local de prueba si aún no configuró credenciales en la nube
            return this._mockSignIn(email, password);
        }

        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (error) {
            throw new Error(this._translateAuthError(error.message));
        }

        await this._loadUserProfile(data.user);
        this._notifyListeners();
        return { user: currentUser, profile: currentProfile, role: currentRole };
    },

    /**
     * Registro de nuevo usuario
     */
    async signUp({ email, password, firstName, lastName, phone, requestedRole = 'reader' }) {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase no está configurado. Por favor, introduzca sus credenciales en el Panel.');
        }

        const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    first_name: firstName.trim(),
                    last_name: lastName ? lastName.trim() : '',
                    phone: phone ? phone.trim() : '',
                    role: requestedRole
                }
            }
        });

        if (error) {
            throw new Error(this._translateAuthError(error.message));
        }

        return data;
    },

    /**
     * Cierre de sesión seguro
     */
    async signOut() {
        const client = getSupabaseClient();
        if (client) {
            await client.auth.signOut();
        }
        currentUser = null;
        currentProfile = null;
        currentRole = 'reader';
        localStorage.removeItem('PS_DEMO_USER');
        this._notifyListeners();
        return true;
    },

    /**
     * Recuperación de contraseña por correo
     */
    async resetPassword(email) {
        const client = getSupabaseClient();
        if (!client) {
            throw new Error('Supabase no está configurado.');
        }

        const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin
        });

        if (error) {
            throw new Error(this._translateAuthError(error.message));
        }

        return data;
    },

    /**
     * Obtener el perfil y rol del usuario desde PostgreSQL
     */
    async _loadUserProfile(user) {
        currentUser = user;
        const client = getSupabaseClient();
        if (!client) return;

        try {
            // Cargar datos del perfil
            const { data: profile } = await client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            currentProfile = profile || {
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || 'Usuario',
                last_name: user.user_metadata?.last_name || ''
            };

            // Cargar rol desde memberships
            const { data: membership } = await client
                .from('memberships')
                .select('role_id')
                .eq('user_id', user.id)
                .single();

            currentRole = membership?.role_id || 'reader';
        } catch (err) {
            console.warn('[AuthService] No se pudo cargar perfil extendido:', err);
            currentProfile = {
                id: user.id,
                email: user.email,
                first_name: user.email.split('@')[0]
            };
            currentRole = 'reader';
        }
    },

    /**
     * Suscribirse a cambios de estado de autenticación
     */
    subscribe(callback) {
        authListeners.add(callback);
        // Notificar inmediatamente con el estado actual
        callback({ user: currentUser, profile: currentProfile, role: currentRole });
        return () => authListeners.delete(callback);
    },

    _notifyListeners() {
        const state = { user: currentUser, profile: currentProfile, role: currentRole };
        authListeners.forEach(cb => {
            try { cb(state); } catch (e) { console.error(e); }
        });
    },

    isAuthenticated() {
        return !!currentUser;
    },

    getUser() {
        return currentUser;
    },

    getProfile() {
        return currentProfile;
    },

    getRole() {
        return currentRole;
    },

    _translateAuthError(msg) {
        if (!msg) return 'Error de autenticación';
        if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
        if (msg.includes('User already registered')) return 'Este correo electrónico ya está registrado.';
        if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
        if (msg.includes('rate limit')) return 'Demasiados intentos. Por favor espera unos minutos.';
        return msg;
    },

    // Modo demostración local si aún no se han configurado credenciales Supabase
    _checkDemoSession() {
        const stored = localStorage.getItem('PS_DEMO_USER');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                currentUser = parsed.user;
                currentProfile = parsed.profile;
                currentRole = parsed.role;
                this._notifyListeners();
            } catch (e) {}
        }
    },

    _mockSignIn(email, password) {
        // En modo demostración local (sin claves de Supabase aún conectadas)
        let role = 'reader';
        let name = 'Lector Invitado';

        if (email.toLowerCase().includes('admin') || password === 'admin123' || password === '2121') {
            role = 'admin';
            name = 'Administrador Sistema';
        } else if (email.toLowerCase().includes('editor') || password === 'editor123') {
            role = 'editor';
            name = 'Editor Profesional';
        }

        currentUser = { id: 'demo-' + Date.now(), email };
        currentProfile = { id: currentUser.id, email, first_name: name, last_name: '' };
        currentRole = role;

        localStorage.setItem('PS_DEMO_USER', JSON.stringify({
            user: currentUser,
            profile: currentProfile,
            role: currentRole
        }));

        this._notifyListeners();
        return { user: currentUser, profile: currentProfile, role: currentRole };
    }
};

window.AuthService = AuthService;
