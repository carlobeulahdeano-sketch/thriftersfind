const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix .id.substring and .id.toLowerCase
    content = content.replace(/([a-zA-Z0-9_]+)\.id\.substring\(/g, 'String($1.id).substring(');
    content = content.replace(/([a-zA-Z0-9_]+)\.id\.toLowerCase\(/g, 'String($1.id).toLowerCase(');
    
    // Fix updateQuantity(productId: string...
    content = content.replace(/updateQuantity = \((productId|id): string,/g, 'updateQuantity = ($1: string | number,');
    content = content.replace(/incrementQuantity = \((productId|id): string\)/g, 'incrementQuantity = ($1: string | number)');
    content = content.replace(/decrementQuantity = \((productId|id): string\)/g, 'decrementQuantity = ($1: string | number)');
    content = content.replace(/removeProduct = \((productId|id): string\)/g, 'removeProduct = ($1: string | number)');
    content = content.replace(/handleRemove = \((productId|id): string\)/g, 'handleRemove = ($1: string | number)');
    content = content.replace(/handleDelete = \((productId|id): string\)/g, 'handleDelete = ($1: string | number)');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed ' + filePath);
    }
  }
});
