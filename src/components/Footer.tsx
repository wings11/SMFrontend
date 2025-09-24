"use client"

import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 mt-12">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">SM Drama</h3>
          <p className="text-sm text-gray-400">SM Drama is a translation and entertainment platform dedicated to bringing Korean movies, Korean variety shows, and Thai series to Burmese audiences. Founded in August 2021, SM Drama started with variety shows and quickly grew to include movies and series.</p>
        </div>

        <div>
          <h4 className="text-md font-semibold mb-2">Resources</h4>
          <ul className="space-y-1 text-sm text-gray-400">
            <li><Link href="/disclaimers" className="hover:underline">Disclaimers</Link></li>
            <li><Link href="/advertise" className="hover:underline">Advertise with us</Link></li>
            <li><Link href="/about" className="hover:underline">About Us</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <div>© {new Date().getFullYear()} SM Drama. All rights reserved.</div>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link href="/advertise" className="hover:underline">Advertise with us</Link>
            <Link href="/about" className="hover:underline">About Us</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
