'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { moviesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// expandable text removed for compact movies grid
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Film, Star, Clock, Calendar, Search, Filter, ChevronLeft, ChevronRight, Tv } from 'lucide-react';
import Image from 'next/image'
import { isLikelyImageUrl } from '@/lib/imageUtils'
import Link from 'next/link';

interface Movie {
  _id: string;
  title: string;
  originalTitle?: string;
  type: 'movie' | 'series';
  year?: number;
  genre: string[];
  language: string;
  description?: string;
  posterUrl?: string;
  rating?: number;
  duration?: string;
  seasons?: number;
  episodes?: number;
  clickCount: number;
  isFeatured: boolean;
  slug: string;
  tags: string[];
  createdAt: string;
}

const MoviesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  
  // Available filter options
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Filters and Navigation
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'series'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const router = useRouter();
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const limit = 12;

  const fetchMovies = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: string;
        search?: string;
        type?: string;
        genre?: string;
        tag?: string;
      } = {
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
      };

      // Only add optional params if they have values
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      if (activeTab && activeTab !== 'all') params.type = activeTab;
      if (selectedGenre && selectedGenre !== 'all') params.genre = selectedGenre;
      if (selectedTag && selectedTag !== 'all') params.tag = selectedTag;
      
      console.log('fetchMovies called with filters:', {
        hasSearch: !!searchQuery,
        activeTab,
        selectedGenre,
        selectedTag,
        currentPage
      });

      console.log('Fetching movies with params:', params);
      const response = await moviesAPI.getMovies(params);
      console.log('Movies API response:', response);
      
      if (response && response.data) {
        setMovies(response.data);
        
        // Get pagination data from response (backend returns it in pagination object)
        const paginationData = response.pagination || {};
        const totalCount = paginationData.totalItems || response.total || response.data.length;
        const backendTotalPages = paginationData.totalPages || response.totalPages || Math.ceil(totalCount / limit);
        const currentPageFromResponse = paginationData.currentPage || response.currentPage || params.page;
        
        setCurrentPage(currentPageFromResponse);
        setTotalPages(backendTotalPages);
        setTotalMovies(totalCount);
        
        console.log('Pagination debug:', {
          responseStructure: Object.keys(response),
          paginationData,
          totalCount,
          backendTotalPages,
          currentPageFromResponse,
          dataLength: response.data.length
        });
      } else {
        console.warn('Invalid response structure:', response);
        setMovies([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalMovies(0);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      // Reset to safe defaults on error
      setMovies([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalMovies(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, activeTab, selectedGenre, selectedTag, sortBy, sortOrder, limit]);


  // Sync all filter parameters from URL on mount and when URL changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      // Get all parameters from URL
      const tagParam = params.get('tag') || 'all';
      const searchParam = params.get('search') || '';
      const genreParam = params.get('genre') || 'all';
      const typeParam = params.get('type') || 'all';
      const sortByParam = params.get('sortBy') || 'createdAt';
      const sortOrderParam = params.get('sortOrder') || 'desc';
      const pageParam = parseInt(params.get('page') || '1');
      
      // Update state with URL parameters
      let hasChanges = false;
      
      if (tagParam !== selectedTag) {
        setSelectedTag(tagParam);
        hasChanges = true;
      }
      if (searchParam !== searchQuery) {
        setSearchQuery(searchParam);
        hasChanges = true;
      }
      if (genreParam !== selectedGenre) {
        setSelectedGenre(genreParam);
        hasChanges = true;
      }
      if (typeParam !== activeTab) {
        setActiveTab(typeParam as 'all' | 'movie' | 'series');
        hasChanges = true;
      }
      if (sortByParam !== sortBy) {
        setSortBy(sortByParam);
        hasChanges = true;
      }
      if (sortOrderParam !== sortOrder) {
        setSortOrder(sortOrderParam);
        hasChanges = true;
      }
      if (pageParam !== currentPage) {
        setCurrentPage(pageParam);
        hasChanges = true;
      }
      
      // Only log if there were actual changes to avoid spam
      if (hasChanges) {
        console.log('URL params synced:', { tagParam, searchParam, genreParam, typeParam, sortByParam, sortOrderParam, pageParam });
      }
    }
    // eslint-disable-next-line
  }, [typeof window !== 'undefined' ? window.location.search : '']);

  useEffect(() => {
    console.log('Movies page: calling fetchMovies');
    fetchMovies();
  }, [fetchMovies, selectedTag]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Initial load on mount - force load all movies with pagination
  useEffect(() => {
    console.log('Movies page: Initial mount - loading all movies');
    const initialLoad = async () => {
      setLoading(true);
      try {
        // Force fetch all movies with explicit pagination
        const response = await moviesAPI.getMovies({
          page: 1,
          limit: 12,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        
        console.log('Initial load response:', response);
        
        if (response && response.data) {
          setMovies(response.data);
          setCurrentPage(1);
          
          // Ensure we have proper pagination data
          const totalCount = response.total || response.data.length;
          const calculatedPages = Math.ceil(totalCount / 12);
          
          // Force minimum pagination if we have content
          if (totalCount > 12) {
            setTotalPages(Math.max(calculatedPages, 2));
          } else {
            setTotalPages(1);
          }
          
          setTotalMovies(totalCount);
          
          console.log(`Initial load: ${response.data.length} movies, Total: ${totalCount}, Pages: ${calculatedPages}`);
        }
      } catch (error) {
        console.error('Initial load failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialLoad();
  }, []); // Only run once on mount

  // Fetch available filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [genresResponse, tagsResponse] = await Promise.all([
          moviesAPI.getGenres(),
          moviesAPI.getTags()
        ]);
        setAvailableGenres(genresResponse.data || []);
        setAvailableTags(tagsResponse.data || []);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Movie list click actions are handled on the detail page; per-card "Watch Now" removed.

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    
    // Update URL with current filter state, preserving all parameters
    updateURLParams({
      search: searchQuery,
      tag: selectedTag,
      genre: selectedGenre,
      type: activeTab,
      sortBy: sortBy,
      sortOrder: sortOrder,
      page: 1
    });
  };

  // Unified URL parameter update function
  const updateURLParams = (updates: {
    search?: string;
    tag?: string;
    genre?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(window.location.search);
    
    // Update or remove parameters based on updates object
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    
    // Always remove page if not explicitly set to preserve pagination
    if (!updates.page) {
      params.delete('page');
    }
    
    // Build the new URL
    const newURL = params.toString() ? `/movies?${params.toString()}` : '/movies';
    router.replace(newURL);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedGenre('all');
    setSelectedTag('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
    
    // Clear all URL parameters
    router.replace('/movies');
  };

  const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105">
      {/* Poster */}
      <Link href={`/smdrama/${movie._id}`} className="relative aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden block">
        {movie && isLikelyImageUrl(movie.posterUrl) ? (
          <Image
            src={movie.posterUrl!}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <Image src="/placeholder-movie.svg" alt={movie.title} fill className="object-cover" />
        )}
        {/* Type badge overlay (inside poster) */}
        <div className="absolute top-2 right-2">
          <Badge className="text-xs bg-black/70 text-white border-0">
            {movie.type === 'movie' ? 'Movie' : 'Series'}
          </Badge>
        </div>
      </Link>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/smdrama/${movie._id}`} className="block hover:text-blue-600 transition-colors">
              <CardTitle className="text-sm md:text-lg line-clamp-2">
                {movie.title}
              </CardTitle>
            </Link>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-xs text-muted-foreground mt-1">{movie.originalTitle}</p>
            )}
          </div>
          {/* badge moved into poster overlay to give title more space */}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Removed description to keep movies grid compact; details available on detail page */}
        <div className="mb-2">
          <div className="flex flex-wrap gap-1">
            {movie.genre.slice(0, 3).map((g) => (
              <Badge key={g} variant="outline" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
        </div>

          <div className="space-y-1 text-[11px] text-muted-foreground">
          {movie.year && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {movie.year}
            </div>
          )}
          
          {movie.rating && (
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1 text-yellow-500" />
              {movie.rating}/10
            </div>
          )}
          
          {movie.duration && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {movie.duration}
            </div>
          )}
          
          {movie.type === 'series' && movie.seasons && (
            <div className="flex items-center">
              <Film className="h-3 w-3 mr-1" />
              {movie.seasons} seasons
            </div>
          )}

          {/* Views removed from public listing */}
        </div>

        <div className="flex gap-2 mt-4">
          <Link href={`/smdrama/${movie._id}`}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    

    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="flex items-center gap-3">
                    <div className="w-28 h-28 relative overflow-hidden flex items-center justify-center">
                      <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold block">SMDrama</span>
                      
                    </div>
                  </Link>
      <div className="mb-4">
        
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
              
              // Update URL with all current filter parameters
              updateURLParams({
                search: searchQuery,
                tag: selectedTag,
                genre: selectedGenre,
                type: 'all',
                sortBy: sortBy,
                sortOrder: sortOrder,
                page: 1
              });
            }}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Film className="w-4 h-4" />
            All
          </button>
          <button
            onClick={() => {
              setActiveTab('movie');
              setCurrentPage(1);
              
              // Update URL with all current filter parameters
              updateURLParams({
                search: searchQuery,
                tag: selectedTag,
                genre: selectedGenre,
                type: 'movie',
                sortBy: sortBy,
                sortOrder: sortOrder,
                page: 1
              });
            }}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'movie'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Film className="w-4 h-4" />
            Movies
          </button>
          <button
            onClick={() => {
              setActiveTab('series');
              setCurrentPage(1);
              
              // Update URL with all current filter parameters
              updateURLParams({
                search: searchQuery,
                tag: selectedTag,
                genre: selectedGenre,
                type: 'series',
                sortBy: sortBy,
                sortOrder: sortOrder,
                page: 1
              });
            }}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'series'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Tv className="w-4 h-4" />
            Series
          </button>
        </div>
        
        {/* Results count */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              'Loading...'
            ) : (
              <>
                Showing {totalMovies} {activeTab === 'movie' ? 'movies' : activeTab === 'series' ? 'series' : 'results'}
                {activeTab === 'all' && ' (movies & series)'}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className=" rounded-lg shadow-sm border p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search movies and series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit">Search</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={selectedGenre} onValueChange={(val) => {
              setSelectedGenre(val);
              setCurrentPage(1);
              
              // Update URL with all current filter parameters
              updateURLParams({
                search: searchQuery,
                tag: selectedTag,
                genre: val,
                type: activeTab,
                sortBy: sortBy,
                sortOrder: sortOrder,
                page: 1
              });
            }}>
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Genre" className="text-black placeholder:text-muted-foreground" />
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

            <Select value={selectedTag} onValueChange={(val) => {
              if (!val || val === '') return; // Prevent setting empty tag
              setSelectedTag(val);
              setCurrentPage(1);
              
              // Update URL with all current filter parameters
              updateURLParams({
                search: searchQuery,
                tag: val,
                genre: selectedGenre,
                type: activeTab,
                sortBy: sortBy,
                sortOrder: sortOrder,
                page: 1
              });
            }}>
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Tag" className="text-black placeholder:text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(val) => {
              setSortBy(val);
              setCurrentPage(1);
              
              // Update URL with all current filter parameters
              updateURLParams({
                search: searchQuery,
                tag: selectedTag,
                genre: selectedGenre,
                type: activeTab,
                sortBy: val,
                sortOrder: sortOrder,
                page: 1
              });
            }}>
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Sort by" className="text-black placeholder:text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="clickCount">Popularity</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(val) => {
              setSortOrder(val);
              setCurrentPage(1);
              
              // Update URL with all current filter parameters
              updateURLParams({
                search: searchQuery,
                tag: selectedTag,
                genre: selectedGenre,
                type: activeTab,
                sortBy: sortBy,
                sortOrder: val,
                page: 1
              });
            }}>
              <SelectTrigger className="text-foreground">
                <SelectValue placeholder="Order" className="text-black placeholder:text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <p className="text-sm text-muted-foreground">
              {totalMovies} total results
            </p>
          </div>
        </form>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-56 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16">
          <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No movies found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button onClick={resetFilters}>Reset Filters</Button>
        </div>
      ) : (
        <>
          {/* Results info */}
          <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
            <span>
              Showing {movies.length} of {totalMovies} results
              {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </span>
            {totalPages > 1 && (
              <span>
                {limit} per page
              </span>
            )}
          </div>

          <div className="grid gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>

          {/* Pagination - Always show if there are multiple pages */}
          {totalPages > 1 && (
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(currentPage - 1, 1);
                    setCurrentPage(newPage);
                    updateURLParams({
                      search: searchQuery,
                      tag: selectedTag,
                      genre: selectedGenre,
                      type: activeTab,
                      sortBy: sortBy,
                      sortOrder: sortOrder,
                      page: newPage
                    });
                  }}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => {
                    const page = i + 1;
                    // Show first page, last page, current page, and 2 pages around current
                    const shouldShow = 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 2;
                    
                    if (!shouldShow) {
                      // Show ellipsis if there's a gap
                      if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="px-2 text-muted-foreground">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(page);
                          updateURLParams({
                            search: searchQuery,
                            tag: selectedTag,
                            genre: selectedGenre,
                            type: activeTab,
                            sortBy: sortBy,
                            sortOrder: sortOrder,
                            page: page
                          });
                        }}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(currentPage + 1, totalPages);
                    setCurrentPage(newPage);
                    updateURLParams({
                      search: searchQuery,
                      tag: selectedTag,
                      genre: selectedGenre,
                      type: activeTab,
                      sortBy: sortBy,
                      sortOrder: sortOrder,
                      page: newPage
                    });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              {/* Page info */}
              <div className="text-center text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {totalMovies} total items
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default MoviesPage;
