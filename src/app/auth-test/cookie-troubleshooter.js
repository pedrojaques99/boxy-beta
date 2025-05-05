/**
 * Função para diagnosticar e corrigir problemas de cookies de autenticação do Supabase
 * Cole este código no console do navegador para executar o diagnóstico
 */

(function() {
  // Cores para console
  const styles = {
    success: 'color: green; font-weight: bold',
    error: 'color: red; font-weight: bold',
    warning: 'color: orange; font-weight: bold',
    info: 'color: blue; font-weight: bold',
    highlight: 'background: yellow; color: black; padding: 2px 5px; border-radius: 3px'
  };

  console.log('%c🔍 Iniciando diagnóstico de autenticação Supabase...', styles.info);
  
  // Analisar cookies
  const allCookies = document.cookie.split(';').map(c => c.trim());
  const authCookies = allCookies.filter(c => 
    c.toLowerCase().includes('supabase') || 
    c.toLowerCase().includes('auth') || 
    c.toLowerCase().includes('session')
  );
  
  console.log(`%cTotal de cookies: ${allCookies.length}`, styles.info);
  console.log(`%cCookies de autenticação: ${authCookies.length}`, styles.info);
  
  if (authCookies.length > 0) {
    console.log('%c✓ Cookies de autenticação encontrados:', styles.success);
    authCookies.forEach(cookie => {
      const [name, value] = cookie.split('=');
      console.log(`%c${name}:%c ${value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'vazio'}`, 
        styles.highlight, '');
    });
  } else {
    console.log('%c✗ Nenhum cookie de autenticação encontrado!', styles.error);
  }
  
  // Problemas comuns e correções
  console.log('%c\n🔧 Verificando problemas comuns...', styles.info);
  
  // Verificar SameSite e Secure
  const hasInsecureCookie = authCookies.some(c => 
    (c.toLowerCase().includes('secure') && c.toLowerCase().includes('false')) ||
    (c.toLowerCase().includes('samesite') && c.toLowerCase().includes('none') && !c.toLowerCase().includes('secure'))
  );
  
  if (hasInsecureCookie) {
    console.log('%c✗ Encontrados cookies possivelmente mal configurados (SameSite/Secure)', styles.error);
  }
  
  // Verificar se estamos em uma aba incognito
  const isIncognito = () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return false;
    } catch (e) {
      return true;
    }
  };
  
  if (isIncognito()) {
    console.log('%c⚠️ Navegação anônima/incognito detectada! Isso pode afetar cookies e localStorage.', styles.warning);
  }
  
  // Verificar localStorage
  try {
    const supabaseItemsCount = Object.keys(localStorage).filter(k => 
      k.toLowerCase().includes('supabase') || 
      k.toLowerCase().includes('auth')
    ).length;
    
    console.log(`%cItens Supabase no localStorage: ${supabaseItemsCount}`, styles.info);
    
    if (supabaseItemsCount === 0) {
      console.log('%c⚠️ Nenhum dado do Supabase encontrado no localStorage. Isso pode indicar problemas.', styles.warning);
    }
  } catch (e) {
    console.log('%c✗ Não foi possível acessar localStorage', styles.error);
  }
  
  // URL atual
  const url = window.location.href;
  console.log(`%cURL atual: ${url}`, styles.info);
  
  // Verificar se há problemas com CORS
  console.log('%c\n🔄 Verificando configuração CORS...', styles.info);
  fetch('/_next/static/chunks/pages/_app.js')
    .then(response => {
      console.log('%c✓ Requisição interna funciona corretamente', styles.success);
    })
    .catch(error => {
      console.log('%c✗ Possível problema de CORS ou rede: ' + error.message, styles.error);
    });
  
  // Instruções para corrigir
  console.log('%c\n🛠️ Ações possíveis para corrigir problemas:', styles.info);
  console.log(`
    1. Limpar cookies: document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'));
    2. Limpar localStorage: localStorage.clear();
    3. Recarregar página: window.location.reload();
    4. Verificar sessão atual: const checkSession = async () => { const res = await fetch('/api/auth/session'); console.log(await res.json()); }; checkSession();
  `);
  
  console.log('%c\nDiagnóstico concluído!', styles.info);
  
  // Retornar resumo
  return {
    cookies: allCookies.length,
    authCookies: authCookies.length,
    incognito: isIncognito(),
    url: url,
    time: new Date().toISOString()
  };
})(); 