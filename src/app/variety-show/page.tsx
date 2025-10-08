'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Film, Search, Calendar, Star, ChevronLeft, ChevronRight, Tv } from 'lucide-react'
import Link from 'next/link'
import { MovieImage } from '@/components/ui/movie-image'
import { moviesAPI } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'

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
  updatedAt: string
  lastEpisodeAt?: string
  slug: string
  posterUrl?: string
  trailerUrl?: string
  backdropUrl?: string
}

const MovieCard = ({ movie }: { movie: Movie }) => {
  return (
    <Card className="movie-card group hover:shadow-xl transition-all duration-300 border-0 bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col">
      <Link href={`/smdrama/${movie._id}`}>
        <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 cursor-pointer">
          <MovieImage
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
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
      
      <CardContent className="p-3 flex-1">
        <Link href={`/smdrama/${movie._id}`} className="block group-hover:text-blue-600 transition-colors">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">
            {movie.title}
          </h3>
        </Link>
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          {movie.year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {movie.year}
            </span>
          )}
          {movie.type === 'series' && movie.episodes && (
            <span className="ml-2 flex items-center gap-1">
              <Film className="w-3 h-3" />
              {movie.episodes} eps
            </span>
          )}
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
    <Skeleton className="aspect-[2/3] w-full" />
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

const ITEMS_PER_PAGE = 24

function VarietyShowPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Available genres (will be populated from API data)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  // Initialize filters from URL parameters
  useEffect(() => {
    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || 'all'
    const sort = searchParams.get('sortBy') || 'createdAt'
    const order = searchParams.get('sortOrder') || 'desc'
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')

    setSearchQuery(search)
    setSelectedGenre(genre)
    setSortBy(sort)
    setSortOrder(order as 'asc' | 'desc')
    setTypeFilter(type)
    setCurrentPage(page)
  }, [searchParams])

  // Fetch movies with filters
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        
        const filters = {
          search: searchQuery || undefined,
          genre: selectedGenre !== 'all' ? selectedGenre : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          tag: 'variety show', // Filter specifically for variety show tag
          sortBy,
          sortOrder,
          page: currentPage,
          limit: ITEMS_PER_PAGE
        }

        const response = await moviesAPI.getMovies(filters)
        setMovies(response.data || [])
        setTotalCount(response.total || 0)

        // Extract unique genres for filter options
        if (response.data) {
          const genres = [...new Set(response.data.flatMap((m: Movie) => m.genre))].sort() as string[]
          setAvailableGenres(genres)
        }
      } catch (error) {
        console.error('Error fetching movies:', error)
        setMovies([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [searchQuery, selectedGenre, sortBy, sortOrder, typeFilter, currentPage])

  // Update URL parameters when filters change
  const updateURLParams = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || (typeof value === 'string' && value === 'all')) {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })

    router.push(`/variety-show?${params.toString()}`, { scroll: false })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    updateURLParams({ search: searchQuery, page: undefined })
  }

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
    updateURLParams({ genre, page: undefined })
  }

  const handleTypeChange = (type: string) => {
    setTypeFilter(type)
    setCurrentPage(1)
    updateURLParams({ type, page: undefined })
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURLParams({ page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const delta = 2
      const pages: (number | string)[] = []
      
      // Always show first page
      pages.push(1)
      
      // Calculate range around current page
      const start = Math.max(2, currentPage - delta)
      const end = Math.min(totalPages - 1, currentPage + delta)
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...')
      }
      
      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...')
      }
      
      // Always show last page (if more than 1 page)
      if (totalPages > 1) {
        pages.push(totalPages)
      }
      
      return pages
    }

    const pageNumbers = getPageNumbers()

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={index} className="px-2 py-1 text-gray-500">...</span>
            ) : (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-28 h-28 relative overflow-hidden flex items-center justify-center">
            <MovieImage src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <span className="text-lg font-semibold block">SMDrama</span>
          </div>
        </Link>
        <div className="mb-4">
        </div>

        {/* Header */}
        <div className="mb-8">
          
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Variety Show</h1>
             
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search variety shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Type Filter */}
            <Tabs value={typeFilter} onValueChange={handleTypeChange} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="movie">Movies</TabsTrigger>
                <TabsTrigger value="series">Series</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Genre Filter */}
            <Select value={selectedGenre} onValueChange={handleGenreChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            {/* <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Recently Added</SelectItem>
                <SelectItem value="lastEpisodeAt">Latest Updates</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="year">Release Year</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="clickCount">Most Popular</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>

        {/* Results Info */}
        {/* {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {totalCount} variety {totalCount === 1 ? 'show' : 'shows'}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )} */}

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="text-center py-16">
            <Tv className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No variety shows found
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No variety shows match "${searchQuery}". Try different search terms.`
                : 'No variety shows available with the selected filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VarietyShowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-black flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <VarietyShowPageContent />
    </Suspense>
  )
}