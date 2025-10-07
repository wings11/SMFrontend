'use client'

import Image from 'next/image'
import { useState } from 'react'
import { shouldUnoptimizeImage } from '@/lib/imageUtils'

interface MovieImageProps {
  src?: string | null
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  width?: number
  height?: number
}

export function MovieImage({ src, alt, ...props }: MovieImageProps) {
  const [imgSrc, setImgSrc] = useState(src || '/placeholder-movie.svg')
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImgSrc('/placeholder-movie.svg')
    }
  }

  // If no src provided or src is invalid, show placeholder immediately
  if (!src || hasError) {
    return (
      <Image
        src="/placeholder-movie.svg"
        alt={alt}
        {...props}
      />
    )
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={shouldUnoptimizeImage(src)}
      {...props}
    />
  )
}