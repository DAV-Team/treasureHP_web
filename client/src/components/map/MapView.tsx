import { AdvancedMarker, APILoadingStatus, APIProvider, Map as GoogleMap, useApiLoadingStatus, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { googleMapId, googleMapsApiKey } from '../../lib/googleMaps';
import { HAI_PHONG_CENTER, type MapLocation } from '../../lib/mapLocations';
import { LocationMarker } from './LocationMarker';
import { OpenStreetMapView } from './OpenStreetMapView';

interface MapViewProps {
  locations: MapLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MapView(props: MapViewProps) {
  if (!googleMapsApiKey) return <OpenStreetMapView {...props} />;
  return (
    <APIProvider apiKey={googleMapsApiKey} language="vi" region="VN">
      <GoogleMapCanvas {...props} />
    </APIProvider>
  );
}

function GoogleMapCanvas({ locations, selectedId, onSelect }: MapViewProps) {
  const status = useApiLoadingStatus();
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return <OpenStreetMapView locations={locations} selectedId={selectedId} onSelect={onSelect} notice="Không tải được Google Maps - đang dùng bản đồ OpenStreetMap" />;
  }
  return (
    <GoogleMap
      className="size-full"
      mapId={googleMapId}
      defaultCenter={HAI_PHONG_CENTER}
      defaultZoom={12}
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      clickableIcons={false}
    >
      <MapViewport locations={locations} selectedId={selectedId} />
      {locations.map((location) => (
        <AdvancedMarker key={location.id} position={location.position} zIndex={location.id === selectedId ? 10 : 1} title={location.name}>
          <LocationMarker location={location} selected={location.id === selectedId} onSelect={onSelect} />
        </AdvancedMarker>
      ))}
    </GoogleMap>
  );
}

// Keeps the camera on the visible locations (`locations` must keep a stable identity) and follows the selection.
function MapViewport({ locations, selectedId }: Pick<MapViewProps, 'locations' | 'selectedId'>) {
  const map = useMap();
  const selected = locations.find((location) => location.id === selectedId);
  const selectedLat = selected?.position.lat;
  const selectedLng = selected?.position.lng;

  useEffect(() => {
    if (!map || locations.length === 0) return;
    if (locations.length === 1) {
      map.setCenter(locations[0].position);
      map.setZoom(15);
      return;
    }
    const lats = locations.map((location) => location.position.lat);
    const lngs = locations.map((location) => location.position.lng);
    // Leave room for the floating filter panel and location card on wide screens.
    const left = window.innerWidth >= 1024 ? 300 : 50;
    const right = window.innerWidth >= 640 ? 360 : 50;
    map.fitBounds(
      { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
      { top: 70, bottom: 70, left, right },
    );
  }, [map, locations]);

  useEffect(() => {
    if (map && selectedLat !== undefined && selectedLng !== undefined) map.panTo({ lat: selectedLat, lng: selectedLng });
  }, [map, selectedLat, selectedLng]);

  return null;
}
