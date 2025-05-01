import { useTranslations } from 'next-intl';
import { Plan } from '@/types/subscription'

export const PLANS = {
  free: {
    id: 'free',
    name: 'plans.free.name',
    price: 0,
    interval: 'month',
    interval_count: 1,
    features: [
      'plans.free.features.basic',
      'plans.free.features.support',
      'plans.free.features.community'
    ],
    pagarme_plan_id: 'free'
  },
  monthly: {
    id: 'monthly',
    name: 'plans.monthly.name',
    price: 37.90,
    interval: 'month',
    interval_count: 1,
    features: [
      'plans.monthly.features.all',
      'plans.monthly.features.downloads',
      'plans.monthly.features.support',
      'plans.monthly.features.updates',
      'plans.monthly.features.community'
    ],
    pagarme_plan_id: process.env.PAGARME_PLAN_MONTHLY_ID || 'pln_mensal_id'
  },
  yearly: {
    id: 'yearly',
    name: 'plans.yearly.name',
    price: 379.00,
    interval: 'year',
    interval_count: 1,
    features: [
      'plans.yearly.features.all',
      'plans.yearly.features.downloads',
      'plans.yearly.features.support',
      'plans.yearly.features.updates',
      'plans.yearly.features.community',
      'plans.yearly.features.discount'
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
  const t = useTranslations('plans');
  return count === 1 ? t(`${interval}.interval`) : `${count} ${t(`${interval}.interval`)}s`;
} 