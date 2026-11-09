/**
 * ============================================================================
 * CONTROLADOR DE INTEGRACIÓN PROFESIONAL - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Conecta la arquitectura modular PostgreSQL + Supabase con la interfaz de usuario,
 * el mapa interactivo de Leaflet y los flujos de autenticación y administración.
 */

import { APP_CONFIG } from './config.js';
import { getSupabaseClient, testConnection } from './supabase-client.js';
import { AuthService } from './auth-service.js';
import { RBACService, ROLES } from './rbac-service.js';
import { DatabaseService } from './database-service.js';
import { RealtimeService } from './realtime-service.js';
import { OfflineManager } from './offline-manager.js';
import { AuditService } from './audit-service.js';
import { BackupService } from './backup-service.js';
import { MigrationService } from './migration-service.js';
import { ValidationService } from './validation.js';

class ProAppController {
    constructor() {
        this.initialized = false;
    }

    async init() {
        console.log('[ProApp] Inicializando plataforma profesional v' + APP_CONFIG.version);

        // 1. Inicializar Gestor de Red y Conectividad
        OfflineManager.init();

        // 2. Inicializar Autenticación y Sesión
        await AuthService.init();

        // 3. Suscribirse a cambios de autenticación
        AuthService.subscribe((state) => this.handleAuthState(state));

        // 4. Inicializar Supabase Realtime
        RealtimeService.init();

        // 5. Vincular listeners de UI
        this.bindEvents();

        // 6. Sincronizar datos iniciales con la capa visual existente
        await this.syncInitialData();

        this.initialized = true;
    }

    handleAuthState({ user, profile, role }) {
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.getElementById('app-container');
        const userChip = document.getElementById('user-profile-chip');
        const adminBtn = document.getElementById('btn-open-admin-panel');
        const addSubBtn = document.getElementById('btn-open-add-modal');
        const addCourtBtn = document.getElementById('btn-open-add-court-modal');

        if (user) {
            // Usuario autenticado
            if (loginScreen) loginScreen.style.display = 'none';
            if (appContainer) appContainer.style.display = 'flex';

            // Actualizar Chip de Usuario
            if (userChip) {
                userChip.style.display = 'inline-flex';
                const avatar = userChip.querySelector('.user-avatar-circle');
                const nameLabel = userChip.querySelector('.user-name-label');
                const roleBadge = userChip.querySelector('.user-role-badge');

                const initial = (profile?.first_name || user.email || 'U')[0].toUpperCase();
                if (avatar) avatar.textContent = initial;
                if (nameLabel) nameLabel.textContent = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user.email;
                if (roleBadge) {
                    roleBadge.textContent = RBACService.getRoleLabel(role);
                    roleBadge.className = `user-role-badge role-${role}`;
                }
            }

            // Aplicar permisos RBAC en la UI
            if (adminBtn) {
                adminBtn.style.display = RBACService.isAdmin() ? 'inline-flex' : 'none';
            }
            if (addSubBtn) {
                addSubBtn.style.display = RBACService.isEditor() ? 'inline-flex' : 'none';
            }
            if (addCourtBtn) {
                addCourtBtn.style.display = RBACService.isEditor() ? 'inline-flex' : 'none';
            }
        } else {
            // Usuario no autenticado
            if (loginScreen) loginScreen.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
            if (userChip) userChip.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
        }
    }

    async syncInitialData() {
        try {
            // Cargar procuradores desde PostgreSQL
            const subs = await DatabaseService.getSubstitutes();
            if (subs && subs.length > 0 && window.DataService) {
                console.log(`[ProApp] ${subs.length} procuradores sincronizados desde PostgreSQL`);
                // Actualizar dataset visual en memoria
                window.DataService.substitutes = subs.map(s => ({
                    id: s.id,
                    first_name: s.first_name,
                    last_name: s.last_name,
                    colegiate_number: s.colegiate_number,
                    professional_association: s.professional_association,
                    phone: s.phone,
                    email: s.email,
                    province: s.province,
                    specialties: s.specialties,
                    notes: s.notes,
                    court_ids: s.substitute_courts?.map(sc => sc.court_id) || [],
                    rates: s.rates || []
                }));

                // Notificar a la vista
                if (window.App && typeof window.App.renderDirectory === 'function') {
                    window.App.renderDirectory();
                }
            }
        } catch (err) {
            console.warn('[ProApp] Sincronización inicial en segundo plano:', err.message);
        }
    }

