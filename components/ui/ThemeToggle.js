'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  const options = [
    { value: 'light',  icon: Sun,     label: 'Light' },
    { value: 'dark',   icon: Moon,    label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  const current = options.find(o => o.value === theme) || options[2]
  const Icon = current.icon

  function cycle() {
    const idx = options.findIndex(o => o.value === theme)
    setTheme(options[(idx + 1) % options.length].value)
  }

  return (
    <button
      onClick={cycle}
      title={`Theme: ${current.label} (click to change)`}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${className}`}
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
