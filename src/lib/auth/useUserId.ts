"use client"
import { useEffect, useState } from "react"
import AuthService from "./auth-service"

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    AuthService.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  return userId
} 