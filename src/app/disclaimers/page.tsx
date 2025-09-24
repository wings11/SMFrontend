"use client"

import React from 'react'
import Link from 'next/link'

export default function DisclaimersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Disclaimers</h1>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">About SM Drama</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">SM Drama is a translation and entertainment platform dedicated to bringing Korean movies, Korean variety shows, and Thai series to Burmese audiences. Founded in August 2021, SM Drama started with variety shows and quickly grew to include movies and series.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Disclaimer</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">All original movies, series, and shows featured on SM Drama are the property of their respective copyright owners. SM Drama does not claim ownership; our role is limited to providing Burmese-language translations/subtitles for entertainment and educational purposes only.</p>
        </section>

        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
