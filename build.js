// Script de build para inyectar variables de entorno en los archivos HTML
// Este script se ejecuta en Netlify durante el deploy

const fs = require('fs');
const path = require('path');

// Obtener variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

console.log('🔧 Iniciando build...');
console.log('📦 Inyectando variables de entorno en HTML...');

// Script a inyectar en el HTML
const envScript = `
<script>
  // Variables de entorno inyectadas durante el build
  window.SUPABASE_URL = '${SUPABASE_URL}';
  window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
</script>
`;

// Archivos HTML a procesar
const htmlFiles = ['index.html', 'upload.html'];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Archivo ${file} no encontrado`);
    return;
  }

  // Leer el archivo
  let content = fs.readFileSync(filePath, 'utf8');

  // Buscar si ya tiene el script inyectado (para evitar duplicados)
  if (content.includes('window.SUPABASE_URL')) {
    console.log(`✅ ${file} ya tiene las variables inyectadas`);
    return;
  }

  // Inyectar el script antes del cierre de </head>
  content = content.replace('</head>', `${envScript}</head>`);

  // Guardar el archivo modificado
  fs.writeFileSync(filePath, content, 'utf8');

  console.log(`✅ Variables inyectadas en ${file}`);
});

console.log('✨ Build completado exitosamente!');
