'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClickTrendsChartProps {
  data: Array<{
    _id: string;
    clicks: number;
  }>;
}

export const ClickTrendsChart: React.FC<ClickTrendsChartProps> = ({ data }) => {
  const formattedData = data.map(item => ({
    date: new Date(item._id).toLocaleDateString(),
    clicks: item.clicks,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Click Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="clicks" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: '#8884d8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface TopMoviesChartProps {
  data: Array<{
    title: string;
    clickCount: number;
    type: string;
  }>;
}

export const TopMoviesChart: React.FC<TopMoviesChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Movies by Clicks</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="title" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="clickCount" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface HourlyClicksChartProps {
  data: Array<{
    hour: number;
    clicks: number;
  }>;
}

export const HourlyClicksChart: React.FC<HourlyClicksChartProps> = ({ data }) => {
  // Ensure we have data for all 24 hours
  const fullData = Array.from({ length: 24 }, (_, hour) => {
    const existingData = data.find(item => item.hour === hour);
    return {
      hour,
      clicks: existingData?.clicks || 0,
      time: `${hour.toString().padStart(2, '0')}:00`,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Click Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fullData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="clicks" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface TypeDistributionChartProps {
  movies: number;
  series: number;
}

export const TypeDistributionChart: React.FC<TypeDistributionChartProps> = ({ 
  movies, 
  series 
}) => {
  const data = [
    { name: 'Movies', value: movies, color: '#8884d8' },
    { name: 'Series', value: series, color: '#82ca9d' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name?: string; percent?: number }) => 
                `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface StatsCardsProps {
  totalMovies: number;
  totalSeries: number;
  totalClicks: number;
  recentClicks?: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalMovies,
  totalSeries,
  totalClicks,
  recentClicks,
}) => {
  const stats = [
    {
      title: 'Total Movies',
      value: totalMovies,
      description: 'Active movies',
      color: 'text-blue-600',
    },
    {
      title: 'Total Series',
      value: totalSeries,
      description: 'Active series',
      color: 'text-green-600',
    },
    {
      title: 'Total Clicks',
      value: totalClicks.toLocaleString(),
      description: 'All time clicks',
      color: 'text-purple-600',
    },
    ...(recentClicks !== undefined ? [{
      title: 'Recent Clicks',
      value: recentClicks.toLocaleString(),
      description: 'Last 30 days',
      color: 'text-orange-600',
    }] : []),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
