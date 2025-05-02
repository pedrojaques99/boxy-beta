declare module 'pagarme' {
  interface Plan {
    id: string
    name: string
    amount: number
    days: number
    payment_methods: string[]
    installments: number
    trial_days: number
    status: string
  }

  interface Plans {
    create(data: Omit<Plan, 'id' | 'status'>): Promise<Plan>
  }

  interface Client {
    plans: Plans
  }

  interface ClientOptions {
    api_key: string
  }

  interface ClientStatic {
    connect(options: ClientOptions): Client
  }

  export const client: ClientStatic
} 