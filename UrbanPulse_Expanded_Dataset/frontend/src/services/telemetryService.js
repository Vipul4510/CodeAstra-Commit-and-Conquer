import api from './apiClient';

/**
 * Submits a live or simulated telemetry observation to the backend.
 * @param {Object} report TelemetryReportInput
 */
export function submitTelemetry(report) {
  return api.post('/api/v1/telemetry', report);
}

export default {
  submitTelemetry,
};
