"use client"

import { TrendingUp, Film, Eye } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

// Total Clicks Radial Chart
interface TotalClicksChartProps {
  totalClicks: number
  percentageChange?: number
}

const clicksChartConfig = {
  clicks: {
    label: "Clicks",
  },
  total: {
    label: "Total Clicks",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function TotalClicksChart({ totalClicks, percentageChange = 5.2 }: TotalClicksChartProps) {
  const chartData = [
    { name: "total", clicks: totalClicks, fill: "var(--color-total)" },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Total Clicks
        </CardTitle>
        <CardDescription>Last 6 months performance</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={clicksChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={100}
            innerRadius={80}
            outerRadius={140}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="clicks" background />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {totalClicks.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Clicks
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by {percentageChange}% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total clicks for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}

// Top Movies Bar Chart
interface TopMoviesChartProps {
  movies: Array<{
    title: string
    clickCount: number
    type: string
  }>
}

const topMoviesConfig = {
  clickCount: {
    label: "Clicks",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function TopMoviesChart({ movies }: TopMoviesChartProps) {
  const chartData = movies.slice(0, 5).map(movie => ({
    title: movie.title.length > 15 ? movie.title.substring(0, 15) + '...' : movie.title,
    clickCount: movie.clickCount,
    fill: movie.type === 'movie' ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          Top Performing Content
        </CardTitle>
        <CardDescription>Most clicked movies and series</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topMoviesConfig} className="h-[300px]">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="title" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), "Clicks"]}
              labelFormatter={(label) => `Movie: ${label}`}
            />
            <Bar dataKey="clickCount" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Showing top 5 most popular content
      </CardFooter>
    </Card>
  )
}

// Content Type Distribution Pie Chart
interface ContentTypeChartProps {
  totalMovies: number
  totalSeries: number
}

const contentTypeConfig = {
  movies: {
    label: "Movies",
    color: "#000000", // Black for movies
  },
  series: {
    label: "Series", 
    color: "#737373", // Gray for series
  },
} satisfies ChartConfig

export function ContentTypeChart({ totalMovies, totalSeries }: ContentTypeChartProps) {
  const chartData = [
    { type: "Movies", count: totalMovies, fill: "#000000" }, // Black
    { type: "Series", count: totalSeries, fill: "#737373" }, // Gray
  ]

  const total = totalMovies + totalSeries

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Content Distribution</CardTitle>
        <CardDescription>Movies vs Series</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={contentTypeConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <Tooltip 
              formatter={(value, name) => [
                `${value} (${((Number(value) / total) * 100).toFixed(1)}%)`, 
                name
              ]}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Content
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Movies: {totalMovies} | Series: {totalSeries}
        </div>
        <div className="text-muted-foreground leading-none">
          Current content library distribution
        </div>
      </CardFooter>
    </Card>
  )
}

// Click Trends Line Chart (mock data for demonstration)
interface ClickTrendsChartProps {
  totalClicks: number
}

const trendsConfig = {
  clicks: {
    label: "Daily Clicks",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function ClickTrendsChart({ totalClicks }: ClickTrendsChartProps) {
  // Generate mock trend data based on total clicks
  const generateTrendData = () => {
    const days = 30
    const avgDaily = Math.floor(totalClicks / days)
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: Math.floor(avgDaily * (0.7 + Math.random() * 0.6)) // Random variation ±30%
      }
    })
  }

  const chartData = generateTrendData()
  const avgClicks = Math.floor(totalClicks / 30)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Click Trends</CardTitle>
        <CardDescription>Daily clicks over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={trendsConfig} className="h-[300px]">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), "Clicks"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="clicks" 
              stroke="var(--color-clicks)" 
              strokeWidth={2}
              dot={{ fill: "var(--color-clicks)" }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Average {avgClicks.toLocaleString()} clicks per day
      </CardFooter>
    </Card>
  )
}