    bindEvents() {
        // Formulario de Inicio de Sesión Moderno
        const loginForm = document.getElementById('login-form');
        const loginErrorMsg = document.getElementById('login-error-msg');
        const emailInput = document.getElementById('login-email-input');
        const passInput = document.getElementById('password-input');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                loginErrorMsg.textContent = '';
                const email = emailInput ? emailInput.value.trim() : 'admin@test.es';
                const pass = passInput ? passInput.value : '';

                try {
                    await AuthService.signIn(email, pass);
                    this.showToast('Sesión iniciada correctamente');
                } catch (err) {
                    loginErrorMsg.textContent = err.message;
                }
            });
        }

        // Toggle entre Login y Registro
        const btnToggleRegister = document.getElementById('btn-toggle-register');
        const registerBox = document.getElementById('register-subcard');
        const loginBox = document.getElementById('login-subcard');

        if (btnToggleRegister && registerBox && loginBox) {
            btnToggleRegister.addEventListener('click', (e) => {
                e.preventDefault();
                const isRegistering = registerBox.style.display !== 'none';
                registerBox.style.display = isRegistering ? 'none' : 'block';
                loginBox.style.display = isRegistering ? 'block' : 'none';
            });
        }

        // Formulario de Registro
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const regEmail = document.getElementById('reg-email')?.value;
                const regPass = document.getElementById('reg-pass')?.value;
                const regFirst = document.getElementById('reg-first-name')?.value;
                const regLast = document.getElementById('reg-last-name')?.value;
                const regPhone = document.getElementById('reg-phone')?.value;
                const regRole = document.getElementById('reg-role')?.value || 'reader';
                const errorEl = document.getElementById('register-error-msg');

                try {
                    errorEl.textContent = '';
                    await AuthService.signUp({
                        email: regEmail,
                        password: regPass,
                        firstName: regFirst,
                        lastName: regLast,
                        phone: regPhone,
                        requestedRole: regRole
                    });
                    this.showToast('Registro enviado. Comprueba tu correo o inicia sesión.');
                    registerBox.style.display = 'none';
                    loginBox.style.display = 'block';
                } catch (err) {
                    errorEl.textContent = err.message;
                }
            });
        }

        // Cierre de Sesión
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                if (confirm('¿Deseas cerrar la sesión de forma segura?')) {
                    await AuthService.signOut();
                    this.showToast('Sesión cerrada correctamente');
                }
            });
        }

        // Botón Abrir Panel de Administración
        const btnAdmin = document.getElementById('btn-open-admin-panel');
        const adminModal = document.getElementById('admin-panel-modal');
        const btnCloseAdmin = document.getElementById('admin-modal-close-btn');

        if (btnAdmin && adminModal) {
            btnAdmin.addEventListener('click', () => {
                if (!RBACService.isAdmin()) {
                    alert('Acceso no autorizado: Solo administradores pueden ver este panel.');
                    return;
                }
                this.loadAdminPanelData();
                adminModal.style.display = 'flex';
            });
        }

        if (btnCloseAdmin && adminModal) {
            btnCloseAdmin.addEventListener('click', () => {
                adminModal.style.display = 'none';
            });
        }

        // Tabs del Panel de Administración
        const tabBtns = document.querySelectorAll('.admin-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-tab');
                const targetContent = document.getElementById(targetId);
                if (targetContent) targetContent.classList.add('active');
            });
        });

        // Configuración de Supabase en Admin Panel
        const btnSaveSupabase = document.getElementById('btn-save-supabase-config');
        if (btnSaveSupabase) {
            btnSaveSupabase.addEventListener('click', async () => {
                const url = document.getElementById('admin-supabase-url')?.value;
                const key = document.getElementById('admin-supabase-key')?.value;
                if (!url || !key) {
                    alert('Por favor introduzca tanto la URL como la Clave Anónima Pública.');
                    return;
                }
                APP_CONFIG.updateSupabaseCredentials(url, key);
                alert('Credenciales de Supabase actualizadas. Verificando conexión...');
                await OfflineManager.checkServer();
            });
        }

        // Migración desde LocalStorage
        const btnRunMigration = document.getElementById('btn-run-migration');
        if (btnRunMigration) {
            btnRunMigration.addEventListener('click', async () => {
                if (!confirm('¿Deseas migrar todos los datos locales almacenados a PostgreSQL?')) return;
                try {
                    btnRunMigration.disabled = true;
                    btnRunMigration.textContent = 'Migrando...';
                    const res = await MigrationService.executeMigration();
                    alert(res.message);
                    await this.syncInitialData();
                    this.loadAdminMigrationTab();
                } catch (err) {
                    alert('Error durante la migración: ' + err.message);
                } finally {
                    btnRunMigration.disabled = false;
                    btnRunMigration.textContent = 'Ejecutar Migración a PostgreSQL';
                }
            });
        }

        // Exportación de Backup JSON
        const btnExportBackup = document.getElementById('btn-export-backup-admin');
        if (btnExportBackup) {
            btnExportBackup.addEventListener('click', async () => {
                try {
                    const res = await BackupService.exportBackup();
                    this.showToast(`Copia descargada: ${res.filename}`);
                } catch (err) {
                    alert('Error al exportar: ' + err.message);
                }
            });
        }

        // Importación de Backup JSON
        const inputImportBackup = document.getElementById('admin-import-file');
        if (inputImportBackup) {
            inputImportBackup.addEventListener('change', async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    try {
                        const content = evt.target?.result;
                        const res = await BackupService.importBackup(content);
                        alert(res.message);
                        await this.syncInitialData();
                    } catch (err) {
                        alert('Error al restaurar: ' + err.message);
                    }
                };
                reader.readAsText(file);
            });
        }

        // Escuchar eventos de Realtime para refrescar
        window.addEventListener('realtime:substitute-change', () => this.syncInitialData());
        window.addEventListener('realtime:court-change', () => this.syncInitialData());
    }

    async loadAdminPanelData() {
        this.loadAdminUsersTab();
        this.loadAdminAuditTab();
        this.loadAdminMigrationTab();
        this.loadAdminConfigTab();
    }

    async loadAdminUsersTab() {
        const tableBody = document.getElementById('admin-users-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando usuarios...</td></tr>';

        try {
            const users = await RBACService.listUsers();
            tableBody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${u.first_name} ${u.last_name || ''}</strong></td>
                    <td>${u.email}</td>
                    <td>
                        <select class="pro-form-select user-role-changer" data-user-id="${u.id}" style="padding:4px 8px; font-size:0.8rem;">
                            <option value="admin" ${u.role_id === 'admin' ? 'selected' : ''}>Administrador</option>
                            <option value="editor" ${u.role_id === 'editor' ? 'selected' : ''}>Editor</option>
                            <option value="reader" ${u.role_id === 'reader' ? 'selected' : ''}>Lector</option>
                        </select>
                    </td>
                    <td><span class="status-pill status-connected">${u.status || 'Activo'}</span></td>
                    <td><small style="color:#64748b;">${new Date(u.created_at).toLocaleDateString()}</small></td>
                `;
                tableBody.appendChild(tr);
            });

            // Asignar listeners a selectores de roles
            tableBody.querySelectorAll('.user-role-changer').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const userId = e.target.getAttribute('data-user-id');
                    const newRole = e.target.value;
                    try {
                        await RBACService.updateUserRole(userId, newRole);
                        this.showToast('Rol actualizado correctamente');
                    } catch (err) {
                        alert('Error al cambiar rol: ' + err.message);
                    }
                });
            });
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;">${err.message}</td></tr>`;
        }
    }

    async loadAdminAuditTab() {
        const tableBody = document.getElementById('admin-audit-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando registro de auditoría...</td></tr>';

        try {
            const logs = await AuditService.getLogs({ limit: 40 });
            tableBody.innerHTML = '';
            logs.forEach(l => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${l.action}</strong></td>
                    <td><code>${l.table_name}</code></td>
                    <td>${l.user_email || 'Sistema'}</td>
                    <td><small>${new Date(l.created_at).toLocaleString()}</small></td>
                    <td><code style="font-size:0.75rem;">${JSON.stringify(l.new_data || l.old_data || {}).slice(0, 60)}...</code></td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;">${err.message}</td></tr>`;
        }
    }

    loadAdminMigrationTab() {
        const statusBox = document.getElementById('migration-status-box');
        if (!statusBox) return;
        const check = MigrationService.detectLegacyData();
        if (check.hasLegacyData) {
            statusBox.innerHTML = `
                <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:14px;">
                    <p style="margin:0 0 8px 0; color:#1e40af; font-weight:600;">
                        📦 Se han detectado ${check.totalRecords} registros antiguos en LocalStorage listos para migrar a PostgreSQL.
                    </p>
                    <small style="color:#475569;">La migración garantizará que los datos estén centralizados y accesibles desde cualquier navegador o móvil.</small>
                </div>
            `;
        } else {
            statusBox.innerHTML = `
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px; color:#166534;">
                    ✅ No hay datos huérfanos en LocalStorage. La base de datos centralizada de PostgreSQL es la única fuente de información.
                </div>
            `;
        }
    }

    loadAdminConfigTab() {
        const urlInput = document.getElementById('admin-supabase-url');
        const keyInput = document.getElementById('admin-supabase-key');
        if (urlInput) urlInput.value = APP_CONFIG.supabase.url;
        if (keyInput) keyInput.value = APP_CONFIG.supabase.anonKey;
    }

    showToast(message) {
        const toast = document.getElementById('toast-notification');
        const toastMsg = document.getElementById('toast-message');
        if (toast && toastMsg) {
            toastMsg.textContent = message;
            toast.className = 'show';
            setTimeout(() => { toast.className = ''; }, 3500);
        }
    }
}

// Iniciar aplicación profesional
window.ProApp = new ProAppController();
document.addEventListener('DOMContentLoaded', () => {
    window.ProApp.init();
});
