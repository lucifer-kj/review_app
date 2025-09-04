import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface MobileSearchFiltersProps {
  searchTerm: string;
  ratingFilter: string;
  onSearchChange: (value: string) => void;
  onRatingFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const MobileSearchFilters = ({
  searchTerm,
  ratingFilter,
  onSearchChange,
  onRatingFilterChange,
  onClearFilters
}: MobileSearchFiltersProps) => {
  return (
    <div className="lg:hidden space-y-6 p-6 pt-20">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage and analyze customer feedback
        </p>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader className="px-6 sm:px-8">
          <CardTitle className="text-lg sm:text-xl">Filter Reviews</CardTitle>
          <CardDescription className="text-sm">
            Search and filter reviews to find what you need
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 text-sm sm:text-base"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={onRatingFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="high">High (4-5 stars)</SelectItem>
                <SelectItem value="low">Low (1-3 stars)</SelectItem>
              </SelectContent>
            </Select>
            
            {(searchTerm || ratingFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="flex-shrink-0"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
