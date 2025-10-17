import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CountrySelect = ({ value, onValueChange, placeholder = "Select country...", className }: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extended list of countries
    const countries: Country[] = [
      { id: '1', name: 'United States', code: 'US' },
      { id: '2', name: 'United Kingdom', code: 'GB' },
      { id: '3', name: 'Canada', code: 'CA' },
      { id: '4', name: 'Australia', code: 'AU' },
      { id: '5', name: 'Germany', code: 'DE' },
      { id: '6', name: 'France', code: 'FR' },
      { id: '7', name: 'Italy', code: 'IT' },
      { id: '8', name: 'Spain', code: 'ES' },
      { id: '9', name: 'Netherlands', code: 'NL' },
      { id: '10', name: 'Belgium', code: 'BE' },
      { id: '11', name: 'Switzerland', code: 'CH' },
      { id: '12', name: 'Austria', code: 'AT' },
      { id: '13', name: 'Sweden', code: 'SE' },
      { id: '14', name: 'Norway', code: 'NO' },
      { id: '15', name: 'Denmark', code: 'DK' },
      { id: '16', name: 'Finland', code: 'FI' },
      { id: '17', name: 'Poland', code: 'PL' },
      { id: '18', name: 'Czech Republic', code: 'CZ' },
      { id: '19', name: 'Hungary', code: 'HU' },
      { id: '20', name: 'Portugal', code: 'PT' },
      { id: '21', name: 'Greece', code: 'GR' },
      { id: '22', name: 'Ireland', code: 'IE' },
      { id: '23', name: 'Japan', code: 'JP' },
      { id: '24', name: 'South Korea', code: 'KR' },
      { id: '25', name: 'China', code: 'CN' },
      { id: '26', name: 'India', code: 'IN' },
      { id: '27', name: 'Pakistan', code: 'PK' },
      { id: '28', name: 'Bangladesh', code: 'BD' },
      { id: '29', name: 'Singapore', code: 'SG' },
      { id: '30', name: 'Malaysia', code: 'MY' },
      { id: '31', name: 'Thailand', code: 'TH' },
      { id: '32', name: 'Indonesia', code: 'ID' },
      { id: '33', name: 'Philippines', code: 'PH' },
      { id: '34', name: 'Vietnam', code: 'VN' },
      { id: '35', name: 'Saudi Arabia', code: 'SA' },
      { id: '36', name: 'United Arab Emirates', code: 'AE' },
      { id: '37', name: 'Qatar', code: 'QA' },
      { id: '38', name: 'Kuwait', code: 'KW' },
      { id: '39', name: 'Bahrain', code: 'BH' },
      { id: '40', name: 'Oman', code: 'OM' },
      { id: '41', name: 'Egypt', code: 'EG' },
      { id: '42', name: 'South Africa', code: 'ZA' },
      { id: '43', name: 'Nigeria', code: 'NG' },
      { id: '44', name: 'Kenya', code: 'KE' },
      { id: '45', name: 'Morocco', code: 'MA' },
      { id: '46', name: 'Brazil', code: 'BR' },
      { id: '47', name: 'Argentina', code: 'AR' },
      { id: '48', name: 'Chile', code: 'CL' },
      { id: '49', name: 'Mexico', code: 'MX' },
      { id: '50', name: 'Colombia', code: 'CO' },

      // Special + Additional Countries
      { id: '51', name: 'Turkey', code: 'TR' },
      { id: '52', name: 'Nepal', code: 'NP' },
      { id: '53', name: 'Sri Lanka', code: 'LK' },
      { id: '54', name: 'Maldives', code: 'MV' },
      { id: '55', name: 'Afghanistan', code: 'AF' },
      { id: '56', name: 'Iran', code: 'IR' },
      { id: '57', name: 'Iraq', code: 'IQ' },
      { id: '58', name: 'Israel', code: 'IL' },
      { id: '59', name: 'Palestine', code: 'PS' },
      { id: '60', name: 'Jordan', code: 'JO' },
      { id: '61', name: 'Lebanon', code: 'LB' },
      { id: '62', name: 'Syria', code: 'SY' },
      { id: '63', name: 'Yemen', code: 'YE' },
    ];

    setCountries(countries);
    setLoading(false);
  }, []);

  const selectedCountry = countries.find(country => country.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCountry ? selectedCountry.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50" style={{ minWidth: '300px' }}>
        <Command>
          <CommandInput 
            placeholder="Search countries..." 
            className="border-0 focus:ring-0"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>
              {loading ? "Loading countries..." : "No country found."}
            </CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.id}
                  value={country.name}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{country.name}</span>
                  <span className="text-muted-foreground text-sm">{country.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
