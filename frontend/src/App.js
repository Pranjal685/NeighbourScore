import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoadScript } from '@react-google-maps/api';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './pages/LoadingScreen';
import ReportPage from './pages/ReportPage';
import NotFoundPage from './pages/NotFoundPage';
import ReportSkeleton from './components/ReportSkeleton';
import MethodologyPage from './pages/MethodologyPage';
import { getScore, getReportBySlug } from './services/api';

const LIBRARIES = ['places'];

function App() {
  const [appState, setAppState] = useState('search'); // 'search'|'loading'|'skeleton'|'results'|'error'|'notfound'|'methodology'
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, name: '' });
  const [selectedProfile, setSelectedProfile] = useState('general');
  const [error, setError] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/methodology') {
      setAppState('methodology');
    } else if (path.startsWith('/report/')) {
      const slug = path.split('/report/')[1];
      if (slug) {
        setAppState('loading');
        getReportBySlug(slug)
          .then(data => {
            setResult(data);
            setLocation({ lat: null, lng: null, name: data.locality });
            setSelectedProfile(data.profile || 'general');
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
        new Promise(r => setTimeout(r, 1500)) // minimum 1.5s loading screen
      ]);

      // Validate we got a real response with dimensions
      if (!data || !data.composite || !data.dimensions) {
        throw new Error('Invalid response from server. Please try again.');
      }

      setResult(data);
      setAppState('skeleton');
      setTimeout(() => setAppState('results'), 300);
    } catch (err) {
      console.error('Score fetch failed:', err);
      setError(err.message || 'Failed to analyze this locality. Please try again.');
      setAppState('error');
    }
  };

  const handleNewSearch = () => {
    window.history.pushState({}, '', '/');
    setAppState('search');
    setResult(null);
    setError(null);
  };

  const handleGoMethodology = () => {
    window.history.pushState({}, '', '/methodology');
    setAppState('methodology');
  };

  const handleGoHome = () => {
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
            onGoMethodology={handleGoMethodology}
          />
        )}
        {appState === 'loading' && (
          <LoadingScreen key="loading" localityName={location.name} />
        )}
        {appState === 'skeleton' && (
          <ReportSkeleton key="skeleton" />
        )}
        {appState === 'error' && (
          <div key="error" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #eef0ff 0%, #f8f4ff 100%)',
            gap: 24,
            padding: 32,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1A1A2E', margin: 0 }}>
              Analysis Failed
            </h2>
            <p style={{ color: '#555', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
              {error || 'Something went wrong. The server may be starting up.'}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => handleSearch(location.lat, location.lng, location.name, selectedProfile)}
                style={{
                  padding: '12px 28px',
                  background: '#6366F1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                🔄 Retry
              </button>
              <button
                onClick={handleNewSearch}
                style={{
                  padding: '12px 28px',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#6366F1',
                  border: '1.5px solid #6366F1',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                ← New Search
              </button>
            </div>
          </div>
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
            onGoMethodology={handleGoMethodology}
          />
        )}
        {appState === 'notfound' && (
          <NotFoundPage key="notfound" onGoHome={handleNewSearch} />
        )}
        {appState === 'methodology' && (
          <MethodologyPage key="methodology" onGoHome={handleGoHome} />
        )}
      </AnimatePresence>
    </LoadScript>
  );
}

export default App;
