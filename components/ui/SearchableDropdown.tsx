import { useState, useRef, useEffect } from 'react';
import { Material, LaborRate } from '@/types';

type Option = Material | LaborRate;

interface SearchableDropdownProps {
  value: string;
  onSearch: (term: string) => void;
  options: Option[];
  onSelect: (option: Option) => void;
  placeholder?: string;
}

export function SearchableDropdown({ 
  value, 
  onSearch, 
  options, 
  onSelect, 
  placeholder = "Search..." 
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onSearch(newValue);
    setIsOpen(true);
  };

  const handleSelect = (option: Option) => {
    onSelect(option);
    setIsOpen(false);
  };

  const displayOption = (option: Option) => {
    if ('name' in option) return option.name; // Material
    if ('title' in option) return `${option.title} ${option.level || ''}`.trim(); // Labor
    return '';
  };

  const getPriceInfo = (option: Option) => {
    if ('pricePerUnit' in option) return `$${option.pricePerUnit.toFixed(2)}/${option.unit}`;
    if ('loadedRate' in option) return `$${option.loadedRate.toFixed(2)}/hr`;
    return '';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={searchValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full p-1 border border-slate-700 bg-slate-900 text-white rounded"
      />
      
      {isOpen && options.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option)}
              className="p-2 hover:bg-slate-700 cursor-pointer text-white"
            >
              <div className="font-medium">{displayOption(option)}</div>
              <div className="text-sm text-slate-400">
                {getPriceInfo(option)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}