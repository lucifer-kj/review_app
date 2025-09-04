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
    <div className="lg:hidden space-y-4 px-1">
      {/* Page Title */}
      <div className="px-2">
        <h1 className="text-2xl font-bold mb-2">Reviews</h1>
        <p className="text-muted-foreground">Manage and analyze customer feedback</p>
      </div>

      {/* Search Bar */}
      <div className="relative px-2">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 pr-12 h-12 text-base shadow-lg border-2 rounded-xl"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex gap-3 px-2">
        <Select value={ratingFilter} onValueChange={onRatingFilterChange}>
          <SelectTrigger className="flex-1 h-12 text-base shadow-lg border-2 rounded-xl">
            <Filter className="h-5 w-5 mr-3" />
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base py-3">All Ratings</SelectItem>
            <SelectItem value="5" className="text-base py-3">5 Stars ⭐⭐⭐⭐⭐</SelectItem>
            <SelectItem value="4" className="text-base py-3">4 Stars ⭐⭐⭐⭐</SelectItem>
            <SelectItem value="3" className="text-base py-3">3 Stars ⭐⭐⭐</SelectItem>
            <SelectItem value="2" className="text-base py-3">2 Stars ⭐⭐</SelectItem>
            <SelectItem value="1" className="text-base py-3">1 Star ⭐</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || ratingFilter !== "all") && (
          <Button
            variant="outline"
            size="lg"
            onClick={onClearFilters}
            className="flex-shrink-0 h-12 px-6 text-base font-medium shadow-lg border-2 rounded-xl"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
