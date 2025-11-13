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

// ========================================
// VARIABLES GLOBALES
// ========================================

let allPhotos = [];
let currentFilter = 'all';
let allTags = new Set();

// ========================================
// ELEMENTOS DEL DOM
// ========================================

const photoGrid = document.getElementById('photoGrid');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const emptyState = document.getElementById('emptyState');
const tagFilters = document.getElementById('tagFilters');
const photoModal = document.getElementById('photoModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalTags = document.getElementById('modalTags');
const modalDate = document.getElementById('modalDate');
const closeModal = document.querySelector('.close');

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    setupModal();
});

// ========================================
// FUNCIONES PRINCIPALES
// ========================================

/**
 * Carga todas las fotos desde Supabase
 */
async function loadPhotos() {
    try {
        showLoading();

        // Realizar petición GET a la API de Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/gallery_photos?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const photos = await response.json();
        allPhotos = photos;

        // Extraer todos los tags únicos
        extractAllTags(photos);

        // Renderizar filtros y fotos
        renderTagFilters();
        renderPhotos(photos);

        hideLoading();

    } catch (error) {
        console.error('❌ Error al cargar fotos:', error);
        showError();
        hideLoading();
    }
}

/**
 * Extrae todos los tags únicos de las fotos
 */
function extractAllTags(photos) {
    allTags.clear();
    photos.forEach(photo => {
        if (photo.tags && Array.isArray(photo.tags)) {
            photo.tags.forEach(tag => allTags.add(tag.trim()));
        }
    });
}

/**
 * Renderiza los botones de filtro por tags
 */
function renderTagFilters() {
    // Limpiar filtros existentes (excepto el botón "Todas")
    tagFilters.innerHTML = '<button class="tag-btn active" data-tag="all">Todas</button>';

    // Añadir un botón por cada tag
    allTags.forEach(tag => {
        const button = document.createElement('button');
        button.className = 'tag-btn';
        button.dataset.tag = tag;
        button.textContent = tag;
        button.addEventListener('click', () => filterByTag(tag));
        tagFilters.appendChild(button);
    });

    // Event listener para el botón "Todas"
    const allButton = tagFilters.querySelector('[data-tag="all"]');
    allButton.addEventListener('click', () => filterByTag('all'));
}

/**
 * Filtra las fotos por tag
 */
function filterByTag(tag) {
    currentFilter = tag;

    // Actualizar UI de los botones
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tag === tag);
    });

    // Filtrar y renderizar
    if (tag === 'all') {
        renderPhotos(allPhotos);
    } else {
        const filtered = allPhotos.filter(photo =>
            photo.tags && photo.tags.includes(tag)
        );
        renderPhotos(filtered);
    }
}

/**
 * Renderiza las fotos en el grid
 */
function renderPhotos(photos) {
    // Limpiar grid
    photoGrid.innerHTML = '';

    // Si no hay fotos, mostrar estado vacío
    if (photos.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Crear una tarjeta por cada foto
    photos.forEach(photo => {
        const card = createPhotoCard(photo);
        photoGrid.appendChild(card);
    });

    // Implementar lazy loading para las imágenes
    lazyLoadImages();
}

/**
 * Crea una tarjeta de foto
 */
function createPhotoCard(photo) {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.addEventListener('click', () => openModal(photo));

    // Formatear la fecha
    const date = new Date(photo.created_at);
    const formattedDate = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Crear HTML de la tarjeta
    card.innerHTML = `
        <img
            class="photo-card-image"
            data-src="${photo.image_url}"
            alt="${photo.title}"
            loading="lazy"
        >
        <div class="photo-card-content">
            <h3 class="photo-card-title">${escapeHtml(photo.title)}</h3>
            ${photo.description ? `<p class="photo-card-description">${escapeHtml(photo.description)}</p>` : ''}
            ${renderTags(photo.tags)}
            <p class="photo-card-date">${formattedDate}</p>
        </div>
    `;

    return card;
}

/**
 * Renderiza los tags de una foto
 */
function renderTags(tags) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return '';
    }

    const tagsHtml = tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
    return `<div class="tags">${tagsHtml}</div>`;
}

/**
 * Lazy loading de imágenes
 */
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// ========================================
// MODAL
// ========================================

/**
 * Configura el modal
 */
function setupModal() {
    // Cerrar modal al hacer clic en la X
    closeModal.addEventListener('click', () => {
        photoModal.classList.remove('active');
    });

    // Cerrar modal al hacer clic fuera del contenido
    photoModal.addEventListener('click', (e) => {
        if (e.target === photoModal) {
            photoModal.classList.remove('active');
        }
    });

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && photoModal.classList.contains('active')) {
            photoModal.classList.remove('active');
        }
    });
}

/**
 * Abre el modal con la información de una foto
 */
function openModal(photo) {
    modalImage.src = photo.image_url;
    modalImage.alt = photo.title;
    modalTitle.textContent = photo.title;
    modalDescription.textContent = photo.description || 'Sin descripción';
    modalTags.innerHTML = renderTags(photo.tags);

    const date = new Date(photo.created_at);
    const formattedDate = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    modalDate.textContent = `Subida el ${formattedDate}`;

    photoModal.classList.add('active');
}

// ========================================
// ESTADOS DE LA UI
// ========================================

function showLoading() {
    loadingState.style.display = 'block';
    photoGrid.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
}

function hideLoading() {
    loadingState.style.display = 'none';
    photoGrid.style.display = 'grid';
}

function showError(message = 'Error al cargar las fotos. Por favor, intenta de nuevo.') {
    errorState.style.display = 'block';
    errorState.querySelector('p').textContent = `❌ ${message}`;
    photoGrid.style.display = 'none';
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
