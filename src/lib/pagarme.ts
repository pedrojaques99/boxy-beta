import { client } from 'pagarme'

const PAGARME_API_KEY = process.env.PAGARME_API_KEY

if (!PAGARME_API_KEY) {
  throw new Error('PAGARME_API_KEY não está configurada no .env')
}

console.log('Configurando cliente Pagar.me com a chave:', PAGARME_API_KEY.substring(0, 10) + '...')

let pagarmeClient

try {
  pagarmeClient = client.connect({ api_key: PAGARME_API_KEY })
  console.log('Cliente Pagar.me configurado com sucesso')
} catch (error) {
  console.error('Erro ao configurar cliente Pagar.me:', error)
  throw new Error('Falha ao configurar cliente Pagar.me')
}

export const pagarme = pagarmeClient 