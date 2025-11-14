# 📸 Galería de Fotos con Supabase

Galería de fotos moderna y responsive construida con HTML, CSS y JavaScript vanilla, utilizando Supabase como backend y optimizada para deploy en Netlify.

## ✨ Características

- **Galería responsive** con CSS Grid (mobile-first)
- **Autenticación de usuarios** con Email + Contraseña
- **Subida de imágenes** a Supabase Storage (solo usuarios autenticados)
- **Filtrado por tags** dinámico
- **Modal** para ver fotos en detalle
- **Lazy loading** de imágenes
- **Galería pública** (todos pueden ver, solo usuarios autenticados suben)
- **Código limpio** y comentado en español

## 🛠️ Tecnologías

- HTML5, CSS3, JavaScript vanilla
- Supabase (Storage + Database)
- Netlify (Hosting)

## 📁 Estructura del Proyecto

```
practica-supabase-netlify/
├── index.html              # Página principal de la galería
├── upload.html             # Página de subida de fotos (protegida)
├── login.html              # Página de login/registro
├── css/
│   └── style.css          # Estilos responsive + auth
├── js/
│   ├── gallery.js         # Lógica de la galería
│   ├── upload.js          # Lógica de subida
│   └── auth.js            # Lógica de autenticación
├── build.js               # Script de build para Netlify
├── package.json           # Configuración de npm
├── netlify.toml           # Configuración de Netlify
├── supabase-setup.sql     # SQL para configurar Supabase + Auth
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
   - Name: `Permitir subida a usuarios autenticados`
   - Policy definition: `(bucket_id = 'photos'::text)`
   - Target roles: `authenticated`
   - Allowed operations: `INSERT`

### 4. Configurar Autenticación

1. Ve a **Authentication** en el panel de Supabase
2. Configura **Email Auth**:
   - Ve a **Authentication > Providers > Email**
   - Activa **Enable Email provider**
   - **Confirm email**: Desactiva para desarrollo (o activa para producción)
   - **Secure email change**: Activado (recomendado)
3. Configura **Site URL y Redirect URLs**:
   - Ve a **Authentication > URL Configuration**
   - **Site URL**: Tu URL de Netlify (ej: `https://tu-sitio.netlify.app`)
   - **Redirect URLs**: Agrega:
     - Tu URL de Netlify
     - `http://localhost:8000` (para desarrollo local)

### 5. Actualizar Políticas (Si ya tenías la tabla creada)

Si ya tenías la tabla `gallery_photos` sin autenticación, ejecuta estos comandos en el SQL Editor:

```sql
-- Agregar columna user_id
ALTER TABLE public.gallery_photos
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Eliminar política antigua
DROP POLICY IF EXISTS "Permitir inserción pública de fotos" ON public.gallery_photos;

-- Crear nueva política
CREATE POLICY "Permitir inserción a usuarios autenticados"
    ON public.gallery_photos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

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
8. **Importante**: Una vez desplegado, actualiza las URLs de Open Graph (ver sección abajo)

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

### 🔗 Configurar URLs de Open Graph (Importante)

Después del primer deploy, **debes actualizar las URLs** en los meta tags para que funcione correctamente el preview al compartir en WhatsApp, Facebook, Twitter, etc.

1. **Obtén tu URL de Netlify** (ej: `https://mi-galeria.netlify.app`)
2. **Busca y reemplaza** en todos los archivos HTML (`index.html`, `upload.html`, `login.html`):
   - Buscar: `https://tu-sitio.netlify.app`
   - Reemplazar por: `https://tu-url-real.netlify.app`

3. **Archivos a editar**:
   ```bash
   index.html   # Líneas 17, 20, 24, 27
   upload.html  # Líneas 17, 20, 24, 27
   login.html   # Líneas 17, 20, 24, 27
   ```

4. **Hacer commit y push** de los cambios
5. **Probar el preview**:
   - Usa [https://www.opengraph.xyz/](https://www.opengraph.xyz/)
   - O comparte el link en WhatsApp/Telegram y verás el preview

**Tip**: Puedes usar buscar/reemplazar en tu editor para cambiar todas las ocurrencias de una vez.

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

### Crear una Cuenta

1. Haz clic en "Iniciar Sesión" en la página principal
2. Ve a la pestaña "Registrarse"
3. Ingresa tu email y contraseña (mínimo 6 caracteres)
4. Confirma tu contraseña
5. Haz clic en "Crear Cuenta"
6. **Nota**: Si tienes confirmación por email activada, revisa tu correo

### Iniciar Sesión

1. Haz clic en "Iniciar Sesión"
2. Ingresa tu email y contraseña
3. Haz clic en "Iniciar Sesión"
4. Serás redirigido a la galería automáticamente

### Subir una Foto

1. **Debes estar autenticado** para subir fotos
2. Haz clic en "Subir Foto" en el header
3. Completa el formulario:
   - **Título** (obligatorio)
   - **Descripción** (opcional)
   - **Tags** (opcional, separados por comas)
   - **Imagen** (JPG, PNG, WEBP, máx 5MB)
4. Haz clic en "Subir Foto"
5. Espera la confirmación y vuelve a la galería

### Ver Fotos

1. La página principal muestra todas las fotos en un grid responsive
2. **No necesitas estar autenticado** para ver las fotos
3. Haz clic en cualquier foto para verla en detalle
4. Usa los filtros de tags para filtrar por categoría

### Cerrar Sesión

1. Haz clic en "Cerrar Sesión" en el header
2. Serás redirigido a la página de login

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

### Modificar Comportamiento de Autenticación

La aplicación está configurada para:
- **Galería pública**: Todos pueden ver las fotos
- **Subida protegida**: Solo usuarios autenticados pueden subir

Para cambiar a galería privada (solo usuarios autenticados pueden ver):
1. Modifica la política RLS en Supabase:
   ```sql
   DROP POLICY IF EXISTS "Permitir lectura pública de fotos" ON public.gallery_photos;
   CREATE POLICY "Permitir lectura a usuarios autenticados"
       ON public.gallery_photos
       FOR SELECT
       USING (auth.uid() IS NOT NULL);
   ```
2. Agrega verificación de autenticación en `index.html` (similar a `upload.html`)

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

### No puedo registrarme o iniciar sesión

- Verifica que Email Auth esté activado en Supabase (Authentication > Providers > Email)
- Revisa la consola del navegador para ver errores específicos
- Si la confirmación por email está activa, revisa tu correo
- Verifica que las credenciales de Supabase estén correctamente configuradas

### Error al subir fotos después de agregar autenticación

- Asegúrate de estar autenticado antes de intentar subir
- Verifica que la política del bucket permita INSERT a usuarios autenticados
- Verifica que la tabla tenga el campo `user_id` y la política RLS correcta
- Revisa la consola del navegador para errores específicos

### La sesión no persiste al recargar la página

- Verifica que el localStorage no esté bloqueado en tu navegador
- Asegúrate de que las cookies estén habilitadas
- Revisa que no haya errores en la consola relacionados con el token

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Documentación de Netlify](https://docs.netlify.com)

## 📄 Licencia

MIT

## 👤 Autor

Tu nombre aquí

---

¿Preguntas o problemas? Abre un issue en GitHub.
