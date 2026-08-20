import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import MobileShell from '../components/MobileShell';
import { CATEGORY_META } from '../api';
import { db } from '../db/db';
import 'leaflet/dist/leaflet.css';

export default function MapPage() {
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    db.buildings.where('deleted').notEqual(1).toArray().then((rows) => setBuildings(rows.filter((b) => b.latitude && b.longitude)));
  }, []);

  const center = buildings[0] ? [buildings[0].latitude, buildings[0].longitude] : [-0.841, 115.8803];

  return (
    <MobileShell title="Peta Lokasi" sub={`${buildings.length} bangunan dengan koordinat`}>
      <div className="card" style={{ padding: 6, height: '60vh' }}>
        <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%', borderRadius: 10 }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {buildings.map((b) => {
            const color = CATEGORY_META[b.category_code]?.color || '#64748b';
            return (
              <CircleMarker key={b.uuid} center={[b.latitude, b.longitude]} radius={7} pathOptions={{ color, fillColor: color, fillOpacity: .85 }}>
                <Popup>
                  <strong>No. {b.no_unit}</strong> &middot; {b.capital}<br />
                  {b.category_code} &middot; Progress {b.progress_value}%
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </MobileShell>
  );
}
