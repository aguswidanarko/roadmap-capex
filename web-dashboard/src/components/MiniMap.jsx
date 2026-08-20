import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { CATEGORY_META } from '../api';
import 'leaflet/dist/leaflet.css';

export default function MiniMap({ buildings, height = 300, interactive = true }) {
  const withCoords = buildings.filter((b) => b.latitude && b.longitude);
  const center = withCoords.length
    ? [withCoords[0].latitude, withCoords[0].longitude]
    : [-0.841, 115.8803];

  return (
    <div style={{ height, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer
        center={center}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((b) => {
          const color = CATEGORY_META[b.category_code]?.color || '#64748b';
          return (
            <CircleMarker
              key={b.id}
              center={[b.latitude, b.longitude]}
              radius={6}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1.5 }}
            >
              {interactive && (
                <Popup>
                  <strong>No. Unit {b.no_unit}</strong> &middot; {b.capital}<br />
                  Unit: {b.unit_count} &middot; Tahun: {b.tahun_bangun || '–'}<br />
                  Sign: {b.category_code} &middot; Progress: {b.progress_value}%
                </Popup>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
