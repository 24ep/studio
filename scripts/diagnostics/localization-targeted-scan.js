const fs = require('fs');
const path = require('path');
const root = 'src/components';
const exts = ['.tsx', '.jsx', '.ts', '.js'];

function walk(dir, files) {
  files = files || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (exts.includes(path.extname(full))) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(root).filter(file => !file.includes('node_modules') && !file.includes('.d.ts'));
const rows = [];
const hasT = /\bt\s*\(/;

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.includes('t(')) continue;
    if (/^\w+\s*(===|!==|==|!=|=|=>)/.test(trimmed)) continue;

    let match = trimmed.match(/>\s*([^<>{}`]+)\s*</);
    if (match && /[A-Za-z]/.test(match[1])) {
      const text = match[1].trim().replace(/\s+/g, ' ');
      rows.push({ file, line: i + 1, type: 'jsx', text });
      continue;
    }

    match = trimmed.match(/\b(title|placeholder|aria-label|label|text|alt)\s*=\s*"([^"]{3,})"/);
    if (match && !match[2].includes('{') && !match[2].includes('http') && /[A-Za-z]/.test(match[2])) {
      rows.push({ file, line: i + 1, type: 'attr', text: match[2].trim() });
    }
  }
}

console.log('file,line,type,text');
for (const row of rows) {
  const esc = String(row.text).replace(/"/g, '""');
  console.log(`${row.file},${row.line},${row.type},"${esc}"`);
}
