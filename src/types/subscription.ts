export interface Plan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  interval_count: number
  features: string[]
  pagarme_plan_id: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'payment_failed' | 'trial' | 'pending'
  pagarme_subscription_id: string
  pagarme_customer_id: string
  started_at: string
  current_period_end: string
  canceled_at?: string
  last_payment_error?: string
  updated_at: string
}

export interface SubscriptionResponse {
  success: boolean
  subscription: Subscription
  customer: {
    id: string
    name: string
    email: string
  }
}

export interface SubscriptionError {
  error: string
  details?: string
} 