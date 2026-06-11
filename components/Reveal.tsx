'use client'
import { useScrollReveal } from './useScrollReveal'

// Thin client wrapper that fades + lifts its children into view on scroll.
// Lets server-rendered sections (WhatsApp preview, Browse) get a reveal without
// becoming client components themselves — they're passed through as children.
type Props = {
  children: React.ReactNode
  className?: string
  /** extra delay in ms before the reveal transition starts */
  delay?: number
}

export default function Reveal({ children, className, delay = 0 }: Props) {
  const { ref, shown } = useScrollReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal${shown ? ' reveal--in' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
