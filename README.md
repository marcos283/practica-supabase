# 📸 Galería de Fotos con Supabase

Galería de fotos moderna y responsive construida con HTML, CSS y JavaScript vanilla, utilizando Supabase como backend y optimizada para deploy en Netlify.

## ✨ Características

- **Galería responsive** con CSS Grid (mobile-first)
- **Subida de imágenes** a Supabase Storage
- **Filtrado por tags** dinámico
- **Modal** para ver fotos en detalle
- **Lazy loading** de imágenes
- **Sin autenticación** (público)
- **Código limpio** y comentado en español

## 🛠️ Tecnologías

- HTML5, CSS3, JavaScript vanilla
- Supabase (Storage + Database)
- Netlify (Hosting)

## 📁 Estructura del Proyecto

```
practica-supabase-netlify/
├── index.html              # Página principal de la galería
├── upload.html             # Página de subida de fotos
├── css/
│   └── style.css          # Estilos responsive
├── js/
│   ├── gallery.js         # Lógica de la galería
│   └── upload.js          # Lógica de subida
├── build.js               # Script de build para Netlify
├── package.json           # Configuración de npm
├── netlify.toml           # Configuración de Netlify
├── supabase-setup.sql     # SQL para configurar Supabase
├── .env.example           # Ejemplo de variables de entorno
└── README.md              # Este archivo
```

## 🚀 Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota tu `SUPABASE_URL` y `SUPABASE_ANON_KEY` (los encontrarás en Settings > API)

### 2. Configurar Base de Datos

1. Ve a **SQL Editor** en el panel de Supabase
2. Copia y pega el contenido del archivo `supabase-setup.sql`
3. Ejecuta el SQL
4. Esto creará:
   - La tabla `gallery_photos`
   - Políticas RLS para acceso público
   - Índices para optimizar consultas

### 3. Configurar Storage

1. Ve a **Storage** en el panel de Supabase
2. Haz clic en **Create bucket**
3. Configura el bucket:
   - **Name:** `photos`
   - **Public bucket:** ✅ Activado
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, image/jpg`
4. Ve a **Policies** del bucket `photos`
5. Crea dos políticas:

   **Política para lectura:**
   - Name: `Permitir lectura pública`
   - Policy definition: `true`
   - Allowed operations: `SELECT`

   **Política para subida:**
   - Name: `Permitir subida pública`
   - Policy definition: `true`
   - Allowed operations: `INSERT`

## 🌐 Deploy en Netlify

### Opción 1: Deploy desde GitHub

1. Sube tu proyecto a GitHub
2. Ve a [https://netlify.com](https://netlify.com) y crea una cuenta
3. Haz clic en **Add new site > Import an existing project**
4. Conecta tu repositorio de GitHub
5. Configura el build:
   - **Build command:** `npm run build`
   - **Publish directory:** `.` (punto)
6. Configura las variables de entorno:
   - Ve a **Site settings > Environment variables**
   - Añade las siguientes variables:
     - `SUPABASE_URL`: tu URL de Supabase
     - `SUPABASE_ANON_KEY`: tu anon key de Supabase
7. Haz clic en **Deploy site**

### Opción 2: Deploy con Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login en Netlify
netlify login

# Inicializar el sitio
netlify init

# Configurar variables de entorno
netlify env:set SUPABASE_URL "https://tu-proyecto.supabase.co"
netlify env:set SUPABASE_ANON_KEY "tu-anon-key-aqui"

# Deploy
netlify deploy --prod
```

## 💻 Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd practica-supabase-netlify
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de Supabase
# SUPABASE_URL=https://tu-proyecto.supabase.co
# SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 3. Ejecutar localmente

Para desarrollo local, tienes dos opciones:

**Opción A: Usando un servidor HTTP simple**

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (npx)
npx serve .

# Con PHP
php -S localhost:8000
```

**Opción B: Editar temporalmente los archivos HTML**

Añade manualmente este script antes del `</head>` en `index.html` y `upload.html`:

```html
<script>
  window.SUPABASE_URL = 'https://tu-proyecto.supabase.co';
  window.SUPABASE_ANON_KEY = 'tu-anon-key-aqui';
</script>
```

⚠️ **Importante:** No subas estos cambios a git. El script de build de Netlify los inyectará automáticamente.

### 4. Abrir en el navegador

Abre `http://localhost:8000` en tu navegador.

## 📝 Uso

### Subir una Foto

1. Ve a la página de upload (botón "Subir Foto")
2. Completa el formulario:
   - **Título** (obligatorio)
   - **Descripción** (opcional)
   - **Tags** (opcional, separados por comas)
   - **Imagen** (JPG, PNG, WEBP, máx 5MB)
3. Haz clic en "Subir Foto"
4. Espera la confirmación y vuelve a la galería

### Ver Fotos

1. La página principal muestra todas las fotos en un grid responsive
2. Haz clic en cualquier foto para verla en detalle
3. Usa los filtros de tags para filtrar por categoría

## 🔧 Personalización

### Cambiar Colores

Edita las variables CSS en `css/style.css`:

```css
:root {
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    /* ... más variables */
}
```

### Cambiar Límite de Tamaño de Archivo

Edita en `js/upload.js`:

```javascript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

### Añadir Autenticación

Actualmente la app es pública. Para añadir autenticación:

1. Implementa Supabase Auth en el frontend
2. Modifica las políticas RLS en Supabase
3. Añade checks de autenticación en `gallery.js` y `upload.js`

## 🐛 Solución de Problemas

### Las fotos no se cargan

- Verifica que las variables de entorno estén configuradas correctamente
- Revisa la consola del navegador para ver errores
- Asegúrate de que las políticas RLS estén activas en Supabase

### Error al subir fotos

- Verifica que el bucket `photos` existe y es público
- Revisa las políticas del bucket en Supabase Storage
- Confirma que el archivo sea menor a 5MB

### Las imágenes no se muestran

- Verifica que la URL de la imagen sea correcta
- Asegúrate de que el bucket sea público
- Revisa los CORS en Supabase (deberían estar configurados por defecto)

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Netlify](https://docs.netlify.com)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Database](https://supabase.com/docs/guides/database)

## 📄 Licencia

MIT

## 👤 Autor

Tu nombre aquí

---

¿Preguntas o problemas? Abre un issue en GitHub.
