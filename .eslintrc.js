export default {
  root: true,
  extends: ['next/core-web-vitals'],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-literal-strings': ['error', {
      ignore: ['^[A-Z_]+$', '^[a-z]+$', '^[0-9]+$'], // Ignora constantes, palavras simples e números
      message: 'Use translation system instead of literal strings. Example: t?.key?.subkey || "fallback"'
    }]
  }
} 