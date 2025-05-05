/**
 * Script para forçar recarregamento quando há uma nova versão do app
 * Adicione este script em seu _app.js ou layout.js
 */

(function() {
  // Versão atual do app - altere este valor quando quiser forçar um refresh nos clientes
  const APP_VERSION = '2023-05-05-1';
  const VERSION_KEY = 'boxy_app_version';
  
  // Verificar se estamos no navegador
  if (typeof window === 'undefined') return;
  
  // Verificar se há uma versão armazenada
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  // Se não houver versão armazenada ou a versão for diferente
  if (!storedVersion || storedVersion !== APP_VERSION) {
    console.log(`Versão atualizada detectada: ${APP_VERSION} (atual: ${storedVersion || 'nenhuma'})`);
    
    // Armazenar nova versão
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // Se não for a primeira vez (já tinha uma versão anterior)
    if (storedVersion) {
      console.log('Redirecionando para limpeza de cache...');
      
      // Redirecionar para a página de limpeza de cache
      // Usamos um pequeno delay para garantir que o localStorage seja atualizado
      setTimeout(() => {
        window.location.href = '/clear-cache/';
      }, 500);
    }
  }
})(); 