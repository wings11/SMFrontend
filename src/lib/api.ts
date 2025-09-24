import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smdrama.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If response is HTML (e.g., unexpected error page), normalize to a JSON-like error
    try {
      if (error.response) {
        if (error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }

        // If server returned a string (HTML) instead of JSON, attach it as text
        if (typeof error.response.data === 'string') {
          error.serverMessage = error.response.data
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 1000);
        }
      }
    } catch {
      // ignore
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Movies API
export const moviesAPI = {
  getMovies: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const response = await api.get('/movies', { params });
    return response.data;
  },
  
  getFeatured: async (limit?: number) => {
    const response = await api.get('/movies/featured', { params: { limit } });
    return response.data;
  },
  
  getPopular: async (limit?: number, type?: string) => {
    const response = await api.get('/movies/popular', { params: { limit, type } });
    return response.data;
  },
  
  getMovie: async (id: string) => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  getEpisodes: async (movieId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/movies/${movieId}/episodes`, { params });
    return response.data;
  },
  
  clickMovie: async (id: string) => {
    const response = await api.post(`/movies/${id}/click`);
    return response.data;
  },

  getGenres: async () => {
    const response = await api.get('/movies/filters/genres');
    return response.data;
  },

  getTags: async () => {
    const response = await api.get('/movies/filters/tags');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  
  getMovies: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    isActive?: boolean;
  }) => {
    const response = await api.get('/admin/movies', { params });
    return response.data;
  },
  
  createMovie: async (movieData: unknown) => {
    const response = await api.post('/admin/movies', movieData as object);
    return response.data;
  },
  
  updateMovie: async (id: string, movieData: unknown) => {
    const response = await api.put(`/admin/movies/${id}`, movieData as object);
    return response.data;
  },
  
  deleteMovie: async (id: string) => {
    const response = await api.delete(`/admin/movies/${id}`);
    return response.data;
  },
  
  toggleMovieFeatured: async (id: string) => {
    const response = await api.put(`/admin/movies/${id}/feature`);
    return response.data;
  },
  
  getUsers: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  createUser: async (userData: unknown) => {
    const response = await api.post('/admin/users', userData as object);
    return response.data;
  },
  
  toggleUserStatus: async (id: string) => {
    const response = await api.put(`/admin/users/${id}/toggle-status`);
    return response.data;
  },
};

// Client API
export const clientAPI = {
  getDashboard: async () => {
    const response = await api.get('/client/dashboard');
    return response.data;
  },
  
  getMoviesAnalytics: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    type?: string;
    search?: string;
  }) => {
    const response = await api.get('/client/movies/analytics', { params });
    return response.data;
  },
  
  getMovieClicks: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/client/movies/${id}/clicks`, { params });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getOverview: async (days?: number) => {
    const response = await api.get('/analytics/overview', { params: { days } });
    return response.data;
  },
  
  getTopMovies: async (params?: {
    limit?: number;
    type?: string;
    days?: number;
  }) => {
    const response = await api.get('/analytics/movies/top', { params });
    return response.data;
  },
  
  getHourlyClicks: async (days?: number) => {
    const response = await api.get('/analytics/clicks/hourly', { params: { days } });
    return response.data;
  },
  
  getMovieStats: async (id: string, days?: number) => {
    const response = await api.get(`/analytics/movies/${id}/stats`, { params: { days } });
    return response.data;
  },
};

export { API_BASE_URL };
export default api;
