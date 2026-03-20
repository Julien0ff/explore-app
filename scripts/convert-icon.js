const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function convertIcon() {
  const inputPath = path.join(__dirname, '../website/logo.svg');
  const outputPath = path.join(__dirname, '../public/icon.png');
  
  if (!fs.existsSync(inputPath)) {
    console.error('Input SVG not found at:', inputPath);
    process.exit(1);
  }

  try {
    await sharp(inputPath)
      .resize(256, 256)
      .png()
      .toFile(outputPath);
    console.log('Successfully created icon.png');
  } catch (err) {
    console.error('Error generating icon:', err);
    process.exit(1);
  }
}

convertIcon();
