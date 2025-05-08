import type React from "react"

import { useEffect, useRef, useState } from "react"

interface AnimateOnScrollProps {
  children: React.ReactNode
  className?: string
}

export function AnimateOnScroll({ children, className = "" }: AnimateOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.1,
      },
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return (
    <div ref={ref} className={`${className} ${isVisible ? "animate-fade-in" : "opacity-0"}`}>
      {children}
    </div>
  )
}