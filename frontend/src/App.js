import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoadScript } from '@react-google-maps/api';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './pages/LoadingScreen';
import ReportPage from './pages/ReportPage';
import NotFoundPage from './pages/NotFoundPage';
import ReportSkeleton from './components/ReportSkeleton';
import { getScore, getReportBySlug } from './services/api';

const LIBRARIES = ['places'];

function App() {
  const [appState, setAppState] = useState('search'); // 'search' | 'loading' | 'skeleton' | 'results' | 'notfound'
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, name: '' });
  const [selectedProfile, setSelectedProfile] = useState('general');
  const [error, setError] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/report/')) {
      const slug = path.split('/report/')[1];
      if (slug) {
        setAppState('loading');
        getReportBySlug(slug)
          .then(data => {
            setResult(data);
            setLocation({ lat: null, lng: null, name: data.locality });
            setSelectedProfile(data.profile || 'general');
            // Show skeleton briefly before the real report
            setAppState('skeleton');
            setTimeout(() => setAppState('results'), 300);
          })
          .catch(err => {
            console.error(err);
            setAppState('notfound');
          });
      }
    }
  }, []);

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
      // Show skeleton briefly to prevent white flash
      setAppState('skeleton');
      setTimeout(() => setAppState('results'), 300);
    } catch (err) {
      console.error('Score fetch failed:', err);
      setError('Failed to analyze this locality. Please try again.');
      setAppState('search');
    }
  };

  const handleNewSearch = () => {
    window.history.pushState({}, '', '/');
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
        {appState === 'skeleton' && (
          <ReportSkeleton key="skeleton" />
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
        {appState === 'notfound' && (
          <NotFoundPage key="notfound" onGoHome={handleNewSearch} />
        )}
      </AnimatePresence>
    </LoadScript>
  );
}

export default App;
