'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Notification {
  id: string
  title: string
  title_en: string | null
  message: string
  message_en: string | null
  type: string
  is_read: boolean
  is_global: boolean
  created_at: string
}

const TYPE_ICON: Record<string, { icon: typeof Info; bg: string; text: string }> = {
  info: { icon: Info, bg: '#ebf5fd', text: '#309ae7' },
  success: { icon: CheckCircle, bg: '#e7f5ec', text: '#60bc7f' },
  warning: { icon: AlertTriangle, bg: '#fef2d4', text: '#e4a508' },
  error: { icon: XCircle, bg: '#fde8ea', text: '#e91925' },
}

export function NotificationBell() {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const json = await res.json()
        if (json.data) setNotifications(json.data)
      }
    } catch { /* ignore */ }
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'read' }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('just_now')
    if (mins < 60) return `${mins} ${t('minutes_ago')}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ${t('hours_ago')}`
    const days = Math.floor(hours / 24)
    return `${days} ${t('days_ago')}`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) loadNotifications() }}
        className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors relative"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-[#FF5942] text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">{t('notification')}</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5942] text-white">
                {unreadCount} {t('new')}
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 20).map(n => {
                const cfg = TYPE_ICON[n.type] || TYPE_ICON.info
                const Icon = cfg.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.is_read) markRead(n.id) }}
                    className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors ${
                      n.is_read ? 'bg-white' : 'bg-blue-50/50'
                    } hover:bg-gray-50`}
                  >
                    <div className="flex size-8 items-center justify-center rounded-full shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg }}>
                      <Icon className="size-4" style={{ color: cfg.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${n.is_read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                          {lang === 'en' && n.title_en ? n.title_en : n.title}
                        </p>
                        {!n.is_read && <span className="size-2 rounded-full bg-[#FF5942] shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{lang === 'en' && n.message_en ? n.message_en : n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-10 text-center">
                <Bell className="size-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('no_notifications')}</p>
              </div>
            )}
          </div>

          {/* Clear all */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2.5">
              <button
                onClick={async () => {
                  if (!confirm(lang === 'en' ? 'Delete all notifications?' : 'Xóa tất cả thông báo?')) return
                  await fetch('/api/notifications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete_all' }),
                  })
                  setNotifications([])
                }}
                className="w-full text-center text-xs text-red-500 hover:text-red-600 font-medium py-1 transition-colors"
              >
                {lang === 'en' ? 'Delete all notifications' : 'Xóa tất cả thông báo'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
