import * as React from "react"
import { cn } from "@/lib/utils"
import { useBreakpoint } from "@/hooks/use-mobile"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { ChevronDown, ChevronRight } from "lucide-react"

interface ResponsiveTableColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: any, item: T) => React.ReactNode
  mobileRender?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
  mobilePriority?: number // Higher number = more important on mobile
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: ResponsiveTableColumn<T>[]
  keyField: keyof T
  className?: string
  emptyMessage?: string
  loading?: boolean
  onRowClick?: (item: T) => void
  mobileCardTitle?: (item: T) => string
  mobileCardDescription?: (item: T) => string
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyField,
  className,
  emptyMessage = "No data available",
  loading = false,
  onRowClick,
  mobileCardTitle,
  mobileCardDescription
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useBreakpoint()
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedRows(newExpanded)
  }

  // Sort columns by mobile priority for mobile view
  const sortedColumns = React.useMemo(() => {
    if (!isMobile) return columns
    return [...columns].sort((a, b) => (b.mobilePriority || 0) - (a.mobilePriority || 0))
  }, [columns, isMobile])

  // Get primary columns for mobile (top 2-3 most important)
  const primaryColumns = sortedColumns.slice(0, 2)
  const secondaryColumns = sortedColumns.slice(2)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  // Mobile view - Card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          const key = String(item[keyField])
          const isExpanded = expandedRows.has(key)
          const title = mobileCardTitle ? mobileCardTitle(item) : String(item[primaryColumns[0]?.key as keyof T] || `Item ${index + 1}`)
          const description = mobileCardDescription ? mobileCardDescription(item) : String(item[primaryColumns[1]?.key as keyof T] || '')

          return (
            <Card key={key} className={cn(
              "transition-all duration-200",
              onRowClick && "cursor-pointer hover:shadow-md",
              isExpanded && "shadow-md"
            )}>
              <CardContent 
                className="p-4"
                onClick={() => onRowClick?.(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {title}
                    </CardTitle>
                    {description && (
                      <CardDescription className="text-xs mt-1 truncate">
                        {description}
                      </CardDescription>
                    )}
                  </div>
                  {secondaryColumns.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleRow(key)
                      }}
                      className="ml-2 h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && secondaryColumns.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {secondaryColumns.map((column) => {
                      const value = column.key.includes('.') 
                        ? column.key.split('.').reduce((obj, key) => obj?.[key], item as any)
                        : item[column.key as keyof T]
                      
                      return (
                        <div key={String(column.key)} className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground font-medium">
                            {column.label}:
                          </span>
                          <div className="text-xs text-right">
                            {column.mobileRender ? column.mobileRender(item) : (
                              column.render ? column.render(value, item) : String(value || '-')
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Tablet/Desktop view - Table layout
  return (
    <div className={cn(
      "rounded-md border",
      // Mobile: no horizontal scroll needed
      isTablet ? "overflow-x-auto" : "overflow-x-auto"
    )}>
      <Table className={cn("w-full", className)}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={String(column.key)} 
                className={cn(
                  "whitespace-nowrap",
                  column.className
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const key = String(item[keyField])
            return (
              <TableRow 
                key={key}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => {
                  const value = column.key.includes('.') 
                    ? column.key.split('.').reduce((obj, key) => obj?.[key], item as any)
                    : item[column.key as keyof T]
                  
                  return (
                    <TableCell 
                      key={String(column.key)}
                      className={cn(
                        "whitespace-nowrap",
                        column.className
                      )}
                    >
                      {column.render ? column.render(value, item) : String(value || '-')}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// Utility function to create common column configurations
export function createTableColumn<T>(
  key: keyof T | string,
  label: string,
  options: Partial<ResponsiveTableColumn<T>> = {}
): ResponsiveTableColumn<T> {
  return {
    key,
    label,
    mobilePriority: 0,
    ...options
  }
}

// Common render functions
export const tableRenderers = {
  badge: (value: string, variant: "default" | "secondary" | "destructive" | "outline" = "default") => 
    (value: any) => <Badge variant={variant}>{String(value)}</Badge>,
  
  date: (value: any) => {
    if (!value) return '-'
    const date = new Date(value)
    return date.toLocaleDateString()
  },
  
  datetime: (value: any) => {
    if (!value) return '-'
    const date = new Date(value)
    return date.toLocaleString()
  },
  
  email: (value: any) => (
    <a 
      href={`mailto:${value}`} 
      className="text-primary hover:underline"
    >
      {String(value)}
    </a>
  ),
  
  status: (value: any) => {
    const status = String(value).toLowerCase()
    const variant = status === 'active' ? 'default' : 
                   status === 'inactive' ? 'secondary' : 
                   status === 'pending' ? 'outline' : 'destructive'
    return <Badge variant={variant}>{String(value)}</Badge>
  }
}
