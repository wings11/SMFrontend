import { useRef, useCallback, useEffect } from 'react'

export const useMouseDrag = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const lastXRef = useRef(0)
  const velocityRef = useRef(0)
  const momentumRef = useRef<number | null>(null)

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    // Only enable drag for desktop - check if it's not a touch device
    if (window.matchMedia('(pointer: coarse)').matches) return

    // Cancel any ongoing momentum
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = null
    }

    isDraggingRef.current = true
    startXRef.current = e.pageX
    lastXRef.current = e.pageX
    scrollLeftRef.current = container.scrollLeft
    velocityRef.current = 0
    
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
    container.classList.add('dragging')
    
    // Disable smooth scrolling during drag for immediate response
    container.style.scrollBehavior = 'auto'
    
    // Prevent default to avoid text selection
    e.preventDefault()
  }, [])

  const applyMomentum = useCallback(() => {
    const container = containerRef.current
    if (!container || isDraggingRef.current) return

    const friction = 0.95
    const minVelocity = 0.5

    if (Math.abs(velocityRef.current) > minVelocity) {
      container.scrollLeft -= velocityRef.current
      velocityRef.current *= friction
      
      momentumRef.current = requestAnimationFrame(applyMomentum)
    } else {
      // Re-enable smooth scrolling after momentum ends
      container.style.scrollBehavior = 'smooth'
      momentumRef.current = null
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    if (isDraggingRef.current) {
      // Start momentum when leaving during drag
      isDraggingRef.current = false
      applyMomentum()
    }

    container.style.cursor = 'grab'
    container.style.userSelect = 'auto'
    container.classList.remove('dragging')
  }, [applyMomentum])

  const handleMouseUp = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    if (isDraggingRef.current) {
      isDraggingRef.current = false
      // Start momentum scrolling on mouse up
      applyMomentum()
    }

    container.style.cursor = 'grab'
    container.style.userSelect = 'auto'
    container.classList.remove('dragging')
  }, [applyMomentum])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current
    if (!isDraggingRef.current || !container) return

    e.preventDefault()
    
    const currentX = e.pageX
    const deltaX = currentX - lastXRef.current
    const walk = (currentX - startXRef.current) * 1.2 // Slightly reduced multiplier for smoother feel
    
    // Calculate velocity for momentum
    velocityRef.current = deltaX * 0.8
    lastXRef.current = currentX
    
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      if (container && isDraggingRef.current) {
        container.scrollLeft = scrollLeftRef.current - walk
      }
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Add draggable classes
    container.classList.add('draggable-scroll', 'drag-container')

    // Set initial cursor for desktop only
    if (!window.matchMedia('(pointer: coarse)').matches) {
      container.style.cursor = 'grab'
    }

    // Enable smooth scrolling by default
    container.style.scrollBehavior = 'smooth'

    // Add event listeners
    container.addEventListener('mousedown', handleMouseDown, { passive: false })
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mousemove', handleMouseMove, { passive: false })

    // Global mouse up listener to handle mouse up outside container
    document.addEventListener('mouseup', handleMouseUp)

    // Prevent context menu on long press
    const preventContextMenu = (e: Event) => {
      if (isDraggingRef.current) e.preventDefault()
    }
    container.addEventListener('contextmenu', preventContextMenu)

    // Prevent drag on images and links
    const preventDragStart = (e: Event) => {
      if ((e.target as HTMLElement).tagName === 'IMG' || (e.target as HTMLElement).tagName === 'A') {
        e.preventDefault()
      }
    }
    container.addEventListener('dragstart', preventDragStart)

    // Add smooth horizontal wheel scrolling
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Already scrolling horizontally, let it be natural
        return
      }
      
      // Convert vertical scroll to horizontal for better UX
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault()
        const scrollAmount = e.deltaY * 0.5 // Reduce scroll speed for smoothness
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      // Cancel any ongoing momentum
      if (momentumRef.current) {
        cancelAnimationFrame(momentumRef.current)
      }

      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('contextmenu', preventContextMenu)
      container.removeEventListener('dragstart', preventDragStart)
      container.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mouseup', handleMouseUp)

      // Reset styles and classes
      container.style.cursor = 'auto'
      container.style.userSelect = 'auto'
      container.style.scrollBehavior = 'auto'
      container.classList.remove('draggable-scroll', 'drag-container', 'dragging')
    }
  }, [handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove, applyMomentum])

  return containerRef
}