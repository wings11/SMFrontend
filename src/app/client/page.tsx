'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { clientAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Film, TrendingUp, Eye, Calendar } from 'lucide-react';
import { 
  TotalClicksChart, 
  TopMoviesChart, 
  ContentTypeChart, 
  ClickTrendsChart 
} from '@/components/analytics/MovieCharts';

interface DashboardStats {
  statistics: {
    totalMovies: number;
    totalSeries: number;
    totalClicks: number;
  };
  topMovies: Array<{
    _id: string;
    title: string;
    clickCount: number;
    type: string;
  }>;
}

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const dashboardRes = await clientAPI.getDashboard();
      setStats(dashboardRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'client') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router, fetchDashboardData]);

  const handleExportCSV = () => {
    if (!stats) return;
    
    const csvContent = `Movie Title,Type,Clicks\n${stats.topMovies.map((movie) =>
      `"${movie.title}","${movie.type}",${movie.clickCount}`
    ).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movie-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || user.role !== 'client') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">View movie and series performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleExportCSV} disabled={!stats}>
                Export CSV
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user.email}</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Film className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <div className="text-2xl font-bold">{stats.statistics.totalMovies.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Total Movies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <div className="text-2xl font-bold">{stats.statistics.totalSeries.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Total Series</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Eye className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <div className="text-2xl font-bold">{stats.statistics.totalClicks.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Total Clicks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <div className="text-2xl font-bold">{stats.topMovies.length.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Content Items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Charts */}
            <div className="grid gap-6 mb-8 lg:grid-cols-2">
              {/* Total Clicks Radial Chart */}
              <TotalClicksChart 
                totalClicks={stats.statistics.totalClicks}
                percentageChange={8.5}
              />
              
              {/* Content Type Distribution */}
              <ContentTypeChart 
                totalMovies={stats.statistics.totalMovies}
                totalSeries={stats.statistics.totalSeries}
              />
            </div>

            {/* Click Trends and Top Movies */}
            <div className="grid gap-6 mb-8 lg:grid-cols-2">
              {/* Click Trends Line Chart */}
              <ClickTrendsChart totalClicks={stats.statistics.totalClicks} />
              
              {/* Top Movies Bar Chart */}
              <TopMoviesChart movies={stats.topMovies} />
            </div>

            {/* Top Movies List */}
            <div className="grid gap-6 lg:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Performance Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topMovies.slice(0, 10).map((movie, index) => (
                      <div key={movie._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="font-bold text-lg text-muted-foreground min-w-[3rem]">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{movie.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={movie.type === 'movie' ? 'default' : 'secondary'}>
                                {movie.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {((movie.clickCount / stats.statistics.totalClicks) * 100).toFixed(1)}% of total clicks
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{movie.clickCount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">clicks</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load dashboard data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
