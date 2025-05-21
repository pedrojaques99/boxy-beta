"use client"

import { PlanCreation } from '@/components/admin/PlanCreation'

export default function AdminPlansPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Gerenciar Planos Pagar.me</h1>
      <p className="text-muted-foreground mb-6">Crie e visualize planos oficiais de assinatura na plataforma Pagar.me.</p>
      <PlanCreation />
    </div>
  )
} 