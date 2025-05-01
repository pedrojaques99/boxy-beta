import { Plan } from '@/types/subscription'

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    interval_count: 1,
    features: [
      'Basic features',
      'Email support',
      'Community access (coming soon)'
    ],
    pagarme_plan_id: 'free'
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 37.90,
    interval: 'month',
    interval_count: 1,
    features: [
      'Access to all features',
      '10 downloads per day',
      'Priority support',
      'Constant updates',
      'Community access (coming soon)'
    ],
    pagarme_plan_id: process.env.PAGARME_PLAN_MONTHLY_ID || 'pln_mensal_id'
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    price: 379.00,
    interval: 'year',
    interval_count: 1,
    features: [
      'Access to all features',
      'Unlimited downloads',
      'Priority support',
      'Constant updates',
      'Community access (coming soon)',
      '20% discount'
    ],
    pagarme_plan_id: process.env.PAGARME_PLAN_YEARLY_ID || 'pln_anual_id'
  }
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanById(id: PlanId) {
  return PLANS[id];
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

export function getPlanInterval(interval: string, count: number) {
  if (interval === 'month') {
    return count === 1 ? 'month' : `${count} months`;
  }
  return count === 1 ? 'year' : `${count} years`;
} 