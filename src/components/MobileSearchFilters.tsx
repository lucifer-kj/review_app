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
    <div className="lg:hidden space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Select value={ratingFilter} onValueChange={onRatingFilterChange}>
          <SelectTrigger className="flex-1">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || ratingFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex-shrink-0"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
