import React, { useState } from 'react';
import { useUrbanPulse } from '../context/UrbanPulseContext';
import RouteMap from '../components/RouteMap';
import IncidentDetails from '../components/IncidentDetails';
import { planRoute, evaluateRoute } from '../services/routeService';
import { PRESET_JOURNEYS } from '../data/simulationScenarios';
import {
  MapPin,
  Layers,
  Navigation,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Crosshair,
} from 'lucide-react';

export function LiveMap() {
  const {
    incidents,
    plannedRoute,
    setPlannedRoute,
    routeEvaluation,
    setRouteEvaluation,
    origin,
    setOrigin,
    destination,
    setDestination,
    selectedIncident,
    setSelectedIncident,
    showAssets,
    setShowAssets,
  } = useUrbanPulse();

  const [focusLocation, setFocusLocation] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const handlePlanAndEval = async () => {
    setLoadingRoute(true);
    try {
      const planRes = await planRoute(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );
      if (planRes.ok) {
        setPlannedRoute(planRes.data);
      }
      const evalRes = await evaluateRoute(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );
      if (evalRes.ok) {
        setRouteEvaluation(evalRes.data);
      }
    } finally {
      setLoadingRoute(false);
    }
  };

  const localities = [
    { name: 'Andheri West (Subway)', lat: 19.1198, lon: 72.8465 },
    { name: 'Santacruz West (Milan Subway)', lat: 19.0880, lon: 72.8390 },
    { name: 'Bandra West (Linking Road)', lat: 19.0596, lon: 72.8295 },
    { name: 'Malad West (Subway)', lat: 19.1860, lon: 72.8480 },
    { name: 'Borivali West (SV Road)', lat: 19.2307, lon: 72.8567 },
  ];

  return (
    <div className="livemap-page">
      <div className="livemap-sidebar">
        <div className="sidebar-section">
          <div className="flex-center-gap mb-3">
            <Layers size={18} className="text-primary" />
            <h3 className="section-title">Spatial Controls</h3>
          </div>

          <div className="control-toggle-card">
            <div className="toggle-row">
              <span className="toggle-label">Critical Asset Registry</span>
              <button
                className={`pill-btn ${showAssets ? 'active' : ''}`}
                onClick={() => setShowAssets(!showAssets)}
              >
                {showAssets ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{showAssets ? 'Shown' : 'Hidden'}</span>
              </button>
            </div>
            <p className="text-xs text-muted mt-1">
              Toggle visibility of registered stormwater pumping stations, sluice gates, and subways.
            </p>
          </div>
        </div>

        <div className="sidebar-section">
          <h4 className="sub-heading">Corridor Jump Locations</h4>
          <div className="jump-loc-list">
            {localities.map((loc, i) => (
              <button
                key={i}
                className="jump-loc-btn"
                onClick={() => setFocusLocation({ lat: loc.lat, lon: loc.lon })}
              >
                <Crosshair size={14} className="text-muted" />
                <span>{loc.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h4 className="sub-heading">Quick Route Evaluation</h4>
          <div className="quick-journey-select">
            <select
              className="select-field select-sm mb-2"
              onChange={(e) => {
                const pj = PRESET_JOURNEYS.find((p) => p.name === e.target.value);
                if (pj) {
                  setOrigin(pj.origin);
                  setDestination(pj.destination);
                }
              }}
            >
              <option value="">Choose Corridor...</option>
              {PRESET_JOURNEYS.map((pj, i) => (
                <option key={i} value={pj.name}>
                  {pj.name}
                </option>
              ))}
            </select>
            <button
              className="btn-primary w-full flex-center-gap"
              onClick={handlePlanAndEval}
              disabled={loadingRoute}
            >
              <Navigation size={15} />
              <span>{loadingRoute ? 'Planning & Evaluating...' : 'Plot & Evaluate Route'}</span>
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <h4 className="sub-heading">Suburbs Incident Overview</h4>
          <div className="stat-summary-box">
            <div className="stat-row">
              <span className="text-muted text-sm">Active Incidents:</span>
              <strong>{incidents.length}</strong>
            </div>
            <div className="stat-row">
              <span className="text-muted text-sm">Passability Alerts:</span>
              <strong className="text-danger">
                {incidents.filter((i) => i.road_passability === 'CLOSED' || i.road_passability === 'IMPASSABLE').length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="livemap-canvas-container">
        <RouteMap
          height="100%"
          focusCoords={focusLocation}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />
      </div>

      {selectedIncident && (
        <IncidentDetails
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          origin={origin}
          destination={destination}
        />
      )}
    </div>
  );
}

export default LiveMap;
