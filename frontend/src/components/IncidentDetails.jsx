import React, { useState, useEffect } from 'react';
import { getIncidentRouteImpact, getNearbyAssets } from '../services/incidentService';
import { X, AlertOctagon, MapPin, Activity, Droplets, Zap, Shield, ArrowRight } from 'lucide-react';

export function IncidentDetails({ incident, onClose, origin, destination }) {
  const [impactData, setImpactData] = useState(null);
  const [nearbyAssets, setNearbyAssets] = useState([]);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const incidentId = incident?.incident_id || incident?.event_id;
  const lat = incident?.latitude || incident?.incident_location?.coordinates?.latitude;
  const lon = incident?.longitude || incident?.incident_location?.coordinates?.longitude;

  useEffect(() => {
    if (!incidentId) return;

    // Fetch route impact
    setLoadingImpact(true);
    const oLat = origin?.latitude;
    const oLon = origin?.longitude;
    const dLat = destination?.latitude;
    const dLon = destination?.longitude;

    getIncidentRouteImpact(incidentId, oLat, oLon, dLat, dLon)
      .then((res) => {
        if (res.ok) setImpactData(res.data);
      })
      .finally(() => setLoadingImpact(false));

    // Fetch nearby assets
    if (lat && lon) {
      setLoadingAssets(true);
      getNearbyAssets(lat, lon, 3)
        .then((res) => {
          if (res.ok && res.data?.nearby_assets) {
            setNearbyAssets(res.data.nearby_assets);
          }
        })
        .finally(() => setLoadingAssets(false));
    }
  }, [incidentId, lat, lon, origin, destination]);

  if (!incident) return null;

  const severity = (incident.severity || 'MODERATE').toUpperCase();
  const isCritical = severity === 'CRITICAL' || severity === 'HIGH';

  return (
    <div className="incident-drawer-backdrop" onClick={onClose}>
      <div className="incident-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className={`badge ${isCritical ? 'badge-critical' : 'badge-warning'}`}>
              {severity}
            </span>
            <h3>{incident.locality || 'Incident Location'}</h3>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="section-card">
            <h4>Description & Event Classification</h4>
            <p className="incident-text">
              {incident.description || incident.description_or_text || incident.event_type || 'No description provided.'}
            </p>
            <div className="key-value-grid">
              <div className="kv-item">
                <span className="kv-label">Incident ID</span>
                <span className="kv-value font-mono">{incidentId}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Event Type</span>
                <span className="kv-value">{incident.event_type || 'INCIDENT'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Road Passability</span>
                <span className={`kv-value font-semibold ${incident.road_passability === 'CLOSED' || incident.road_passability === 'IMPASSABLE' ? 'text-danger' : 'text-amber'}`}>
                  {incident.road_passability || 'UNKNOWN'}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Provenance</span>
                <span className="kv-value">{incident.provenance || incident.source_modality || 'TELEMETRY'}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Sensor Metrics */}
          <div className="section-card">
            <h4>Telemetry & Sensor Readings</h4>
            <div className="telemetry-badges-row">
              <div className="metric-pill">
                <Droplets size={16} className="text-blue" />
                <div>
                  <span className="metric-label">Water Level</span>
                  <span className="metric-val">{incident.water_level_cm != null ? `${incident.water_level_cm} cm` : 'N/A'}</span>
                </div>
              </div>
              <div className="metric-pill">
                <Activity size={16} className="text-cyan" />
                <div>
                  <span className="metric-label">Rainfall Rate</span>
                  <span className="metric-val">{incident.rainfall_rate_mm != null ? `${incident.rainfall_rate_mm} mm/h` : 'N/A'}</span>
                </div>
              </div>
              <div className="metric-pill">
                <Zap size={16} className="text-amber" />
                <div>
                  <span className="metric-label">Power & Pump</span>
                  <span className="metric-val">{incident.power_status || incident.pump_status || 'NORMAL'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Impact Evaluation from backend */}
          <div className="section-card">
            <h4>Backend Route Impact Assessment</h4>
            {loadingImpact ? (
              <div className="loading-spinner-row">Evaluating route impact with backend...</div>
            ) : impactData ? (
              <div className="impact-summary-box">
                <div className="impact-status-header">
                  <span className={`impact-badge ${impactData.is_disrupting ? 'badge-critical' : 'badge-safe'}`}>
                    {impactData.impact_status || (impactData.is_disrupting ? 'DISRUPTING ROUTE' : 'NO DIRECT IMPACT')}
                  </span>
                  {impactData.estimated_delay_minutes > 0 && (
                    <span className="delay-tag">+{impactData.estimated_delay_minutes} min delay</span>
                  )}
                </div>
                <p className="impact-explanation">
                  {impactData.explanation || impactData.route_match_reason || 'Backend evaluation completed.'}
                </p>
                {impactData.confidence != null && (
                  <div className="confidence-bar-container">
                    <span className="kv-label">Evaluation Confidence: {Math.round(impactData.confidence * 100)}%</span>
                    <div className="confidence-track">
                      <div className="confidence-fill" style={{ width: `${Math.round(impactData.confidence * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted text-sm">No journey-specific impact data available.</p>
            )}
          </div>

          {/* Nearby Critical Assets */}
          <div className="section-card">
            <h4>Nearby Infrastructure Assets</h4>
            {loadingAssets ? (
              <div className="loading-spinner-row">Loading spatial asset registry...</div>
            ) : nearbyAssets.length > 0 ? (
              <div className="assets-list">
                {nearbyAssets.map((asset, i) => (
                  <div key={i} className="asset-list-item">
                    <div className="asset-name-group">
                      <Shield size={16} className="text-indigo" />
                      <div>
                        <strong>{asset.asset_name || asset.name || 'Pumping Station'}</strong>
                        <span className="asset-type-label">{asset.asset_type || asset.category}</span>
                      </div>
                    </div>
                    <span className="asset-dist">{asset.distance_km != null ? `${asset.distance_km} km` : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No registered infrastructure assets within immediate radius.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncidentDetails;
