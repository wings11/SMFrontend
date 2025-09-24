'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Eye, Star, Calendar, Film, Tv, TrendingUp, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { adminAPI } from '@/lib/api'
import { movieFetchService } from '@/lib/movieFetch'
import { useRouter } from 'next/navigation'

interface Movie {
  _id: string
  title: string
  type: 'movie' | 'series'
  year?: number
  genre: string[]
  language?: string
  description: string
  telegramLink: string
  posterUrl?: string
  trailerUrl?: string
  backdropUrl?: string
  imdbRating?: number
  tmdbRating?: number
  rottenTomatoesRating?: number
  metacriticRating?: number
  seasons?: number
  clickCount: number
  isFeatured: boolean
  isActive: boolean
  tags: string[]
  createdAt: string
  slug: string
  uploadedBy: {
    _id: string
    email: string
  }
}

interface DashboardStats {
  totalMovies: number
  totalSeries: number
  activeMovies: number
  totalClicks: number
}

interface MovieFormData {
  title: string
  type: 'movie' | 'series'
  year?: number
  genre: string[]
  description: string
  telegramLink: string
  posterUrl?: string
  trailerUrl?: string
  backdropUrl?: string
  imdbRating?: number
  tmdbRating?: number
  rottenTomatoesRating?: number
  metacriticRating?: number
  seasons?: number
  tags: string[]
  isFeatured: boolean
  downloads?: Partial<Record<'240' | '360' | '720' | '1080', Array<{ source?: string; url?: string }>>>
  episodes?: EpisodeInput[]
}

interface EpisodeInput {
  _id?: string
  season?: number
  episodeNumber?: number
  watchUrl?: string
  isPublished?: boolean
  title?: string
  thumbnailUrl?: string
  duration?: number
  clickCount?: number
  downloads?: Partial<Record<'240' | '360' | '720' | '1080', Array<{ source?: string; url?: string }>>>
}

// Default downloads shape helper (module scope so admin handlers can use it)
const DEFAULT_DOWNLOADS: Partial<Record<'240' | '360' | '720' | '1080', Array<{ source?: string; url?: string }>>> = { '240': [{ source: '', url: '' }], '360': [{ source: '', url: '' }], '720': [{ source: '', url: '' }], '1080': [{ source: '', url: '' }] }

// helper to clean downloads arrays by removing entries with empty url (module scope)
const cleanDownloads = (d?: Partial<Record<string, Array<{ source?: string; url?: string }>>>) => {
  if (!d) return undefined
  const out: Record<string, Array<{ source?: string; url?: string }>> = {}
  Object.entries(d).forEach(([k, arr]) => {
    if (Array.isArray(arr)) {
      const cleaned = arr
        .map(it => ({ source: it?.source || '', url: typeof it?.url === 'string' ? it.url.trim() : '' }))
        .filter(it => it.url && it.url !== '')
      if (cleaned.length > 0) out[k] = cleaned
    }
  })
  return Object.keys(out).length > 0 ? out : undefined
}

