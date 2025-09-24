// Movie data fetching service
import axios from 'axios';

// You'll need to get API keys for these services
const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY || '';
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

interface MovieDetails {
  title: string;
  year?: number;
  genre: string[];
  description: string;
  imdbRating?: number;
  tmdbRating?: number;
  rottenTomatoesRating?: number;
  metacriticRating?: number;
  type: 'movie' | 'series';
  seasons?: number;
  poster?: string;
  posterUrl?: string;
  trailerUrl?: string;
  backdropUrl?: string;
  tags: string[];
}

interface Genre {
  id: number;
  name: string;
}

interface Rating {
  Source: string;
  Value: string;
}

interface Video {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

class MovieFetchService {
  // Extract ID from various URL formats
  private extractMovieId(url: string): { source: string; id: string } | null {
    // IMDb URLs
    const imdbMatch = url.match(/imdb\.com\/title\/(tt\d+)/);
    if (imdbMatch) {
      return { source: 'imdb', id: imdbMatch[1] };
    }

    // TMDB URLs
    const tmdbMovieMatch = url.match(/themoviedb\.org\/movie\/(\d+)/);
    if (tmdbMovieMatch) {
      return { source: 'tmdb_movie', id: tmdbMovieMatch[1] };
    }

    const tmdbTvMatch = url.match(/themoviedb\.org\/tv\/(\d+)/);
    if (tmdbTvMatch) {
      return { source: 'tmdb_tv', id: tmdbTvMatch[1] };
    }

    return null;
  }

  // Extract Rotten Tomatoes rating from OMDb ratings array
  private extractRottenTomatoesRating(ratings: Rating[]): number | undefined {
    if (!ratings) return undefined;
    const rtRating = ratings.find(r => r.Source === 'Rotten Tomatoes');
    if (!rtRating) return undefined;
    const percentage = rtRating.Value.match(/(\d+)%/);
    return percentage ? parseInt(percentage[1]) : undefined;
  }

  // Fetch from OMDb (using IMDb ID)
  private async fetchFromOMDb(imdbId: string): Promise<MovieDetails | null> {
    if (!OMDB_API_KEY) {
      // Demo data for testing without API key
      return this.getDemoData(imdbId);
    }

    try {
  const response = await axios.get(`https://www.omdbapi.com/`, {
        params: {
          apikey: OMDB_API_KEY,
          i: imdbId,
          plot: 'full'
        }
      });

      const data = response.data;
      if (data.Response === 'False') return null;

      return {
        title: data.Title,
        year: parseInt(data.Year),
        genre: data.Genre ? data.Genre.split(', ') : [],
        description: data.Plot || '',
        imdbRating: parseFloat(data.imdbRating) || 0,
        rottenTomatoesRating: this.extractRottenTomatoesRating(data.Ratings),
        metacriticRating: data.Metascore ? parseFloat(data.Metascore) : undefined,
        type: data.Type === 'series' ? 'series' : 'movie',
        seasons: data.totalSeasons ? parseInt(data.totalSeasons) : undefined,
        poster: data.Poster !== 'N/A' ? data.Poster : undefined,
        posterUrl: data.Poster !== 'N/A' ? data.Poster : undefined,
        tags: data.Genre ? data.Genre.split(', ').map((g: string) => g.toLowerCase()) : []
      };
    } catch (error) {
      console.error('Error fetching from OMDb:', error);
      return null;
    }
  }

  // Fetch from TMDB with videos and images
  private async fetchFromTMDB(id: string, type: 'movie' | 'tv'): Promise<MovieDetails | null> {
    if (!TMDB_API_KEY) {
      // Demo data for testing without API key
      return this.getDemoData(id, type);
    }

    try {
      const endpoint = type === 'movie' ? 'movie' : 'tv';
      
      // Fetch basic details
      const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US'
        }
      });

