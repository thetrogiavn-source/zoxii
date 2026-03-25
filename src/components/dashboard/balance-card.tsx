'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  title: string
  amount: number
  colorScheme: 'green' | 'blue' | 'orange'
}

const colorMap = {
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  blue: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: 'text-cyan-500',
    dot: 'bg-cyan-500',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'text-orange-500',
    dot: 'bg-orange-500',
  },
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

export function BalanceCard({ title, amount, colorScheme }: BalanceCardProps) {
  const [visible, setVisible] = useState(true)
  const colors = colorMap[colorScheme]

  return (
    <Card className={cn('border', colors.border, colors.bg)}>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full', colors.dot)} />
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          <button
            onClick={() => setVisible(!visible)}
            className={cn('p-1 rounded-md hover:bg-white/60 transition-colors', colors.icon)}
          >
            {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>
        <p className={cn('text-2xl font-bold', colors.text)}>
          {visible ? formatVND(amount) : '••••••••'}
        </p>
      </CardContent>
    </Card>
  )
}
