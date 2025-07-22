export interface M3UData {
  username: string;
  password: string;
  dns: string;
  name?: string;
}

export function parseM3ULink(m3uUrl: string): M3UData | null {
  try {
    const url = new URL(m3uUrl);
    
    // Extrair parâmetros da query string
    const username = url.searchParams.get('username');
    const password = url.searchParams.get('password');
    
    if (!username || !password) {
      throw new Error('Username ou password não encontrados no link M3U');
    }
    
    // Extrair DNS (host + porta)
    const dns = url.host;
    
    if (!dns) {
      throw new Error('DNS não encontrado no link M3U');
    }
    
    // Gerar nome baseado no DNS
    const name = `Lista M3U - ${dns}`;
    
    return {
      username,
      password,
      dns,
      name
    };
  } catch (error) {
    console.error('Erro ao fazer parse do link M3U:', error);
    return null;
  }
}

export function buildServerUrl(dns: string): string {
  // Se já tem protocolo, usar como está
  if (dns.startsWith('http://') || dns.startsWith('https://')) {
    return dns;
  }
  
  // Assumir http por padrão para servidores IPTV
  return `http://${dns}`;
}