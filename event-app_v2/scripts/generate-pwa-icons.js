import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.join(__dirname, '../public/favicon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

// PWA icons for all platforms
const PWA_ICONS = [
  // Standard PWA icons
  { size: 64, name: 'pwa-64x64.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  // Apple Touch Icons
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 114, name: 'apple-touch-icon-114x114.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 57, name: 'apple-touch-icon-57x57.png' },
  // Maskable icon (with padding for safe area)
  { size: 512, name: 'maskable-icon-512x512.png', padding: 0.1 },
  // Favicon
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' },
];

async function generateIcons() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  console.log(`Generating PWA icons from ${SOURCE_FILE}...\n`);

  for (const icon of PWA_ICONS) {
    const outputFile = path.join(OUTPUT_DIR, icon.name);
    
    try {
      let pipeline = sharp(SOURCE_FILE)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });
      
      // For maskable icons, add padding
      if (icon.padding) {
        const paddedSize = Math.round(icon.size * (1 - icon.padding * 2));
        pipeline = sharp(SOURCE_FILE)
          .resize(paddedSize, paddedSize)
          .extend({
            top: Math.round(icon.size * icon.padding),
            bottom: Math.round(icon.size * icon.padding),
            left: Math.round(icon.size * icon.padding),
            right: Math.round(icon.size * icon.padding),
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          });
      }

      await pipeline.png().toFile(outputFile);
      console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.name}:`, error.message);
    }
  }

  // Generate default apple-touch-icon.png (180x180)
  try {
    const appleIcon = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
    await sharp(SOURCE_FILE)
      .resize(180, 180)
      .png()
      .toFile(appleIcon);
    console.log(`✅ apple-touch-icon.png (180x180)`);
  } catch (error) {
    console.error(`❌ Error generating apple-touch-icon.png:`, error.message);
  }

  console.log('\n✨ PWA icons generated successfully!');
}

generateIcons();
