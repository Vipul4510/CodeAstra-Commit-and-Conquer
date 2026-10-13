import api from './apiClient';

export function planRoute(origin, destination) {
  return api.post('/api/routes/plan', { origin, destination });
}

export function evaluateRoute(origin, destination, candidateRadiusM = 500, includeDataset = true) {
  return api.post('/api/routes/evaluate', {
    origin, destination,
    candidate_radius_m: candidateRadiusM,
    include_dataset: includeDataset,
  });
}

export function evaluateAlternatives(origin, destination, candidateRadiusM = 500, includeDataset = true) {
  return api.post('/api/routes/alternatives/evaluate', {
    origin, destination,
    candidate_radius_m: candidateRadiusM,
    include_dataset: includeDataset,
  });
}

export function evaluateJourneyAlerts(origin, destination, journeyId, journeyName) {
  return api.post('/api/routes/alerts/evaluate', {
    origin, destination,
    user_journey_id: journeyId || 'DEMO-JOURNEY-001',
    journey_name: journeyName || 'Demo Commute Corridor',
    include_dataset: true,
  });
}
