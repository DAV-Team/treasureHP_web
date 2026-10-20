import { divIcon, latLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AttributionControl, MapContainer, Marker, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { HAI_PHONG_CENTER, type MapLocation } from '../../lib/mapLocations';
import { LocationMarker } from './LocationMarker';

interface OpenStreetMapViewProps {
  locations: MapLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Shown when this map is standing in for Google Maps that failed to load. */
  notice?: string;
}

const noop = () => undefined;

// Real street map that needs no API key, used until Google Maps is configured (or when it fails to load).
// Tiles come from the OSM France mirror (CARTO's free Voyager basemap has since been retired/requires a key).
export function OpenStreetMapView({ locations, selectedId, onSelect, notice }: OpenStreetMapViewProps) {
  return (
    <div className="relative size-full min-h-72">
      <MapContainer center={[HAI_PHONG_CENTER.lat, HAI_PHONG_CENTER.lng]} zoom={12} zoomControl={false} attributionControl={false} className="size-full !bg-[#cfe8ea]" aria-label="Bản đồ Hải Phòng">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          subdomains="abc"
          maxZoom={20}
        />
        <ZoomControl position="topright" />
        {/* The floating filter panel sits top-left, the location card bottom-right; attribution stays in the free corner. */}
        <AttributionControl position="bottomleft" prefix={false} />
        <Viewport locations={locations} selectedId={selectedId} />
        {locations.map((location) => (
          <PinMarker key={location.id} location={location} selected={location.id === selectedId} onSelect={onSelect} />
        ))}
      </MapContainer>
      {notice && <p className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow">{notice}</p>}
    </div>
  );
}

function PinMarker({ location, selected, onSelect }: { location: MapLocation; selected: boolean; onSelect: (id: string) => void }) {
  // The pin is the same component the Google map uses, frozen to HTML because Leaflet icons are plain DOM.
  const icon = useMemo(
    () => divIcon({ html: renderToStaticMarkup(<LocationMarker location={location} selected={selected} onSelect={noop} />), className: '', iconSize: [40, 46], iconAnchor: [20, 46] }),
    [location, selected],
  );
  return (
    <Marker
      position={[location.position.lat, location.position.lng]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      // The pin's own button is already focusable, so Leaflet's keyboard handling would only add a second tab stop.
      keyboard={false}
      eventHandlers={{ click: () => onSelect(location.id) }}
    />
  );
}

// Keeps the camera on the visible locations (`locations` must keep a stable identity) and follows the selection.
function Viewport({ locations, selectedId }: Pick<OpenStreetMapViewProps, 'locations' | 'selectedId'>) {
  const map = useMap();
  const selected = locations.find((location) => location.id === selectedId);
  const selectedLat = selected?.position.lat;
  const selectedLng = selected?.position.lng;

  useEffect(() => {
    // An unmeasured container (not laid out yet) cannot be fitted.
    if (locations.length === 0 || map.getSize().x === 0) return;
    if (locations.length === 1) {
      map.setView([locations[0].position.lat, locations[0].position.lng], 16);
      return;
    }
    const left = window.innerWidth >= 1024 ? 300 : 50;
    const right = window.innerWidth >= 640 ? 360 : 50;
    map.fitBounds(latLngBounds(locations.map((location) => [location.position.lat, location.position.lng] as [number, number])), { paddingTopLeft: [left, 70], paddingBottomRight: [right, 70], maxZoom: 17 });
  }, [map, locations]);

  useEffect(() => {
    if (selectedLat !== undefined && selectedLng !== undefined) map.panTo([selectedLat, selectedLng]);
  }, [map, selectedLat, selectedLng]);

  return null;
}
