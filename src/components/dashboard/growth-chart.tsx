'use client'

import { useI18n } from '@/lib/i18n'

interface GrowthChartProps {
  data: { month: string; amount: number }[]
}

export function GrowthChart({ data }: GrowthChartProps) {
  const { t } = useI18n()
  const maxAmount = Math.max(...data.map(d => d.amount), 1)
  const formatVND = (n: number) => {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
    if (n >= 1000000) return (n / 1000000).toFixed(0) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
    return String(n)
  }

  const total = data.reduce((s, d) => s + d.amount, 0)
  const lastMonth = data[data.length - 1]?.amount || 0
  const prevMonth = data[data.length - 2]?.amount || 0
  const growthPct = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth * 100).toFixed(0) : '0'
  const isPositive = lastMonth >= prevMonth

  // SVG line chart points
  const chartH = 140
  const chartW = 100 // percentage-based
  const points = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * chartW : 50,
    y: maxAmount > 0 ? chartH - (d.amount / maxAmount) * (chartH - 20) - 10 : chartH - 10,
    amount: d.amount,
    month: d.month,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${chartH} L ${points[0]?.x || 0} ${chartH} Z`

  return (
    <div>
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-5">
        <div>
          <p className="text-xs text-gray-500">{t('chart_total_6months')}</p>
          <p className="text-lg font-bold text-gray-900">{formatVND(total)} VND</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t('chart_last_month')}</p>
          <p className="text-lg font-bold text-gray-900">{formatVND(lastMonth)} VND</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t('chart_growth')}</p>
          <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{growthPct}%
          </p>
        </div>
      </div>

      {/* Combined: Bar chart + Line overlay */}
      <div className="relative">
        {/* Bar chart */}
        <div className="flex items-end gap-1.5 sm:gap-3 h-44">
          {data.map((d, i) => {
            const height = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0
            const isLast = i === data.length - 1
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-gray-500">
                  {d.amount > 0 ? formatVND(d.amount) : ''}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isLast ? 'bg-[#FF5942]' : 'bg-[#FF5942]/20'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${d.month}: ${new Intl.NumberFormat('vi-VN').format(d.amount)} VND`}
                />
                <span className={`text-[10px] font-medium ${isLast ? 'text-[#FF5942]' : 'text-gray-400'}`}>
                  {d.month}
                </span>
              </div>
            )
          })}
        </div>

        {/* SVG Line overlay */}
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          style={{ height: '176px', top: '14px' }}
          viewBox={`0 0 ${chartW} ${chartH}`}
          preserveAspectRatio="none"
        >
          {/* Gradient fill under line */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF5942" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FF5942" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#lineGradient)" />
          <path d={linePath} fill="none" stroke="#FF5942" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots on each point */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="white" stroke="#FF5942" strokeWidth="1.5" />
              {i === points.length - 1 && (
                <circle cx={p.x} cy={p.y} r="5" fill="#FF5942" stroke="white" strokeWidth="2" />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Month-over-month changes */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {data.map((d, i) => {
          if (i === 0) return null
          const prev = data[i - 1].amount
          const change = prev > 0 ? ((d.amount - prev) / prev * 100) : 0
          const up = change >= 0
          return (
            <div key={d.month} className="flex items-center gap-1 text-[10px]">
              <span className="text-gray-400">{d.month}:</span>
              <span className={`font-bold ${up ? 'text-green-600' : 'text-red-500'}`}>
                {up ? '↑' : '↓'} {Math.abs(change).toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
