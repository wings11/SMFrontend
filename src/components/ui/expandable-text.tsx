'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableTextProps {
  text: string
  maxLines?: number
  className?: string
  showButton?: boolean
  buttonClassName?: string
  expandButtonText?: string
  collapseButtonText?: string
  variant?: 'default' | 'compact'
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLines = 2,
  className = '',
  showButton = true,
  buttonClassName = '',
  expandButtonText = 'See more...',
  collapseButtonText = 'Show less',
  variant = 'default'
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowButton, setShouldShowButton] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const checkTextOverflow = () => {
      if (textRef.current) {
        const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight)
        const maxHeight = lineHeight * maxLines
        const actualHeight = textRef.current.scrollHeight
        
        setShouldShowButton(actualHeight > maxHeight + 5) // Add small buffer
      }
    }

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(checkTextOverflow, 100)
    window.addEventListener('resize', checkTextOverflow)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', checkTextOverflow)
    }
  }, [text, maxLines])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-1">
        <p
          ref={textRef}
          className={`${className} transition-all duration-200`}
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            WebkitLineClamp: !isExpanded ? maxLines : 'none',
            textOverflow: 'ellipsis'
          }}
        >
          {text}
          {shouldShowButton && showButton && !isExpanded && (
            <button
              onClick={toggleExpanded}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1 font-medium text-sm underline"
            >
              {expandButtonText}
            </button>
          )}
        </p>
        
        {shouldShowButton && showButton && isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className={`h-auto p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm ${buttonClassName}`}
          >
            {collapseButtonText}
            <ChevronUp className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p
        ref={textRef}
        className={`${className} transition-all duration-200`}
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          WebkitLineClamp: !isExpanded ? maxLines : 'none',
          textOverflow: 'ellipsis'
        }}
      >
        {text}
      </p>
      
      {shouldShowButton && showButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          className={`h-auto p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm ${buttonClassName}`}
        >
          {isExpanded ? (
            <>
              {collapseButtonText}
              <ChevronUp className="w-3 h-3 ml-1" />
            </>
          ) : (
            <>
              {expandButtonText}
              <ChevronDown className="w-3 h-3 ml-1" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default ExpandableText
