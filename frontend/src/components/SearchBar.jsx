import React, { useRef, useState, useCallback } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    } else if (inputValue.trim()) {
      if (!window.google) return;
      const geocoder = new window.google.maps.Geocoder();
      const query = inputValue.toLowerCase().includes('pune') ? inputValue : `${inputValue}, Pune, India`;
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          const name = results[0].formatted_address;
          setInputValue(name);
          onSearch(lat, lng, name);
        } else {
          alert('Could not find this location. Please try selecting from the dropdown.');
        }
      });
    }
  }, [onSearch, inputValue]);

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
      <motion.div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 16,
        padding: '5px 5px 5px 16px',
        width: '100%',
      }}
      animate={isFocused ? {
        borderColor: 'rgba(99,102,241,0.5)',
        boxShadow: [
          '0 8px 32px rgba(99,102,241,0.1), 0 0 0 0px rgba(99,102,241,0)',
          '0 8px 32px rgba(99,102,241,0.1), 0 0 0 6px rgba(99,102,241,0.2)',
          '0 8px 32px rgba(99,102,241,0.1), 0 0 0 10px rgba(99,102,241,0.08)',
          '0 8px 32px rgba(99,102,241,0.1), 0 0 0 14px rgba(99,102,241,0.03)',
          '0 8px 32px rgba(99,102,241,0.1), 0 0 0 14px rgba(99,102,241,0)',
        ]
      } : {
        borderColor: 'rgba(255,255,255,0.9)',
        boxShadow: '0 8px 32px rgba(99,102,241,0.1), 0 2px 8px rgba(0,0,0,0.06)'
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Search size={16} color={isFocused ? '#6366F1' : '#94A3B8'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
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
            color: '#1A1A2E',
            fontSize: 16, /* 16px minimum prevents iOS auto-zoom on focus */
            flex: 1,
            padding: '9px 12px',
            fontFamily: 'var(--font-body)'
          }}
        />
        <button
          onClick={triggerSearch}
          disabled={isLoading}
          style={{
            background: isLoading ? 'linear-gradient(135deg, rgba(99,102,241,0.7), rgba(139,92,246,0.7))' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = 0.9; }}
          onMouseLeave={e => { if (!isLoading) e.currentTarget.style.opacity = 1; }}
        >
          {isLoading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </motion.div>
    </Autocomplete>
  );
}

export default SearchBar;
