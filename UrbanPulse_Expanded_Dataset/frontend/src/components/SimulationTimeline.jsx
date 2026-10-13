import React from 'react';
import { Droplets, Gauge, CloudRain, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function SimulationTimeline({
  scenario,
  currentStepIndex,
  timelineLogs,
  simClock,
}) {
  const steps = scenario?.steps || [];
  const currentStep = steps[currentStepIndex] || steps[steps.length - 1];

  return (
    <div className="sim-timeline-card">
      <div className="timeline-header">
        <div className="flex-center-gap">
          <Clock size={16} className="text-muted" />
          <span className="font-semibold text-charcoal">Simulation Clock:</span>
          <span className="font-mono text-primary font-bold">{simClock}</span>
        </div>
        <span className="badge badge-neutral">SYNTHETIC SENSOR FEED</span>
      </div>

      {/* Sensor Trend Gauges */}
      <div className="sensor-trends-row">
        <div className="sensor-gauge-item">
          <div className="gauge-label-row">
            <CloudRain size={16} className="text-blue" />
            <span>Rainfall Rate</span>
          </div>
          <div className="gauge-val font-mono">{currentStep?.rainfall_rate_mm || 0} mm/h</div>
          <div className="meter-track">
            <div
              className="meter-bar bg-blue"
              style={{ width: `${Math.min(100, ((currentStep?.rainfall_rate_mm || 0) / 80) * 100)}%` }}
            />
          </div>
        </div>

        <div className="sensor-gauge-item">
          <div className="gauge-label-row">
            <Droplets size={16} className="text-cyan" />
            <span>Water Depth</span>
          </div>
          <div className="gauge-val font-mono">{currentStep?.water_level_cm || 0} cm</div>
          <div className="meter-track">
            <div
              className="meter-bar bg-cyan"
              style={{ width: `${Math.min(100, ((currentStep?.water_level_cm || 0) / 90) * 100)}%` }}
            />
          </div>
        </div>

        <div className="sensor-gauge-item">
          <div className="gauge-label-row">
            <Gauge size={16} className="text-amber" />
            <span>Corridor Speed</span>
          </div>
          <div className="gauge-val font-mono">
            {currentStep?.traffic?.traffic_speed_kmh != null ? `${currentStep.traffic.traffic_speed_kmh} km/h` : 'N/A'}
          </div>
          <div className="meter-track">
            <div
              className="meter-bar bg-amber"
              style={{ width: `${Math.min(100, ((currentStep?.traffic?.traffic_speed_kmh || 0) / 50) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps Progression Sequence */}
      <div className="steps-sequence-box">
        <h5 className="sub-heading">Scenario Progression Sequence</h5>
        <div className="steps-stepper">
          {steps.map((st, i) => {
            const isCompleted = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div
                key={i}
                className={`stepper-step ${isCompleted ? 'step-done' : ''} ${isCurrent ? 'step-active' : ''}`}
              >
                <div className="step-circle">
                  {isCompleted ? <CheckCircle size={14} /> : i + 1}
                </div>
                <div className="step-content">
                  <span className="step-title">{st.title}</span>
                  <span className="step-meta text-xs text-muted">
                    {st.source_modality} &bull; {st.event_type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission Audit Stream */}
      <div className="timeline-logs-section">
        <h5 className="sub-heading">Backend Ingestion Audit Feed ({timelineLogs.length})</h5>
        {timelineLogs.length === 0 ? (
          <p className="text-muted text-sm italic">No observations sent yet. Click Send or Start Auto Run.</p>
        ) : (
          <div className="timeline-log-list">
            {timelineLogs.map((log, idx) => (
              <div key={idx} className="timeline-log-entry">
                <div className="log-top-row">
                  <span className={`badge ${log.status === 'SUCCESS' ? 'badge-safe' : 'badge-critical'}`}>
                    {log.status === 'SUCCESS' ? 'HTTP 200 INGESTED' : `FAILED (${log.error || 'Network'})`}
                  </span>
                  <span className="font-mono text-xs text-muted">{log.timestamp}</span>
                  {log.latencyMs != null && <span className="text-xs text-muted">{log.latencyMs}ms</span>}
                </div>
                <p className="log-text">
                  <strong>{log.payload?.locality}:</strong> {log.payload?.description_or_text}
                </p>
                {log.backendResponse?.model_evaluation && (
                  <div className="log-model-tag">
                    ML Relation: <strong>{log.backendResponse.model_evaluation.predicted_relationship || 'EVALUATED'}</strong>
                    {log.backendResponse.model_evaluation.confidence != null && (
                      <span> (Conf: {Math.round(log.backendResponse.model_evaluation.confidence * 100)}%)</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SimulationTimeline;
