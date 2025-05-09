import { Client } from '@pagar.me/sdk';

export const getPagarmeClient = () => {
  const apiKey = process.env.PAGARME_API_KEY;
  
  if (!apiKey) {
    throw new Error('PAGARME_API_KEY is not defined');
  }

  return new Client({ apiKey });
}; 