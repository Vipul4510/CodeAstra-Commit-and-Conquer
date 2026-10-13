import React from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldCheck, HelpCircle, Navigation } from 'lucide-react';

export function RouteComparison({
  plannedRoute,
  routeEvaluation,
  alternativeRoutes,
  onApplyAlternative,
}) {
  if (!plannedRoute && !routeEvaluation) {
    return (
      <div className="empty-state-card">
        <Navigation size={28} className="text-muted" />
        <p>Plan a journey to evaluate route disruption and alternative corridors.</p>
      </div>
    );
  }

  // Calculate baseline duration from plannedRoute (OSRM gives seconds)
  const baselineMinutes = plannedRoute
    ? Math.round((plannedRoute.duration_sec || plannedRoute.duration?.seconds || 0) / 60)
    : 0;

  // Evaluation details
  const delayMinutes = routeEvaluation?.delay?.additional_delay_minutes || 0;
  const isBlocked = routeEvaluation?.is_route_blocked || false;
  const shouldAlert = routeEvaluation?.should_alert || false;
  const totalEstimatedMinutes = baselineMinutes + delayMinutes;
  const delaySource = routeEvaluation?.delay?.delay_source || 'OSRM Free-Flow Baseline';

  const impactingIncidents = routeEvaluation?.impacting_incidents || [];
  const nearbyUnrelated = routeEvaluation?.nearby_unrelated_incidents || [];

  // Alternative candidates
  const candidates = alternativeRoutes?.candidates || [];
  const recommendedId = alternativeRoutes?.recommended_candidate_id;
  const recommendedCandidate = candidates.find((c) => c.candidate_id === recommendedId);

  return (
    <div className="route-comparison-card">
      <div className="comparison-header">
        <h4>Journey Disruption Assessment</h4>
        <span
          className={`badge ${
            isBlocked
              ? 'badge-critical'
              : shouldAlert
              ? 'badge-warning'
              : 'badge-safe'
          }`}
        >
          {isBlocked ? 'CORRIDOR BLOCKED' : shouldAlert ? 'DISRUPTION ALERT' : 'ROUTE UNAFFECTED'}
        </span>
      </div>

      {/* Duration & Delay Breakdown */}
      <div className="duration-grid">
        <div className="duration-box">
          <span className="duration-label">OSRM Baseline</span>
          <span className="duration-value">{baselineMinutes} min</span>
          <span className="duration-sub">Free-flow duration</span>
        </div>
        <div className="duration-box">
          <span className="duration-label">Estimated Delay</span>
          <span className={`duration-value ${delayMinutes > 0 ? 'text-danger' : 'text-safe'}`}>
            +{delayMinutes} min
          </span>
          <span className="duration-sub">{delaySource}</span>
        </div>
        <div className="duration-box duration-total">
          <span className="duration-label">Total Estimated ETA</span>
          <span className="duration-value text-primary">{totalEstimatedMinutes} min</span>
          <span className="duration-sub">Baseline + Delay</span>
        </div>
      </div>

      {/* Alert / Summary */}
      {routeEvaluation?.alert && (
        <div className="alert-callout">
          <AlertTriangle size={18} className="text-warning-icon" />
          <div>
            <strong>{routeEvaluation.alert.title || 'Route Advisory'}</strong>
            <p>{routeEvaluation.alert.message || routeEvaluation.alert.description || routeEvaluation.evaluation_summary}</p>
          </div>
        </div>
      )}

      {/* Impacting Incidents */}
      {impactingIncidents.length > 0 && (
        <div className="impacting-section">
          <h5>Directly Impacting Incidents ({impactingIncidents.length})</h5>
          <div className="impacting-list">
            {impactingIncidents.map((inc, i) => (
              <div key={i} className="impacting-item">
                <div className="impacting-meta">
                  <span className="badge badge-critical">{inc.severity || 'CRITICAL'}</span>
                  <span className="impacting-title">{inc.locality || inc.incident_id || 'Incident on corridor'}</span>
                </div>
                <p className="impacting-desc">{inc.description || inc.reason || 'Causes passage obstruction'}</p>
                {inc.reported_delay_minutes > 0 && (
                  <span className="impacting-delay">Adds ~{inc.reported_delay_minutes} min delay</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Unrelated Incidents */}
      {nearbyUnrelated.length > 0 && (
        <div className="nearby-unrelated-section">
          <span className="text-xs text-muted">
            {nearbyUnrelated.length} nearby incident(s) detected within spatial buffer, but verified not obstructing this route geometry.
          </span>
        </div>
      )}

      {/* Alternative Route Section */}
      <div className="alternatives-section">
        <h5>Alternative Route Recommendation</h5>
        {alternativeRoutes ? (
          candidates.length > 0 ? (
            <div className="candidates-list">
              {candidates.map((cand, idx) => {
                const isRec = cand.candidate_id === recommendedId;
                const altDurationMin = cand.duration_sec ? Math.round(cand.duration_sec / 60) : cand.duration_minutes || 'N/A';
                return (
                  <div key={idx} className={`candidate-card ${isRec ? 'candidate-recommended' : ''}`}>
                    <div className="candidate-header">
                      <div>
                        <strong>{cand.candidate_name || `Alternative Route ${idx + 1}`}</strong>
                        {isRec && <span className="badge badge-safe ml-2">RECOMMENDED</span>}
                      </div>
                      <span className="font-mono text-sm">{cand.distance_km} km &bull; ~{altDurationMin} min</span>
                    </div>
                    <p className="candidate-rationale">{cand.selection_rationale || cand.rationale || 'Evaluated via alternative corridor search.'}</p>
                    <div className="candidate-footer">
                      <span className="text-xs text-muted">Passability: <strong>{cand.recommendation_status || 'VIABLE'}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-alternatives-box">
              <HelpCircle size={16} />
              <span>The alternative routing engine evaluated parallel corridors, but found no viable unobstructed bypass for this destination.</span>
            </div>
          )
        ) : (
          <p className="text-muted text-sm">Click "Compare Alternatives" in the Journey Planner to evaluate alternate routes.</p>
        )}
      </div>

      {/* Model & Routing Limitations */}
      {routeEvaluation?.limitations && (
        <div className="limitations-footnote">
          <small className="text-muted">
            <strong>Routing Notice:</strong> {routeEvaluation.limitations}
          </small>
        </div>
      )}
    </div>
  );
}

export default RouteComparison;
