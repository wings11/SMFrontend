"use client"

import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function FloatingNav() {
  const [open, setOpen] = useState(false)

  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <div className="fixed left-4 bottom-6 z-[9999]">
        <button
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((v) => !v)}
          className="bg-[#176DA6] text-white p-3 rounded-full shadow-lg focus:outline-none"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed left-4 bottom-20 z-50 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800">
          <nav className="p-3">
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Home</Link>
              </li>
              <li>
                <Link href="/about" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">About Us</Link>
              </li>
              <li>
                <Link href="/movies" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Watch Now</Link>
              </li>
              <li>
                <Link href="/advertise" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Advertise With Us</Link>
              </li>
              <li>
                <Link href="/disclaimers" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Disclaimers</Link>
              </li>
              <li>
                <Link href="/contact" onClick={() => setOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Contact Us</Link>
              </li>
              {/* Theme Switcher Button */}
              <li className="pt-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-center"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
