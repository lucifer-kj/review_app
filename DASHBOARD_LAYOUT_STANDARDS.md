# Dashboard Layout Standards

## Overview
This document outlines the standardized layout patterns and spacing guidelines for the dashboard pages to ensure consistency across all device interfaces.

## Layout Structure

### Main Container
All dashboard pages use the same main container structure:
```tsx
<div className="w-full space-y-6 p-6">
  {/* Mobile Components */}
  <div className="lg:hidden space-y-6">
    {/* Mobile-specific components */}
  </div>

  {/* Desktop Components */}
  <div className="hidden lg:block space-y-6">
    {/* Desktop-specific components */}
  </div>
</div>
```

### Key Spacing Patterns

#### 1. Main Container Spacing
- **Outer padding**: `p-6` (24px on all sides)
- **Vertical spacing between sections**: `space-y-6` (24px between elements)
- **Responsive**: Maintains consistent spacing across all screen sizes

#### 2. Card Spacing
- **Between cards**: `space-y-6` (24px vertical spacing)
- **Card header padding**: `px-6 sm:px-8` (24px/32px horizontal padding)
- **Card content padding**: `px-6 sm:px-8` (24px/32px horizontal padding)
- **No manual margin-top**: Cards rely on `space-y-6` for consistent spacing

#### 3. Content Padding Standards
- **Small screens**: `px-6` (24px horizontal padding)
- **Medium screens and up**: `px-8` (32px horizontal padding)
- **Consistent across**: Card headers, card content, and form sections

## Page-Specific Patterns

### Dashboard Reviews Page
```tsx
// Main container with consistent spacing
<LoadingWrapper loading={isLoading} error={error} className="w-full space-y-6 p-6">
  {/* Mobile layout */}
  <div className="lg:hidden space-y-6">
    <MobileSearchFilters />
    <div className="space-y-4 px-1">
      {/* Mobile review cards */}
    </div>
  </div>

  {/* Desktop layout */}
  <div className="hidden lg:block space-y-6">
    <Breadcrumbs className="mb-4" />
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Page header */}
    </div>
    
    {/* Filter Card */}
    <Card>
      <CardHeader className="px-6 sm:px-8">
        {/* Card header content */}
      </CardHeader>
      <CardContent className="space-y-4 px-6 sm:px-8">
        {/* Card content */}
      </CardContent>
    </Card>

    {/* Reviews Table Card */}
    <Card>
      <CardHeader className="px-6 sm:px-8">
        {/* Card header content */}
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        {/* Table content */}
      </CardContent>
    </Card>
  </div>
</LoadingWrapper>
```

### Dashboard Settings Page
```tsx
// Main container with consistent spacing
<div className="w-full space-y-6 p-6">
  {/* Mobile layout */}
  <MobileSettings />

  {/* Desktop layout */}
  <div className="hidden lg:block space-y-6">
    <Breadcrumbs className="mb-4" />
    <div>
      {/* Page header */}
    </div>
    
    {/* Setup Progress Card */}
    <Card>
      <CardHeader className="px-6 sm:px-8">
        {/* Card header content */}
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        {/* Progress content */}
      </CardContent>
    </Card>

    {/* Business Information Card */}
    <Card>
      <CardHeader className="px-6 sm:px-8">
        {/* Card header content */}
      </CardHeader>
      <CardContent className="space-y-4 px-6 sm:px-8">
        {/* Form content */}
      </CardContent>
    </Card>

    {/* Google Business Integration Card */}
    <Card>
      <CardHeader className="px-6 sm:px-8">
        {/* Card header content */}
      </CardHeader>
      <CardContent className="space-y-4 px-6 sm:px-8">
        {/* Integration content */}
      </CardContent>
    </Card>

    {/* Save Button */}
    <div className="flex justify-end">
      {/* Save button */}
    </div>
  </div>
</div>
```

