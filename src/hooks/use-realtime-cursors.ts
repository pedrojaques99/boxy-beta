'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RealtimeChannel, REALTIME_CHANNEL_STATES } from '@supabase/supabase-js'
import { useThrottleCallback } from './use-throttle-callback'
import { createClient } from '@/lib/supabase/client'

const EVENT_NAME = 'cursor-move'
const THROTTLE_DEFAULT = 16 // ~60fps
const CLEANUP_INTERVAL = 1000 // Check every second
const CURSOR_TIMEOUT = 1000 // Remove cursor after 1 second of inactivity

interface CursorEventPayload {
  position: {
    x: number
    y: number
  }
  user: {
    id: number
    name: string
  }
  color: string
  timestamp: number
  isVisible: boolean
}

const generateRandomColor = () => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEEAD',
    '#D4A5A5',
    '#9B59B6',
    '#3498DB',
    '#1ABC9C',
    '#F1C40F',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 1000000)
}

const isInViewport = (x: number, y: number): boolean => {
  if (typeof window === 'undefined') return false
  return x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight
}

export const useRealtimeCursors = ({
  roomName,
  username,
  throttleMs = THROTTLE_DEFAULT,
}: {
  roomName: string
  username: string
  throttleMs?: number
}) => {
  const [color] = useState(() => {
    if (typeof window === 'undefined') return '#000000'
    return generateRandomColor()
  })
  const [userId] = useState(() => {
    if (typeof window === 'undefined') return 0
    return generateRandomNumber()
  })
  const [cursors, setCursors] = useState<Record<string, CursorEventPayload>>({})
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const callback = useCallback(
    (event: MouseEvent) => {
      const { clientX, clientY } = event
      
      // Only broadcast if position has changed significantly (more than 1px)
      if (lastPositionRef.current) {
        const dx = Math.abs(clientX - lastPositionRef.current.x)
        const dy = Math.abs(clientY - lastPositionRef.current.y)
        if (dx < 1 && dy < 1) return
      }

      lastPositionRef.current = { x: clientX, y: clientY }
      const isVisible = isInViewport(clientX, clientY)

      const payload: CursorEventPayload = {
        position: {
          x: clientX,
          y: clientY,
        },
        user: {
          id: userId,
          name: username,
        },
        color: color,
        timestamp: Date.now(),
        isVisible
      }

      channelRef.current?.send({
        type: 'broadcast',
        event: EVENT_NAME,
        payload: payload,
      })
    },
    [color, userId, username]
  )

  const handleMouseMove = useThrottleCallback(callback, throttleMs)

  const handleMouseLeave = useCallback(() => {
    if (!lastPositionRef.current) return

    const payload: CursorEventPayload = {
      position: lastPositionRef.current,
      user: {
        id: userId,
        name: username,
      },
      color: color,
      timestamp: Date.now(),
      isVisible: false
    }

    channelRef.current?.send({
      type: 'broadcast',
      event: EVENT_NAME,
      payload: payload,
    })
  }, [color, userId, username])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = supabase.channel(roomName, {
      config: {
        broadcast: { self: true },
        presence: { key: username },
      },
    })
    
    channelRef.current = channel

    channel
      .on('broadcast', { event: EVENT_NAME }, (data: { payload: CursorEventPayload }) => {
        const { user, isVisible } = data.payload
        
        setCursors(prev => {
          const newCursors = { ...prev }
          
          if (!isVisible) {
            delete newCursors[user.id]
          } else {
            newCursors[user.id] = data.payload
          }
          
          return newCursors
        })
      })
      .subscribe((status: keyof typeof REALTIME_CHANNEL_STATES) => {
        if (status === 'joined') {
          console.log('Connected to cursor channel:', roomName)
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [roomName, username, supabase])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  // Remove stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCursors(prev => {
        const newCursors = { ...prev }
        let hasChanges = false

        Object.entries(newCursors).forEach(([id, cursor]) => {
          if (now - cursor.timestamp > CURSOR_TIMEOUT) {
            delete newCursors[id]
            hasChanges = true
          }
        })

        return hasChanges ? newCursors : prev
      })
    }, CLEANUP_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  return { cursors }
}
