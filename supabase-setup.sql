-- ========================================
-- SETUP DE SUPABASE PARA GALERÍA DE FOTOS CON AUTENTICACIÓN
-- ========================================

-- 1. Crear la tabla gallery_photos
CREATE TABLE IF NOT EXISTS public.gallery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para permitir lectura pública (SELECT)
-- Todos pueden ver todas las fotos
CREATE POLICY "Permitir lectura pública de fotos"
    ON public.gallery_photos
    FOR SELECT
    USING (true);

-- 4. Crear política para permitir inserción solo a usuarios autenticados (INSERT)
-- Solo usuarios autenticados pueden subir fotos
CREATE POLICY "Permitir inserción a usuarios autenticados"
    ON public.gallery_photos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_gallery_photos_created_at
    ON public.gallery_photos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_tags
    ON public.gallery_photos USING GIN(tags);

-- ========================================
-- INSTRUCCIONES PARA STORAGE
-- ========================================

-- IMPORTANTE: Estas configuraciones se deben hacer desde la interfaz de Supabase:
--
-- 1. Ve a Storage en el panel de Supabase
-- 2. Crea un nuevo bucket llamado "photos"
-- 3. Configura el bucket como público:
--    - Public bucket: ON
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/jpg
--
-- 4. Políticas del bucket (Storage Policies):
--    - Crear política para permitir INSERT solo a usuarios autenticados:
--      Policy name: "Permitir subida a usuarios autenticados"
--      Policy definition: (bucket_id = 'photos'::text)
--      Operations: INSERT
--      Target roles: authenticated
--
--    - Crear política para permitir SELECT público:
--      Policy name: "Permitir lectura pública"
--      Policy definition: (bucket_id = 'photos'::text)
--      Operations: SELECT
--      Target roles: public, authenticated

-- ========================================
-- INSTRUCCIONES PARA CONFIGURAR AUTENTICACIÓN
-- ========================================

-- IMPORTANTE: Configuración de Auth en Supabase:
--
-- 1. Ve a Authentication > Settings en el panel de Supabase
-- 2. Configuración de Email Auth:
--    - Enable Email provider: ON
--    - Confirm email: OFF (para desarrollo) o ON (para producción)
--    - Secure email change: ON (recomendado)
-- 3. Site URL y Redirect URLs:
--    - Site URL: Tu URL de Netlify (ej: https://tu-sitio.netlify.app)
--    - Redirect URLs: Agregar tu URL de Netlify y localhost para desarrollo

-- ========================================
-- MIGRACIÓN: Si ya tienes la tabla creada sin user_id
-- ========================================

-- Si ya tienes la tabla gallery_photos creada sin el campo user_id,
-- ejecuta estos comandos para actualizarla:

-- 1. Agregar columna user_id
-- ALTER TABLE public.gallery_photos
--     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Eliminar la política antigua de inserción pública
-- DROP POLICY IF EXISTS "Permitir inserción pública de fotos" ON public.gallery_photos;

-- 3. Crear la nueva política de inserción para usuarios autenticados
-- CREATE POLICY "Permitir inserción a usuarios autenticados"
--     ON public.gallery_photos
--     FOR INSERT
--     WITH CHECK (auth.uid() = user_id);

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ejecuta estas consultas para verificar que todo está configurado correctamente:

-- Ver la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'gallery_photos';

-- Ver las políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'gallery_photos';

-- Insertar datos de prueba (opcional - requiere autenticación)
-- INSERT INTO public.gallery_photos (title, description, image_url, tags, user_id)
-- VALUES
--     ('Foto de prueba', 'Esta es una foto de prueba', 'https://picsum.photos/800/600', ARRAY['prueba', 'test'], auth.uid()),
--     ('Paisaje', 'Hermoso paisaje natural', 'https://picsum.photos/800/601', ARRAY['naturaleza', 'paisaje'], auth.uid());
