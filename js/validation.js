/**
 * ============================================================================
 * SERVICIO DE VALIDACIÓN Y SANITIZACIÓN - PROCURADORES SUSTITUTOS ESPAÑA
 * ============================================================================
 * Prevención de XSS, inyección y validación rigurosa de entradas de usuario.
 */

export const ValidationService = {
    /**
     * Sanitizar cadenas contra Cross-Site Scripting (XSS)
     */
    sanitize(input) {
        if (input === null || input === undefined) return '';
        if (typeof input !== 'string') return String(input);
        
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim();
    },

    /**
     * Validar correo electrónico
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email.trim());
    },

    /**
     * Validar número de teléfono (formato español / internacional)
     */
    isValidPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        // Permite prefijos internacionales opcionales y números de 9 dígitos con o sin espacios/guiones
        const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
        const re = /^(\+34|0034)?[6-9]\d{8}$/;
        return re.test(cleaned);
    },

    /**
     * Validar número de colegiado (letras, guiones y números)
     */
    isValidColegiate(num) {
        if (!num || typeof num !== 'string') return false;
        const trimmed = num.trim();
        return trimmed.length >= 2 && trimmed.length <= 30;
    },

    /**
     * Validar código postal español (5 dígitos)
     */
    isValidPostalCode(cp) {
        if (!cp || typeof cp !== 'string') return false;
        return /^(0[1-9]|[1-4][0-9]|5[0-2])\d{3}$/.test(cp.trim());
    },

    /**
     * Validar importe de tarifa
     */
    isValidPrice(amount) {
        const val = Number(amount);
        return !isNaN(val) && val >= 0 && val <= 100000;
    },

    /**
     * Validar coordenadas geográficas (latitud [-90, 90], longitud [-180, 180])
     */
    isValidCoordinates(lat, lng) {
        const nLat = Number(lat);
        const nLng = Number(lng);
        return !isNaN(nLat) && !isNaN(nLng) && nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180;
    },

    /**
     * Validar entidad completa de Procurador
     */
    validateSubstitute(sub) {
        const errors = [];
        if (!sub.first_name || sub.first_name.trim().length < 2) {
            errors.push('El nombre es obligatorio y debe tener al menos 2 caracteres.');
        }
        if (!sub.last_name || sub.last_name.trim().length < 2) {
            errors.push('Los apellidos son obligatorios.');
        }
        if (!this.isValidColegiate(sub.colegiate_number)) {
            errors.push('El número de colegiado es obligatorio.');
        }
        if (!this.isValidPhone(sub.phone)) {
            errors.push('El teléfono introducido no tiene un formato válido (ej: +34 612 345 678).');
        }
        if (!this.isValidEmail(sub.email)) {
            errors.push('El correo electrónico no es válido.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validar entidad de Tarifa
     */
    validateRate(rate) {
        const errors = [];
        if (!rate.substitute_id) {
            errors.push('Debe asociarse a un procurador.');
        }
        if (!this.isValidPrice(rate.amount)) {
            errors.push('El importe debe ser un número positivo válido.');
        }
        if (!rate.service_type || rate.service_type.trim().length < 3) {
            errors.push('El concepto o tipo de servicio es obligatorio.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

window.ValidationService = ValidationService;