const MovieForm = ({ 
  movie, 
  isOpen, 
  onClose, 
  onSubmit,
  isLoading 
}: { 
  movie?: Movie
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MovieFormData) => Promise<Record<string, unknown> | void>
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    type: 'movie' as 'movie' | 'series',
    year: new Date().getFullYear(),
    genre: [] as string[],
    description: '',
    telegramLink: '',
    posterUrl: '',
    trailerUrl: '',
    backdropUrl: '',
    imdbRating: 0,
    tmdbRating: 0,
    rottenTomatoesRating: 0,
    metacriticRating: 0,
    seasons: 1,
    tags: [] as string[],
    isFeatured: false,
    downloads: DEFAULT_DOWNLOADS
  })

  const [episodes, setEpisodes] = useState<EpisodeInput[]>([])
  const [newEpisode, setNewEpisode] = useState<{ season: number; episodeNumber: number; title: string; watchUrl: string; thumbnailUrl: string; duration?: number | string; isPublished: boolean; downloads?: Partial<Record<'240'|'360'|'720'|'1080', Array<{source?:string;url?:string}>>> }>({ season: 1, episodeNumber: 1, title: '', watchUrl: '', thumbnailUrl: '', duration: undefined, isPublished: true, downloads: DEFAULT_DOWNLOADS })

  const [fetchUrl, setFetchUrl] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [fetchSuccess, setFetchSuccess] = useState(false)

  // Initialize form data only when the dialog opens or when a different movie is selected
  // This prevents mid-edit re-initialization while the admin is typing
  useEffect(() => {
    if (!isOpen) return

    if (movie) {
  // Do not auto-set tags from fetched data anymore; admin must choose tags manually
  setFormData({
        title: movie.title,
        type: movie.type,
        year: movie.year || new Date().getFullYear(),
        genre: movie.genre || [],
        description: movie.description || '',
        telegramLink: movie.telegramLink || '',
        posterUrl: movie.posterUrl || '',
        trailerUrl: movie.trailerUrl || '',
        backdropUrl: movie.backdropUrl || '',
        imdbRating: movie.imdbRating || 0,
        tmdbRating: movie.tmdbRating || 0,
        rottenTomatoesRating: movie.rottenTomatoesRating || 0,
        metacriticRating: movie.metacriticRating || 0,
        seasons: movie.seasons || 1,
    tags: movie.tags || [],
    isFeatured: !!movie.isFeatured,
  downloads: (movie as unknown as { downloads?: Partial<Record<string, Array<{ source?: string; url?: string }>>> }).downloads || DEFAULT_DOWNLOADS
      })
      // Load episodes for series (keep existing episodes state if already loaded)
      setFetchUrl('')
      setFetchSuccess(false)
    } else {
      // only reset when dialog opens for creating a new movie
      setFormData({
        title: '',
        type: 'movie',
        year: new Date().getFullYear(),
        genre: [],
        description: '',
        telegramLink: '',
        posterUrl: '',
        trailerUrl: '',
        backdropUrl: '',
        imdbRating: 0,
        tmdbRating: 0,
        rottenTomatoesRating: 0,
        metacriticRating: 0,
        seasons: 1,
        tags: [],
        isFeatured: false,
        downloads: DEFAULT_DOWNLOADS
      })
      setFetchUrl('')
      setFetchSuccess(false)
      setEpisodes([])
    }
    // We intentionally only watch isOpen and movie?._id to avoid re-initializing on unrelated prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, movie ? movie._id : null])

  // Load episodes when editing a series using the centralized moviesAPI (axios)
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!movie || movie.type !== 'series') return
      try {
  // no-op loading flag removed; keep UI simple here
        const { moviesAPI } = await import('@/lib/api')
        try {
          const res = await moviesAPI.getEpisodes(movie._id)
          if (res && res.success) setEpisodes(res.data || [])
        } catch {
          // Fallback to relative fetch if axios helper fails (should be rare)
          try {
            const resp = await fetch(`/api/movies/${movie._id}/episodes`)
            const parsed = await resp.json()
            if (parsed && parsed.success) setEpisodes(parsed.data || [])
          } catch (fallbackErr) {
            console.error('Error fetching episodes in admin form fallback', fallbackErr)
          }
        }
      } catch (err) {
        console.error('Error fetching episodes for admin form', err)
      } finally {
        // nothing to do
      }
    }

    fetchEpisodes()
  }, [movie])

  const handleFetchMovieData = async () => {
    if (!fetchUrl.trim()) return

    try {
      setIsFetching(true)
      const movieData = await movieFetchService.fetchMovieDetails(fetchUrl)
      
      if (movieData) {
        console.log('Fetched movie data:', movieData); // Debug log
        setFormData(prev => ({
          ...prev,
          title: movieData.title,
          type: movieData.type,
          year: movieData.year || new Date().getFullYear(),
          genre: movieData.genre,
          description: movieData.description,
          posterUrl: movieData.posterUrl || '',
          trailerUrl: movieData.trailerUrl || '',
          backdropUrl: movieData.backdropUrl || '',
          imdbRating: movieData.imdbRating || 0,
          tmdbRating: movieData.tmdbRating || 0,
          rottenTomatoesRating: movieData.rottenTomatoesRating || 0,
          metacriticRating: movieData.metacriticRating || 0,
          seasons: movieData.seasons || 1,
          // keep tags untouched so admin will select from fixed list
          tags: []
        }))
        console.log('Updated form data with trailer:', movieData.trailerUrl); // Debug log
        setFetchSuccess(true)
      }
    } catch (error) {
      console.error('Error fetching movie data:', error)
      alert('Failed to fetch movie data. Please check the URL and try again.')
    } finally {
      setIsFetching(false)
    }
  }

  const handleGenreChange = (genreString: string) => {
    const genres = genreString.split(',').map(g => g.trim()).filter(g => g)
    setFormData(prev => ({ ...prev, genre: genres }))
  }

  // Fixed tag options for admin selection
  const TAG_OPTIONS = ['movie', 'korea drama', 'BL', 'thai series', 'western series', 'variety show'] as const

  const handleToggleTag = (tag: string) => {
    setFormData(prev => {
      const exists = prev.tags.includes(tag)
      let nextTags = exists ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
      // enforce max 5 tags
      if (nextTags.length > 5) nextTags = nextTags.slice(0, 5)
      return { ...prev, tags: nextTags }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const resp = await onSubmit({ ...formData, episodes })
      if (resp) {
        const r = resp as unknown as Record<string, unknown>
        if (r.episodes) {
          const eps = r.episodes as unknown as EpisodeInput[]
          setEpisodes(eps.map(e => ({
            _id: e._id,
            season: e.season,
            episodeNumber: e.episodeNumber,
            watchUrl: e.watchUrl,
            isPublished: e.isPublished,
            title: e.title,
            thumbnailUrl: e.thumbnailUrl,
            duration: e.duration,
            clickCount: e.clickCount
          })))
        }
      }
    } catch (err) {
      console.error('MovieForm submit error:', err)
    }
  }

  const handleAddEpisode = () => {
    // simple validation: require numeric episodeNumber and a watchUrl
    const epNum = Number(newEpisode.episodeNumber)
    if (!epNum || !newEpisode.watchUrl || typeof newEpisode.watchUrl !== 'string' || newEpisode.watchUrl.trim() === '') {
      alert('Please provide an episode number and a watch URL')
      return
    }
  setEpisodes(prev => [...prev, { ...newEpisode, _id: `tmp-${Date.now()}`, episodeNumber: epNum, duration: typeof newEpisode.duration === 'string' ? (newEpisode.duration ? Number(newEpisode.duration) : undefined) : newEpisode.duration, downloads: cleanDownloads(newEpisode.downloads as Partial<Record<'240'|'360'|'720'|'1080', Array<{ source?: string; url?: string }>>>) } as EpisodeInput])
  setNewEpisode({ season: Number(newEpisode.season) || 1, episodeNumber: epNum + 1, title: '', watchUrl: '', thumbnailUrl: '', duration: undefined, isPublished: true })
  }

  const handleRemoveEpisode = (id: string) => {
    setEpisodes(prev => prev.filter(e => e._id !== id))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="w-full max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>{movie ? 'Edit' : 'Add New'} {formData.type === 'movie' ? 'Movie' : 'Series'}</DialogTitle>
          <DialogDescription>
            {!movie && 'Paste an IMDb or TMDB URL to auto-fill movie details, or fill manually.'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Auto-fetch section - only for new movies */}
        {!movie && (
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <Label htmlFor="fetchUrl">Auto-fetch from URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="fetchUrl"
                placeholder="https://www.imdb.com/title/tt1234567/ or https://www.themoviedb.org/movie/12345"
                value={fetchUrl}
                onChange={(e) => setFetchUrl(e.target.value)}
              />
              <Button 
                type="button" 
                onClick={handleFetchMovieData} 
                disabled={isFetching || !fetchUrl.trim()}
              >
                {isFetching ? 'Fetching...' : 'Fetch Data'}
              </Button>
            </div>
            {fetchSuccess && (
              <div className="text-green-600 text-sm mt-2 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Movie data fetched successfully! Review and edit if needed.
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value: 'movie' | 'series') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              />
            </div>
            {formData.type === 'series' && (
              <div>
                <Label htmlFor="seasons">Seasons</Label>
                <Input
                  id="seasons"
                  type="number"
                  min="1"
                  value={formData.seasons}
                  onChange={(e) => setFormData(prev => ({ ...prev, seasons: parseInt(e.target.value) || 1 }))}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="telegramLink">Telegram Link *</Label>
            <Input
              id="telegramLink"
              type="url"
              placeholder="https://t.me/yourchannel/123"
              value={formData.telegramLink}
              onChange={(e) => setFormData(prev => ({ ...prev, telegramLink: e.target.value }))}
              required
            />
          </div>

          {/* Media URLs - editable so admins can fill or correct poster/trailer/backdrop links manually */}
          <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm text-muted-foreground">Media URLs (editable)</h4>

            <div>
              <Label htmlFor="posterUrl">Poster URL</Label>
              <Input
                id="posterUrl"
                type="url"
                placeholder="https://.../poster.jpg"
                value={formData.posterUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
              />
              {formData.posterUrl && (
                <div className="mt-2">
                  <Image
                    src={formData.posterUrl}
                    alt="Poster preview"
                    width={128}
                    height={192}
                    className="h-32 w-auto rounded border"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="trailerUrl">Trailer URL</Label>
              <Input
                id="trailerUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                value={formData.trailerUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, trailerUrl: e.target.value }))}
              />
              {formData.trailerUrl && formData.trailerUrl.includes('youtube.com') && (
                <div className="mt-2">
                  <iframe
                    width="280"
                    height="157"
                    src={formData.trailerUrl.replace('watch?v=', 'embed/')}
                    title="Movie Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded border"
                  ></iframe>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="backdropUrl">Backdrop URL</Label>
              <Input
                id="backdropUrl"
                type="url"
                placeholder="https://.../backdrop.jpg"
                value={formData.backdropUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, backdropUrl: e.target.value }))}
              />
            </div>
            
            {/* Download links per resolution */}
            <div className="col-span-3 mt-2">
              <h5 className="text-sm font-medium">Download Links</h5>
              <p className="text-xs text-gray-500">Add optional download sources for common resolutions (240, 360, 720, 1080). You can add multiple links per resolution.</p>
              <div className="grid grid-cols-1 gap-3 mt-3">
                {(['240','360','720','1080'] as const).map((res) => (
                  <div key={res} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{res}p</div>
                      <Button size="sm" type="button" onClick={() => {
                        setFormData(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: [ ...(prev.downloads?.[res] || []), { source: '', url: '' } ] } }))
                      }}>Add link</Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(formData.downloads?.[res] || []).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-5">
                            <Input placeholder="Source (Mega, Google Drive, etc.)" value={item.source || ''} onChange={(e) => {
                              const next = (formData.downloads?.[res] || []).slice()
                              next[idx] = { ...(next[idx] || {}), source: e.target.value }
                              setFormData(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: next } }))
                            }} />
                          </div>
                          <div className="col-span-6">
                            <Input placeholder="https://..." value={item.url || ''} onChange={(e) => {
                              const next = (formData.downloads?.[res] || []).slice()
                              next[idx] = { ...(next[idx] || {}), url: e.target.value }
                              setFormData(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: next } }))
                            }} />
                          </div>
                          <div className="col-span-1">
                            <Button size="sm" variant="destructive" type="button" onClick={() => {
                              const next = (formData.downloads?.[res] || []).slice()
                              next.splice(idx, 1)
                              setFormData(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: next } }))
                            }}>Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="genre">Genres (comma-separated)</Label>
            <Input
              id="genre"
              placeholder="Action, Drama, Thriller"
              value={formData.genre.join(', ')}
              onChange={(e) => { handleGenreChange(e.target.value); console.log('genre input change', e.target.value); }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="imdbRating">IMDb Rating (0-10)</Label>
              <Input
                id="imdbRating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.imdbRating}
                onChange={(e) => setFormData(prev => ({ ...prev, imdbRating: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="tmdbRating">TMDB Rating (0-10)</Label>
              <Input
                id="tmdbRating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.tmdbRating}
                onChange={(e) => setFormData(prev => ({ ...prev, tmdbRating: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="rottenTomatoesRating">Rotten Tomatoes (0-100)</Label>
              <Input
                id="rottenTomatoesRating"
                type="number"
                min="0"
                max="100"
                value={formData.rottenTomatoesRating}
                onChange={(e) => setFormData(prev => ({ ...prev, rottenTomatoesRating: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (choose up to 5)</Label>
            <div className="mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" className="w-full text-left">
                    {formData.tags.length === 0 ? 'Select tags' : formData.tags.join(', ')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {TAG_OPTIONS.map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t}
                      checked={formData.tags.includes(t)}
                      onCheckedChange={() => handleToggleTag(t)}
                    >
                      {t}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-sm text-gray-500 mt-1">Selected: {formData.tags.length} / 5</p>
            </div>
          </div>

          {/* Episodes management - visible for series */}
          {formData.type === 'series' && (
            <div className="border rounded p-3 space-y-3">
              <h4 className="font-medium">Episodes</h4>
              {episodes.length === 0 ? (
                <p className="text-sm text-gray-600">No episodes yet. Add below.</p>
              ) : (
                <div className="space-y-2">
                  {episodes.map(ep => (
                    <div key={ep._id} className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{ep.title || `S${ep.season}E${ep.episodeNumber}`}</div>
                        <div className="text-sm text-gray-500">Episode {ep.episodeNumber} • Season {ep.season}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={ep.watchUrl} target="_blank" rel="noreferrer" className="text-blue-600">Open</a>
                        <Button size="sm" variant="destructive" onClick={() => { if (ep._id) handleRemoveEpisode(ep._id) }}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <Label>Season</Label>
                  <Input type="number" value={newEpisode.season} onChange={(e) => setNewEpisode(prev => ({ ...prev, season: parseInt(e.target.value || '1') }))} />
                </div>
                <div>
                  <Label>Episode #</Label>
                  <Input type="number" value={newEpisode.episodeNumber} onChange={(e) => setNewEpisode(prev => ({ ...prev, episodeNumber: parseInt(e.target.value || '1') }))} />
                </div>
                <div className="col-span-3">
                  <Label>Watch URL</Label>
                  <Input value={newEpisode.watchUrl} onChange={(e) => setNewEpisode(prev => ({ ...prev, watchUrl: e.target.value }))} placeholder="https://t.me/yourchannel/123 or https://.../video.mp4" />
                </div>
                <div className="col-span-3">
                  <Label>Episode Download Links (optional)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['240','360','720','1080'] as const).map((res) => (
                      <div key={res} className="border rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{res}p</div>
                          <Button size="sm" type="button" onClick={() => setNewEpisode(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: [ ...(prev.downloads?.[res] || []), { source: '', url: '' } ] } }))}>Add link</Button>
                        </div>
                        <div className="mt-2 space-y-2">
                          {((newEpisode.downloads?.[res] || []) as Array<{ source?: string; url?: string }>).map((it, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                              <div className="col-span-5">
                                <Input placeholder="Source" value={it.source || ''} onChange={(e) => {
                                  const next = (newEpisode.downloads?.[res] || []).slice()
                                  next[idx] = { ...(next[idx] || {}), source: e.target.value }
                                  setNewEpisode(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: next } }))
                                }} />
                              </div>
                              <div className="col-span-6">
                                <Input placeholder="https://..." value={it.url || ''} onChange={(e) => {
                                  const next = (newEpisode.downloads?.[res] || []).slice()
                                  next[idx] = { ...(next[idx] || {}), url: e.target.value }
                                  setNewEpisode(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: next } }))
                                }} />
                              </div>
                              <div className="col-span-1">
                                <Button size="sm" variant="destructive" type="button" onClick={() => {
                                  const next = (newEpisode.downloads?.[res] || []).slice()
                                  next.splice(idx, 1)
                                  setNewEpisode(prev => ({ ...prev, downloads: { ...(prev.downloads || {}), [res]: next } }))
                                }}>Remove</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={handleAddEpisode}><Plus className="w-4 h-4 mr-2" />Add Episode</Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
            />
            <Label htmlFor="featured">Featured Content</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : movie ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | undefined>()
  const [formLoading, setFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [dashboardData, moviesData] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getMovies({ 
          limit: 100, 
          isActive: showInactive ? undefined : true 
        })
      ])
      setStats(dashboardData.data.statistics)
      setMovies(moviesData.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login')
      return
    }
    fetchData()
  }, [user, router, fetchData])

  // Refetch data when showInactive filter changes
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [showInactive, user, fetchData])

  const handleCreateMovie = async (movieData: MovieFormData) => {
    try {
      setFormLoading(true)
      
  // Only filter out empty URL fields, keep other empty strings
  const cleanedData: Record<string, unknown> = { ...movieData }
      
  // Remove empty URL fields specifically (narrow to string first)
  const cd = cleanedData as Record<string, unknown>
  const posterUrl = cd.posterUrl as string | undefined
  const trailerUrl = cd.trailerUrl as string | undefined
  const backdropUrl = cd.backdropUrl as string | undefined
  if (!posterUrl || !posterUrl.trim()) delete cd.posterUrl
  if (!trailerUrl || !trailerUrl.trim()) delete cd.trailerUrl
  if (!backdropUrl || !backdropUrl.trim()) delete cd.backdropUrl
      
      // Attach cleaned downloads if present
  const cdDownloads = cleanDownloads((cleanedData as unknown as { downloads?: Partial<Record<string, Array<{ source?: string; url?: string }>>> }).downloads)
  if (cdDownloads) (cleanedData as unknown as { downloads?: unknown }).downloads = cdDownloads

      // Normalize episodes: send only needed fields (season, episodeNumber, watchUrl, isPublished)
      if (Array.isArray((cleanedData as unknown as Record<string, unknown>).episodes)) {
        const eps = (cleanedData as unknown as Record<string, unknown>).episodes as unknown as EpisodeInput[]
        (cleanedData as unknown as Record<string, unknown>).episodes = eps
          .map((e) => ({
            season: e.season ? Number(e.season) : 1,
            episodeNumber: e.episodeNumber ? Number(e.episodeNumber) : null,
            watchUrl: e.watchUrl ? String(e.watchUrl).trim() : '',
            isPublished: e.isPublished !== undefined ? !!e.isPublished : true
          ,
            downloads: cleanDownloads((e as unknown as { downloads?: Partial<Record<string, Array<{ source?: string; url?: string }>>> }).downloads)
          }))
          .filter((ep) => (ep as EpisodeInput).episodeNumber && (ep as EpisodeInput).watchUrl)
      }

      console.log('Sending movie data:', cleanedData) // Debug log
      await adminAPI.createMovie(cleanedData)
      setIsFormOpen(false)
      setEditingMovie(undefined)
      await fetchData()
    } catch (error: unknown) {
      console.error('Error creating movie:', error)
      const err = error as { response?: { data?: { details?: Array<{ msg: string }>, error?: string } } }
      if (err.response?.data?.details) {
        console.error('Validation errors:', err.response.data.details)
        alert('Validation errors: ' + err.response.data.details.map((e) => e.msg).join(', '))
      } else if ((err as unknown as { serverMessage?: string }).serverMessage) {
        alert('Server response (non-JSON):\n' + (err as unknown as { serverMessage?: string }).serverMessage)
      } else if (err.response?.data?.error) {
        alert('Error: ' + err.response.data.error)
      } else {
        alert('Failed to create movie. Please try again.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateMovie = async (movieData: MovieFormData) => {
    if (!editingMovie) return
    try {
      setFormLoading(true)
      
      // Filter out empty strings to avoid validation errors
      const cleanedData: Record<string, unknown> = Object.fromEntries(
        Object.entries(movieData).filter(([, value]) => {
          if (typeof value === 'string') {
            return value.trim() !== ''
          }
          return value !== null && value !== undefined
        })
      )

  const cdDownloads = cleanDownloads((cleanedData as unknown as { downloads?: Partial<Record<string, Array<{ source?: string; url?: string }>>> }).downloads)
  if (cdDownloads) (cleanedData as unknown as { downloads?: unknown }).downloads = cdDownloads

      if (Array.isArray((cleanedData as unknown as Record<string, unknown>).episodes)) {
        const eps = (cleanedData as unknown as Record<string, unknown>).episodes as unknown as EpisodeInput[]
        (cleanedData as unknown as Record<string, unknown>).episodes = eps
          .map((e) => ({
            _id: e._id,
            season: e.season ? Number(e.season) : 1,
            episodeNumber: e.episodeNumber ? Number(e.episodeNumber) : null,
            watchUrl: e.watchUrl ? String(e.watchUrl).trim() : '',
            isPublished: e.isPublished !== undefined ? !!e.isPublished : true
          ,
            downloads: cleanDownloads((e as unknown as { downloads?: Partial<Record<string, Array<{ source?: string; url?: string }>>> }).downloads)
          }))
          .filter((ep) => (ep as EpisodeInput).episodeNumber && (ep as EpisodeInput).watchUrl)
      }

      await adminAPI.updateMovie(editingMovie._id, cleanedData)
      setIsFormOpen(false)
      setEditingMovie(undefined)
      await fetchData()
    } catch (error) {
      console.error('Error updating movie:', error)
      if ((error as unknown as { serverMessage?: string }).serverMessage) {
        alert('Server response (non-JSON):\n' + (error as unknown as { serverMessage?: string }).serverMessage)
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteMovie = async (movieId: string) => {
    console.log('Delete button clicked for movie ID:', movieId)
    if (!confirm('Are you sure you want to delete this movie?')) {
      console.log('User cancelled deletion')
      return
    }
    try {
      console.log('Attempting to delete movie:', movieId)
      await adminAPI.deleteMovie(movieId)
      console.log('Movie deleted successfully')
      await fetchData()
    } catch (error) {
      console.error('Error deleting movie:', error)
      alert('Failed to delete movie. Please try again.')
    }
  }

  const handleToggleFeatured = async (movieId: string) => {
    try {
      await adminAPI.toggleMovieFeatured(movieId)
      await fetchData()
    } catch (error) {
      console.error('Error toggling featured status:', error)
    }
  }

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         movie.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || movie.type === typeFilter
    return matchesSearch && matchesType
  })

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin only.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your movies and series collection</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user.email}</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-6 w-20 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Film className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{stats?.totalMovies || 0}</p>
                      <p className="text-gray-600 dark:text-gray-400">Movies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Tv className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{stats?.totalSeries || 0}</p>
                      <p className="text-gray-600 dark:text-gray-400">Series</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Eye className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{stats?.activeMovies || 0}</p>
                      <p className="text-gray-600 dark:text-gray-400">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{stats?.totalClicks?.toLocaleString() || 0}</p>
                      <p className="text-gray-600 dark:text-gray-400">Total Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Content Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Add, edit, and manage your movies and series</CardDescription>
              </div>
              <Button onClick={() => { setEditingMovie(undefined); setIsFormOpen(true) }}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Content
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search movies and series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive">Show Deleted</Label>
              </div>
            </div>

            {/* Movies List */}
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div className="flex-1 min-w-0">
                        <Skeleton className="h-6 w-64 mb-2" />
                        <Skeleton className="h-4 w-96 mb-2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                filteredMovies.map((movie) => (
                  <div key={movie._id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${!movie.isActive ? 'opacity-60 bg-gray-50 dark:bg-gray-800' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-lg font-semibold truncate ${!movie.isActive ? 'line-through text-gray-500' : ''}`} title={movie.title}>{movie.title}</h3>
                          <Badge variant={movie.type === 'movie' ? 'default' : 'secondary'}>
                            {movie.type === 'movie' ? <Film className="w-3 h-3 mr-1" /> : <Tv className="w-3 h-3 mr-1" />}
                            {movie.type}
                          </Badge>
                          {movie.isFeatured && (
                            <Badge variant="destructive">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {!movie.isActive && <Badge variant="outline">Deleted</Badge>}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2 min-w-0">
                          {movie.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {movie.year && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {movie.year}
                            </span>
                          )}
                          {movie.imdbRating && movie.imdbRating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              IMDb: {movie.imdbRating}
                            </span>
                          )}
                          {movie.tmdbRating && movie.tmdbRating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              TMDB: {movie.tmdbRating}
                            </span>
                          )}
                          {movie.type === 'series' && movie.seasons && (
                            <span>
                              {movie.seasons} Season{movie.seasons !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {movie.clickCount.toLocaleString()} views
                          </span>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto mt-0 sm:mt-0 sm:ml-4 flex-shrink-0">
                        {/* On small screens place buttons in a row below the content; on larger screens keep them inline */}
                        <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleFeatured(movie._id)}
                        >
                          <Star className={`w-4 h-4 ${movie.isFeatured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingMovie(movie); setIsFormOpen(true) }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMovie(movie._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movie Form Dialog */}
      <MovieForm
        movie={editingMovie}
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingMovie(undefined) }}
        onSubmit={editingMovie ? handleUpdateMovie : handleCreateMovie}
        isLoading={formLoading}
      />
    </div>
  )
}
