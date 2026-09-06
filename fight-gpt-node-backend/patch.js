const fs = require('fs');
const file = 'dist/routes/index.js';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  'this.publicRoutes = (analysisController && characterEncyclopediaController && metaController) ? new publicRoutes_1.PublicRoutes(analysisController, characterEncyclopediaController, metaController) : null;',
  'this.publicRoutes = new publicRoutes_1.PublicRoutes(analysisController, characterEncyclopediaController, metaController);'
);
fs.writeFileSync(file, code);
console.log("Patched successfully.");
