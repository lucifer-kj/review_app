import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-sm hover:shadow-primary/20",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm hover:shadow-secondary/20",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:shadow-sm hover:shadow-destructive/20",
        outline: "text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        success:
          "border-transparent bg-green-600 text-white hover:bg-green-700 hover:shadow-sm hover:shadow-green-600/20",
        warning:
          "border-transparent bg-yellow-600 text-white hover:bg-yellow-700 hover:shadow-sm hover:shadow-yellow-600/20",
        info:
          "border-transparent bg-blue-600 text-white hover:bg-blue-700 hover:shadow-sm hover:shadow-blue-600/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
