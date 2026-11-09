/**
 * ============================================================================
 * CONTROLADOR DE INTEGRACIÓN PROFESIONAL - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Sistema de seguridad y gestión privada de uso personal exclusivo.
 * Conexión directa con PostgreSQL + Supabase Auth / RLS,
 * autenticación real, pantalla de bloqueo privado, recuperación de acceso,
 * control de sesiones seguras y sincronización de datos.
 */

import { APP_CONFIG } from './config.js';
import { getSupabaseClient, testConnection } from './supabase-client.js';
import { AuthService } from './auth-service.js';
import { RBACService } from './rbac-service.js';
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
        console.log('[ProApp] Inicializando plataforma privada v' + APP_CONFIG.version);

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

        // 6. Sincronizar datos iniciales si ya hay sesión activa
        if (AuthService.isAuthenticated()) {
            await this.syncInitialData();
        }

        this.initialized = true;
    }

    handleAuthState({ user, profile, role }) {
        const loginScreen = document.getElementById('login-screen') || document.getElementById('auth-modal');
        const appContainer = document.getElementById('app-container');
        const userChip = document.getElementById('user-profile-chip');
        const adminBtn = document.getElementById('btn-open-admin-panel');
        const addSubBtn = document.getElementById('btn-open-add-modal');
        const addCourtBtn = document.getElementById('btn-open-add-court-modal');
        const logoutBtn = document.getElementById('btn-logout');

        if (user) {
            // Usuario Autenticado: Revelar plataforma privada
            if (loginScreen) {
                loginScreen.classList.add('hidden');
                loginScreen.style.display = 'none';
            }
            if (appContainer) {
                appContainer.style.display = 'flex';
            }

            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            if (addSubBtn) addSubBtn.style.display = 'inline-flex';
            if (addCourtBtn) addCourtBtn.style.display = 'inline-flex';
            if (adminBtn) adminBtn.style.display = 'inline-flex';

            if (userChip) {
                userChip.style.display = 'inline-flex';
                const avatar = userChip.querySelector('.user-avatar-circle');
                const nameLabel = userChip.querySelector('.user-name-label');
                const roleBadge = userChip.querySelector('.user-role-badge');

                const email = user.email || 'Propietario';
                if (avatar) avatar.textContent = email[0].toUpperCase();
                if (nameLabel) nameLabel.textContent = email;
                if (roleBadge) {
                    roleBadge.textContent = 'Acceso Personal';
                    roleBadge.className = 'user-role-badge role-admin';
                }
            }

            // Notificar a Leaflet para ajustar dimensiones en la pantalla
            if (window.App && window.App.map) {
                setTimeout(() => {
                    try { window.App.map.invalidateSize(); } catch (e) {}
                }, 150);
            }
        } else {
            // Usuario No Autenticado: Proteger datos y mostrar pantalla de acceso privado
            if (appContainer) {
                appContainer.style.display = 'none';
            }
            if (loginScreen) {
                loginScreen.classList.remove('hidden');
                loginScreen.style.display = 'flex';
            }
            if (userChip) userChip.style.display = 'none';
            if (addSubBtn) addSubBtn.style.display = 'none';
            if (addCourtBtn) addCourtBtn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    async syncInitialData() {
        try {
            // Cargar procuradores desde PostgreSQL
            const subs = await DatabaseService.getSubstitutes();
            if (subs && subs.length > 0 && window.DataService) {
                console.log(`[ProApp] ${subs.length} procuradores sincronizados desde PostgreSQL`);
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

                if (window.App && typeof window.App.renderDirectory === 'function') {
                    window.App.renderDirectory();
                }
            }
        } catch (err) {
            console.warn('[ProApp] Sincronización de datos privada:', err.message);
        }
    }

    bindEvents() {
        // Formulario de Inicio de Sesión Privado
        const loginForm = document.getElementById('login-form');
        const loginErrorMsg = document.getElementById('login-error-msg');
        const emailInput = document.getElementById('login-email-input');
        const passInput = document.getElementById('password-input');
        const btnTogglePass = document.getElementById('btn-toggle-password-visibility');

        // Toggle Mostrar / Ocultar Contraseña
        if (btnTogglePass && passInput) {
            btnTogglePass.addEventListener('click', (e) => {
                e.preventDefault();
                const isPassword = passInput.getAttribute('type') === 'password';
                passInput.setAttribute('type', isPassword ? 'text' : 'password');
                btnTogglePass.innerHTML = isPassword ? `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>
                    </svg>
                ` : `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                `;
            });
        }

        // Envío de Formulario de Inicio de Sesión
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (loginErrorMsg) {
                    loginErrorMsg.style.display = 'none';
                    loginErrorMsg.textContent = '';
                }
                const email = emailInput ? emailInput.value.trim() : '';
                const pass = passInput ? passInput.value : '';

                try {
                    await AuthService.signIn(email, pass);
                    this.showToast('Acceso privado concedido');
                    await this.syncInitialData();
                } catch (err) {
                    if (loginErrorMsg) {
                        loginErrorMsg.textContent = err.message;
                        loginErrorMsg.style.display = 'block';
                    }
                }
            });
        }

        // Toggle Recuperación de Acceso
        const btnToggleRecovery = document.getElementById('btn-toggle-recovery');
        const btnRecoveryBack = document.getElementById('btn-recovery-back');
        const loginSubcard = document.getElementById('login-subcard');
        const recoverySubcard = document.getElementById('recovery-subcard');
        const recoveryStatusMsg = document.getElementById('recovery-status-msg');

        if (btnToggleRecovery && recoverySubcard && loginSubcard) {
            btnToggleRecovery.addEventListener('click', (e) => {
                e.preventDefault();
                loginSubcard.style.display = 'none';
                recoverySubcard.style.display = 'block';
                if (recoveryStatusMsg) recoveryStatusMsg.style.display = 'none';
            });
        }

        if (btnRecoveryBack && recoverySubcard && loginSubcard) {
            btnRecoveryBack.addEventListener('click', (e) => {
                e.preventDefault();
                recoverySubcard.style.display = 'none';
                loginSubcard.style.display = 'block';
            });
        }

        // Formulario de Recuperación de Acceso
        const recoveryForm = document.getElementById('recovery-form');
        const recoveryEmailInput = document.getElementById('recovery-email-input');
        if (recoveryForm) {
            recoveryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = recoveryEmailInput ? recoveryEmailInput.value.trim() : '';
                try {
                    if (recoveryStatusMsg) {
                        recoveryStatusMsg.style.display = 'block';
                        recoveryStatusMsg.style.color = '#2563eb';
                        recoveryStatusMsg.textContent = 'Enviando solicitud segura a Supabase...';
                    }
                    const result = await AuthService.resetPassword(email);
                    if (recoveryStatusMsg) {
                        recoveryStatusMsg.style.color = '#10b981';
                        recoveryStatusMsg.textContent = result.message || 'Enlace de recuperación enviado correctamente.';
                    }
                } catch (err) {
                    if (recoveryStatusMsg) {
                        recoveryStatusMsg.style.color = '#ef4444';
                        recoveryStatusMsg.textContent = err.message;
                    }
                }
            });
        }

        // Cierre de Sesión Seguro
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                if (confirm('¿Deseas cerrar la sesión de tu panel personal?')) {
                    await AuthService.signOut();
                    this.showToast('Sesión privada finalizada');
                }
            });
        }

        // Botón Abrir Panel de Ajustes Privados
        const btnAdmin = document.getElementById('btn-open-admin-panel');
        const adminModal = document.getElementById('admin-panel-modal');
        const btnCloseAdmin = document.getElementById('admin-modal-close-btn');

        if (btnAdmin && adminModal) {
            btnAdmin.addEventListener('click', () => {
                if (!AuthService.isAuthenticated()) {
                    alert('Debes iniciar sesión para acceder a los ajustes privados.');
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

        // Navegación por Pestañas del Panel de Ajustes
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

        // Configuración de Credenciales Supabase
        const btnSaveSupabase = document.getElementById('btn-save-supabase-config');
        if (btnSaveSupabase) {
            btnSaveSupabase.addEventListener('click', async () => {
                const url = document.getElementById('admin-supabase-url')?.value;
                const key = document.getElementById('admin-supabase-key')?.value;
                if (!url || !key) {
                    alert('Por favor introduce la URL del proyecto y la Clave Anónima.');
                    return;
                }
                APP_CONFIG.updateSupabaseCredentials(url, key);
                alert('Credenciales de Supabase actualizadas. Verificando conexión en PostgreSQL...');
                await OfflineManager.checkServer();
            });
        }

        // Herramienta de Migración LocalStorage -> PostgreSQL
        const btnRunMigration = document.getElementById('btn-run-migration');
        if (btnRunMigration) {
            btnRunMigration.addEventListener('click', async () => {
                if (!confirm('¿Deseas migrar todos tus datos almacenados localmente a PostgreSQL?')) return;
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

        // Exportación de Copia de Seguridad JSON
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

        // Importación de Copia de Seguridad JSON
        const importFileInput = document.getElementById('admin-import-file');
        if (importFileInput) {
            importFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!confirm(`¿Restaurar copia de seguridad desde "${file.name}"? Los datos se sincronizarán con PostgreSQL.`)) {
                    importFileInput.value = '';
                    return;
                }

                try {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const jsonData = JSON.parse(event.target.result);
                            const res = await BackupService.importBackup(jsonData);
                            alert(`Restauración completada con éxito. Registros importados: ${res.imported_records}`);
                            await this.syncInitialData();
                        } catch (parseErr) {
                            alert('Archivo de copia de seguridad no válido: ' + parseErr.message);
                        }
                    };
                    reader.readAsText(file);
                } catch (err) {
                    alert('Error al leer el archivo: ' + err.message);
                }
            });
        }
    }

    async loadAdminPanelData() {
        this.loadAdminAuditTab();
        this.loadAdminMigrationTab();
        this.loadAdminConfigTab();
    }

    async loadAdminAuditTab() {
        const tableBody = document.getElementById('admin-audit-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando registro de actividad...</td></tr>';

        try {
            const logs = await AuditService.getLogs({ limit: 40 });
            tableBody.innerHTML = '';
            if (logs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">No hay registros de auditoría aún.</td></tr>';
                return;
            }
            logs.forEach(l => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${l.action}</strong></td>
                    <td><code>${l.table_name}</code></td>
                    <td>${l.user_email || 'Propietario'}</td>
                    <td><small>${new Date(l.created_at).toLocaleString()}</small></td>
                    <td><code style="font-size:0.75rem;">${JSON.stringify(l.new_data || l.old_data || {}).slice(0, 60)}...</code></td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;">${err.message}</td></tr>`;
        }
    }

    async loadAdminMigrationTab() {
        const statusEl = document.getElementById('migration-scan-result');
        if (!statusEl) return;
        const scan = MigrationService.scanLocalStorage();
        if (scan.totalCount === 0) {
            statusEl.innerHTML = `
                <div style="background:#ecfdf5; border:1px solid #10b981; border-radius:8px; padding:12px; color:#065f46;">
                    ✓ <strong>Base de datos limpia:</strong> No existen registros residuales en LocalStorage. Toda la información reside en PostgreSQL.
                </div>
            `;
        } else {
            statusEl.innerHTML = `
                <div style="background:#fffbeb; border:1px solid #f59e0b; border-radius:8px; padding:12px; color:#92400e;">
                    ⚠ <strong>Se han detectado ${scan.totalCount} registros en LocalStorage</strong> (${scan.substitutesCount} procuradores, ${scan.courtsCount} juzgados).
                    Pulsa el botón inferior para sincronizarlos con PostgreSQL.
                </div>
            `;
        }
    }

    loadAdminConfigTab() {
        const urlInput = document.getElementById('admin-supabase-url');
        const keyInput = document.getElementById('admin-supabase-key');
        if (urlInput && APP_CONFIG.supabase.url) {
            urlInput.value = APP_CONFIG.supabase.url;
        }
        if (keyInput && APP_CONFIG.supabase.anonKey) {
            keyInput.value = APP_CONFIG.supabase.anonKey;
        }
    }

    showToast(message) {
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast(message);
        } else {
            const toast = document.getElementById('toast-notification');
            const msgEl = document.getElementById('toast-message');
            if (toast && msgEl) {
                msgEl.textContent = message;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3500);
            }
        }
    }
}

// Inicializar en DOMContentLoaded
window.ProApp = new ProAppController();
document.addEventListener('DOMContentLoaded', () => {
    window.ProApp.init();
});
