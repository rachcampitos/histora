/**
 * Script para probar la validación de CEP
 *
 * Uso: npx ts-node scripts/test-cep-validation.ts <CEP_NUMBER>
 * Ejemplo: npx ts-node scripts/test-cep-validation.ts 12345
 */

import axios from 'axios';
import * as https from 'https';
import * as fs from 'fs';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function testCepValidation(cepNumber: string) {
  console.log(`\n🔍 Probando validación para CEP: ${cepNumber}\n`);
  console.log('='.repeat(60));

  // Test 1: POST request
  console.log('\n📤 Test 1: POST request a view.php');
  try {
    const postResponse = await axios.post(
      'https://www.cep.org.pe/validar/pagina/view.php',
      new URLSearchParams({ cep: cepNumber }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.cep.org.pe/validar/',
        },
        httpsAgent,
        timeout: 15000,
      }
    );

    console.log('✅ POST exitoso');
    console.log(`   Status: ${postResponse.status}`);
    console.log(`   Content-Length: ${postResponse.data.length} bytes`);

    // Guardar respuesta para análisis
    fs.writeFileSync('/tmp/cep-post-response.html', postResponse.data);
    console.log('   📁 Respuesta guardada en: /tmp/cep-post-response.html');

    // Mostrar primeras líneas
    const preview = postResponse.data.substring(0, 500);
    console.log('\n   Preview del HTML:');
    console.log('   ' + '-'.repeat(50));
    console.log(preview.split('\n').map((l: string) => '   ' + l).join('\n'));

  } catch (error: any) {
    console.log('❌ POST falló:', error.message);
  }

  // Test 2: GET request
  console.log('\n📤 Test 2: GET request a view.php');
  try {
    const getResponse = await axios.get(
      `https://www.cep.org.pe/validar/pagina/view.php?cep=${cepNumber}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        httpsAgent,
        timeout: 15000,
      }
    );

    console.log('✅ GET exitoso');
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Content-Length: ${getResponse.data.length} bytes`);

    fs.writeFileSync('/tmp/cep-get-response.html', getResponse.data);
    console.log('   📁 Respuesta guardada en: /tmp/cep-get-response.html');

  } catch (error: any) {
    console.log('❌ GET falló:', error.message);
  }

  // Test 3: Verificar si existe foto (usando DNI si lo conoces)
  console.log('\n📤 Test 3: Verificar foto con DNI (si aplica)');
  // Si el CEP es un número que también podría ser DNI
  try {
    const photoUrl = `https://www.cep.org.pe/fotos/${cepNumber}.jpg`;
    const photoResponse = await axios.head(photoUrl, {
      httpsAgent,
      timeout: 5000,
    });

    console.log(`✅ Foto existe: ${photoUrl}`);
    console.log(`   Status: ${photoResponse.status}`);

  } catch (error: any) {
    console.log(`❌ Foto no encontrada para DNI ${cepNumber}`);
  }

  // Test 4: Probar el endpoint alternativo pegasoweb
  console.log('\n📤 Test 4: Probar pegasoweb/publico');
  try {
    const pegasoResponse = await axios.get(
      'https://cep.org.pe/pegasoweb/publico/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        httpsAgent,
        timeout: 15000,
      }
    );

    console.log('✅ pegasoweb accesible');
    console.log(`   Status: ${pegasoResponse.status}`);

    fs.writeFileSync('/tmp/cep-pegasoweb.html', pegasoResponse.data);
    console.log('   📁 Respuesta guardada en: /tmp/cep-pegasoweb.html');

    // Buscar formularios y endpoints
    const formMatches = pegasoResponse.data.match(/<form[^>]*action="([^"]*)"[^>]*>/gi) || [];
    console.log(`   📋 Formularios encontrados: ${formMatches.length}`);
    formMatches.forEach((form: string) => console.log('      ' + form));

  } catch (error: any) {
    console.log('❌ pegasoweb falló:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📝 Revisa los archivos HTML guardados en /tmp/ para análisis detallado');
  console.log('   Usa "open /tmp/cep-post-response.html" para verlo en el navegador');
}

// Obtener CEP de argumentos
const cepNumber = process.argv[2] || '12345';
testCepValidation(cepNumber).catch(console.error);
