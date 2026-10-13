import React, { useEffect, useRef } from 'react';
import { useUrbanPulse } from '../context/UrbanPulseContext';

export function RouteMap({
  height = '500px',
  onSelectIncident,
  focusCoords = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const altRouteLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const assetsLayerRef = useRef(null);

  const {
    incidents,
    plannedRoute,
    routeEvaluation,
    alternativeRoutes,
    origin,
    destination,
    showAssets,
    setSelectedIncident,
  } = useUrbanPulse();

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    // Default center on Mumbai Western Suburbs
    const map = L.map(mapContainerRef.current, {
      center: [19.145, 72.845],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Standard OpenStreetMap tiles — 100% free, reliable, no API key required
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    altRouteLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    assetsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines and Origin/Destination Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L || !routeLayerRef.current) return;

    routeLayerRef.current.clearLayers();
    altRouteLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Origin Marker
    if (origin && origin.latitude && origin.longitude) {
      const originIcon = L.divIcon({
        className: 'custom-map-pin origin-pin',
        html: `<div class="pin-inner pin-origin" title="Origin: ${origin.label || 'Origin'}"><span>A</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const originMarker = L.marker([origin.latitude, origin.longitude], { icon: originIcon })
        .bindPopup(`<strong>Origin:</strong> ${origin.label || 'Selected Origin'}<br/><small>${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}</small>`);
      routeLayerRef.current.addLayer(originMarker);
      bounds.extend([origin.latitude, origin.longitude]);
    }

    // 2. Destination Marker
    if (destination && destination.latitude && destination.longitude) {
      const destIcon = L.divIcon({
        className: 'custom-map-pin dest-pin',
        html: `<div class="pin-inner pin-dest" title="Destination: ${destination.label || 'Destination'}"><span>B</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const destMarker = L.marker([destination.latitude, destination.longitude], { icon: destIcon })
        .bindPopup(`<strong>Destination:</strong> ${destination.label || 'Selected Destination'}<br/><small>${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}</small>`);
      routeLayerRef.current.addLayer(destMarker);
      bounds.extend([destination.latitude, destination.longitude]);
    }

    // 3. Planned Primary Route Polyline
    if (plannedRoute && plannedRoute.geometry && plannedRoute.geometry.coordinates) {
      // GeoJSON has [lon, lat], Leaflet needs [lat, lon]
      const latLngs = plannedRoute.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

      const isImpacted = routeEvaluation && (routeEvaluation.should_alert || routeEvaluation.is_route_blocked);
      const routeColor = isImpacted ? '#dc2626' : '#2563eb';

      const polyline = L.polyline(latLngs, {
        color: routeColor,
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).bindPopup(`<strong>Primary Route</strong><br/>Distance: ${plannedRoute.distance_km || plannedRoute.distance?.kilometers || 'N/A'} km<br/>Baseline Duration: ${Math.round((plannedRoute.duration_sec || plannedRoute.duration?.seconds || 0) / 60)} min`);

      routeLayerRef.current.addLayer(polyline);
      latLngs.forEach((pt) => bounds.extend(pt));
    }

    // 4. Alternative Route Polylines (if available)
    if (alternativeRoutes && alternativeRoutes.candidates && alternativeRoutes.candidates.length > 0) {
      alternativeRoutes.candidates.forEach((cand, idx) => {
        if (cand.route && cand.route.geometry && cand.route.geometry.coordinates) {
          const altLatLngs = cand.route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          const isRecommended = cand.candidate_id === alternativeRoutes.recommended_candidate_id;
          const altPolyline = L.polyline(altLatLngs, {
            color: isRecommended ? '#059669' : '#9333ea',
            weight: 4,
            dashArray: '6, 8',
            opacity: 0.8,
          }).bindPopup(`<strong>Candidate Route ${idx + 1} (${cand.candidate_id})</strong><br/>Status: ${cand.recommendation_status}<br/>Distance: ${cand.distance_km || 'N/A'} km<br/>${cand.selection_rationale || ''}`);

          altRouteLayerRef.current.addLayer(altPolyline);
        }
      });
    }

    // Fit map bounds if points exist
    if (bounds.isValid() && bounds.getNorthEast().lat !== bounds.getSouthWest().lat) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [plannedRoute, routeEvaluation, alternativeRoutes, origin, destination]);

  // Update Incident Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Set of incident IDs directly impacting route
    const impactingIds = new Set();
    if (routeEvaluation?.impacting_incidents) {
      routeEvaluation.impacting_incidents.forEach((item) => {
        const id = item.incident_id || item.incident?.incident_id;
        if (id) impactingIds.add(id);
      });
    }

    // Prioritize incidents: always include impacting, live-simulated, critical/high, capped to 80 for visual clarity
    const prioritizedIncidents = (() => {
      if (incidents.length <= 80) return incidents;
      const impacting = [];
      const liveOrCritical = [];
      const others = [];

      incidents.forEach((inc) => {
        const id = inc.incident_id || inc.event_id || '';
        const sev = (inc.severity || '').toUpperCase();
        if (impactingIds.has(id)) {
          impacting.push(inc);
        } else if (sev === 'CRITICAL' || sev === 'HIGH' || id.startsWith('SIM') || id.startsWith('EVT-LIVE')) {
          liveOrCritical.push(inc);
        } else {
          others.push(inc);
        }
      });

      return [...impacting, ...liveOrCritical.slice(0, 50), ...others.slice(0, 30)];
    })();

    prioritizedIncidents.forEach((inc) => {
      const lat = inc.latitude || inc.incident_location?.coordinates?.latitude;
      const lon = inc.longitude || inc.incident_location?.coordinates?.longitude;
      if (!lat || !lon) return;

      const incId = inc.incident_id || inc.event_id || 'INC-UNKNOWN';
      const severity = (inc.severity || 'MODERATE').toUpperCase();
      const isImpacting = impactingIds.has(incId);

      let pinColor = '#d97706'; // warning/amber
      if (severity === 'CRITICAL' || severity === 'HIGH' || isImpacting) {
        pinColor = '#dc2626'; // red
      } else if (severity === 'LOW') {
        pinColor = '#2563eb'; // blue
      }

      const iconHtml = `
        <div class="custom-incident-pin ${isImpacting ? 'pulse-pin' : ''}" style="background-color: ${pinColor}">
          <span class="incident-pin-icon">!</span>
        </div>
      `;

      const incidentIcon = L.divIcon({
        className: 'incident-marker-container',
        html: iconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([lat, lon], { icon: incidentIcon });

      const popupContent = `
        <div class="incident-popup-card">
          <div class="popup-header">
            <span class="badge ${severity === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}">${severity}</span>
            <span class="popup-title">${inc.locality || 'Mumbai Suburb'}</span>
          </div>
          <p class="popup-desc">${inc.description || inc.description_or_text || inc.event_type || 'Incident reported'}</p>
          <div class="popup-meta">
            <span>Passability: <strong>${inc.road_passability || 'N/A'}</strong></span>
            ${isImpacting ? '<span class="text-danger font-semibold">Impacting Current Route!</span>' : ''}
          </div>
          <button class="btn-popup-inspect" id="btn-inspect-${incId}">Inspect Details</button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${incId}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedIncident(inc);
            if (onSelectIncident) onSelectIncident(inc);
          };
        }
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [incidents, routeEvaluation, setSelectedIncident, onSelectIncident]);

  // Center on focusCoords when provided
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusCoords || !focusCoords.lat || !focusCoords.lon) return;
    map.setView([focusCoords.lat, focusCoords.lon], 15, { animate: true });
  }, [focusCoords]);

  return (
    <div className="map-wrapper" style={{ height }}>
      <div ref={mapContainerRef} className="map-container" style={{ width: '100%', height: '100%' }} />
      <div className="map-legend-overlay">
        <div className="legend-title">Map Legend</div>
        <div className="legend-row">
          <span className="legend-dot" style={{ backgroundColor: '#2563eb' }}></span>
          <span>Planned Primary Route</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ backgroundColor: '#dc2626' }}></span>
          <span>Disrupted / Critical Incident</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{ backgroundColor: '#d97706' }}></span>
          <span>Moderate / Caution Area</span>
        </div>
        {alternativeRoutes && (
          <div className="legend-row">
            <span className="legend-line-dashed" style={{ borderColor: '#059669' }}></span>
            <span>Recommended Alternative</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteMap;
