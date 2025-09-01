import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Country {
  code: string;
  country: string;
  flag: string;
  dialCode: string;
}

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onPhoneChange: (phone: string) => void;
  onCountryChange: (countryCode: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const countries: Country[] = [
  { code: "US", country: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "CA", country: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "GB", country: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "FR", country: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "DE", country: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "CN", country: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "IN", country: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "JP", country: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { code: "AU", country: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "NG", country: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
  { code: "KE", country: "Kenya", flag: "🇰🇪", dialCode: "+254" },
  { code: "ZA", country: "South Africa", flag: "🇿🇦", dialCode: "+27" },
  { code: "GE", country: "Georgia", flag: "🇬🇪", dialCode: "+995" },
];

export const PhoneInput = ({
  value,
  countryCode,
  onPhoneChange,
  onCountryChange,
  disabled = false,
  placeholder = "1234567890"
}: PhoneInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = countries.find(c => c.dialCode === countryCode) || countries[0];

  const filteredCountries = countries.filter(country =>
    country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    onCountryChange(country.dialCode);
    setIsOpen(false);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/[^\d]/g, '');
    onPhoneChange(cleanValue);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        {/* Country Selector */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="form-input rounded-r-none border-r-0 flex items-center gap-2 px-3 py-2 w-[20%] bg-background hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Phone Input */}
        <input
          ref={inputRef}
          type="tel"
          value={value}
          onChange={handlePhoneInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="form-input rounded-l-none w-[80%]"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for countries"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-sm bg-background border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="overflow-y-auto max-h-48">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={`w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-3 ${
                  selectedCountry.code === country.code ? 'bg-accent' : ''
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="text-sm">{country.country}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {country.dialCode}
                </span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};