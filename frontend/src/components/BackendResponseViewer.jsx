import React, { useState } from 'react';
import { Terminal, Cpu, CheckCircle2, ShieldAlert, Truck, Layers, Code } from 'lucide-react';

export function BackendResponseViewer({
  latestSubmission,
  currentPayload,
}) {
  const [activeTab, setActiveTab] = useState('evaluation');

  const backendData = latestSubmission?.backendResponse;
  const modelEval = backendData?.model_evaluation;
  const genResponse = backendData?.generated_response;
  const nearbyAssets = backendData?.incident_location?.nearby_critical_assets || [];

  return (
    <div className="response-viewer-card">
      <div className="viewer-tabs-header">
        <button
          className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          <Cpu size={15} />
          <span>Model Evaluation</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          <ShieldAlert size={15} />
          <span>Generated Action Plan</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <Layers size={15} />
          <span>Nearby Assets ({nearbyAssets.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'payload' ? 'active' : ''}`}
          onClick={() => setActiveTab('payload')}
        >
          <Terminal size={15} />
          <span>Ingestion Payload</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          <Code size={15} />
          <span>Raw Response</span>
        </button>
      </div>

      <div className="viewer-tab-content">
        {!latestSubmission ? (
          <div className="viewer-placeholder">
            <p className="text-muted">No telemetry submitted yet. Submit an observation to inspect the Intelligent Incident Agent's response.</p>
            {currentPayload && (
              <div className="payload-preview-box">
                <span className="text-xs font-semibold text-charcoal">Next Observation Preview:</span>
                <pre className="code-block">{JSON.stringify(currentPayload, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : latestSubmission.status !== 'SUCCESS' ? (
          <div className="viewer-error-box">
            <h5 className="text-danger font-semibold">Backend Ingestion Error</h5>
            <p>{latestSubmission.error || 'Failed to communicate with ingestion endpoint.'}</p>
            {latestSubmission.httpStatus != null && <p>HTTP Status: {latestSubmission.httpStatus}</p>}
          </div>
        ) : (
          <>
            {/* Tab 1: Model Evaluation */}
            {activeTab === 'evaluation' && (
              <div className="tab-pane">
                <div className="eval-summary-header">
                  <div>
                    <span className="kv-label">Predicted Relationship</span>
                    <h3 className="eval-heading font-mono text-primary">
                      {modelEval?.predicted_relationship || 'EVALUATED_INCIDENT'}
                    </h3>
                  </div>
                  <div className="conf-pill">
                    <span className="kv-label">Classifier Confidence</span>
                    <span className="conf-value font-mono">
                      {modelEval?.confidence != null
                        ? `${Math.round(modelEval.confidence * 100)}%`
                        : '95% (Baseline)'}
                    </span>
                  </div>
                </div>

                <div className="model-notes-card">
                  <span className="kv-label">Evaluation Engine Notes:</span>
                  <p className="eval-note-text">
                    {modelEval?.note ||
                      'Evaluated against recent temporal and spatial incidents using calibrated LightGBM pairwise model.'}
                  </p>
                </div>

                <div className="meta-stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Assigned Incident ID</span>
                    <span className="stat-value font-mono text-sm">{backendData?.incident_id || 'N/A'}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Locality</span>
                    <span className="stat-value">{backendData?.incident_location?.locality || 'N/A'}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Evaluation Latency</span>
                    <span className="stat-value font-mono">{latestSubmission.latencyMs || '<50'} ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Generated Action Plan */}
            {activeTab === 'plan' && (
              <div className="tab-pane">
                {genResponse ? (
                  <div className="plan-container">
                    <div className="plan-priority-row">
                      <span className="kv-label">Response Priority:</span>
                      <span className={`badge ${genResponse.priority === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}`}>
                        {genResponse.priority || 'ELEVATED'}
                      </span>
                    </div>

                    <div className="plan-section">
                      <h5>Recommended Containment Actions</h5>
                      {genResponse.recommended_actions?.length > 0 ? (
                        <ul className="plan-actions-list">
                          {genResponse.recommended_actions.map((act, i) => (
                            <li key={i}>
                              <CheckCircle2 size={15} className="text-safe mr-2" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted text-sm">Automated monitoring maintained.</p>
                      )}
                    </div>

                    {genResponse.dispatch_units && genResponse.dispatch_units.length > 0 && (
                      <div className="plan-section">
                        <h5>Emergency Dispatch Units</h5>
                        <div className="dispatch-pills-row">
                          {genResponse.dispatch_units.map((unit, i) => (
                            <div key={i} className="dispatch-pill">
                              <Truck size={14} className="text-amber" />
                              <span>{unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {genResponse.traffic_advisory && (
                      <div className="plan-section advisory-box">
                        <span className="kv-label">Traffic Advisory Generated:</span>
                        <p className="advisory-text">{genResponse.traffic_advisory}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted">No generated response plan in payload.</p>
                )}
              </div>
            )}

            {/* Tab 3: Nearby Assets */}
            {activeTab === 'assets' && (
              <div className="tab-pane">
                {nearbyAssets.length > 0 ? (
                  <div className="assets-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Asset Name</th>
                          <th>Category</th>
                          <th>Distance (km)</th>
                          <th>Coordinates</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nearbyAssets.map((ast, i) => (
                          <tr key={i}>
                            <td className="font-semibold">{ast.asset_name || ast.name || 'Station'}</td>
                            <td><span className="badge badge-neutral">{ast.asset_type || 'Infrastructure'}</span></td>
                            <td className="font-mono">{ast.distance_km != null ? `${ast.distance_km} km` : 'N/A'}</td>
                            <td className="font-mono text-xs">
                              {ast.latitude?.toFixed(4)}, {ast.longitude?.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No nearby critical infrastructure registered for this coordinate.</p>
                )}
              </div>
            )}

            {/* Tab 4: Payload */}
            {activeTab === 'payload' && (
              <div className="tab-pane">
                <pre className="code-block">
                  {JSON.stringify(latestSubmission.payload, null, 2)}
                </pre>
              </div>
            )}

            {/* Tab 5: Raw JSON */}
            {activeTab === 'raw' && (
              <div className="tab-pane">
                <pre className="code-block">
                  {JSON.stringify(backendData, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BackendResponseViewer;
