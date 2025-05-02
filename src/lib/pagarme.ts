import { client } from 'pagarme'

const PAGARME_API_KEY = process.env.PAGARME_API_KEY

if (!PAGARME_API_KEY) {
  throw new Error('PAGARME_API_KEY não está configurada no .env')
}

export const pagarme = client.connect({ api_key: PAGARME_API_KEY }) 