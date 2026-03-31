const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'src/public/images');
const exts = ['.jpg', '.jpeg', '.png', '.JPG'];

fs.readdirSync(dir).forEach(file => {
  if (exts.includes(path.extname(file))) {
    const input = path.join(dir, file);
    const output = path.join(dir, path.parse(file).name + '.webp');
    sharp(input)
      .webp({ quality: 80 })
      .toFile(output)
      .then(() => console.log(`Converted: ${file} -> ${path.parse(file).name}.webp`))
      .catch(err => console.error(`Error converting ${file}:`, err));
  }
});