import api from './apiClient';

export function getActiveIncidents(locality = null, includeDataset = true) {
  let path = `/api/v1/incidents/active?include_dataset=${includeDataset}`;
  if (locality) path += `&locality=${encodeURIComponent(locality)}`;
  return api.get(path);
}

export function getAllIncidents() {
  return api.get('/api/v1/incidents');
}

export function getIncidentRouteImpact(incidentId, originLat, originLon, destLat, destLon) {
  let path = `/api/incidents/${encodeURIComponent(incidentId)}/route-impact`;
  const params = [];
  if (originLat != null) params.push(`origin_lat=${originLat}`);
  if (originLon != null) params.push(`origin_lon=${originLon}`);
  if (destLat != null) params.push(`dest_lat=${destLat}`);
  if (destLon != null) params.push(`dest_lon=${destLon}`);
  if (params.length) path += '?' + params.join('&');
  return api.get(path);
}

export function getNearbyAssets(lat, lon, k = 3) {
  return api.get(`/api/v1/assets/nearby?lat=${lat}&lon=${lon}&k=${k}`);
}

export function queryResponseByLocation(latitude, longitude, radiusKm = 3.0) {
  return api.post('/api/v1/incident/response-by-location', {
    latitude, longitude, radius_km: radiusKm,
  });
}

export function getIncidentGraph(incidentId = 'INC-001') {
  return api.get(`/api/incident/${encodeURIComponent(incidentId)}/graph`);
}

export function getIncidentBriefing(incidentId = 'INC-001') {
  return api.get(`/api/incident/${encodeURIComponent(incidentId)}/briefing`);
}

export function getIncidentLedger(incidentId = 'INC-001') {
  return api.get(`/api/incident/${encodeURIComponent(incidentId)}/ledger`);
}

export function getModelMetrics() {
  return api.get('/api/models/metrics');
}

export default {
  getActiveIncidents,
  getAllIncidents,
  getIncidentRouteImpact,
  getNearbyAssets,
  queryResponseByLocation,
  getIncidentGraph,
  getIncidentBriefing,
  getIncidentLedger,
  getModelMetrics,
};
