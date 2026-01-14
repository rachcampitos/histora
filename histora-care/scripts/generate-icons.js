const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Histora Care primary color
const primaryColor = '#667eea';
const backgroundColor = primaryColor;

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Create an SVG with the Histora Care logo (HC monogram)
function createSvgIcon(size) {
  const fontSize = Math.round(size * 0.45);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${backgroundColor}"/>
    <text
      x="50%"
      y="50%"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="white"
      text-anchor="middle"
      dominant-baseline="central">HC</text>
  </svg>`;
}

async function generateIcons() {
  const iconsDir = path.join(__dirname, '../src/icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating PWA icons for Histora Care...');

  for (const size of sizes) {
    const svgBuffer = Buffer.from(createSvgIcon(size));
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .png()
      .toFile(outputPath);

    console.log(`  Created: icon-${size}x${size}.png`);
  }

  console.log('\nAll icons generated successfully!');
  console.log('\nUpdate your manifest.webmanifest to reference these icons.');
}

generateIcons().catch(console.error);
