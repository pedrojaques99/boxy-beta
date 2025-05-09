import { client as Client } from 'pagarme';

export const getPagarmeClient = () => {
  const apiKey = process.env.PAGARME_API_KEY;
  
  if (!apiKey) {
    throw new Error('PAGARME_API_KEY is not defined');
  }

  return Client.connect({ api_key: apiKey });
}; 