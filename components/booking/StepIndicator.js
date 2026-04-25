import { Car, Sparkles, Calendar, CreditCard, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { icon: Car,         label: 'Vehicle'  },
  { icon: Sparkles,    label: 'Services' },
  { icon: Calendar,    label: 'Schedule' },
  { icon: CreditCard,  label: 'Payment'  },
]

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const num = i + 1
        const done    = num < currentStep
        const active  = num === currentStep
        const Icon    = step.icon

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                done   ? 'bg-brand-500 border-brand-500 text-[var(--text)]' :
                active ? 'bg-[var(--surface)] border-brand-500 text-brand-600 shadow-thunder' :
                         'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)]'
              )}>
                {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                'text-xs mt-1 font-medium',
                active ? 'text-brand-600' : done ? 'text-brand-400' : 'text-[var(--text-muted)]'
              )}>
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 w-12 md:w-20 mx-1 mb-4 transition-all duration-300',
                num < currentStep ? 'bg-brand-500' : 'bg-gray-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
