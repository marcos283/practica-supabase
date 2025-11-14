-- ========================================
-- MIGRACIÓN: Agregar Autenticación a Galería Existente
-- ========================================
--
-- Ejecuta estos comandos UNO POR UNO en el SQL Editor de Supabase
-- Supabase te advertirá sobre el DROP POLICY - es normal, confírmalo.
--

-- PASO 1: Agregar columna user_id
-- ========================================
ALTER TABLE public.gallery_photos
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verificar que se agregó correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'gallery_photos' AND column_name = 'user_id';


-- PASO 2: Ver políticas actuales
-- ========================================
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'gallery_photos';


-- PASO 3: Eliminar política antigua de inserción pública
-- ========================================
-- ⚠️ ADVERTENCIA: Supabase te preguntará si estás seguro - CONFIRMA
-- Esto elimina la política que permitía subir fotos sin autenticación
DROP POLICY IF EXISTS "Permitir inserción pública de fotos" ON public.gallery_photos;


-- PASO 4: Crear nueva política de inserción para usuarios autenticados
-- ========================================
CREATE POLICY "Permitir inserción a usuarios autenticados"
    ON public.gallery_photos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- PASO 5: Verificar que todo quedó bien
-- ========================================
-- Ver todas las políticas actuales
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'gallery_photos';

-- Debería mostrar:
-- 1. "Permitir lectura pública de fotos" (SELECT)
-- 2. "Permitir inserción a usuarios autenticados" (INSERT)


-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
--
-- 1. Las fotos existentes tendrán user_id = NULL (está bien)
-- 2. Las nuevas fotos solo se podrán subir con autenticación
-- 3. Todos pueden seguir viendo todas las fotos (lectura pública)
-- 4. No olvides actualizar las políticas del Storage bucket "photos"
--    para que solo usuarios autenticados puedan hacer INSERT
