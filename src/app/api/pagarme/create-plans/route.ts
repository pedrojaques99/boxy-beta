import { NextResponse } from 'next/server'
import { pagarme } from '@/lib/pagarme'

export async function POST() {
  try {
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

    const createdPlans = await Promise.all(
      plans.map(async (plan) => {
        try {
          const response = await pagarme.plans.create(plan)
          return {
            id: response.id,
            name: response.name,
            amount: response.amount,
            status: response.status
          }
        } catch (error) {
          console.error(`Erro ao criar plano ${plan.name}:`, error)
          throw error
        }
      })
    )

    return NextResponse.json({
      success: true,
      plans: createdPlans
    })
  } catch (error) {
    console.error('Erro ao criar planos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create plans' 
      },
      { status: 500 }
    )
  }
} 