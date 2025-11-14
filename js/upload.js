// ========================================
// CONFIGURACIÓN DE SUPABASE
// ========================================

// Obtener las variables de entorno de Netlify
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

// Validar que las variables estén configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Variables de Supabase no configuradas');
    showError('Configuración de Supabase no encontrada. Verifica las variables de entorno.');
}

// Nombre del bucket de Supabase Storage
const STORAGE_BUCKET = 'photos';

// ========================================
// ELEMENTOS DEL DOM
// ========================================

const uploadForm = document.getElementById('uploadForm');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const tagsInput = document.getElementById('tags');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('imagePreview');
const submitBtn = document.getElementById('submitBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// ========================================
// VARIABLES GLOBALES
// ========================================

let selectedFile = null;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    setupFormHandlers();
    setupImagePreview();
});

// ========================================
// CONFIGURACIÓN DE HANDLERS
// ========================================

/**
 * Configura los event listeners del formulario
 */
function setupFormHandlers() {
    // Submit del formulario
    uploadForm.addEventListener('submit', handleSubmit);

    // Reset del formulario
    uploadForm.addEventListener('reset', () => {
        resetForm();
    });
}

/**
 * Configura la vista previa de la imagen
 */
function setupImagePreview() {
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];

        if (!file) {
            imagePreview.innerHTML = '<p>Selecciona una imagen</p>';
            selectedFile = null;
            return;
        }

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            showError('Por favor selecciona un archivo de imagen válido');
            imageInput.value = '';
            return;
        }

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
            showError('La imagen es demasiado grande. Tamaño máximo: 5MB');
            imageInput.value = '';
            return;
        }

        selectedFile = file;

        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    });
}

// ========================================
// MANEJO DEL FORMULARIO
// ========================================

/**
 * Maneja el envío del formulario
 */
async function handleSubmit(e) {
    e.preventDefault();

    // Validaciones
    if (!selectedFile) {
        showError('Por favor selecciona una imagen');
        return;
    }

    // Deshabilitar botón mientras se sube
    submitBtn.disabled = true;
    hideMessages();
    showProgress('Preparando subida...');

    try {
        // 1. Subir imagen a Supabase Storage
        updateProgress(30, 'Subiendo imagen...');
        const imageUrl = await uploadImageToStorage(selectedFile);

        // 2. Guardar metadata en la base de datos
        updateProgress(70, 'Guardando información...');
        await savePhotoMetadata(imageUrl);

        // 3. Mostrar éxito
        updateProgress(100, '¡Completado!');
        showSuccess();

        // Resetear formulario después de 2 segundos
        setTimeout(() => {
            resetForm();
        }, 2000);

    } catch (error) {
        console.error('❌ Error al subir foto:', error);
        showError(error.message || 'Error al subir la foto. Intenta de nuevo.');
        submitBtn.disabled = false;
    }
}

/**
 * Sube la imagen a Supabase Storage
 */
async function uploadImageToStorage(file) {
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    // Obtener el token de autenticación
    const token = window.supabaseAuth ? window.supabaseAuth.getAccessToken() : SUPABASE_ANON_KEY;

    // Realizar la subida usando la API REST de Supabase Storage
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': file.type
        },
        body: file
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al subir la imagen al storage');
    }

    // Construir la URL pública de la imagen
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;

    return publicUrl;
}

/**
 * Guarda la metadata de la foto en la base de datos
 */
async function savePhotoMetadata(imageUrl) {
    // Obtener valores del formulario
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const tagsRaw = tagsInput.value.trim();

    // Procesar tags (separar por comas y limpiar)
    const tags = tagsRaw
        ? tagsRaw.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

    // Obtener el usuario actual
    const user = window.supabaseAuth ? window.supabaseAuth.getCurrentUser() : null;
    const token = window.supabaseAuth ? window.supabaseAuth.getAccessToken() : SUPABASE_ANON_KEY;

    // Crear objeto de datos
    const photoData = {
        title,
        description: description || null,
        image_url: imageUrl,
        tags,
        user_id: user ? user.id : null,
        created_at: new Date().toISOString()
    };

    // Insertar en la base de datos
    const response = await fetch(`${SUPABASE_URL}/rest/v1/gallery_photos`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(photoData)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar en la base de datos');
    }

    return true;
}

// ========================================
// UI Y ESTADOS
// ========================================

/**
 * Muestra la barra de progreso
 */
function showProgress(message) {
    uploadProgress.style.display = 'block';
    progressText.textContent = message;
}

/**
 * Actualiza la barra de progreso
 */
function updateProgress(percentage, message) {
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = message;
}

/**
 * Oculta la barra de progreso
 */
function hideProgress() {
    uploadProgress.style.display = 'none';
    progressFill.style.width = '0%';
}

/**
 * Muestra mensaje de éxito
 */
function showSuccess() {
    hideProgress();
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';

    // Ocultar después de 5 segundos
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}

/**
 * Muestra mensaje de error
 */
function showError(message) {
    hideProgress();
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';

    // Ocultar después de 8 segundos
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 8000);
}

/**
 * Oculta todos los mensajes
 */
function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

/**
 * Resetea el formulario y sus estados
 */
function resetForm() {
    uploadForm.reset();
    selectedFile = null;
    imagePreview.innerHTML = '<p>Selecciona una imagen</p>';
    submitBtn.disabled = false;
    hideProgress();
    hideMessages();
}
