'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface SearchResult {
    '1. symbol': string;
    '2. name': string;
    '3. type': string;
    '4. region': string;
    '5. marketOpen': string;
    '6. marketClose': string;
    '7. timezone': string;
    '8. currency': string;
    '9. matchScore': string;
}

interface TickerSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    onTickerSelected?: () => void;
    loading: boolean;
    placeholder?: string;
}

export default function TickerSearchInput({
    value,
    onChange,
    onSearch,
    onTickerSelected,
    loading,
    placeholder = "Search stocks by symbol or company name..."
}: TickerSearchInputProps) {
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const searchTickers = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);

        try {
            const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

            if (!API_KEY) {
                setSearchResults([]);
                setShowSuggestions(false);
                setIsSearching(false);
                return;
            }

            const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${API_KEY}`;

            const response = await axios.get(url);

            if (response.data['Error Message']) {
                // API error
                setSearchResults([]);
                setShowSuggestions(false);
                setIsSearching(false);
                return;
            }

            if (response.data['Note']) {
                // Rate limit - don't show suggestions
                setSearchResults([]);
                setShowSuggestions(false);
                setIsSearching(false);
                return;
            }

            const results = response.data.bestMatches || [];

            const filteredResults = results
                .filter((result: SearchResult) =>
                    result['3. type'] === 'Equity' &&
                    result['4. region'] === 'United States'
                )
                .sort((a: SearchResult, b: SearchResult) =>
                    parseFloat(b['9. matchScore']) - parseFloat(a['9. matchScore'])
                )
                .slice(0, 8);

            setSearchResults(filteredResults);
            setShowSuggestions(filteredResults.length > 0);

        } catch (error) {
            setSearchResults([]);
            setShowSuggestions(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toUpperCase();
        // update the ticker value in parent
        onChange(newValue);

        // clear existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // search for suggestions, don't trigger chart updates
        if (newValue.trim() && newValue.length >= 3) {
            const timeout = setTimeout(() => {
                // gets suggestions
                searchTickers(newValue.trim());
            }, 500);
            setSearchTimeout(timeout);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (result: SearchResult) => {
        const symbol = result['1. symbol'];
        onChange(symbol);
        setShowSuggestions(false);
        setSearchResults([]);

        // notify parent that user selected a ticker
        if (onTickerSelected) {
            onTickerSelected();
        }

        // trigger sentiment analysis and chart update 
        setTimeout(() => {
            onSearch();
        }, 100);
    };

    // handle key navigation 
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (showSuggestions && searchResults.length > 0) {
                // select first suggestion on enter if suggestions are shown
                handleSuggestionClick(searchResults[0]);
            } else {
                // close suggestions and trigger analysis with current value
                setShowSuggestions(false);

                // notify parent that user entered a ticker
                if (onTickerSelected) {
                    onTickerSelected();
                }
                // trigger sentiment analysis and chart fetch
                onSearch();
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // format company name for display
    const formatCompanyName = (name: string) => {
        // remove common suffixes for cleaner display
        return name
            .replace(/\s+(Inc\.?|Corp\.?|Corporation|Company|Co\.?|Ltd\.?|LLC|LP)$/i, '')
            .trim();
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (searchResults.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 pr-12 text-lg border border-gray-600 rounded-lg bg-neutral-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {/* loading spinner for search */}
                {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* search icon when not searching */}
                {!isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* suggestions dropdown */}
            {showSuggestions && searchResults.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-neutral-800 border border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                >
                    {searchResults.map((result, index) => (
                        <div
                            key={`${result['1. symbol']}-${index}`}
                            onClick={() => handleSuggestionClick(result)}
                            className="px-4 py-3 hover:bg-neutral-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-bold text-blue-400 text-lg">
                                            {result['1. symbol']}
                                        </span>
                                        <span className="text-white font-medium">
                                            {formatCompanyName(result['2. name'])}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        {result['3. type']} • {result['8. currency']} • Match: {(parseFloat(result['9. matchScore']) * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* footer with API attribution */}
                    <div className="px-4 py-2 bg-neutral-900 text-xs text-gray-500 border-t border-gray-700">
                        Powered by Alpha Vantage Symbol Search
                    </div>
                </div>
            )}

            {/* no results message - only show if API is working but no matches found */}
            {showSuggestions && searchResults.length === 0 && !isSearching && value.length >= 3 && process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY && (
                <div className="absolute z-50 w-full mt-1 bg-neutral-800 border border-gray-600 rounded-lg shadow-lg">
                    <div className="px-4 py-3 text-gray-400 text-center">
                        No matching stocks found for "{value}"
                        <div className="text-xs mt-1 text-gray-500">
                            Press Enter to search anyway
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
