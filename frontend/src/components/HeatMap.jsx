import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Polygon, OverlayView } from '@react-google-maps/api';
import puneLocalities from '../data/pune_localities.json';

function safeGtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// ─── Map styles: clean light theme so polygons pop ───────────────────────────
const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f9f9f9' }] },
];

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

// ─── Color helpers ────────────────────────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 75) return '#10B981'; // green — premium
  if (score >= 55) return '#F59E0B'; // amber — good/developing
  return '#EF4444';                   // red — needs attention
}

function getTierLabel(score) {
  if (score >= 75) return 'Premium';
  if (score >= 55) return 'Good';
  return 'Developing';
}

// Average all coordinate pairs to find polygon centroid
function getPolygonCenter(coordinates) {
  const ring = coordinates[0];
  let lat = 0, lng = 0;
  for (const [lo, la] of ring) {
    lng += lo;
    lat += la;
  }
  return { lat: lat / ring.length, lng: lng / ring.length };
}

// Convert GeoJSON [lng, lat] array to Google Maps {lat, lng} objects
function toLatLng(coordinates) {
  return coordinates[0].map(([lng, lat]) => ({ lat, lng }));
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 32,
      left: 16,
      background: 'rgba(255,255,255,0.93)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 12,
      padding: '14px 18px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      zIndex: 10,
      pointerEvents: 'none',
      border: '1px solid rgba(255,255,255,0.9)',
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#1A1A2E',
        marginBottom: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        NeighbourScore
      </div>
      {[
        { color: '#10B981', range: '75–100', tier: 'Premium' },
        { color: '#F59E0B', range: '55–74',  tier: 'Good' },
        { color: '#EF4444', range: '<55',     tier: 'Developing' },
      ].map(({ color, range, tier }) => (
        <div key={tier} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: tier === 'Developing' ? 0 : 6,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: color, flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#64748B' }}>
            {range} · {tier}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Desktop hover tooltip (OverlayView) ─────────────────────────────────────
function HoverTooltip({ feature }) {
  const { name, score } = feature.properties;
  const color = getScoreColor(score);
  const center = getPolygonCenter(feature.geometry.coordinates);

  return (
    <OverlayView
      position={center}
      mapPaneName={OverlayView.FLOAT_PANE}
      getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h + 14) })}
    >
      <div style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.9)',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          minWidth: 160,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#1A1A2E', marginBottom: 5,
            letterSpacing: '-0.01em',
          }}>
            {name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8,
          }}>
            <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>/100</span>
          </div>
          <div style={{
            display: 'inline-block',
            background: `${color}1A`,
            color,
            fontSize: 11, fontWeight: 600,
            padding: '3px 9px',
            borderRadius: 6,
            marginBottom: 8,
            border: `1px solid ${color}30`,
          }}>
            {getTierLabel(score)}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            Click to analyze →
          </div>
        </div>
        {/* Arrow pointer */}
        <div style={{
          width: 0, height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '7px solid rgba(255,255,255,0.97)',
          margin: '0 auto',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.06))',
        }} />
      </div>
    </OverlayView>
  );
}

// ─── Polygon label (always visible at zoom ≥ 12) ─────────────────────────────
function PolygonLabel({ feature }) {
  const { name, score } = feature.properties;
  const color = getScoreColor(score);
  const center = getPolygonCenter(feature.geometry.coordinates);

  return (
    <OverlayView
      position={center}
      mapPaneName={OverlayView.OVERLAY_LAYER}
      getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
    >
      <div style={{ pointerEvents: 'none', textAlign: 'center', userSelect: 'none' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#1A1A2E',
          background: 'rgba(255,255,255,0.88)',
          padding: '1px 6px', borderRadius: 4,
          whiteSpace: 'nowrap', lineHeight: 1.6,
          marginBottom: 2,
        }}>
          {name}
        </div>
        <div style={{
          display: 'inline-block',
          fontSize: 10, fontWeight: 800, color: '#fff',
          background: color,
          padding: '1px 7px', borderRadius: 8, lineHeight: 1.5,
        }}>
          {score}
        </div>
      </div>
    </OverlayView>
  );
}

