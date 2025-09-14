import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let content = fs.readFileSync(envPath, 'utf-8');

// Ищем строку VITE_MODE и заменяем на production
if (content.includes('VITE_MODE=')) {
  content = content.replace(/VITE_MODE=.*/, 'VITE_MODE=development');
} else {
  // Если строки нет, добавляем её
  content += '\nVITE_MODE=development';
}

// Сохраняем файл
fs.writeFileSync(envPath, content, 'utf-8');

console.log('✅ .env updated: VITE_MODE=development');