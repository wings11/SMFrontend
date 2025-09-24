'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableText } from '@/components/ui/expandable-text'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { 
  Star, 
  Calendar, 
  Clock, 
  Play, 
  TrendingUp, 
  Film, 
  Tv, 
  ArrowLeft,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { isLikelyImageUrl } from '@/lib/imageUtils'
import { moviesAPI } from '@/lib/api'

// Client-only Comments component (UI only, no backend integration yet)
const Comments = ({ movieId }: { movieId: string }) => {
  const [comments, setComments] = useState<Array<{ id: string; name: string; text: string }>>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')

  // Load example comments for testing
  useEffect(() => {
    setComments([
      { id: '1', name: 'Tester A', text: 'Nice upload! Thanks.' },
      { id: '2', name: 'Tester B', text: 'Looking forward to more translations.' }
    ])
  }, [movieId])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !text.trim()) return
    setComments(prev => [{ id: Date.now().toString(), name: name.trim(), text: text.trim() }, ...prev])
    setName('')
    setText('')
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-4">
        <div className="flex gap-2">
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 border rounded px-3 py-2" />
          <button className="bg-black text-white px-4 rounded">Add</button>
        </div>
        <textarea placeholder="Write a comment..." value={text} onChange={(e) => setText(e.target.value)} className="w-full mt-2 border rounded p-2 h-24" />
      </form>

      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="border rounded p-3">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-gray-600">{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface Movie {
  _id: string
  title: string
  originalTitle?: string
  type: 'movie' | 'series'
  year?: number
  genre: string[]
  language: string
  description: string
  rating?: number
  duration?: string
  seasons?: number
  episodes?: number
  clickCount: number
  isFeatured: boolean
  tags: string[]
  createdAt: string
  slug: string
  posterUrl?: string
  trailerUrl?: string
  backdropUrl?: string
  telegramLink?: string
}

interface Episode {
  _id: string
  season?: number
  episodeNumber: number
  title?: string
  thumbnailUrl?: string
  duration?: number
  watchUrl?: string
  clickCount?: number
}

