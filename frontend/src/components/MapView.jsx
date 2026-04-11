import React from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0D1117' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1117' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3d5070' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#4a607a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#3a5060' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#081522' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0d1e35' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0D1117' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#112038' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0D1117' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0a1828' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#030d1c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1a2f4a' }] }
];

function MapView({ lat, lng, height = 360 }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: height
    }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat, lng }}
        zoom={14}
        options={{
          styles: darkMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: 9 }
        }}
      >
        <MarkerF position={{ lat, lng }} />
      </GoogleMap>
    </div>
  );
}

export default MapView;
