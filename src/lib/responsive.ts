/**
 * Responsive Design Utilities
 * 
 * This file provides utility functions and classes for responsive design
 * across all screen sizes with consistent spacing and typography.
 */

import { cn } from './utils';

// Breakpoint utilities
export const breakpoints = {
  mobile: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Responsive spacing utilities
export const spacing = {
  // Mobile-first spacing
  mobile: {
    padding: 'p-3 sm:p-4',
    margin: 'm-3 sm:m-4',
    gap: 'gap-3 sm:gap-4',
  },
  // Tablet spacing
  tablet: {
    padding: 'p-4 lg:p-6',
    margin: 'm-4 lg:m-6',
    gap: 'gap-4 lg:gap-6',
  },
  // Desktop spacing
  desktop: {
    padding: 'p-6',
    margin: 'm-6',
    gap: 'gap-6',
  },
} as const;

// Responsive typography utilities
export const typography = {
  // Headings
  h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold',
  h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold',
  h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold',
  h4: 'text-base sm:text-lg md:text-xl lg:text-2xl font-medium',
  h5: 'text-sm sm:text-base md:text-lg lg:text-xl font-medium',
  h6: 'text-xs sm:text-sm md:text-base lg:text-lg font-medium',
  
  // Body text
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm',
  large: 'text-base sm:text-lg md:text-xl',
  
  // Labels
  label: 'text-xs sm:text-sm font-medium',
  caption: 'text-xs text-muted-foreground',
} as const;

// Responsive grid utilities
export const grid = {
  // Mobile-first grid
  mobile: 'grid-cols-1',
  // Responsive grid
  responsive: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // Card grid
  cards: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // Table grid
  table: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
} as const;

// Responsive container utilities
export const container = {
  // Mobile container
  mobile: 'w-full px-3 sm:px-4',
  // Tablet container
  tablet: 'w-full px-4 lg:px-6',
  // Desktop container
  desktop: 'w-full px-6',
  // Full width container
  full: 'w-full',
  // Centered container
  centered: 'w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6',
} as const;

// Responsive flex utilities
export const flex = {
  // Mobile flex
  mobile: 'flex flex-col sm:flex-row',
  // Responsive flex
  responsive: 'flex flex-col sm:flex-row lg:flex-row',
  // Card flex
  card: 'flex flex-col',
  // Header flex
  header: 'flex flex-col sm:flex-row items-start sm:items-center justify-between',
} as const;

// Responsive visibility utilities
export const visibility = {
  // Mobile only
  mobileOnly: 'block sm:hidden',
  // Tablet and up
  tabletUp: 'hidden sm:block',
  // Desktop and up
  desktopUp: 'hidden lg:block',
  // Mobile and tablet
  mobileTablet: 'block lg:hidden',
} as const;

// Responsive sizing utilities
export const sizing = {
  // Mobile sizing
  mobile: {
    button: 'h-8 px-3 text-xs',
    input: 'h-8 px-3 text-sm',
    card: 'p-3',
  },
  // Tablet sizing
  tablet: {
    button: 'h-9 px-4 text-sm',
    input: 'h-9 px-4 text-sm',
    card: 'p-4',
  },
  // Desktop sizing
  desktop: {
    button: 'h-10 px-4 text-sm',
    input: 'h-10 px-4 text-sm',
    card: 'p-6',
  },
} as const;

// Responsive component utilities
export const components = {
  // Card component
  card: cn(
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    'p-3 sm:p-4 lg:p-6'
  ),
  
  // Button component
  button: cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    'h-8 px-3 sm:h-9 sm:px-4 lg:h-10 lg:px-4'
  ),
  
  // Input component
  input: cn(
    'flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
    'sm:h-9 sm:px-4',
    'lg:h-10 lg:px-4',
    'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50'
  ),
  
  // Badge component
  badge: cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'px-2 py-1 sm:px-2.5 sm:py-0.5'
  ),
} as const;

// Responsive hook for conditional rendering
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, isTablet, isDesktop };
};

// Responsive class generator
export const responsive = {
  // Generate responsive classes
  classes: (base: string, mobile?: string, tablet?: string, desktop?: string) => {
    return cn(
      base,
      mobile && `sm:${mobile}`,
      tablet && `md:${tablet}`,
      desktop && `lg:${desktop}`
    );
  },
  
  // Generate responsive spacing
  spacing: (mobile: string, tablet?: string, desktop?: string) => {
    return cn(
      mobile,
      tablet && `sm:${tablet}`,
      desktop && `lg:${desktop}`
    );
  },
  
  // Generate responsive grid
  grid: (mobile: string, tablet?: string, desktop?: string) => {
    return cn(
      mobile,
      tablet && `sm:${tablet}`,
      desktop && `lg:${desktop}`
    );
  },
} as const;

export default {
  breakpoints,
  spacing,
  typography,
  grid,
  container,
  flex,
  visibility,
  sizing,
  components,
  useResponsive,
  responsive,
};