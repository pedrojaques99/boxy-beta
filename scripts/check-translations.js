const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '../src/i18n/locales');
const files = fs.readdirSync(localesPath);

// Lê todos os arquivos de tradução
const translations = files.reduce((acc, file) => {
  if (file.endsWith('.json')) {
    const locale = file.replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(localesPath, file), 'utf8'));
    acc[locale] = content;
  }
  return acc;
}, {});

// Função para obter todas as chaves de um objeto
function getAllKeys(obj, prefix = '') {
  return Object.entries(obj).reduce((keys, [key, value]) => {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      return [...keys, ...getAllKeys(value, currentKey)];
    }
    return [...keys, currentKey];
  }, []);
}

// Verifica se todas as chaves estão presentes em todos os arquivos
const allKeys = Object.values(translations).flatMap(getAllKeys);
const uniqueKeys = [...new Set(allKeys)];

const missingTranslations = uniqueKeys.reduce((missing, key) => {
  Object.entries(translations).forEach(([locale, content]) => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], content);
    if (value === undefined) {
      missing[locale] = missing[locale] || [];
      missing[locale].push(key);
    }
  });
  return missing;
}, {});

// Exibe os resultados
if (Object.keys(missingTranslations).length > 0) {
  console.error('Missing translations found:');
  Object.entries(missingTranslations).forEach(([locale, keys]) => {
    console.error(`\n${locale}:`);
    keys.forEach(key => console.error(`  - ${key}`));
  });
  process.exit(1);
} else {
  console.log('All translations are complete!');
  process.exit(0);
} 