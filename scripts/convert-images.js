/**
 * Convert SVG assets to PNG for production
 * Run with: npm run convert-images
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function convertImages() {
  console.log('Converting SVG images to PNG...\n');

  // Convert OG image (1200x630 for social sharing)
  const ogSvgPath = path.join(PUBLIC_DIR, 'og-image.svg');
  const ogPngPath = path.join(PUBLIC_DIR, 'og-image.png');

  if (fs.existsSync(ogSvgPath)) {
    await sharp(ogSvgPath)
      .resize(1200, 630)
      .png()
      .toFile(ogPngPath);
    console.log('✓ og-image.svg → og-image.png (1200x630)');
  } else {
    console.log('✗ og-image.svg not found');
  }

  // Convert favicon to multiple sizes
  const faviconSvgPath = path.join(PUBLIC_DIR, 'favicon.svg');

  if (fs.existsSync(faviconSvgPath)) {
    // 32x32 favicon
    await sharp(faviconSvgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
    console.log('✓ favicon.svg → favicon-32x32.png');

    // 16x16 favicon
    await sharp(faviconSvgPath)
      .resize(16, 16)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
    console.log('✓ favicon.svg → favicon-16x16.png');

    // 180x180 apple touch icon
    await sharp(faviconSvgPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    console.log('✓ favicon.svg → apple-touch-icon.png (180x180)');

    // 192x192 for PWA
    await sharp(faviconSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
    console.log('✓ favicon.svg → icon-192.png');

    // 512x512 for PWA
    await sharp(faviconSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
    console.log('✓ favicon.svg → icon-512.png');
  } else {
    console.log('✗ favicon.svg not found');
  }

  console.log('\n✅ Done! Images are ready in /public');
}

convertImages().catch(console.error);
