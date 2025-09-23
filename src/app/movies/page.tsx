'use client';

import React, { useState, useEffect } from 'react';
import { moviesAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpandableText } from '@/components/ui/expandable-text';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { Film, Star, Clock, Calendar, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, Tv, Play } from 'lucide-react';
import Image from 'next/image'
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

      if (searchQuery) params.search = searchQuery;
      if (activeTab !== 'all') params.type = activeTab;
      if (selectedGenre !== 'all') params.genre = selectedGenre;
      if (selectedTag !== 'all') params.tag = selectedTag;

      const response = await moviesAPI.getMovies(params);
      setMovies(response.data);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setTotalMovies(response.total);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, activeTab, selectedGenre, selectedTag, sortBy, sortOrder, limit]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

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

  const handleMovieClick = async (movieId: string) => {
    try {
      const response = await moviesAPI.clickMovie(movieId);
      window.open(response.telegramLink, '_blank');
      
      // Update the movie's click count in the local state
      setMovies(prev => prev.map(movie => 
        movie._id === movieId 
          ? { ...movie, clickCount: movie.clickCount + 1 }
          : movie
      ));
    } catch (error) {
      console.error('Error clicking movie:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMovies();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedGenre('all');
    setSelectedTag('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const MovieCard: React.FC<{ movie: Movie }> = ({ movie }) => (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/movie/${movie._id}`} className="block hover:text-blue-600 transition-colors">
              <CardTitle className="text-lg line-clamp-2">
                {movie.title}
              </CardTitle>
            </Link>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-sm text-muted-foreground mt-1">{movie.originalTitle}</p>
            )}
          </div>
          <Badge variant={movie.type === 'movie' ? 'default' : 'secondary'}>
            {movie.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          {movie.description && (
            <ExpandableText
              text={movie.description}
              maxLines={2}
              className="text-sm text-muted-foreground"
              variant="compact"
            />
          )}
          
          <div className="flex flex-wrap gap-1">
            {movie.genre.slice(0, 3).map((g) => (
              <Badge key={g} variant="outline" className="text-xs">
                {g}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
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

          <div className="flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            {movie.clickCount.toLocaleString()} views
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            className="flex-1"
            onClick={() => handleMovieClick(movie._id)}
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Now
          </Button>
          <Link href={`/movie/${movie._id}`}>
            <Button variant="outline" size="sm">
              Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    

    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3">
                    <div className="w-28 h-28 relative overflow-hidden flex items-center justify-center">
                      <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold block">SMDrama</span>
                      
                    </div>
                  </div>
      <div className="mb-4">
        
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
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
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
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
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Genre" />
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

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue placeholder="Tag" />
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="clickCount">Popularity</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Order" />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
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
