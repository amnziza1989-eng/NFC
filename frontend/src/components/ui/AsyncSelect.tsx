import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Check, Loader2, X } from 'lucide-react';

interface AsyncSelectProps<T> {
  value: string;
  onChange: (value: string) => void;
  queryKey: string;
  queryFn: (search: string) => Promise<T[]>;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsText?: string;
  disabled?: boolean;
  className?: string;
}

export function AsyncSelect<T>({
  value,
  onChange,
  queryKey,
  queryFn,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  noOptionsText = 'No results found',
  disabled = false,
  className = '',
}: AsyncSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Optional: keep track of selected option object to show its label
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: options = [], isLoading } = useQuery({
    queryKey: [queryKey, debouncedSearch],
    queryFn: () => queryFn(debouncedSearch),
    enabled: isOpen || value !== '',
  });

  // Effect to find the selected label if we have a value but haven't cached the label
  useEffect(() => {
    if (value && options.length > 0) {
      const selectedOption = options.find((opt) => getOptionValue(opt) === value);
      if (selectedOption) {
        setSelectedLabel(getOptionLabel(selectedOption));
      }
    } else if (!value) {
      setSelectedLabel('');
    }
  }, [value, options, getOptionLabel, getOptionValue]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: T) => {
    onChange(getOptionValue(option));
    setSelectedLabel(getOptionLabel(option));
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedLabel('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`flex items-center justify-between w-full bg-white text-sm rounded-xl border px-3.5 py-2.5 transition-colors cursor-pointer ${
          disabled ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : 
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedLabel ? 'text-slate-900 font-bold' : 'text-slate-400'}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedLabel && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full bg-white text-sm rounded-lg border border-slate-200 py-2 pr-9 pl-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <ul className="max-h-60 overflow-y-auto p-1">
            {isLoading ? (
              <li className="flex items-center justify-center py-6 text-slate-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </li>
            ) : options.length === 0 ? (
              <li className="py-6 text-center text-slate-400 text-sm">{noOptionsText}</li>
            ) : (
              options.map((option, idx) => {
                const optValue = getOptionValue(option);
                const optLabel = getOptionLabel(option);
                const isSelected = value === optValue;
                
                return (
                  <li
                    key={optValue || idx}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    <span>{optLabel}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
