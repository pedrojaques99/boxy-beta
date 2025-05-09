import { NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'

// Constantes para a API V5 do Pagar.me
const PAGARME_API_KEY = process.env.PAGARME_API_KEY
const PAGARME_API_URL = 'https://api.pagar.me/core/v5'

export async function POST() {
  try {
    console.log('Iniciando criação de planos no Pagar.me V5...')
    
    if (!PAGARME_API_KEY) {
      throw new Error('PAGARME_API_KEY não está configurada no .env')
    }

    // Planos que serão criados
    const plans = [
      {
        name: 'Plano Mensal',
        interval: 'month',
        interval_count: 1,
        billing_type: 'exact_day',
        billing_days: [1],
        minimum_price: 3790, // R$ 37,90 em centavos
        installments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        currency: 'BRL',
        items: [
          {
            name: 'Assinatura Mensal',
            quantity: 1,
            pricing_scheme: {
              price: 3790, // R$ 37,90 em centavos
              scheme_type: 'unit'
            }
          }
        ]
      },
      {
        name: 'Plano Anual',
        interval: 'year',
        interval_count: 1,
        billing_type: 'prepaid',
        minimum_price: 37900, // R$ 379,00 em centavos
        installments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        currency: 'BRL',
        items: [
          {
            name: 'Assinatura Anual',
            quantity: 1,
            pricing_scheme: {
              price: 37900, // R$ 379,00 em centavos
              scheme_type: 'unit'
            }
          }
        ]
      }
    ]

    console.log('Iniciando criação dos planos:', plans)
    const createdPlans = await Promise.all(
      plans.map(async (plan) => {
        try {
          console.log(`Criando plano: ${plan.name}...`)
          const response = await axios.post(
            `${PAGARME_API_URL}/plans`,
            plan,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`
              }
            }
          )
          
          console.log(`Plano ${plan.name} criado com sucesso:`, response.data)
          return {
            id: response.data.id,
            name: response.data.name,
            interval: response.data.interval,
            status: response.data.status
          }
        } catch (error) {
          const axiosError = error as AxiosError
          console.error(`Erro ao criar plano ${plan.name}:`, axiosError.response?.data || axiosError)
          if (axiosError.response?.data) {
            throw new Error(`Erro ao criar plano ${plan.name}: ${JSON.stringify(axiosError.response.data)}`)
          }
          throw error
        }
      })
    )

    console.log('Todos os planos criados com sucesso:', createdPlans)
    return NextResponse.json({
      success: true,
      plans: createdPlans
    })
  } catch (error) {
    console.error('Erro detalhado ao criar planos:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create plans'
    const errorDetails = error instanceof Error ? error.stack : error
    
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