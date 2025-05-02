import { NextResponse } from 'next/server'
import { pagarme } from '@/lib/pagarme'

export async function POST() {
  try {
    console.log('Iniciando criação de planos no Pagar.me...')
    
    // Planos que serão criados
    const plans = [
      {
        name: 'Plano Mensal',
        amount: 3790, // R$ 37,90 em centavos
        days: 30,
        payment_methods: ['credit_card'],
        installments: 12,
        trial_days: 0
      },
      {
        name: 'Plano Anual',
        amount: 37900, // R$ 379,00 em centavos
        days: 365,
        payment_methods: ['credit_card'],
        installments: 12,
        trial_days: 0
      }
    ]

    console.log('Configurando cliente Pagar.me...')
    const createdPlans = await Promise.all(
      plans.map(async (plan) => {
        try {
          console.log(`Criando plano: ${plan.name}...`)
          const response = await pagarme.plans.create(plan)
          console.log(`Plano ${plan.name} criado com sucesso:`, response)
          return {
            id: response.id,
            name: response.name,
            amount: response.amount,
            status: response.status
          }
        } catch (error) {
          console.error(`Erro ao criar plano ${plan.name}:`, error)
          if (error instanceof Error) {
            throw new Error(`Erro ao criar plano ${plan.name}: ${error.message}`)
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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create plans',
        details: error
      },
      { status: 500 }
    )
  }
} 