import React from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';

const lightMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e8f5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d5e8d4" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
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
          styles: lightMapStyles,
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
