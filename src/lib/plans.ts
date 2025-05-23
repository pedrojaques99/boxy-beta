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
    name: 'Plano Mensal',
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
    pagarme_plan_id: process.env.PAGARME_PLAN_MONTHLY_ID || 'plan_o73KEzlH5HjglzyJ'
  },
  annual: {
    id: 'annual',
    name: 'Plano Anual',
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
    pagarme_plan_id: process.env.PAGARME_PLAN_YEARLY_ID || 'plan_Z3rw7jBsrsO7GMXA'
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

// Função para buscar plano por id local ou pagarme_plan_id
export function getPlanByAnyId(id: string) {
  return (
    Object.values(PLANS).find(
      (plan) => plan.id === id || plan.pagarme_plan_id === id
    ) || null
  );
} 