"use client"

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function TopBanner() {
  const [featuredAds, setFeaturedAds] = useState<Array<{ image?: string; link?: string }>>([])
  const [activeAdIdx, setActiveAdIdx] = useState(0)
  const adTimerRef = useRef<number | null>(null)

  useEffect(() => {
    // Seed with static placeholders. For dynamic ads, replace with fetch('/api/ads')
    setFeaturedAds([
      { image: '/ads/sponsor-placeholder.svg', link: '#' },
      { image: '/ads/sponsor-placeholder.svg', link: '#' }
    ])
  }, [])

  useEffect(() => {
    if (!featuredAds || featuredAds.length <= 1) return
    adTimerRef.current = window.setInterval(() => {
      setActiveAdIdx((prev) => (prev + 1) % featuredAds.length)
    }, 5000)

    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current)
    }
  }, [featuredAds])

  return (
    <div className="sticky top-0 z-40">
      {featuredAds && featuredAds.length > 0 ? (
        <div className="w-full bg-black/80 flex items-center justify-center">
          <a href={featuredAds[activeAdIdx]?.link || '#'} className="w-full max-w-4xl">
            <Image src={featuredAds[activeAdIdx].image || '/placeholder-movie.jpg'} alt="Ad" width={1200} height={180} className="w-full h-20 md:h-28 object-cover rounded-b-md" />
          </a>
        </div>
      ) : (
        <div className="w-full bg-black/80 flex items-center justify-center">
          <div className="w-full max-w-4xl py-4 text-center text-white/90">Can add Ads, contact - 0xxx</div>
        </div>
      )}
    </div>
  )
}
