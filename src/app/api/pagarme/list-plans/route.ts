import { NextResponse } from 'next/server'
import axios from 'axios'

// Constantes para a API V5 do Pagar.me
const PAGARME_API_KEY = process.env.PAGARME_API_KEY
const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

export async function GET() {
  try {
    console.log('Buscando planos do Pagar.me V5...')
    
    if (!PAGARME_API_KEY) {
      throw new Error('PAGARME_API_KEY não está configurada no .env')
    }

    const response = await axios.get(
      `${PAGARME_API_URL}/plans`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`
        }
      }
    )
    
    console.log('Planos encontrados:', response.data)
    
    return NextResponse.json({
      success: true,
      plans: response.data.data || [],
      count: response.data.data?.length || 0,
      paging: response.data.paging || {}
    })
  } catch (error) {
    console.error('Erro ao buscar planos:', error.response?.data || error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch plans'
    const errorDetails = error.response?.data || (error instanceof Error ? error.stack : error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
} 