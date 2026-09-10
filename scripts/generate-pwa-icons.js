const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoPath = path.join(__dirname, '..', 'public', 'app_logo.png');
const outputDir = path.join(__dirname, '..', 'public');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('Error: app_logo.png not found in public directory');
  process.exit(1);
}

async function generateIcons() {
  try {
    console.log('Generating PWA icons from app_logo.png...');
    
    // Generate 192x192 icon
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'icon-192x192.png'));
    
    console.log('✅ Generated icon-192x192.png');
    
    // Generate 512x512 icon
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(outputDir, 'icon-512x512.png'));
    
    console.log('✅ Generated icon-512x512.png');
    
    console.log('\n🎉 PWA icons generated successfully!');
    console.log('Icons are ready in the public directory.');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