      // Fetch videos (trailers)
      const videosResponse = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${id}/videos`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US'
        }
      });

      const data = response.data;
      const title = data.title || data.name;
      const releaseDate = data.release_date || data.first_air_date;

      // Find official trailer
      const videos = videosResponse.data.results || [];
      const trailer = videos.find((v: Video) => 
        v.type === 'Trailer' && v.site === 'YouTube' && v.official
      ) || videos.find((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');

      return {
        title,
        year: releaseDate ? new Date(releaseDate).getFullYear() : undefined,
        genre: data.genres ? data.genres.map((g: Genre) => g.name) : [],
        description: data.overview || '',
        tmdbRating: data.vote_average || 0,
        type: type === 'tv' ? 'series' : 'movie',
        seasons: data.number_of_seasons,
        poster: data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : undefined,
        posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : undefined,
        backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : undefined,
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
        tags: data.genres ? data.genres.map((g: Genre) => g.name.toLowerCase()) : []
      };
    } catch (error) {
      console.error('Error fetching from TMDB:', error);
      return null;
    }
  }

  // Demo data for testing without API keys
  private getDemoData(id: string, type?: 'movie' | 'tv'): MovieDetails {
    // Sample data based on common movies/series
    // Note: Using IMDb-style posters for demo to simulate OMDb response
    const demos = {
      'tt0111161': {
        title: 'The Shawshank Redemption',
        year: 1994,
        genre: ['Drama'],
        description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        imdbRating: 9.3,
        tmdbRating: 8.7,
        type: 'movie' as const,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg', // IMDb poster
        trailerUrl: 'https://www.youtube.com/watch?v=NmzuHjWmXOc',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/l6hQWH9eDksNJNiXWYRkWqikOdu.jpg',
        tags: ['drama', 'crime', 'hope']
      },
      'tt0903747': {
        title: 'Breaking Bad',
        year: 2008,
        genre: ['Crime', 'Drama', 'Thriller'],
        description: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.',
        imdbRating: 9.5,
        tmdbRating: 8.9,
        type: 'series' as const,
        seasons: 5,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_SX300.jpg', // IMDb poster
        trailerUrl: 'https://www.youtube.com/watch?v=HhesaQXLuRY',
        backdropUrl: 'https://image.tmdb.org/t/p/w1280/iNOGKhqMEwQ2CZdnp67eKp6nIJ8.jpg',
        tags: ['crime', 'drama', 'thriller']
      }
    };

    // Return demo data or generate based on ID
    const demoKey = id as keyof typeof demos;
    if (demos[demoKey]) {
      return demos[demoKey];
    }

    // Generate sample data
    return {
      title: `Sample Movie ${id}`,
      year: 2023,
      genre: ['Action', 'Drama'],
      description: 'This is a sample movie description for testing purposes.',
      imdbRating: 7.5,
      tmdbRating: 7.2,
      type: type === 'tv' ? 'series' : 'movie',
      seasons: type === 'tv' ? 3 : undefined,
      posterUrl: 'https://image.tmdb.org/t/p/w500/sample-poster.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/sample-backdrop.jpg',
      tags: ['action', 'drama', 'sample']
    };
  }

  // Get TMDB trailer using IMDb ID
  private async getTMDBTrailerByIMDbId(imdbId: string): Promise<string | null> {
    if (!TMDB_API_KEY) return null;

    try {
      // Search TMDB using IMDb ID
      const response = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          external_source: 'imdb_id'
        }
      });

      const results = response.data;
      let tmdbId = null;
      let mediaType = null;

      // Check if it's a movie or TV show
      if (results.movie_results && results.movie_results.length > 0) {
        tmdbId = results.movie_results[0].id;
        mediaType = 'movie';
      } else if (results.tv_results && results.tv_results.length > 0) {
        tmdbId = results.tv_results[0].id;
        mediaType = 'tv';
      }

      if (!tmdbId) return null;

      // Get videos for this TMDB ID
      const videosResponse = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US'
        }
      });

      const videos = videosResponse.data.results || [];
      const trailer = videos.find((v: Video) => 
        v.type === 'Trailer' && v.site === 'YouTube' && v.official
      ) || videos.find((v: Video) => v.type === 'Trailer' && v.site === 'YouTube');

      return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    } catch (error) {
      console.error('Error getting TMDB trailer by IMDb ID:', error);
      return null;
    }
  }

  // Get IMDb rating for TMDB content
  private async getIMDbRatingForTMDB(id: string, type: 'movie' | 'tv'): Promise<number | null> {
    if (!TMDB_API_KEY) return null;

    try {
      const endpoint = type === 'movie' ? 'movie' : 'tv';
      const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}/${id}/external_ids`, {
        params: {
          api_key: TMDB_API_KEY
        }
      });

      const imdbId = response.data.imdb_id;
      if (!imdbId) return null;

      const omdbData = await this.fetchFromOMDb(imdbId);
      return omdbData?.imdbRating || null;
    } catch (error) {
      console.error('Error getting IMDb rating:', error);
      return null;
    }
  }

  // Main fetch function
  async fetchMovieDetails(url: string): Promise<MovieDetails | null> {
    // Support asianwiki links by calling backend proxy
    if (/asianwiki\.com/i.test(url)) {
      try {
        const resp = await axios.get('/api/asianwiki', { params: { url } });
        if (resp && resp.data) {
          const d = resp.data;
          const movieData: MovieDetails = {
            title: d.title || '',
            year: d.year ? parseInt(d.year) : undefined,
            genre: d.genre || [],
            description: d.synopsis || d.description || '',
            imdbRating: undefined,
            tmdbRating: undefined,
            rottenTomatoesRating: undefined,
            metacriticRating: undefined,
            type: 'movie',
            seasons: undefined,
            posterUrl: d.poster || d.image || d.cover || undefined,
            poster: d.poster || d.image || d.cover || undefined,
            trailerUrl: d.trailerUrl || undefined,
            backdropUrl: d.backdrop || undefined,
            tags: Array.isArray(d.cast) ? d.cast.map((c: string) => c.split(' as ')[0].trim().toLowerCase()) : []
          };
          // Heuristic: if synopsis mentions "episode" or cast is long, mark as series
          if (d.cast && d.cast.length > 5) movieData.type = 'series';
          return movieData;
        }
        return null;
      } catch (err) {
        console.error('Error fetching AsianWiki data:', err);
        return null;
      }
    }

    const extracted = this.extractMovieId(url);
    if (!extracted) {
      throw new Error('Invalid URL. Please provide a valid IMDb, TMDB, or AsianWiki URL.');
    }

    let movieData: MovieDetails | null = null;

    console.log('Fetching movie data for:', extracted); // Debug log

    switch (extracted.source) {
      case 'imdb':
        // Get all data from IMDb/OMDb
        movieData = await this.fetchFromOMDb(extracted.id);
        
        // Enhance with trailer from TMDB (best trailer source)
        if (movieData && TMDB_API_KEY) {
          try {
            const tmdbTrailer = await this.getTMDBTrailerByIMDbId(extracted.id);
            if (tmdbTrailer) {
              movieData.trailerUrl = tmdbTrailer;
              console.log('Enhanced IMDb data with TMDB trailer:', tmdbTrailer);
            }
          } catch (error) {
            console.log('Could not fetch trailer from TMDB:', error);
          }
        }
        
        // If OMDb fails, use demo data as fallback
        if (!movieData && (extracted.id === 'tt0111161' || extracted.id === 'tt0903747')) {
          movieData = this.getDemoData(extracted.id);
          console.log('OMDb failed, using demo data:', movieData);
        }
        break;
      
      case 'tmdb_movie':
        // Get all data from TMDB (including trailers)
        movieData = await this.fetchFromTMDB(extracted.id, 'movie');
        if (movieData) {
          // Also try to get IMDb rating for additional context
          const imdbRating = await this.getIMDbRatingForTMDB(extracted.id, 'movie');
          if (imdbRating) movieData.imdbRating = imdbRating;
        }
        break;
      
      case 'tmdb_tv':
        // Get all data from TMDB (including trailers)
        movieData = await this.fetchFromTMDB(extracted.id, 'tv');
        if (movieData) {
          // Also try to get IMDb rating for additional context
          const imdbRating = await this.getIMDbRatingForTMDB(extracted.id, 'tv');
          if (imdbRating) movieData.imdbRating = imdbRating;
        }
        break;
    }

    console.log('Final movie data:', movieData); // Debug log
    return movieData;
  }

  // Search by title as fallback
  async searchByTitle(title: string, type?: 'movie' | 'series'): Promise<MovieDetails[]> {
    if (!TMDB_API_KEY) {
      // Return demo search results
      const searchType = type === 'series' ? 'tv' : 'movie';
      return [
        this.getDemoData('search1', searchType), 
        this.getDemoData('search2', searchType)
      ];
    }

    try {
      const results: MovieDetails[] = [];

      // Search TMDB
      const searchType = type === 'series' ? 'tv' : 'movie';
      const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/search/${searchType}`, {
        params: {
          api_key: TMDB_API_KEY,
          query: title,
          language: 'en-US'
        }
      });

      for (const item of tmdbResponse.data.results.slice(0, 5)) {
        const details = await this.fetchFromTMDB(item.id.toString(), searchType as 'movie' | 'tv');
        if (details) results.push(details);
      }

      return results;
    } catch (error) {
      console.error('Error searching by title:', error);
      return [];
    }
  }
}

export const movieFetchService = new MovieFetchService();
export type { MovieDetails };
