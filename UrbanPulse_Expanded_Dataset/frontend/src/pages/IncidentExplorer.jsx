import React, { useState, useEffect } from 'react';
import { useUrbanPulse } from '../context/UrbanPulseContext';
import { getAllIncidents } from '../services/incidentService';
import IncidentDetails from '../components/IncidentDetails';
import {
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  FileText,
  MapPin,
  Clock,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

export function IncidentExplorer() {
  const { incidents, refreshIncidents, incidentsLoading, origin, destination } = useUrbanPulse();

  const [auditLog, setAuditLog] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedPassability, setSelectedPassability] = useState('ALL');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'audit'

  // Fetch full historical audit log on tab switch or mount
  const fetchAuditLog = async () => {
    setLoadingAudit(true);
    try {
      const res = await getAllIncidents();
      if (res.ok && Array.isArray(res.data)) {
        setAuditLog(res.data);
      }
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'audit' && auditLog.length === 0) {
      fetchAuditLog();
    }
  }, [viewMode]);

  const rawList = viewMode === 'active' ? incidents : auditLog;

  const filteredIncidents = rawList.filter((item) => {
    const locality = (item.locality || '').toLowerCase();
    const desc = (item.description || item.description_or_text || item.text || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || locality.includes(query) || desc.includes(query) || (item.event_type || '').toLowerCase().includes(query);

    const sev = (item.severity || 'MODERATE').toUpperCase();
    const matchesSeverity = selectedSeverity === 'ALL' || sev === selectedSeverity;

    const pass = (item.road_passability || 'PASSABLE').toUpperCase();
    const matchesPassability = selectedPassability === 'ALL' || pass === selectedPassability;

    return matchesSearch && matchesSeverity && matchesPassability;
  });

  return (
    <div className="explorer-page">
      <div className="explorer-header">
        <div>
          <h2 className="page-title">Incident Explorer & Audit Ledger</h2>
          <p className="page-subtitle">
            Inspect real-time incident reports, verification status, telemetry provenance, and passability records.
          </p>
        </div>
        <div className="explorer-actions">
          <div className="view-mode-tabs">
            <button
              className={`tab-btn ${viewMode === 'active' ? 'active' : ''}`}
              onClick={() => setViewMode('active')}
            >
              Active Incidents ({incidents.length})
            </button>
            <button
              className={`tab-btn ${viewMode === 'audit' ? 'active' : ''}`}
              onClick={() => setViewMode('audit')}
            >
              Historical Audit Log ({auditLog.length})
            </button>
          </div>
          <button
            className="btn-secondary flex-center-gap"
            onClick={viewMode === 'active' ? refreshIncidents : fetchAuditLog}
            disabled={incidentsLoading || loadingAudit}
          >
            <RefreshCw size={14} className={incidentsLoading || loadingAudit ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-card">
        <div className="search-input-group">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text search-field"
            placeholder="Search by locality, road name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-dropdown-group">
          <label className="filter-label">Severity:</label>
          <select
            className="select-field select-sm"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="filter-dropdown-group">
          <label className="filter-label">Passability:</label>
          <select
            className="select-field select-sm"
            value={selectedPassability}
            onChange={(e) => setSelectedPassability(e.target.value)}
          >
            <option value="ALL">All States</option>
            <option value="CLOSED">Closed</option>
            <option value="IMPASSABLE">Impassable</option>
            <option value="RESTRICTED">Restricted</option>
            <option value="PASSABLE">Passable</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Locality / Location</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>Passability</th>
                <th>Provenance / Modality</th>
                <th>Coordinates</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidentsLoading || loadingAudit ? (
                <tr>
                  <td colSpan="8" className="table-loading-cell">
                    Loading incident ledger from backend...
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty-cell">
                    No incidents matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((item, idx) => {
                  const id = item.incident_id || item.event_id || `INC-${idx}`;
                  const sev = (item.severity || 'MODERATE').toUpperCase();
                  const pass = item.road_passability || 'PASSABLE';
                  const isCrit = sev === 'CRITICAL' || sev === 'HIGH';
                  const isClosed = pass === 'CLOSED' || pass === 'IMPASSABLE';
                  const lat = item.latitude || item.incident_location?.coordinates?.latitude;
                  const lon = item.longitude || item.incident_location?.coordinates?.longitude;

                  return (
                    <tr key={idx} className="cursor-pointer" onClick={() => setSelectedIncident(item)}>
                      <td className="font-mono text-xs">{id}</td>
                      <td>
                        <strong>{item.locality || 'Western Suburbs'}</strong>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{item.event_type || 'INCIDENT'}</span>
                      </td>
                      <td>
                        <span className={`badge ${isCrit ? 'badge-critical' : 'badge-warning'}`}>
                          {sev}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isClosed ? 'badge-critical' : 'badge-safe'}`}>
                          {pass}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-muted">
                          {item.provenance || item.source_modality || 'SENSOR_TELEMETRY'}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-muted">
                        {lat != null && lon != null ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : 'N/A'}
                      </td>
                      <td>
                        <button
                          className="btn-link flex-center-gap"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(item);
                          }}
                        >
                          <span>Inspect</span>
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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

export default IncidentExplorer;
