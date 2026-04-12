import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoadScript } from '@react-google-maps/api';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './pages/LoadingScreen';
import ReportPage from './pages/ReportPage';
import { getScore } from './services/api';

const LIBRARIES = ['places'];

function App() {
  const [appState, setAppState] = useState('search'); // 'search' | 'loading' | 'results'
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, name: '' });
  const [selectedProfile, setSelectedProfile] = useState('general');
  const [error, setError] = useState(null);

  const handleSearch = async (lat, lng, name, profile) => {
    const activeProfile = profile || selectedProfile || 'general';
    setLocation({ lat, lng, name });
    setAppState('loading');
    setError(null);

    try {
      const [data] = await Promise.all([
        getScore(lat, lng, name, activeProfile),
        new Promise(r => setTimeout(r, 2000)) // minimum 2s loading screen
      ]);
      setResult(data);
      setAppState('results');
    } catch (err) {
      console.error('Score fetch failed:', err);
      setError('Failed to analyze this locality. Please try again.');
      setAppState('search');
    }
  };

  const handleNewSearch = () => {
    setAppState('search');
    setResult(null);
    setError(null);
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={LIBRARIES}
    >
      <AnimatePresence mode="wait">
        {appState === 'search' && (
          <LandingPage
            key="landing"
            onSearch={handleSearch}
            error={error}
            selectedProfile={selectedProfile}
            onProfileChange={setSelectedProfile}
          />
        )}
        {appState === 'loading' && (
          <LoadingScreen key="loading" localityName={location.name} />
        )}
        {appState === 'results' && result && (
          <ReportPage
            key="results"
            result={result}
            lat={location.lat}
            lng={location.lng}
            onNewSearch={handleNewSearch}
            profile={selectedProfile}
            onSearch={handleSearch}
          />
        )}
      </AnimatePresence>
    </LoadScript>
  );
}

export default App;