const MovieDetailPage = () => {
  const params = useParams()
  const movieId = params.id as string

  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)

  // Fetch movie details by ID
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await moviesAPI.getMovie(movieId)
        setMovie(response.data)
      } catch (err) {
        console.error('Error fetching movie:', err)
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }

    if (movieId) {
      fetchMovie()
    }
  }, [movieId])

  useEffect(() => {
  const fetchEpisodes = async () => {
      if (!movie || movie.type !== 'series') return
      setEpisodesLoading(true)
      setEpisodes([])

      // Try axios helper
      try {
        // moviesAPI helper uses the internal axios instance. We can't rely on a typed baseURL prop here,
        // so avoid accessing it directly. The fallback below will import the axios instance for diagnostics if needed.
        console.debug('[MovieDetail] Attempting to load episodes via moviesAPI.getEpisodes')
        const res = await moviesAPI.getEpisodes(movie._id)
        if (res && res.success) {
          setEpisodes(res.data || [])
          setEpisodesLoading(false)
          return
        }
      } catch (errUnknown: unknown) {
        // Narrow unknown to see if it's an Error-like object or our axios wrapper
        const err = errUnknown as { serverMessage?: string; message?: string }
        console.warn('[MovieDetail] moviesAPI.getEpisodes failed', err.serverMessage ?? err.message ?? errUnknown)
      }

      // Fallback: absolute fetch to the configured API base URL (helps if NEXT_PUBLIC_API_URL missing)
      try {
        const apiBase = (await import('@/lib/api')).default.defaults.baseURL || 'http://localhost:5000/api'
        console.debug('[MovieDetail] Falling back to absolute fetch for episodes', { apiBase })
        const resp = await fetch(`${apiBase}/movies/${movie._id}/episodes`)
        const json = await resp.json()
        if (json && json.success) {
          setEpisodes(json.data || [])
        } else {
          console.warn('[MovieDetail] fallback fetch returned no episodes or unsuccessful response', json)
        }
      } catch (err) {
        console.error('[MovieDetail] fallback fetch failed', err)
      } finally {
        setEpisodesLoading(false)
      }
    }

    fetchEpisodes()
    }, [movie])

    // Helper to determine trailer type and embed URL
    const getYouTubeEmbed = (url: string) => {
      try {
        // Examples: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
        const ytMatch = url.match(/(?:v=|youtu\.be\/)\s*([A-Za-z0-9_-]{6,})/)
        if (ytMatch && ytMatch[1]) {
          return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
        }
      } catch {
        // ignore
      }
      return null
    }

    const renderTrailer = (url?: string | null) => {
      if (!url) return null

      const ytEmbed = getYouTubeEmbed(url)
      const isMp4 = url.match(/\.mp4(\?|$)/i)

      if (ytEmbed) {
        return (
          <div className="w-full rounded overflow-hidden">
            <div className="w-full aspect-video bg-black">
              <iframe
                src={ytEmbed}
                title="Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )
      }

      if (isMp4) {
        return (
          <div className="w-full rounded overflow-hidden bg-black">
            <video controls className="w-full h-auto" preload="metadata">
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )
      }

      // Fallback: show a link to open the trailer in a new tab
      return (
        <div>
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
            Open trailer in a new tab
          </a>
        </div>
      )
    }

  const handleWatchClick = async () => {
    if (!movie) return
    
    try {
      // Open a blank window synchronously so mobile/Safari treat navigation as user-initiated
      const win = window.open('', '_blank')
      const response = await moviesAPI.clickMovie(movie._id)
      if (response.success && response.telegramLink) {
        if (win) {
          win.location.href = response.telegramLink
        } else {
          window.location.href = response.telegramLink
        }
        // Update click count locally
        setMovie(prev => prev ? { ...prev, clickCount: prev.clickCount + 1 } : null)
      } else {
        if (win) win.close()
      }
    } catch (error) {
      console.error('Error getting telegram link:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie?.title,
          text: movie?.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        
        <div className="container mx-auto px-4 py-8">
          
          {/* Back button skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster skeleton */}
            <div className="lg:col-span-1">
              <Skeleton className="w-full aspect-[2/3] rounded-lg" />
            </div>
            
            {/* Content skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
              
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Film className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error || 'Movie not found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The movie you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/movies">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Movies
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section with Backdrop */}
      {movie.backdropUrl && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <Image
            src={movie.backdropUrl}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Back button overlay */}
          <div className="absolute top-6 left-6">
            <Link href="/movies">
              <Button variant="secondary" size="sm" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Back button (if no backdrop) */}

        <Link href="/" className="flex items-center gap-3">
                            <div className="w-28 h-28 relative overflow-hidden flex items-center justify-center">
                              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                            </div>
                            <div>
                              <span className="text-lg font-semibold block">SMDrama</span>
                              
                            </div>
                          </Link>
        {!movie.backdropUrl && (
          <div className="mb-6">
            <Link href="/movies">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Movies
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Poster Section */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                {movie.posterUrl && isLikelyImageUrl(movie.posterUrl) ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400 dark:text-gray-600">
                      {movie.type === 'movie' ? (
                        <Film className="w-16 h-16 mx-auto mb-4" />
                      ) : (
                        <Tv className="w-16 h-16 mx-auto mb-4" />
                      )}
                      <p>No Poster Available</p>
                    </div>
                  </div>
                )}
                
                {/* Featured badge */}
                {movie.isFeatured && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-red-500 text-white border-0">
                        <Star className="w-4 h-4 mr-1 inline animate-pulse" /> Featured
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="mt-4 space-y-3">
              <Button onClick={handleWatchClick} className="w-full bg-red-600 hover:bg-red-700 text-white" size="lg">
                <Play className="w-5 h-5 mr-2 fill-white" />
                Watch Now
              </Button>
              
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="w-full" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {movie.title}
                </h1>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Original: {movie.originalTitle}
                  </p>
                )}
              </div>

              {/* Type and Rating */}
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant={movie.type === 'movie' ? 'default' : 'secondary'} className="text-sm">
                  {movie.type === 'movie' ? (
                    <>
                      <Film className="w-4 h-4 mr-1" />
                      Movie
                    </>
                  ) : (
                    <>
                      <Tv className="w-4 h-4 mr-1" />
                      Series
                    </>
                  )}
                </Badge>
                
                {movie.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg text-yellow-600 dark:text-yellow-400">
                      {movie.rating}/10
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  {movie.clickCount.toLocaleString()} views
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                {movie.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {movie.year}
                  </div>
                )}
                
                {movie.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {movie.duration}
                  </div>
                )}
                
                {movie.type === 'series' && movie.seasons && (
                  <div className="flex items-center gap-1">
                    <Tv className="w-4 h-4" />
                    {movie.seasons} season{movie.seasons > 1 ? 's' : ''}
                    {movie.episodes && ` • ${movie.episodes} episodes`}
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.genre.map((g) => (
                  <Badge key={g} variant="outline">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Trailer */}
            {movie.trailerUrl && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Trailer</h2>
                </CardHeader>
                <CardContent>
                  {renderTrailer(movie.trailerUrl)}
                </CardContent>
              </Card>
            )}

              {/* Episodes list for series */}
              {movie.type === 'series' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Episodes</h2>
                  </CardHeader>
                  <CardContent>
                    {episodesLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : episodes.length === 0 ? (
                      <p className="text-sm text-gray-600">No episodes available.</p>
                    ) : (
                      <div className="space-y-3">
                        {episodes.map(ep => (
                          <div key={ep._id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{ep.title || `Season ${ep.season} • Episode ${ep.episodeNumber}`}</div>
                                  {ep.duration && <div className="text-sm text-gray-600">{Math.floor(ep.duration/60)}m {ep.duration%60}s</div>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="bg-red-600 text-white" onClick={async () => {
                                    try {
                                      // Open blank window synchronously to satisfy mobile browsers
                                      const win = window.open('', '_blank')
                                      const { default: api } = await import('@/lib/api')
                                      const resp = await api.post(`/episodes/${ep._id}/click`)
                                      const j = resp.data
                                      if (j && j.watchUrl) {
                                        const watchUrl = j.watchUrl
                                        if (win) {
                                          win.location.href = watchUrl
                                        } else {
                                          window.location.href = watchUrl
                                        }
                                        // update local episode click count
                                        setEpisodes(prev => prev.map(p => p._id === ep._id ? { ...p, clickCount: (p.clickCount||0)+1 } : p))
                                        // also increment parent movie click count locally so UI updates immediately
                                        setMovie(prev => prev ? { ...prev, clickCount: (prev.clickCount||0) + 1 } : prev)
                                      } else {
                                        console.warn('Episode click endpoint returned no watchUrl', j)
                                        if (win) win.close()
                                      }
                                    } catch (err) {
                                      console.error('Error getting episode link', err)
                                    }
                                  }}>
                                    <Play className="w-4 h-4 mr-1" />
                                    Watch
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Description */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Overview</h2>
              </CardHeader>
              <CardContent>
                <ExpandableText
                  text={movie.description}
                  maxLines={4}
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                />
              </CardContent>
            </Card>

            {/* Tags */}
            {movie.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Tags</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {movie.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Additional Information</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Added:</span>
                    <span className="ml-2">{new Date(movie.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="ml-2 capitalize">{movie.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Total Views:</span>
                    <span className="ml-2">{movie.clickCount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments (client-only, UI-only for now) */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Comments (Test)</h2>
              </CardHeader>
              <CardContent>
                <Comments movieId={movie._id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}

export default MovieDetailPage
