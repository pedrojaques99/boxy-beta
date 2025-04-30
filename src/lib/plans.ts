import { Plan } from '@/types/subscription'

export const PLANS: Record<string, Plan> = {
  'pln_mensal_id': {
    id: 'pln_mensal_id',
    name: 'Mensal',
    price: 3790, // R$ 37,90 in cents
    interval: 'month',
    interval_count: 1,
    features: [
      'Acesso a todos os recursos',
      'Suporte prioritário',
      'Atualizações constantes',
      'Backup diário'
    ],
    pagarme_plan_id: process.env.PAGARME_PLAN_MONTHLY_ID || 'pln_mensal_id'
  },
  'pln_anual_id': {
    id: 'pln_anual_id',
    name: 'Anual',
    price: 37900, // R$ 379,00 in cents
    interval: 'year',
    interval_count: 1,
    features: [
      'Acesso a todos os recursos',
      'Suporte prioritário',
      'Atualizações constantes',
      'Backup diário',
      '20% de desconto'
    ],
    pagarme_plan_id: process.env.PAGARME_PLAN_YEARLY_ID || 'pln_anual_id'
  }
}

export const getPlanById = (id: string): Plan | undefined => {
  return PLANS[id]
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price / 100)
}

export const getPlanInterval = (plan: Plan): string => {
  if (plan.interval === 'month') {
    return plan.interval_count === 1 ? 'mês' : `${plan.interval_count} meses`
  }
  return plan.interval_count === 1 ? 'ano' : `${plan.interval_count} anos`
} 