const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a simple colored square PNG
function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Purple background
  ctx.fillStyle = '#6B4CE6';
  ctx.fillRect(0, 0, size, size);
  
  // White text
  ctx.fillStyle = 'white';
  ctx.font = `${size/2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', size/2, size/2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log('Created:', filename);
}

try {
  createIcon(1024, 'icon.png');
  createIcon(1024, 'splash.png');
  createIcon(1024, 'adaptive-icon.png');
  createIcon(48, 'favicon.png');
} catch (err) {
  console.error('Canvas not available:', err.message);
}
