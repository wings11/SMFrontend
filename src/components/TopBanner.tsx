"use client"

import React, { useEffect, useRef, useState } from 'react'

function driveToDirectUrl(url?: string) {
  if (!url) return undefined
  try {
    const u = new URL(url)
    // Drive share: /file/d/FILE_ID/view
    const match = u.pathname.match(/\/file\/d\/([^\/]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`
    }
    // If already a uc link or direct, return as-is
    if (u.hostname.includes('drive.google.com')) return url
    return url
  } catch {
    return url
  }
}

function extractYouTubeId(url?: string) {
  if (!url) return null
  try {
    // support youtu.be/ID and youtube.com/watch?v=ID and embed links
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/watch')) return u.searchParams.get('v')
      const match = u.pathname.match(/\/embed\/([^\/]+)/)
      if (match && match[1]) return match[1]
    }
    return null
  } catch {
    return null
  }
}

export default function TopBanner() {
  const [featuredAds, setFeaturedAds] = useState<Array<{ image?: string; link?: string; video?: string }>>([])
  const [activeAdIdx, setActiveAdIdx] = useState(0)
  const adTimerRef = useRef<number | null>(null)

  useEffect(() => {
    // Seed with static placeholders. For dynamic ads, replace with fetch('/api/ads')
    setFeaturedAds([
      // Show the repo GIF (keep full visible and animated). Use encoded space in filename for correct URL.
      { image: '/ads/sponsor-placeholder.svg', link: '#' },
      // Use provided YouTube URL for banner
      // { video: 'https://youtu.be/e9P6-9-PNXo?si=OkkPSKzJKk8jIqY9', link: '#' }
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

  const currentAd = featuredAds && featuredAds.length > 0 ? featuredAds[activeAdIdx] : null
  const ytId = currentAd ? extractYouTubeId(currentAd.video) : null

  return (
    <div className="sticky top-0 z-40 flex justify-center bg-black/80">
      {currentAd ? (
        // Center a fixed-size ad container (1200x180) so the top banner does not grow on large screens
        <div className="w-[1200px] h-[180px] relative">
          {currentAd.video ? (
            ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0&playsinline=1`}
                title="Ad video"
                className="absolute inset-0 w-full h-full object-cover"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                frameBorder={0}
              />
            ) : (
              <video
                src={driveToDirectUrl(currentAd.video)}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            )
          ) : (
            <img key={activeAdIdx} src={currentAd.image || '/placeholder-movie.jpg'} alt="Ad" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
      ) : (
        <div className="w-full bg-black/80 flex items-center justify-center">
          <div className="w-full max-w-4xl py-4 text-center text-white/90">Can add Ads, contact - 0xxx</div>
        </div>
      )}
    </div>
  )
}
