import React, { useRef, useState, useCallback } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Search, Loader2 } from 'lucide-react';

function SearchBar({ onSearch, isLoading }) {
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const onLoad = useCallback((autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const triggerSearch = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const name = place.formatted_address || place.name;
      setInputValue(name);
      onSearch(lat, lng, name);
    }
  }, [onSearch]);

  const onPlaceChanged = useCallback(() => {
    triggerSearch();
  }, [triggerSearch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') triggerSearch();
  };

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        componentRestrictions: { country: 'in' },
        bounds: { north: 18.65, south: 18.40, east: 74.00, west: 73.70 },
        types: ['geocode', 'establishment']
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        border: `1px solid ${isFocused ? 'rgba(230,168,23,0.4)' : 'var(--border-mid)'}`,
        borderRadius: 14,
        padding: '5px 5px 5px 16px',
        width: '100%',
        boxShadow: isFocused ? '0 0 0 3px rgba(230,168,23,0.1), 0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'all 0.25s ease'
      }}>
        <Search size={16} color={isFocused ? '#E6A817' : 'var(--text-muted)'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
        <input
          type="text"
          placeholder="Search locality e.g. Wakad, Baner, Kothrud..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 15,
            flex: 1,
            padding: '9px 12px',
            fontFamily: 'var(--font-body)'
          }}
        />
        <button
          onClick={triggerSearch}
          disabled={isLoading}
          style={{
            background: isLoading ? 'rgba(230,168,23,0.7)' : 'var(--accent)',
            color: '#0D1117',
            border: 'none',
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#F5B82B'; }}
          onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = 'var(--accent)'; }}
        >
          {isLoading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </Autocomplete>
  );
}

export default SearchBar;