### Dashboard Main Page
```tsx
// Main container with consistent spacing
<LoadingWrapper loading={loading} error={null} className="w-full">
  {/* Mobile layout */}
  <MobileDashboard />
  
  {/* Desktop layout */}
  <div className="hidden lg:block w-full space-y-6 p-6">
    {/* Page header with actions */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Header content */}
    </div>

    {/* Stats Cards Grid */}
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Magic cards with stats */}
    </div>

    {/* Content Cards Grid */}
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Recent Activity Card */}
      <Card>
        <CardHeader className="px-6 sm:px-8">
          {/* Card header content */}
        </CardHeader>
        <CardContent className="px-6 sm:px-8">
          {/* Activity content */}
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader className="px-6 sm:px-8">
          {/* Card header content */}
        </CardHeader>
        <CardContent className="px-6 sm:px-8">
          {/* Actions content */}
        </CardContent>
      </Card>
    </div>
  </div>
</LoadingWrapper>
```

## Responsive Design Guidelines

### Breakpoints
- **Mobile**: `< 1024px` (lg breakpoint)
- **Desktop**: `≥ 1024px` (lg breakpoint)

### Mobile-First Approach
1. **Mobile components**: Hidden on desktop (`lg:hidden`)
2. **Desktop components**: Hidden on mobile (`hidden lg:block`)
3. **Responsive padding**: `px-6 sm:px-8` (24px on mobile, 32px on larger screens)

### Grid Layouts
- **Stats cards**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Content cards**: `grid-cols-1 lg:grid-cols-2`
- **Form grids**: `grid-cols-1 lg:grid-cols-2`

## Typography Standards

### Headings
- **Page titles**: `text-2xl sm:text-3xl font-bold`
- **Card titles**: `text-lg sm:text-xl`
- **Section titles**: `text-sm font-medium`

### Text Sizes
- **Base text**: `text-sm sm:text-base`
- **Small text**: `text-xs sm:text-sm`
- **Muted text**: `text-muted-foreground`

## Component Spacing

### Buttons
- **Button groups**: `gap-2` or `gap-3`
- **Button sizes**: `size="sm"`, `size="lg"` for primary actions
- **Responsive text**: `text-sm sm:text-base`

### Form Elements
- **Input groups**: `space-y-2` for label + input
- **Form sections**: `space-y-4` between form groups
- **Grid layouts**: `gap-4` for form field grids

### Tables
- **Table padding**: `px-2 sm:px-4` for cells
- **Table headers**: `px-3 py-3 text-xs sm:text-sm`
- **Responsive columns**: Hide less important columns on smaller screens

## Best Practices

### 1. Consistent Spacing
- Always use `space-y-6` for vertical spacing between major sections
- Use `px-6 sm:px-8` for consistent horizontal padding
- Avoid manual margin classes (`mt-6`, `mb-4`, etc.) in favor of `space-y-*`

### 2. Mobile-First Design
- Design for mobile first, then enhance for desktop
- Use responsive utilities (`sm:`, `lg:`) for progressive enhancement
- Ensure touch-friendly button sizes on mobile

### 3. Card Structure
- Always include `CardHeader` and `CardContent` with consistent padding
- Use `CardTitle` and `CardDescription` for proper semantic structure
- Maintain consistent spacing within cards

### 4. Loading States
- Use `LoadingWrapper` for consistent loading states
- Provide skeleton components for better UX
- Handle error states gracefully

### 5. Accessibility
- Use semantic HTML structure
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Maintain sufficient color contrast

## Implementation Checklist

When creating new dashboard pages, ensure:

- [ ] Main container uses `w-full space-y-6 p-6`
- [ ] Mobile and desktop layouts are properly separated
- [ ] Cards use `px-6 sm:px-8` for header and content padding
- [ ] Vertical spacing uses `space-y-6` between sections
- [ ] Typography follows established patterns
- [ ] Responsive design works on all screen sizes
- [ ] Loading and error states are handled
- [ ] Accessibility requirements are met

This standardized approach ensures a professional, consistent, and responsive user experience across all dashboard pages.