// ─── Mobile bottom sheet ─────────────────────────────────────────────────────
function MobileSheet({ feature, onAnalyze, onDismiss }) {
  const { name, score } = feature.properties;
  const color = getScoreColor(score);

  return (
    <div
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px 16px 0 0',
        padding: '16px 20px 24px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        zIndex: 20,
        animation: 'slideUp 0.25s ease-out',
      }}
    >
      {/* Drag handle */}
      <div style={{
        width: 36, height: 4, background: 'rgba(0,0,0,0.12)',
        borderRadius: 2, margin: '0 auto 14px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', marginBottom: 2 }}>
            {name}
          </div>
          <span style={{
            display: 'inline-block',
            background: `${color}1A`, color,
            fontSize: 12, fontWeight: 600,
            padding: '2px 10px', borderRadius: 6,
            border: `1px solid ${color}30`,
          }}>
            {getTierLabel(score)}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>/100</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button
          onClick={onDismiss}
          style={{
            flex: 1, padding: '11px 0',
            background: 'rgba(0,0,0,0.05)', border: 'none',
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: '#64748B', cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
        <button
          onClick={onAnalyze}
          style={{
            flex: 2, padding: '11px 0',
            background: '#6366F1', border: 'none',
            borderRadius: 10, fontSize: 13, fontWeight: 700,
            color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          Analyze {name} →
        </button>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function MapSkeleton() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(240,244,255,0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 30,
      borderRadius: 'inherit',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(99,102,241,0.15)',
          borderTopColor: '#6366F1',
          animation: 'spin 0.9s linear infinite',
          margin: '0 auto 14px',
        }} />
        <p style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
          Loading Pune map…
        </p>
      </div>
    </div>
  );
}

// ─── Main HeatMap component ───────────────────────────────────────────────────
function HeatMap({ onLocalityClick }) {
  const [hoveredLocality, setHoveredLocality] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const mapRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) setZoom(mapRef.current.getZoom());
  }, []);

  // Close mobile sheet when tapping on the map background
  const onMapClick = useCallback(() => {
    if (isMobile) setHoveredLocality(null);
  }, [isMobile]);

  const hoveredFeature = hoveredLocality
    ? puneLocalities.features.find(f => f.properties.name === hoveredLocality)
    : null;

  const handleAnalyze = useCallback((feature) => {
    const center = getPolygonCenter(feature.geometry.coordinates);
    safeGtag('event', 'heatmap_click', {
      locality_name: feature.properties.name,
      score: feature.properties.score,
    });
    onLocalityClick({
      ...feature.properties,
      lat: center.lat,
      lng: center.lng,
    });
  }, [onLocalityClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!mapLoaded && <MapSkeleton />}

      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={PUNE_CENTER}
        zoom={12}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
        }}
        onLoad={onLoad}
        onZoomChanged={onZoomChanged}
        onClick={onMapClick}
      >
        {puneLocalities.features.map((feature) => {
          const { name, score } = feature.properties;
          const isHovered = hoveredLocality === name;
          const color = getScoreColor(score);
          const paths = toLatLng(feature.geometry.coordinates);

          return (
            <React.Fragment key={name}>
              {/* ── Colored polygon ── */}
              <Polygon
                paths={paths}
                options={{
                  fillColor: color,
                  fillOpacity: isHovered ? 0.7 : 0.45,
                  strokeColor: color,
                  strokeOpacity: 0.9,
                  strokeWeight: isHovered ? 3 : 1.5,
                  clickable: true,
                }}
                onMouseOver={() => !isMobile && setHoveredLocality(name)}
                onMouseOut={() => !isMobile && setHoveredLocality(null)}
                onClick={() => {
                  if (isMobile) {
                    // Mobile: tap opens bottom sheet preview first
                    setHoveredLocality(name);
                  } else {
                    // Desktop: click goes straight to analysis
                    handleAnalyze(feature);
                  }
                }}
              />

              {/* ── Polygon label (desktop, not hovered) ── */}
              {mapLoaded && zoom >= 12 && !isHovered && !isMobile && (
                <PolygonLabel feature={feature} />
              )}
            </React.Fragment>
          );
        })}

        {/* ── Hover tooltip (desktop only) ── */}
        {mapLoaded && hoveredFeature && !isMobile && (
          <HoverTooltip feature={hoveredFeature} />
        )}
      </GoogleMap>

      {/* ── Legend (HTML overlay, not inside map canvas) ── */}
      <Legend />

      {/* ── Mobile bottom sheet ── */}
      {hoveredFeature && isMobile && (
        <MobileSheet
          feature={hoveredFeature}
          onAnalyze={() => handleAnalyze(hoveredFeature)}
          onDismiss={() => setHoveredLocality(null)}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default HeatMap;
