/**
 * ==========================================================================
 * APLICACIÓN PRINCIPAL - PROCURADORES SUSTITUTOS ESPAÑA
 * Lógica de negocio, autenticación, mapa interactivo Leaflet y gestión CRUD
 * ==========================================================================
 */

(function () {
  "use strict";

  // CLAVE MAESTRA PRIVADA REQUERIDA
  const MASTER_PASSWORD = "2121";

  // Estado global de la aplicación
  const state = {
    isAuthenticated: false,
    currentView: "map", // 'map' | 'directory'
    map: null,
    markerClusterGroup: null,
    courtMarkers: new Map(), // courtId -> L.Marker
    selectedCourt: null,
    filters: {
      searchQuery: "",
      province: "all",
      type: "all",
      maxPrice: "all"
    },
    editingSubstituteId: null
  };

  // ==========================================================================
  // ELEMENTOS DOM
  // ==========================================================================
  const dom = {
    // Auth
    loginScreen: document.getElementById("login-screen"),
    loginForm: document.getElementById("login-form"),
    passwordInput: document.getElementById("password-input"),
    loginErrorMsg: document.getElementById("login-error-msg"),
    btnLogout: document.getElementById("btn-logout"),

    // App layout
    appContainer: document.getElementById("app-container"),
    mapViewWrapper: document.getElementById("map-view-wrapper"),
    directoryViewWrapper: document.getElementById("directory-view-wrapper"),
    navTabMap: document.getElementById("nav-tab-map"),
    navTabDirectory: document.getElementById("nav-tab-directory"),

    // Filters
    globalSearchInput: document.getElementById("global-search-input"),
    btnSearchMunicipality: document.getElementById("btn-search-municipality"),
    searchAutocompleteBox: document.getElementById("search-autocomplete-box"),
    filterProvinceSelect: document.getElementById("filter-province-select"),
    filterTypeSelect: document.getElementById("filter-type-select"),
    filterPriceSelect: document.getElementById("filter-price-select"),
    regionPillsContainer: document.getElementById("region-pills-container"),

    // Drawer de juzgado
    courtDetailsDrawer: document.getElementById("court-details-drawer"),
    drawerCloseBtn: document.getElementById("drawer-close-btn"),
    drawerCourtTypePill: document.getElementById("drawer-court-type-pill"),
    drawerCourtTitle: document.getElementById("drawer-court-title"),
    drawerCourtLocation: document.getElementById("drawer-court-location"),
    drawerCourtAddress: document.getElementById("drawer-court-address"),
    drawerCourtPhone: document.getElementById("drawer-court-phone"),
    drawerSubstitutesCount: document.getElementById("drawer-substitutes-count"),
    drawerSubstitutesList: document.getElementById("drawer-substitutes-list"),
    btnAddSubToCourt: document.getElementById("btn-add-sub-to-court"),

    // Directorio
    directoryGrid: document.getElementById("directory-grid"),
    directoryCountText: document.getElementById("directory-count-text"),

    // Modal de procurador
    substituteModal: document.getElementById("substitute-modal"),
    substituteModalTitle: document.getElementById("substitute-modal-title"),
    substituteForm: document.getElementById("substitute-form"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    modalCancelBtn: document.getElementById("modal-cancel-btn"),
    subIdInput: document.getElementById("sub-id-input"),
    subNameInput: document.getElementById("sub-name-input"),
    subCollegiateInput: document.getElementById("sub-collegiate-input"),
    subPhoneInput: document.getElementById("sub-phone-input"),
    subEmailInput: document.getElementById("sub-email-input"),
    subPriceInput: document.getElementById("sub-price-input"),
    subPriceDetailsInput: document.getElementById("sub-price-details-input"),
    subSpecialtiesInput: document.getElementById("sub-specialties-input"),
    subAvailabilityInput: document.getElementById("sub-availability-input"),
    subNotesInput: document.getElementById("sub-notes-input"),
    courtsPickerList: document.getElementById("courts-picker-list"),
    btnOpenAddModal: document.getElementById("btn-open-add-modal"),

    // Modal de nuevo juzgado
    btnOpenAddCourtModal: document.getElementById("btn-open-add-court-modal"),
    courtModal: document.getElementById("court-modal"),
    courtForm: document.getElementById("court-form"),
    courtModalCloseBtn: document.getElementById("court-modal-close-btn"),
    courtModalCancelBtn: document.getElementById("court-modal-cancel-btn"),
    courtNameInput: document.getElementById("court-name-input"),
    courtTypeInput: document.getElementById("court-type-input"),
    courtProvinceInput: document.getElementById("court-province-input"),
    courtCityInput: document.getElementById("court-city-input"),
    courtCommunityInput: document.getElementById("court-community-input"),
    courtAddressInput: document.getElementById("court-address-input"),
    courtPhoneInput: document.getElementById("court-phone-input"),
    courtCoordsInput: document.getElementById("court-coords-input"),

    // Modal de datos / backup
    backupModal: document.getElementById("backup-modal"),
    btnOpenBackupModal: document.getElementById("btn-open-backup-modal"),
    backupModalCloseBtn: document.getElementById("backup-modal-close-btn"),
    btnExportJson: document.getElementById("btn-export-json"),
    importJsonFileInput: document.getElementById("import-json-file-input"),
    btnResetData: document.getElementById("btn-reset-data"),

    // Notificaciones
    toastNotification: document.getElementById("toast-notification"),
    toastMessage: document.getElementById("toast-message")
  };

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================
  function init() {
    // 1. Inicializar Mapa y Directorio INMEDIATAMENTE (el mapa siempre es visible)
    initMap();
    populateProvincesFilter();
    renderDirectory();

    // 2. Vincular listeners de eventos
    setupEventListeners();

    // 3. Inicializar Sistema de Autenticación Moderno (Supabase Auth / RBAC)
    setupAuth();

    // 4. Inicializar suscripción a eventos en tiempo real
    setupRealtimeAndOffline();
  }

  // ==========================================================================
  // 1. SISTEMA DE AUTENTICACIÓN Y SEGURIDAD (SUPABASE AUTH + ROLES)
  // ==========================================================================
  function setupAuth() {
    // Escuchar cambios de estado desde window.AuthService
    if (window.AuthService && typeof window.AuthService.subscribe === "function") {
      window.AuthService.subscribe(({ user, profile, role }) => {
        updateAuthUI(user, profile, role);
      });
    }

    // Botón Iniciar Sesión en la Cabecera
    const btnHeaderLogin = document.getElementById("btn-header-login");
    if (btnHeaderLogin) {
      btnHeaderLogin.addEventListener("click", () => openAuthModal());
    }

    // Botón Cerrar Modal de Autenticación
    const btnCloseAuth = document.getElementById("auth-modal-close-btn");
    if (btnCloseAuth) {
      btnCloseAuth.addEventListener("click", () => closeAuthModal());
    }

    // Toggle entre Iniciar Sesión y Registrarse
    const btnToggleRegister = document.getElementById("btn-toggle-register");
    const btnToggleLoginBack = document.getElementById("btn-toggle-login-back");
    const loginSubcard = document.getElementById("login-subcard");
    const registerSubcard = document.getElementById("register-subcard");

    if (btnToggleRegister && loginSubcard && registerSubcard) {
      btnToggleRegister.addEventListener("click", (e) => {
        e.preventDefault();
        loginSubcard.style.display = "none";
        registerSubcard.style.display = "block";
      });
    }

    if (btnToggleLoginBack && loginSubcard && registerSubcard) {
      btnToggleLoginBack.addEventListener("click", (e) => {
        e.preventDefault();
        registerSubcard.style.display = "none";
        loginSubcard.style.display = "block";
      });
    }

    // Formulario de Inicio de Sesión
    if (dom.loginForm) {
      dom.loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const emailInput = document.getElementById("login-email-input");
        const email = emailInput ? emailInput.value.trim() : "admin@test.es";
        const password = dom.passwordInput ? dom.passwordInput.value.trim() : "";

        try {
          if (dom.loginErrorMsg) dom.loginErrorMsg.textContent = "";
          if (window.AuthService) {
            await window.AuthService.signIn(email, password);
          }
          closeAuthModal();
          showToast("Sesión iniciada correctamente");
        } catch (err) {
          if (dom.loginErrorMsg) dom.loginErrorMsg.textContent = err.message || "Error al iniciar sesión.";
        }
      });
    }

    // Formulario de Registro
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const regEmail = document.getElementById("reg-email")?.value;
        const regPass = document.getElementById("reg-pass")?.value;
        const regFirst = document.getElementById("reg-first-name")?.value;
        const regLast = document.getElementById("reg-last-name")?.value;
        const regPhone = document.getElementById("reg-phone")?.value;
        const regRole = document.getElementById("reg-role")?.value || "reader";
        const errorEl = document.getElementById("register-error-msg");

        try {
          if (errorEl) errorEl.textContent = "";
          if (window.AuthService) {
            await window.AuthService.signUp({
              email: regEmail,
              password: regPass,
              firstName: regFirst,
              lastName: regLast,
              phone: regPhone,
              requestedRole: regRole
            });
          }
          showToast("Cuenta creada con éxito");
          if (registerSubcard) registerSubcard.style.display = "none";
          if (loginSubcard) loginSubcard.style.display = "block";
        } catch (err) {
          if (errorEl) errorEl.textContent = err.message;
        }
      });
    }

    // Cierre de Sesión
    if (dom.btnLogout) {
      dom.btnLogout.addEventListener("click", async function () {
        if (confirm("¿Deseas cerrar la sesión de trabajo?")) {
          if (window.AuthService) {
            await window.AuthService.signOut();
          }
          showToast("Sesión cerrada");
        }
      });
    }
  }

  function updateAuthUI(user, profile, role) {
    const btnHeaderLogin = document.getElementById("btn-header-login");
    const userChip = document.getElementById("user-profile-chip");
    const btnAddSub = document.getElementById("btn-open-add-modal");
    const btnAddCourt = document.getElementById("btn-open-add-court-modal");
    const btnAdmin = document.getElementById("btn-open-admin-panel");
    const btnLogout = document.getElementById("btn-logout");

    const isAuthenticated = !!user;
    state.isAuthenticated = isAuthenticated;
    state.userRole = role || "reader";

    if (isAuthenticated) {
      if (btnHeaderLogin) btnHeaderLogin.style.display = "none";
      if (btnLogout) btnLogout.style.display = "inline-flex";

      if (userChip) {
        userChip.style.display = "inline-flex";
        const avatar = userChip.querySelector(".user-avatar-circle");
        const nameLabel = userChip.querySelector(".user-name-label");
        const roleBadge = userChip.querySelector(".user-role-badge");

        const initial = (profile?.first_name || user.email || "U")[0].toUpperCase();
        if (avatar) avatar.textContent = initial;
        if (nameLabel) nameLabel.textContent = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || user.email;
        if (roleBadge) {
          const roleLabels = { admin: "Administrador", editor: "Editor", reader: "Lector" };
          roleBadge.textContent = roleLabels[role] || "Lector";
          roleBadge.className = `user-role-badge role-${role}`;
        }
      }

      const isEditorOrAdmin = role === "admin" || role === "editor";
      if (btnAddSub) btnAddSub.style.display = isEditorOrAdmin ? "inline-flex" : "none";
      if (btnAddCourt) btnAddCourt.style.display = isEditorOrAdmin ? "inline-flex" : "none";
      if (btnAdmin) btnAdmin.style.display = (role === "admin") ? "inline-flex" : "none";
    } else {
      if (btnHeaderLogin) btnHeaderLogin.style.display = "inline-flex";
      if (userChip) userChip.style.display = "none";
      if (btnAddSub) btnAddSub.style.display = "none";
      if (btnAddCourt) btnAddCourt.style.display = "none";
      if (btnAdmin) btnAdmin.style.display = "none";
      if (btnLogout) btnLogout.style.display = "none";
    }
  }

  function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.style.display = "flex";
      const emailInput = document.getElementById("login-email-input");
      if (emailInput) emailInput.focus();
    }
  }

  function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.style.display = "none";
    }
  }

  function setupRealtimeAndOffline() {
    window.addEventListener("realtime:substitute-change", () => {
      if (window.ProApp && typeof window.ProApp.syncInitialData === "function") {
        window.ProApp.syncInitialData();
      }
      updateMapMarkers();
      renderDirectory();
    });

    window.addEventListener("realtime:court-change", () => {
      updateMapMarkers();
    });
  }

  // ==========================================================================
  // 2. MAPA INTERACTIVO ESTILO GOOGLE MAPS / PREZI
  // ==========================================================================
  function initMap() {
    // Centro geográfico de la península ibérica
    const spainCoords = [40.4168, -3.7038];
    const initialZoom = 6;

    // Crear mapa Leaflet
    state.map = L.map("map-container", {
      center: spainCoords,
      zoom: initialZoom,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false // Personalizaremos el control
    });

    // Control de zoom en posición inferior izquierda
    L.control.zoom({ position: "bottomleft" }).addTo(state.map);

    // Capa base: Esri World Street Map (100% gratuita, sin marcas de agua ni restricciones de API Key)
    const esriStreet = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri"
      }
    );
    esriStreet.addTo(state.map);

    // Agrupación inteligente de marcadores (MarkerCluster) para fluidez absoluta con miles de juzgados
    state.markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 45,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let sizeClass = "marker-cluster-small";
        if (count > 8) sizeClass = "marker-cluster-medium";
        if (count > 20) sizeClass = "marker-cluster-large";

        return new L.DivIcon({
          html: `<div><span>${count}</span></div>`,
          className: "marker-cluster " + sizeClass,
          iconSize: new L.Point(40, 40)
        });
      }
    });

    state.map.addLayer(state.markerClusterGroup);

    // Cargar marcadores de todos los juzgados
    updateMapMarkers();

    // Redimensionar correctamente cuando cambie tamaño de ventana
    window.addEventListener("resize", () => {
      if (state.map) state.map.invalidateSize();
    });

    // Actualización dinámica de marcadores al hacer zoom (revela Juzgados de Paz en zoom >= 10)
    let zoomDebounce = null;
    state.map.on("zoomend", () => {
      clearTimeout(zoomDebounce);
      zoomDebounce = setTimeout(() => {
        updateMapMarkers();
      }, 120);
    });
  }

  // Actualiza los marcadores en el mapa según los juzgados y filtros activos
  function updateMapMarkers() {
    if (!state.markerClusterGroup) return;

    state.markerClusterGroup.clearLayers();
    state.courtMarkers.clear();

    const courts = getFilteredCourts();

    courts.forEach((court) => {
      const subs = window.dataService.getSubstitutesForCourt(court.id);
      const subsCount = subs.length;

      // Crear icono SVG personalizado para Juzgado Principal o Juzgado de Paz
      const isPrincipal = court.type === "principal";
      const markerHtml = `
        <div class="custom-court-marker ${court.type}" style="width: 34px; height: 34px;">
          ${
            isPrincipal
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 9l9-6 9 6M6 13h12M4 17h16M2 21h20"/></svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`
          }
          ${subsCount > 0 ? `<span class="marker-badge-count" title="${subsCount} sustitutos">${subsCount}</span>` : ""}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-div-icon",
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([court.lat, court.lng], {
        icon: customIcon,
        title: court.name
      });

      // Tooltip informativo al pasar el cursor
      marker.bindTooltip(
        `<strong>${court.name}</strong><br><span style="color:#64748b; font-size:11px;">${court.city} (${court.province}) • ${subsCount} sustitutos</span>`,
        { direction: "top", offset: [0, -18] }
      );

      // Al hacer clic: zoom cinematográfico estilo Prezi + apertura de ficha
      marker.on("click", () => {
        zoomToCourtAndOpen(court);
      });

      state.markerClusterGroup.addLayer(marker);
      state.courtMarkers.set(court.id, marker);
    });
  }

  // Efecto Prezi / Google Maps: Acercamiento suave a la ubicación
  function zoomToCourtAndOpen(court) {
    state.selectedCourt = court;
    const targetZoom = Math.max(state.map.getZoom(), 14);

    state.map.flyTo([court.lat, court.lng], targetZoom, {
      duration: 1.1,
      easeLinearity: 0.25
    });

    renderCourtDrawer(court);
    openCourtDrawer();
  }

  // ==========================================================================
  // 3. FICHA DE INFORMACIÓN DE SUSTITUTOS ASIGNADOS A UN JUZGADO
  // ==========================================================================
  function renderCourtDrawer(court) {
    if (!court) return;

    dom.drawerCourtTypePill.textContent =
      court.type === "principal" ? "Partido Judicial / Sede Principal" : "Juzgado de Paz";
    dom.drawerCourtTypePill.className = `drawer-court-type-pill ${court.type}`;

    dom.drawerCourtTitle.textContent = court.name;
    dom.drawerCourtLocation.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      ${court.city}, ${court.province} (${court.community})
    `;
    dom.drawerCourtAddress.textContent = court.address || "Dirección judicial oficial";
    dom.drawerCourtPhone.textContent = court.phone || "No especificado";

    // Obtener sustitutos asignados
    const substitutes = window.dataService.getSubstitutesForCourt(court.id);
    dom.drawerSubstitutesCount.textContent = `${substitutes.length} disponible${substitutes.length === 1 ? "" : "s"}`;

    if (substitutes.length === 0) {
      dom.drawerSubstitutesList.innerHTML = `
        <div class="empty-substitutes-notice">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
          <p>Actualmente no hay procuradores sustitutos asignados a este juzgado.</p>
          <button class="btn-action-primary" id="btn-add-first-sub" style="font-size:0.8rem; padding:0.4rem 0.8rem;">
            + Asignar primer sustituto
          </button>
        </div>
      `;
      const btnAddFirst = document.getElementById("btn-add-first-sub");
      if (btnAddFirst) {
        btnAddFirst.addEventListener("click", () => openAddSubstituteModal(court.id));
      }
    } else {
      dom.drawerSubstitutesList.innerHTML = substitutes
        .map((sub) => createSubstituteCardHTML(sub, court))
        .join("");
      attachSubstituteCardEvents(dom.drawerSubstitutesList);
    }
  }

  // Genera el HTML de la tarjeta del procurador sustituto (con contacto directo y tarifa)
  function createSubstituteCardHTML(sub, currentCourt = null) {
    const rawPhone = (sub.phone || "").replace(/\D/g, "");
    const waText = encodeURIComponent(
      `Hola ${sub.name}, te contacto desde la plataforma de procuradores sustitutos para consultar tu disponibilidad para una sustitución judicial.`
    );
    const waLink = `https://wa.me/${rawPhone}?text=${waText}`;

    return `
      <div class="substitute-card" data-sub-id="${sub.id}">
        <div class="substitute-header">
          <div class="substitute-name-col">
            <h4 class="substitute-name">${escapeHTML(sub.name)}</h4>
            <div class="substitute-col-badge">${escapeHTML(sub.collegiateNumber || "Colegiado/a")}</div>
          </div>
          <div>
            <div class="substitute-price-pill">${sub.price ? `${sub.price} €` : "A convenir"}</div>
            ${sub.priceDetails ? `<div class="substitute-price-details">${escapeHTML(sub.priceDetails)}</div>` : ""}
          </div>
        </div>

        <!-- Botones de contacto directo (Teléfono, WhatsApp y Correo) -->
        <div class="substitute-contact-grid">
          <a href="tel:${sub.phone}" class="contact-btn phone" title="Llamar directamente">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${escapeHTML(sub.phone || "Teléfono")}
          </a>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="contact-btn whatsapp" title="Enviar WhatsApp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.17 8.17 0 0 1-5.82 2.41h-.01c-1.46 0-2.89-.39-4.14-1.13l-.3-.18-3.09.81.83-3.01-.2-.31a8.21 8.21 0 0 1-1.26-4.43c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/></svg>
            WhatsApp
          </a>
          <a href="mailto:${sub.email}?subject=Solicitud%20de%20sustitución%20judicial" class="contact-btn email" title="Enviar correo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            ${escapeHTML(sub.email || "Correo electrónico")}
          </a>
        </div>

        <div class="substitute-details-extra">
          ${sub.specialties ? `<div><strong>Especialidades:</strong> ${escapeHTML(sub.specialties)}</div>` : ""}
          ${sub.availability ? `<div><strong>Disponibilidad:</strong> ${escapeHTML(sub.availability)}</div>` : ""}
          ${sub.notes ? `<div><strong>Observaciones:</strong> ${escapeHTML(sub.notes)}</div>` : ""}
        </div>

        <div class="substitute-card-footer">
          <button class="btn-card-action btn-copy-contact" data-copy="${escapeHTML(sub.name + ' - Tel: ' + sub.phone + ' - Email: ' + sub.email + ' - Tarifa: ' + sub.price + '€')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copiar ficha
          </button>
          <button class="btn-card-action btn-edit-sub" data-sub-id="${sub.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Editar
          </button>
          <button class="btn-card-action danger btn-delete-sub" data-sub-id="${sub.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Eliminar
          </button>
        </div>
      </div>
    `;
  }

  function attachSubstituteCardEvents(container) {
    // Copiar contacto al portapapeles
    container.querySelectorAll(".btn-copy-contact").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-copy");
        navigator.clipboard.writeText(text).then(() => {
          showToast("Ficha de contacto copiada al portapapeles");
        });
      });
    });

    // Editar sustituto
    container.querySelectorAll(".btn-edit-sub").forEach((btn) => {
      btn.addEventListener("click", () => {
        const subId = btn.getAttribute("data-sub-id");
        openEditSubstituteModal(subId);
      });
    });

    // Eliminar sustituto
    container.querySelectorAll(".btn-delete-sub").forEach((btn) => {
      btn.addEventListener("click", () => {
        const subId = btn.getAttribute("data-sub-id");
        const sub = window.dataService.getSubstitutes().find((s) => s.id === subId);
        if (confirm(`¿Seguro que deseas eliminar al sustituto "${sub ? sub.name : 'este registro'}"?`)) {
          window.dataService.deleteSubstitute(subId);
          showToast("Procurador sustituto eliminado correctamente");
          updateMapMarkers();
          if (state.selectedCourt) {
            renderCourtDrawer(state.selectedCourt);
          }
          renderDirectory();
        }
      });
    });
  }

  function openCourtDrawer() {
    dom.courtDetailsDrawer.classList.add("open");
  }

  function closeCourtDrawer() {
    dom.courtDetailsDrawer.classList.remove("open");
  }

  // ==========================================================================
  // 4. VISTA DE DIRECTORIO GENERAL (BÚSQUEDA TRADICIONAL EN LISTA)
  // ==========================================================================
  function renderDirectory() {
    const substitutes = getFilteredSubstitutes();
    dom.directoryCountText.textContent = `Mostrando ${substitutes.length} procurador${substitutes.length === 1 ? "" : "es"} sustituto${substitutes.length === 1 ? "" : "s"}`;

    if (substitutes.length === 0) {
      dom.directoryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; display: block;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3 style="font-size:1.15rem; font-weight:700; color:var(--secondary); margin-bottom:0.5rem;">No se encontraron resultados</h3>
          <p style="font-size:0.875rem;">Prueba a cambiar los términos de búsqueda o a restablecer los filtros de provincia y precio.</p>
        </div>
      `;
      return;
    }

    dom.directoryGrid.innerHTML = substitutes
      .map((sub) => {
        const assignedCourts = (sub.courts || [])
          .map((cId) => window.dataService.getCourtById(cId))
          .filter(Boolean);

        const courtsBadges = assignedCourts
          .map(
            (c) =>
              `<span class="court-tag" data-court-id="${c.id}" title="${escapeHTML(c.name)} (${c.province})">${escapeHTML(c.name.length > 30 ? c.name.substring(0, 30) + '...' : c.name)}</span>`
          )
          .join("");

        return `
          <div class="substitute-card" data-sub-id="${sub.id}">
            <div class="substitute-header">
              <div class="substitute-name-col">
                <h4 class="substitute-name">${escapeHTML(sub.name)}</h4>
                <div class="substitute-col-badge">${escapeHTML(sub.collegiateNumber || "Colegiado/a")}</div>
              </div>
              <div>
                <div class="substitute-price-pill">${sub.price ? `${sub.price} €` : "A convenir"}</div>
                ${sub.priceDetails ? `<div class="substitute-price-details">${escapeHTML(sub.priceDetails)}</div>` : ""}
              </div>
            </div>

            <!-- Juzgados que cubre -->
            <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.25rem;">
              <strong>Juzgados asignados (${assignedCourts.length}):</strong>
              <div class="assigned-courts-tags">
                ${courtsBadges || "<em>Sin juzgados asignados</em>"}
              </div>
            </div>

            <div class="substitute-contact-grid">
              <a href="tel:${sub.phone}" class="contact-btn phone">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${escapeHTML(sub.phone || "Llamar")}
              </a>
              <a href="https://wa.me/${(sub.phone || '').replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" class="contact-btn whatsapp">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.17 8.17 0 0 1-5.82 2.41h-.01c-1.46 0-2.89-.39-4.14-1.13l-.3-.18-3.09.81.83-3.01-.2-.31a8.21 8.21 0 0 1-1.26-4.43c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/></svg>
                WhatsApp
              </a>
              <a href="mailto:${sub.email}" class="contact-btn email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                ${escapeHTML(sub.email || "Email")}
              </a>
            </div>

            <div class="substitute-details-extra">
              ${sub.specialties ? `<div><strong>Especialidades:</strong> ${escapeHTML(sub.specialties)}</div>` : ""}
              ${sub.availability ? `<div><strong>Disponibilidad:</strong> ${escapeHTML(sub.availability)}</div>` : ""}
            </div>

            <div class="substitute-card-footer">
              <button class="btn-card-action btn-copy-contact" data-copy="${escapeHTML(sub.name + ' - Tel: ' + sub.phone + ' - Email: ' + sub.email + ' - Tarifa: ' + sub.price + '€')}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                Copiar
              </button>
              <button class="btn-card-action btn-edit-sub" data-sub-id="${sub.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Editar
              </button>
              <button class="btn-card-action danger btn-delete-sub" data-sub-id="${sub.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Eliminar
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    attachSubstituteCardEvents(dom.directoryGrid);

    // Al hacer clic en un tag de juzgado en el directorio -> cambiar al mapa y hacer zoom
    dom.directoryGrid.querySelectorAll(".court-tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        const courtId = tag.getAttribute("data-court-id");
        const court = window.dataService.getCourtById(courtId);
        if (court) {
          switchView("map");
          setTimeout(() => {
            zoomToCourtAndOpen(court);
          }, 300);
        }
      });
    });
  }

  // ==========================================================================
  // 5. MOTOR DE FILTRADO Y BÚSQUEDA
  // ==========================================================================
  function getFilteredCourts() {
    const courts = window.dataService.getCourts();
    const query = state.filters.searchQuery.toLowerCase().trim();
    const province = state.filters.province;
    const type = state.filters.type;
    const currentZoom = state.map ? state.map.getZoom() : 6;

    // Si hay búsqueda activa, filtro de provincia o filtro explícito de tipo:
    const isTargetedSearch = query.length > 0 || province !== "all" || type !== "all";

    return courts.filter((court) => {
      // Estructura y carga dinámica:
      // A vista nacional lejana (zoom < 10) mostramos Partidos Judiciales y Sedes Principales para máxima fluidez.
      // Al acercar el zoom (zoom >= 10), o al buscar un municipio/juzgado, emergen automáticamente todos los Juzgados de Paz.
      if (!isTargetedSearch && currentZoom < 10 && court.type === "paz") {
        return false;
      }

      // Filtro provincia
      if (province !== "all" && court.province.toLowerCase() !== province.toLowerCase()) {
        return false;
      }

      // Filtro tipo (principal / paz)
      if (type !== "all" && court.type !== type) {
        return false;
      }

      // Búsqueda de texto
      if (query) {
        const inCourt =
          court.name.toLowerCase().includes(query) ||
          court.city.toLowerCase().includes(query) ||
          court.province.toLowerCase().includes(query) ||
          (court.category && court.category.toLowerCase().includes(query)) ||
          (court.jurisdiction && court.jurisdiction.toLowerCase().includes(query)) ||
          (court.address && court.address.toLowerCase().includes(query));

        if (inCourt) return true;

        // También buscar si algún sustituto de este juzgado coincide con la búsqueda
        const subs = window.dataService.getSubstitutesForCourt(court.id);
        const inSubs = subs.some(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            (s.email && s.email.toLowerCase().includes(query)) ||
            (s.phone && s.phone.includes(query)) ||
            (s.specialties && s.specialties.toLowerCase().includes(query))
        );

        return inSubs;
      }

      return true;
    });
  }

  function getFilteredSubstitutes() {
    const substitutes = window.dataService.getSubstitutes();
    const query = state.filters.searchQuery.toLowerCase().trim();
    const province = state.filters.province;
    const maxPrice = state.filters.maxPrice;

    return substitutes.filter((sub) => {
      // Filtro de precio máximo
      if (maxPrice !== "all") {
        const numPrice = parseFloat(maxPrice);
        if (sub.price && sub.price > numPrice) {
          return false;
        }
      }

      // Filtro por provincia (ver si alguno de los juzgados del sustituto está en la provincia)
      if (province !== "all") {
        const subCourts = (sub.courts || []).map((id) => window.dataService.getCourtById(id)).filter(Boolean);
        const matchesProvince = subCourts.some(
          (c) => c.province.toLowerCase() === province.toLowerCase()
        );
        if (!matchesProvince) return false;
      }

      // Búsqueda de texto
      if (query) {
        const inSub =
          sub.name.toLowerCase().includes(query) ||
          (sub.collegiateNumber && sub.collegiateNumber.toLowerCase().includes(query)) ||
          (sub.phone && sub.phone.includes(query)) ||
          (sub.email && sub.email.toLowerCase().includes(query)) ||
          (sub.specialties && sub.specialties.toLowerCase().includes(query)) ||
          (sub.notes && sub.notes.toLowerCase().includes(query));

        if (inSub) return true;

        // Buscar también si el texto coincide con alguno de sus juzgados asociados
        const subCourts = (sub.courts || []).map((id) => window.dataService.getCourtById(id)).filter(Boolean);
        const inCourts = subCourts.some(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.city.toLowerCase().includes(query) ||
            c.province.toLowerCase().includes(query)
        );

        return inCourts;
      }

      return true;
    });
  }

  function applyFilters() {
    updateMapMarkers();
    renderDirectory();
    if (state.selectedCourt) {
      renderCourtDrawer(state.selectedCourt);
    }
  }

  function populateProvincesFilter() {
    const courts = window.dataService.getCourts();
    const provinces = Array.from(new Set(courts.map((c) => c.province))).sort((a, b) =>
      a.localeCompare(b, "es")
    );

    dom.filterProvinceSelect.innerHTML = `<option value="all">Todas las provincias de España (${provinces.length})</option>`;
    provinces.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      dom.filterProvinceSelect.appendChild(opt);
    });
  }

  // ==========================================================================
  // 5B. AUTOCOMPLETADO Y RESOLUCIÓN EN TIEMPO REAL (8.131 MUNICIPIOS DE ESPAÑA)
  // ==========================================================================
  function renderAutocompleteSuggestions(query) {
    if (!dom.searchAutocompleteBox) return;
    const q = query.trim().toLowerCase();

    if (q.length < 2) {
      dom.searchAutocompleteBox.classList.remove("open");
      dom.searchAutocompleteBox.innerHTML = "";
      return;
    }

    // 1. Buscar primero en juzgados principales y preconfigurados
    const courts = window.dataService.getCourts();
    const courtMatches = courts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      )
      .slice(0, 4);

    // 2. Buscar en el censo oficial completo de los 8.131 municipios de España
    let muniMatches = [];
    if (window.ALL_SPAIN_MUNICIPALITIES && Array.isArray(window.ALL_SPAIN_MUNICIPALITIES)) {
      muniMatches = window.ALL_SPAIN_MUNICIPALITIES
        .filter(
          (m) =>
            m.m.toLowerCase().startsWith(q) ||
            m.m.toLowerCase().includes(q)
        )
        .slice(0, 8);
    }

    // Evitar duplicados con los ya mostrados en courtMatches
    const courtCitySet = new Set(courtMatches.map((c) => c.city.toLowerCase()));
    muniMatches = muniMatches.filter((m) => !courtCitySet.has(m.m.toLowerCase()));

    if (courtMatches.length === 0 && muniMatches.length === 0) {
      dom.searchAutocompleteBox.classList.remove("open");
      return;
    }

    let html = "";

    courtMatches.forEach((c) => {
      html += `
        <div class="autocomplete-item" data-action="court" data-id="${c.id}">
          <div>
            <div class="autocomplete-court-name">${escapeHTML(c.name)}</div>
            <div class="autocomplete-court-meta">${escapeHTML(c.city)} (${escapeHTML(c.province)})</div>
          </div>
          <span class="autocomplete-badge ${c.type}">
            ${c.type === "principal" ? "Sede Judicial" : "Juzgado de Paz"}
          </span>
        </div>
      `;
    });

    muniMatches.forEach((m) => {
      html += `
        <div class="autocomplete-item" data-action="muni" data-city="${escapeHTML(m.m)}" data-prov="${escapeHTML(m.p)}" data-com="${escapeHTML(m.c)}">
          <div>
            <div class="autocomplete-court-name">Juzgado de Paz de ${escapeHTML(m.m)}</div>
            <div class="autocomplete-court-meta">${escapeHTML(m.m)} (${escapeHTML(m.p)} - ${escapeHTML(m.c)})</div>
          </div>
          <span class="autocomplete-badge paz">Juzgado de Paz</span>
        </div>
      `;
    });

    dom.searchAutocompleteBox.innerHTML = html;
    dom.searchAutocompleteBox.classList.add("open");

    // Click handler en cada sugerencia
    dom.searchAutocompleteBox.querySelectorAll(".autocomplete-item").forEach((item) => {
      item.addEventListener("click", () => {
        const action = item.getAttribute("data-action");
        if (action === "court") {
          const courtId = item.getAttribute("data-id");
          const court = window.dataService.getCourtById(courtId);
          if (court) {
            if (state.currentView !== "map") switchView("map");
            zoomToCourtAndOpen(court);
          }
        } else if (action === "muni") {
          const city = item.getAttribute("data-city");
          dom.globalSearchInput.value = city;
          searchAndResolveMunicipality(city);
        }
        dom.searchAutocompleteBox.classList.remove("open");
      });
    });
  }

  // ==========================================================================
  // 5C. RESOLUTOR UNIVERSAL DE MUNICIPIOS Y JUZGADOS DE PAZ DE ESPAÑA
  // Permite localizar y registrar en el mapa CUALQUIER municipio español (8.131)
  // ==========================================================================
  async function searchAndResolveMunicipality(query) {
    if (!query || query.trim().length < 2) {
      showToast("Escribe el nombre de un municipio o juzgado");
      return;
    }

    const cleanQuery = query.trim();

    // 1. Primero comprobar si ya existe en la base local (por municipio, nombre o provincia)
    const localMatches = getFilteredCourts();
    if (localMatches.length > 0) {
      const bestMatch =
        localMatches.find(
          (c) =>
            c.city.toLowerCase() === cleanQuery.toLowerCase() ||
            c.name.toLowerCase().includes(cleanQuery.toLowerCase())
        ) || localMatches[0];

      if (state.currentView !== "map") switchView("map");
      zoomToCourtAndOpen(bestMatch);
      showToast(`Juzgado localizado: ${bestMatch.name}`);
      return;
    }

    // 2. Si no está en la base local previa, resolver mediante censo municipal oficial de España
    if (dom.btnSearchMunicipality) {
      dom.btnSearchMunicipality.disabled = true;
      dom.btnSearchMunicipality.innerHTML = `<span>Buscando...</span>`;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=es&addressdetails=1&limit=5&q=${encodeURIComponent(
        cleanQuery + ", España"
      )}`;
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const place = data[0];
        const addr = place.address || {};
        const municipalityName =
          addr.village || addr.town || addr.city || addr.municipality || cleanQuery;
        const province = addr.province || addr.state || addr.county || "España";
        const community = addr.state || province;

        const courtName = `Juzgado de Paz de ${municipalityName}`;

        // Comprobar si ya existía con nombre similar
        let court = window.dataService
          .getCourts()
          .find((c) => c.city.toLowerCase() === municipalityName.toLowerCase());

        if (!court) {
          court = window.dataService.addCourt({
            name: courtName,
            type: "paz",
            category: "Juzgado de Paz",
            jurisdiction: "Registro Civil, Conciliaciones, Exhortos y Juicios Verbales Menores",
            city: municipalityName,
            province: province,
            community: community,
            address: `Sede Municipal / Ayuntamiento de ${municipalityName}`,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          });
        }

        populateProvincesFilter();
        updateMapMarkers();

        if (state.currentView !== "map") switchView("map");
        setTimeout(() => {
          zoomToCourtAndOpen(court);
          showToast(`✓ Localizado: ${court.name} (${province})`);
        }, 300);
      } else {
        showToast(`No se encontró el municipio "${cleanQuery}". Revisa la ortografía.`);
      }
    } catch (err) {
      console.warn("Error en resolución municipal:", err);
      showToast("Búsqueda completada con los juzgados locales.");
    } finally {
      if (dom.btnSearchMunicipality) {
        dom.btnSearchMunicipality.disabled = false;
        dom.btnSearchMunicipality.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span>Buscar Municipio</span>
        `;
      }
    }
  }

  // ==========================================================================
  // 6. GESTIÓN CRUD DE PROCURADORES SUSTITUTOS (MODAL)
  // ==========================================================================
  function openAddSubstituteModal(preselectedCourtId = null) {
    state.editingSubstituteId = null;
    dom.substituteModalTitle.textContent = "Añadir Nuevo Procurador Sustituto";
    dom.substituteForm.reset();
    dom.subIdInput.value = "";

    renderCourtsPicker(preselectedCourtId ? [preselectedCourtId] : []);
    dom.substituteModal.classList.add("open");
    dom.subNameInput.focus();
  }

  function openEditSubstituteModal(subId) {
    const sub = window.dataService.getSubstitutes().find((s) => s.id === subId);
    if (!sub) return;

    state.editingSubstituteId = subId;
    dom.substituteModalTitle.textContent = "Editar Procurador Sustituto";
    dom.subIdInput.value = sub.id;
    dom.subNameInput.value = sub.name || "";
    dom.subCollegiateInput.value = sub.collegiateNumber || "";
    dom.subPhoneInput.value = sub.phone || "";
    dom.subEmailInput.value = sub.email || "";
    dom.subPriceInput.value = sub.price || "";
    dom.subPriceDetailsInput.value = sub.priceDetails || "";
    dom.subSpecialtiesInput.value = sub.specialties || "";
    dom.subAvailabilityInput.value = sub.availability || "";
    dom.subNotesInput.value = sub.notes || "";

    renderCourtsPicker(sub.courts || []);
    dom.substituteModal.classList.add("open");
    dom.subNameInput.focus();
  }

  function closeSubstituteModal() {
    dom.substituteModal.classList.remove("open");
    state.editingSubstituteId = null;
  }

  function renderCourtsPicker(selectedCourtIds = []) {
    const courts = window.dataService.getCourts();
    dom.courtsPickerList.innerHTML = courts
      .map((court) => {
        const isChecked = selectedCourtIds.includes(court.id) ? "checked" : "";
        return `
          <label class="court-checkbox-item">
            <input type="checkbox" name="assigned_courts" value="${court.id}" ${isChecked}>
            <div>
              <strong>${escapeHTML(court.name)}</strong>
              <div style="font-size: 0.725rem; color: var(--text-muted);">${escapeHTML(court.city)} (${escapeHTML(court.province)}) • ${court.type === "principal" ? "Principal" : "Juzgado de Paz"}</div>
            </div>
          </label>
        `;
      })
      .join("");
  }

  function handleSubstituteFormSubmit(e) {
    e.preventDefault();

    const name = dom.subNameInput.value.trim();
    if (!name) {
      alert("Por favor introduce el nombre completo del procurador.");
      return;
    }

    const checkedCourts = Array.from(
      dom.courtsPickerList.querySelectorAll("input[name='assigned_courts']:checked")
    ).map((input) => input.value);

    const subData = {
      name: name,
      collegiateNumber: dom.subCollegiateInput.value.trim(),
      phone: dom.subPhoneInput.value.trim(),
      email: dom.subEmailInput.value.trim(),
      price: parseFloat(dom.subPriceInput.value) || 0,
      priceDetails: dom.subPriceDetailsInput.value.trim(),
      specialties: dom.subSpecialtiesInput.value.trim(),
      availability: dom.subAvailabilityInput.value.trim(),
      notes: dom.subNotesInput.value.trim(),
      courts: checkedCourts
    };

    if (state.editingSubstituteId) {
      window.dataService.updateSubstitute(state.editingSubstituteId, subData);
      showToast("Procurador actualizado correctamente");
    } else {
      window.dataService.addSubstitute(subData);
      showToast("Nuevo procurador sustituto registrado con éxito");
    }

    closeSubstituteModal();
    updateMapMarkers();
    renderDirectory();

    if (state.selectedCourt) {
      renderCourtDrawer(state.selectedCourt);
    }
  }

  // ==========================================================================
  // 6B. GESTIÓN DE NUEVOS JUZGADOS / SEDES JUDICIALES
  // ==========================================================================
  function openAddCourtModal() {
    dom.courtForm.reset();
    dom.courtModal.classList.add("open");
    dom.courtNameInput.focus();
  }

  function closeCourtModal() {
    dom.courtModal.classList.remove("open");
  }

  function handleCourtFormSubmit(e) {
    e.preventDefault();

    const name = dom.courtNameInput.value.trim();
    const province = dom.courtProvinceInput.value.trim();
    const city = dom.courtCityInput.value.trim();
    const type = dom.courtTypeInput.value;

    if (!name || !province || !city) {
      alert("Por favor completa el nombre, provincia y municipio.");
      return;
    }

    // Coordenadas manuales o aproximadas por el centro del mapa actual
    let lat = state.map ? state.map.getCenter().lat : 40.4168;
    let lng = state.map ? state.map.getCenter().lng : -3.7038;

    const coordsStr = dom.courtCoordsInput.value.trim();
    if (coordsStr && coordsStr.includes(",")) {
      const parts = coordsStr.split(",");
      const parsedLat = parseFloat(parts[0]);
      const parsedLng = parseFloat(parts[1]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
      }
    }

    const newCourt = window.dataService.addCourt({
      name,
      type,
      category: type === "principal" ? "Partido Judicial" : "Juzgado de Paz",
      province,
      city,
      community: dom.courtCommunityInput.value.trim() || province,
      address: dom.courtAddressInput.value.trim() || "",
      phone: dom.courtPhoneInput.value.trim() || "",
      lat,
      lng
    });

    closeCourtModal();
    populateProvincesFilter();
    updateMapMarkers();
    showToast(`Sede judicial "${name}" añadida con éxito`);

    if (state.currentView === "map" && state.map) {
      setTimeout(() => {
        zoomToCourtAndOpen(newCourt);
      }, 400);
    }
  }

  // ==========================================================================
  // 7. COPIAS DE SEGURIDAD Y RESTAURACIÓN (EXPORT / IMPORT JSON)
  // ==========================================================================
  function openBackupModal() {
    dom.backupModal.classList.add("open");
  }

  function closeBackupModal() {
    dom.backupModal.classList.remove("open");
  }

  function exportBackup() {
    const jsonStr = window.dataService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `backup_procuradores_espana_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Copia de seguridad descargada en formato JSON");
  }

  function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const content = evt.target.result;
      const result = window.dataService.importBackupJSON(content);
      if (result.success) {
        showToast(`Base de datos restaurada: ${result.countSubs} sustitutos cargados`);
        populateProvincesFilter();
        updateMapMarkers();
        renderDirectory();
        closeBackupModal();
      } else {
        alert("Error al importar la copia de seguridad: " + result.error);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Limpiar input file
  }

  function resetToDefaultData() {
    if (
      confirm(
        "¿Deseas restaurar la base de datos a sus valores iniciales? Se sobrescribirán los cambios no guardados en copia externa."
      )
    ) {
      window.dataService.resetToDefault();
      populateProvincesFilter();
      updateMapMarkers();
      renderDirectory();
      closeBackupModal();
      showToast("Base de datos restablecida a los valores iniciales oficiales");
    }
  }

  // ==========================================================================
  // 8. VISTAS Y NAVEGACIÓN
  // ==========================================================================
  function switchView(targetView) {
    state.currentView = targetView;

    if (targetView === "map") {
      dom.navTabMap.classList.add("active");
      dom.navTabDirectory.classList.remove("active");
      dom.mapViewWrapper.classList.add("active");
      dom.directoryViewWrapper.classList.remove("active");
      if (state.map) {
        setTimeout(() => state.map.invalidateSize(), 200);
      }
    } else {
      dom.navTabMap.classList.remove("active");
      dom.navTabDirectory.classList.add("active");
      dom.mapViewWrapper.classList.remove("active");
      dom.directoryViewWrapper.classList.add("active");
      renderDirectory();
    }
  }

  // ==========================================================================
  // 9. EVENT LISTENERS
  // ==========================================================================
  function setupEventListeners() {
    // Cambio de pestañas
    dom.navTabMap.addEventListener("click", () => switchView("map"));
    dom.navTabDirectory.addEventListener("click", () => switchView("directory"));

    // Búsqueda en tiempo real y autocompletado en los 8.131 municipios de España
    dom.globalSearchInput.addEventListener("input", (e) => {
      state.filters.searchQuery = e.target.value;
      applyFilters();
      renderAutocompleteSuggestions(e.target.value);
    });

    // Enter en input de búsqueda para disparar búsqueda y resolución inmediata de cualquier municipio
    dom.globalSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (dom.searchAutocompleteBox) dom.searchAutocompleteBox.classList.remove("open");
        searchAndResolveMunicipality(e.target.value);
      }
    });

    if (dom.btnSearchMunicipality) {
      dom.btnSearchMunicipality.addEventListener("click", () => {
        if (dom.searchAutocompleteBox) dom.searchAutocompleteBox.classList.remove("open");
        searchAndResolveMunicipality(dom.globalSearchInput.value);
      });
    }

    // Cerrar desplegable al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-input-group")) {
        if (dom.searchAutocompleteBox) dom.searchAutocompleteBox.classList.remove("open");
      }
    });

    // Filtros desplegables
    dom.filterProvinceSelect.addEventListener("change", (e) => {
      state.filters.province = e.target.value;
      applyFilters();
    });

    dom.filterTypeSelect.addEventListener("change", (e) => {
      state.filters.type = e.target.value;
      applyFilters();
    });

    dom.filterPriceSelect.addEventListener("change", (e) => {
      state.filters.maxPrice = e.target.value;
      applyFilters();
    });

    // Píldoras de navegación si están presentes
    if (dom.regionPillsContainer) {
      dom.regionPillsContainer.querySelectorAll(".region-pill-btn").forEach((pill) => {
        pill.addEventListener("click", () => {
          dom.regionPillsContainer
            .querySelectorAll(".region-pill-btn")
            .forEach((p) => p.classList.remove("active"));
          pill.classList.add("active");

          const lat = parseFloat(pill.getAttribute("data-lat"));
          const lng = parseFloat(pill.getAttribute("data-lng"));
          const zoom = parseInt(pill.getAttribute("data-zoom"), 10);

          if (state.currentView !== "map") {
            switchView("map");
          }

          if (state.map) {
            state.map.flyTo([lat, lng], zoom, {
              duration: 1.2,
              easeLinearity: 0.2
            });
          }
        });
      });
    }

    // Botones del Drawer
    if (dom.drawerCloseBtn) dom.drawerCloseBtn.addEventListener("click", closeCourtDrawer);
    if (dom.btnAddSubToCourt) {
      dom.btnAddSubToCourt.addEventListener("click", () => {
        if (!state.isAuthenticated) {
          openAuthModal();
          return;
        }
        if (state.selectedCourt) {
          openAddSubstituteModal(state.selectedCourt.id);
        }
      });
    }

    // Botones del Modal CRUD
    if (dom.btnOpenAddModal) {
      dom.btnOpenAddModal.addEventListener("click", () => {
        if (!state.isAuthenticated) {
          openAuthModal();
          return;
        }
        openAddSubstituteModal();
      });
    }
    if (dom.modalCloseBtn) dom.modalCloseBtn.addEventListener("click", closeSubstituteModal);
    if (dom.modalCancelBtn) dom.modalCancelBtn.addEventListener("click", closeSubstituteModal);
    if (dom.substituteForm) dom.substituteForm.addEventListener("submit", handleSubstituteFormSubmit);

    // Botones del Modal de Juzgado
    if (dom.btnOpenAddCourtModal) {
      dom.btnOpenAddCourtModal.addEventListener("click", () => {
        if (!state.isAuthenticated) {
          openAuthModal();
          return;
        }
        openAddCourtModal();
      });
    }
    if (dom.courtModalCloseBtn) dom.courtModalCloseBtn.addEventListener("click", closeCourtModal);
    if (dom.courtModalCancelBtn) dom.courtModalCancelBtn.addEventListener("click", closeCourtModal);
    if (dom.courtForm) dom.courtForm.addEventListener("submit", handleCourtFormSubmit);

    // Botones del Modal Backup
    if (dom.btnOpenBackupModal) dom.btnOpenBackupModal.addEventListener("click", openBackupModal);
    if (dom.backupModalCloseBtn) dom.backupModalCloseBtn.addEventListener("click", closeBackupModal);
    if (dom.btnExportJson) dom.btnExportJson.addEventListener("click", exportBackup);
    if (dom.importJsonFileInput) dom.importJsonFileInput.addEventListener("change", importBackup);
    if (dom.btnResetData) dom.btnResetData.addEventListener("click", resetToDefaultData);

    // Modal Admin Panel
    const btnOpenAdmin = document.getElementById("btn-open-admin-panel");
    const adminModal = document.getElementById("admin-panel-modal");
    const btnCloseAdmin = document.getElementById("admin-modal-close-btn");

    if (btnOpenAdmin && adminModal) {
      btnOpenAdmin.addEventListener("click", () => {
        if (window.ProApp && typeof window.ProApp.loadAdminPanelData === "function") {
          window.ProApp.loadAdminPanelData();
        }
        adminModal.style.display = "flex";
      });
    }
    if (btnCloseAdmin && adminModal) {
      btnCloseAdmin.addEventListener("click", () => {
        adminModal.style.display = "none";
      });
    }

    // Cerrar modales con tecla ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCourtDrawer();
        closeSubstituteModal();
        closeCourtModal();
        closeBackupModal();
        closeAuthModal();
        if (adminModal) adminModal.style.display = "none";
      }
    });

    // Cerrar al hacer clic fuera del modal
    if (dom.substituteModal) {
      dom.substituteModal.addEventListener("click", (e) => {
        if (e.target === dom.substituteModal) closeSubstituteModal();
      });
    }
    if (dom.courtModal) {
      dom.courtModal.addEventListener("click", (e) => {
        if (e.target === dom.courtModal) closeCourtModal();
      });
    }
    if (dom.backupModal) {
      dom.backupModal.addEventListener("click", (e) => {
        if (e.target === dom.backupModal) closeBackupModal();
      });
    }
  }

  // ==========================================================================
  // 10. UTILIDADES
  // ==========================================================================
  function showToast(msg) {
    dom.toastMessage.textContent = msg;
    dom.toastNotification.classList.add("show");
    setTimeout(() => {
      dom.toastNotification.classList.remove("show");
    }, 3500);
  }

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Arranque inmediato
  document.addEventListener("DOMContentLoaded", init);

  // Hidratación asíncrona de datos masivos en segundo plano (no bloquea el arranque)
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (window.SPAIN_JUDICIAL_DATABASE && window.dataService) {
        const added = window.dataService.hydrateFullDatabase(window.SPAIN_JUDICIAL_DATABASE);
        if (added > 0) {
          populateProvincesFilter();
          updateMapMarkers();
          renderDirectory();
        }
      }
    }, 200);
  });
})();
