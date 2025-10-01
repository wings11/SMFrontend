'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
// Carousel removed: featured layout now uses grouped rows of 3
import { ExpandableText } from '@/components/ui/expandable-text'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { Star, Calendar, Clock, Play, TrendingUp, Search, Film, Tv, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { isLikelyImageUrl } from '@/lib/imageUtils'
import { moviesAPI } from '@/lib/api'

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
}

const MovieCard = ({ movie, featured = false }: { movie: Movie; featured?: boolean }) => {
  const handleWatchClick = async () => {
    try {
      // Open a blank window synchronously to ensure mobile/Safari treat this as a user-initiated navigation
      const win = window.open('', '_blank')
      const response = await moviesAPI.clickMovie(movie._id)
      if (response.success && response.telegramLink) {
        if (win) {
          // navigate the pre-opened window to the telegram link
          win.location.href = response.telegramLink
        } else {
          // fallback if the window failed to open
          window.location.href = response.telegramLink
        }
      } else {
        // Close the blank window if no link returned
        if (win) win.close()
      }
    } catch (error) {
      console.error('Error getting telegram link:', error)
    }
  }

  if (featured) {
    return (
      <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col md:flex-row min-h-[180px] md:min-h-[140px]">
          {/* Poster Image */}
          <div className="relative w-full md:w-32 lg:w-40 flex-shrink-0">
            <div className="aspect-[2/3] md:h-full relative">
              {isLikelyImageUrl(movie.posterUrl) ? (
                <Image
                  src={movie.posterUrl as string}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 224px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <div className="text-center text-gray-400 dark:text-gray-600">
                    {movie.type === 'movie' ? (
                      <Film className="w-12 h-12 mx-auto mb-2" />
                    ) : (
                      <Tv className="w-12 h-12 mx-auto mb-2" />
                    )}
                    <p className="text-sm">No Poster</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <Badge 
                variant={movie.type === 'movie' ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {movie.type === 'movie' ? <Film className="w-3 h-3 mr-1" /> : <Tv className="w-3 h-3 mr-1" />}
                {movie.type === 'movie' ? 'Movie' : 'Series'}
              </Badge>
            </div>
            
            {/* Featured Badge */}
            <div className="absolute top-3 right-3">
              <Badge className="text-xs bg-[#176DA6] text-white border-0">
                ⭐ Featured
              </Badge>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-2 md:p-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Title */}
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {movie.title}
              </h3>
              
              {/* Rating and Year */}
              <div className="flex items-center gap-4 text-sm">
                {movie.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">{movie.rating}</span>
                  </div>
                )}
                {movie.year && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {movie.year}
                  </div>
                )}
                {movie.duration && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {movie.duration}
                  </div>
                )}
                {/* Views removed from public UI */}
              </div>
              
              {/* Description */}
              <ExpandableText
                text={movie.description}
                maxLines={2}
                className="text-gray-700 dark:text-gray-300 text-xs md:text-sm"
              />
              
              {/* Tags/Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.genre.slice(0, 4).map((g) => (
                  <Badge key={g} variant="outline" className="text-xs">
                    {g}
                  </Badge>
                ))}
                {movie.genre.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{movie.genre.length - 4}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Watch Button */}
            <div className="mt-2 flex gap-2">
                <Button 
                  onClick={handleWatchClick}
                  className="flex-1 bg-gradient-to-r from-[#176DA6] to-[#135685] hover:from-[#135685] hover:to-[#0f4664] text-white border-0 shadow-lg"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-1 fill-white" />
                  Watch Now
                </Button>
                <Link href={`/movie/${movie._id}`}>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    View Details
                  </Button>
                </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col">
      {/* Poster Image (clickable, no hover overlay) */}
      <Link href={`/movie/${movie._id}`}> 
        <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 cursor-pointer">
          {movie.posterUrl ? (
            <Image
              src={isLikelyImageUrl(movie.posterUrl) ? movie.posterUrl! : '/placeholder-movie.svg'}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400 dark:text-gray-600">
                {movie.type === 'movie' ? (
                  <Film className="w-12 h-12 mx-auto mb-2" />
                ) : (
                  <Tv className="w-12 h-12 mx-auto mb-2" />
                )}
                <p className="text-sm">No Poster</p>
              </div>
            </div>
          )}
          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge 
              variant={movie.type === 'movie' ? 'default' : 'secondary'} 
              className="text-xs bg-black/70 backdrop-blur-sm text-white border-0"
            >
              {movie.type === 'movie' ? 'Movie' : 'Series'}
            </Badge>
            {movie.isFeatured && (
              <Badge className="text-xs bg-[#176DA6]/90 backdrop-blur-sm text-white border-0">
                Featured
              </Badge>
            )}
          </div>
          {movie.rating && (
            <div className="absolute top-2 right-2">
              <Badge className="text-xs bg-yellow-500/90 backdrop-blur-sm text-white border-0">
                <Star className="w-3 h-3 mr-1 fill-white" />
                {movie.rating}
              </Badge>
            </div>
          )}
        </div>
      </Link>
      {/* Content */}
      <CardContent className="p-3 flex-1">
        <Link href={`/movie/${movie._id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">
            {movie.title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          {movie.year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {movie.year}
            </span>
          )}
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {movie.clickCount.toLocaleString()}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {movie.genre.slice(0, 2).map((g) => (
            <Badge key={g} variant="outline" className="text-xs px-1 py-0">
              {g}
            </Badge>
          ))}
          {movie.genre.length > 2 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              +{movie.genre.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const LoadingSkeleton = () => (
  <Card className="overflow-hidden h-full flex flex-col">
    {/* Poster skeleton */}
    <Skeleton className="aspect-[2/3] w-full" />
    
    {/* Content skeleton */}
  <CardContent className="p-3 space-y-2 flex-1">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-12" />
      </div>
    </CardContent>
  </Card>
)

const FeaturedSkeleton = () => (
  <div className="relative overflow-hidden rounded-2xl">
    <Skeleton className="w-full h-[280px] md:h-[320px]" />
    <div className="absolute bottom-6 left-6 right-6 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-8 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
)

export default function HomePage() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [recentMovies, setRecentMovies] = useState<Movie[]>([])
  const [tagPool, setTagPool] = useState<Movie[]>([])
  // ad banner moved to TopBanner in the global layout
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching data from API...')

        const [featured, recent, pool] = await Promise.all([
          moviesAPI.getFeatured(8),
          moviesAPI.getMovies({ limit: 12, sortBy: 'lastEpisodeAt', sortOrder: 'desc' }),
          moviesAPI.getMovies({ limit: 60, sortBy: 'createdAt', sortOrder: 'desc' })
        ])

        console.log('Featured movies response:', featured)
        console.log('Recent movies response:', recent)

  setFeaturedMovies(featured.data || [])
  setRecentMovies(recent.data || [])
  setTagPool(pool.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        // Set empty arrays on error to avoid undefined issues
        setFeaturedMovies([])
        setRecentMovies([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // TopBanner component in layout handles ad rotation globally

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/movies?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      
      {/* Featured Hero Section (neutral background) */}
      <section className="relative overflow-hidden bg-transparent">
        <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
          {/* Header (logo + search). Ads moved to sticky banner above */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-gray-900 dark:text-white mb-8 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-28 h-28 relative overflow-hidden flex items-center justify-center">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div>
                <span className="text-lg font-semibold block">SMDrama</span>
                
              </div>
            </Link>

            {/* Search Bar (small screens below the logo) */}
            <form onSubmit={handleSearch} className="w-full sm:w-auto max-w-md mx-auto sm:mx-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/10 dark:bg-white/10 backdrop-blur-sm border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/70 rounded-full"
                />
                <Button 
                  type="submit" 
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black hover:bg-gray-100 rounded-full"
                >
                  <Search className="w-4 h-4 text-black dark:text-white" />
                </Button>
              </div>
            </form>
          </div>

          {/* Featured content - render with the same grid sizing as Recently Added */}
          {featuredMovies.length > 0 && (
            <section className="my-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"><Star className="w-5 h-5 mr-2 inline animate-bounce" />Featured</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Top picks for you</p>
                </div>
                <Link href="/movies?featured=true">
                  <Button variant="outline" className="hidden sm:flex">
                    View All
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Mobile horizontal scroll (compact) */}
              <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 flex gap-3 items-stretch sm:hidden">
                {featuredMovies.map((movie) => (
                  <div key={movie._id} className="snap-start w-1/2 flex-shrink-0 h-full">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>

              {/* Desktop grid for larger screens */}
              <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} />)
                ) : (
                  featuredMovies.map((movie) => <MovieCard key={movie._id} movie={movie} />)
                )}
              </div>
            </section>
          )}
          
          {loading && (
            <div className="max-w-6xl mx-auto">
              <FeaturedSkeleton />
            </div>
          )}
          
          {/* Quick Access Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/movies">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 w-full sm:w-auto border-2 border-[#176DA6] dark:border-[#176DA6]"
              >
                <Film className="w-5 h-5 mr-2" />
                Browse All Movies & Series
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-12">
        
        {/* More Featured Content */}
        {featuredMovies.length > 5 && (
          <section>
            <div className="flex items-center justify-between mb-6">
                <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  <Star className="w-5 h-5 mr-2 inline animate-pulse" />More Featured
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Editor&apos;s choice movies and series
                </p>
              </div>
              <Link href="/movies?featured=true">
                <Button variant="outline" className="hidden sm:flex">
                  View All
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} />)
              ) : (
                featuredMovies.slice(5).map((movie) => <MovieCard key={movie._id} movie={movie} />)
              )}
            </div>
            
            <div className="text-center mt-6 sm:hidden">
              <Link href="/movies?featured=true">
                <Button variant="outline">
                  View All Featured
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* Trending Now removed per request */}

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <Plus className="w-5 h-5 mr-2 inline animate-bounce" />Recently Added
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Fresh content just uploaded
              </p>
            </div>
            <Link href="/movies?sortBy=createdAt&sortOrder=desc">
              <Button variant="outline" className="hidden sm:flex">
                View All
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <LoadingSkeleton key={i} />)
            ) : (
              recentMovies.map((movie) => <MovieCard key={movie._id} movie={movie} />)
            )}
          </div>
          <div className="text-center mt-6 sm:hidden">
            <Link href="/movies?sortBy=createdAt&sortOrder=desc">
              <Button variant="outline">
                View All Recent
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          {/* Inline Ad Box (not sticky) */}
          <div className="w-full flex justify-center mt-8">
            <div className="w-full max-w-5xl">
              <Image 
                src="/ads/sponsor-placeholder.svg" 
                alt="Sponsor Ad" 
                width={1200} 
                height={180} 
                className="rounded-xl object-cover w-full h-auto"
                priority={false}
                unoptimized
              />
            </div>
          </div>
        </section>
      </div>

      {/* Tag-based sections under Recently Added */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        {(() => {
          const TAGS = ['movie', 'korea drama', 'BL', 'thai series', 'western series', 'variety show']
          return TAGS.map((tag) => {
            const items = tagPool.filter((m) => Array.isArray(m.tags) && m.tags.includes(tag)).slice(0, 6)
            if (items.length === 0) return null
            return (
              <section key={tag}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{tag.charAt(0).toUpperCase() + tag.slice(1)}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{`Latest ${tag} content`}</p>
                  </div>
                  <Link href={`/movies?search=${encodeURIComponent(tag)}`}>
                    <Button variant="outline" className="hidden sm:flex">
                      View All
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {items.map((movie) => (
                    <MovieCard key={movie._id} movie={movie} />
                  ))}
                </div>
              </section>
            )
          })
        })()}
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}
