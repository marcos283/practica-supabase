-- ========================================
-- SETUP DE SUPABASE PARA GALERÍA DE FOTOS
-- ========================================

-- 1. Crear la tabla gallery_photos
CREATE TABLE IF NOT EXISTS public.gallery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para permitir lectura pública (SELECT)
CREATE POLICY "Permitir lectura pública de fotos"
    ON public.gallery_photos
    FOR SELECT
    USING (true);

-- 4. Crear política para permitir inserción pública (INSERT)
-- NOTA: En producción, considera restringir esto con autenticación
CREATE POLICY "Permitir inserción pública de fotos"
    ON public.gallery_photos
    FOR INSERT
    WITH CHECK (true);

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
--    - Crear política para permitir INSERT público:
--      Policy name: "Permitir subida pública"
--      Policy definition: true
--      Operations: INSERT
--
--    - Crear política para permitir SELECT público:
--      Policy name: "Permitir lectura pública"
--      Policy definition: true
--      Operations: SELECT

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

-- Insertar datos de prueba (opcional)
-- INSERT INTO public.gallery_photos (title, description, image_url, tags)
-- VALUES
--     ('Foto de prueba', 'Esta es una foto de prueba', 'https://picsum.photos/800/600', ARRAY['prueba', 'test']),
--     ('Paisaje', 'Hermoso paisaje natural', 'https://picsum.photos/800/601', ARRAY['naturaleza', 'paisaje']);
