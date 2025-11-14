// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

// Obtener las variables de entorno de Netlify
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

// Validar que las variables estén configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Variables de Supabase no configuradas');
}

// ========================================
// ELEMENTOS DEL DOM
// ========================================

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTabs = document.querySelectorAll('.auth-tab');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya hay sesión activa (solo en login.html)
    if (loginForm && registerForm) {
        checkSession();
        // Configurar event listeners solo si estamos en login.html
        setupEventListeners();
    }
});

// ========================================
// VERIFICACIÓN DE SESIÓN
// ========================================

/**
 * Verifica si el usuario ya tiene una sesión activa
 */
async function checkSession() {
    try {
        const session = await getSession();

        if (session) {
            // Si hay sesión activa, redirigir a la galería
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
    }
}

/**
 * Obtiene la sesión actual del usuario
 */
async function getSession() {
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            return user;
        }

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Obtiene el token de acceso del localStorage
 */
function getAccessToken() {
    const authData = localStorage.getItem('supabase.auth.token');
    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            return parsed.access_token || '';
        } catch (e) {
            return '';
        }
    }
    return '';
}

// ========================================
// EVENT LISTENERS
// ========================================

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Solo configurar si los elementos existen
    if (!loginForm || !registerForm) return;

    // Tabs de login/registro
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Formulario de login
    loginForm.addEventListener('submit', handleLogin);

    // Formulario de registro
    registerForm.addEventListener('submit', handleRegister);
}

/**
 * Cambia entre las tabs de login y registro
 */
function switchTab(tabName) {
    // Actualizar tabs activas
    authTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Actualizar formularios activos
    loginForm.classList.toggle('active', tabName === 'login');
    registerForm.classList.toggle('active', tabName === 'register');

    // Limpiar mensajes
    hideMessages();
}

// ========================================
// FUNCIONES DE AUTENTICACIÓN
// ========================================

/**
 * Maneja el login del usuario
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validaciones básicas
    if (!email || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando sesión...';
    hideMessages();

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || data.msg || 'Error al iniciar sesión');
        }

        // Guardar tokens en localStorage
        saveAuthData(data);

        showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');

        // Redirigir a la galería después de 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('❌ Error en login:', error);
        showError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Iniciar Sesión';
    }
}

/**
 * Maneja el registro de un nuevo usuario
 */
async function handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    // Validaciones
    if (!email || !password || !passwordConfirm) {
        showError('Por favor completa todos los campos');
        return;
    }

    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (password !== passwordConfirm) {
        showError('Las contraseñas no coinciden');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creando cuenta...';
    hideMessages();

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error_description || data.msg || 'Error al crear la cuenta');
        }

        // Si el registro requiere confirmación por email
        if (data.user && !data.user.confirmed_at) {
            showSuccess('¡Cuenta creada! Por favor revisa tu email para confirmar tu cuenta.');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Crear Cuenta';

            // Limpiar formulario
            registerForm.reset();
        } else {
            // Si el registro es automático (sin confirmación)
            saveAuthData(data);
            showSuccess('¡Cuenta creada exitosamente! Redirigiendo...');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }

    } catch (error) {
        console.error('❌ Error en registro:', error);
        showError(error.message || 'Error al crear la cuenta. Intenta de nuevo.');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Crear Cuenta';
    }
}

// ========================================
// GESTIÓN DE TOKENS
// ========================================

/**
 * Guarda los datos de autenticación en localStorage
 */
function saveAuthData(data) {
    const authData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user
    };

    localStorage.setItem('supabase.auth.token', JSON.stringify(authData));
}

// ========================================
// FUNCIONES DE LOGOUT (para usar en otras páginas)
// ========================================

/**
 * Cierra la sesión del usuario
 */
async function logout() {
    try {
        const token = getAccessToken();

        if (token) {
            await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`
                }
            });
        }

        // Limpiar localStorage
        localStorage.removeItem('supabase.auth.token');

        // Redirigir al login
        window.location.href = 'login.html';

    } catch (error) {
        console.error('❌ Error en logout:', error);
        // Limpiar de todas formas
        localStorage.removeItem('supabase.auth.token');
        window.location.href = 'login.html';
    }
}

/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
    const token = getAccessToken();
    return !!token;
}

/**
 * Obtiene información del usuario actual
 */
function getCurrentUser() {
    const authData = localStorage.getItem('supabase.auth.token');
    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            return parsed.user || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// ========================================
// UI - MENSAJES
// ========================================

/**
 * Muestra un mensaje de éxito
 */
function showSuccess(message) {
    if (!successMessage || !errorMessage) return;
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    if (!errorMessage || !successMessage) return;
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

/**
 * Oculta todos los mensajes
 */
function hideMessages() {
    if (!successMessage || !errorMessage) return;
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
}

// ========================================
// EXPORTAR FUNCIONES (para uso global)
// ========================================

// Hacer funciones disponibles globalmente
window.supabaseAuth = {
    logout,
    isAuthenticated,
    getCurrentUser,
    getSession,
    getAccessToken
};
