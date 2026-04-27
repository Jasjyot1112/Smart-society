const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir);

files.forEach(file => {
  if (file === 'Society.js') return;
  
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match the schema declaration and inject the society field
  const regex = /(const \w+Schema = new mongoose\.Schema\(\s*\{)/;
  
  if (regex.test(content) && !content.includes("ref: 'Society'")) {
    content = content.replace(regex, `$1\n    society: {\n      type: mongoose.Schema.Types.ObjectId,\n      ref: 'Society',\n      required: true,\n    },`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
