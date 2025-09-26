'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopProps {
  showAfter?: number
  className?: string
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({
  showAfter = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [showAfter])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-6 z-50 h-10 w-10 rounded-full bg-[#176DA6] text-white/0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${className}`}
      size="sm"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" style={{ color: '#fff' }} />
    </Button>
  )
}

export default ScrollToTop
