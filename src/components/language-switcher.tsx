'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const { lang: i18nLang, setLang: setI18nLang } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  const lang = i18nLang === 'en' ? 'EN' : 'VI'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function switchLang(newLang: 'VI' | 'EN') {
    setI18nLang(newLang === 'EN' ? 'en' : 'vi')
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
      >
        <span>{lang === 'VI' ? '🇻🇳' : '🇺🇸'}</span>
        <span>{lang}</span>
        <ChevronDown className={`size-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden w-36">
          <button
            onClick={() => switchLang('VI')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${lang === 'VI' ? 'font-bold text-[#FF5942]' : 'text-gray-700'}`}
          >
            <span>🇻🇳</span> Tiếng Việt
          </button>
          <button
            onClick={() => switchLang('EN')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${lang === 'EN' ? 'font-bold text-[#FF5942]' : 'text-gray-700'}`}
          >
            <span>🇺🇸</span> English
          </button>
        </div>
      )}
    </div>
  )
}
