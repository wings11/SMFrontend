import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle external resources better
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  images: {
    // Allow images from any source (development setup)
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in dev to avoid external image issues
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Add loader config to handle external images better
    loader: 'default',
    // Increase timeout for slow external servers
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Movie database sources
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'images.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'www.themoviedb.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'photos.hancinema.net',
        port: '',
        pathname: '/**',
      },
      // Common CDNs and image hosts
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      // Google/Search related
      {
        protocol: 'https',
        hostname: 'www.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      // Asian drama sources
      {
        protocol: 'https',
        hostname: 'mydramalist.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.mydramalist.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.soompi.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.sportskeeda.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'asianwiki.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.asianwiki.com',
        port: '',
        pathname: '/**',
      },
      // Permissive fallback for any HTTPS source
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      // HTTP fallback (less secure, use with caution)
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
