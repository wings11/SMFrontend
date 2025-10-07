# Smooth Mouse Drag Scrolling Feature

## Overview
The homepage now supports ultra-smooth mouse drag scrolling for all horizontal content sections on desktop devices, with momentum scrolling and enhanced wheel support, in addition to the existing touch scrolling on mobile devices.

## Features Implemented

### 1. Custom Hook: `useMouseDrag`
- **Location**: `src/hooks/useMouseDrag.ts`
- **Purpose**: Provides smooth mouse drag functionality for horizontal scroll containers
- **Features**:
  - Desktop-only activation (detects pointer type)
  - **Momentum scrolling** with physics-based deceleration
  - **Smooth dragging** with requestAnimationFrame optimization
  - **Enhanced wheel scrolling** (converts vertical to horizontal)
  - Visual feedback with cursor changes (grab/grabbing)
  - Prevents text selection during drag
  - Handles edge cases (mouse leave, mouse up outside container)
  - **Performance optimized** with passive event listeners

### 2. Navigation Arrow System
- **Location**: Integrated in `src/app/page.tsx`
- **Purpose**: Provides precise navigation controls for all horizontal sections
- **Features**:
  - **Smart visibility**: Arrows appear on hover for desktop, hidden on mobile for cleaner touch experience
  - **Smooth scrolling**: 75% viewport width scroll with smooth animation
  - **Visual feedback**: Backdrop blur, hover effects, and focus indicators
  - **Accessibility**: Keyboard navigation and focus management
  - **Responsive design**: Scales appropriately for different screen sizes
  - **Pulse hints**: Subtle animation to indicate interactivity

### 2. Enhanced CSS Styles
- **Location**: `src/app/globals.css`
- **New Classes**:
  - `.draggable-scroll`: Base styles for draggable containers
  - `.drag-container`: Container-specific styling
  - `.dragging`: Active dragging state
  - Enhanced hover effects that respect dragging state

### 3. Updated Homepage Sections
- **Featured Movies** (mobile horizontal scroll)
- **Recently Added** (horizontal scroll)
- **Tag-based Sections** (movie, korea drama, LGBT, thai series, western series, variety show)

## How It Works

### Desktop Experience
1. **Visual Indicators**: 
   - Cursor changes to "grab" when hovering over scrollable sections
   - Cursor changes to "grabbing" when actively dragging
   - Cards have enhanced hover effects when not dragging
   - Subtle scroll indicators appear on hover
   - Custom scrollbar with smooth transitions

2. **Smooth Interactions**:
   - **Click and drag**: Ultra-smooth horizontal scrolling with momentum
   - **Navigation arrows**: Left/right buttons for precise content navigation
   - **Momentum scrolling**: Physics-based deceleration after drag ends
   - **Enhanced wheel**: Vertical mouse wheel converts to smooth horizontal scroll
   - **Snap scrolling**: Proximity-based snap alignment for better positioning
   - **Performance**: 60fps animations with requestAnimationFrame
   - **Smart behavior**: Auto-adjusts scroll speed based on gesture

### Mobile Experience
- **Clean interface**: Navigation arrows are hidden for uncluttered touch experience
- **Native scrolling**: Continues to use optimized touch scrolling
- **Drag disabled**: Mouse drag feature disabled on touch devices to avoid conflicts

## Technical Implementation

### Mouse Event Handling
```javascript
// Key events handled:
- mousedown: Initiate drag
- mousemove: Update scroll position
- mouseup: End drag
- mouseleave: End drag (safety)
```

### Device Detection
```javascript
// Only enable on non-touch devices
if (window.matchMedia('(pointer: coarse)').matches) return
```

### Performance Considerations
- **React optimization**: Uses `useCallback` for event handlers to prevent re-renders
- **Memory management**: Proper cleanup of event listeners and animations
- **Smooth rendering**: `requestAnimationFrame` for 60fps scrolling
- **Momentum physics**: Optimized friction and velocity calculations
- **Passive listeners**: Non-blocking event handling where possible
- **Smart scroll speed**: Dynamic multiplier (1.2x) for optimal feel
- **Reduced reflows**: Efficient DOM manipulation during drag

## Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Falls back to native touch scrolling

## Usage in Other Components
To add mouse drag functionality to new horizontal scroll containers:

```tsx
import { useMouseDrag } from '@/hooks/useMouseDrag'

const MyComponent = () => {
  const dragRef = useMouseDrag()
  
  return (
    <div 
      ref={dragRef}
      className="overflow-x-auto no-scrollbar flex gap-4"
    >
      {/* Your content */}
    </div>
  )
}
```

## Future Enhancements
- Add keyboard navigation (arrow keys)
- Implement scroll indicators
- Add smooth scroll-to-position functionality
- Consider adding momentum/inertia scrolling