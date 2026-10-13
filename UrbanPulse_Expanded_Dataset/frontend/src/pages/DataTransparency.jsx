import React from 'react';
import { Info, ShieldAlert, Navigation, Database, Cpu, Lock } from 'lucide-react';

export function DataTransparency() {
  return (
    <div className="transparency-page">
      <div className="transparency-header">
        <h2 className="page-title">About & Data Transparency</h2>
        <p className="page-subtitle">
          Methodological disclosures, sensor data assumptions, and computational model limitations for the UrbanPulse platform.
        </p>
      </div>

      <div className="transparency-grid">
        {/* Synthetic Simulation Disclosure */}
        <div className="transparency-card highlighted-card">
          <div className="card-top-title">
            <div className="flex-center-gap">
              <ShieldAlert size={20} className="text-warning-icon" />
              <h4 className="section-title">Synthetic Demonstration Feed</h4>
            </div>
            <span className="badge badge-warning">DISCLOSURE</span>
          </div>
          <p className="transparency-text">
            Observations generated within the <strong>Live Simulation Lab</strong> (such as water level rises, citizen reports, and telemetry events) are <strong>synthetic demonstration inputs</strong> calibrated to reflect realistic Mumbai monsoon conditions. They are transmitted to the active backend endpoint (<code>POST /api/v1/telemetry</code>) to validate the live ingestion pipeline and model correlation behavior, but they are not verified live emergency alerts.
          </p>
        </div>

        {/* OSRM Routing Disclosures */}
        <div className="transparency-card">
          <div className="card-top-title">
            <div className="flex-center-gap">
              <Navigation size={20} className="text-primary" />
              <h4 className="section-title">OSRM Baseline vs Live Traffic Delay</h4>
            </div>
            <span className="badge badge-neutral">ROUTING</span>
          </div>
          <p className="transparency-text">
            Route geometry and baseline travel durations are retrieved from the Open Source Routing Machine (OSRM). <strong>The public OSRM car routing profile calculates free-flow travel times and does not incorporate real-time vehicular traffic or live weather speeds by default.</strong>
          </p>
          <p className="transparency-text mt-2">
            UrbanPulse separates the <strong>OSRM Baseline Duration</strong> from the <strong>Agent-Estimated Additional Delay</strong>, and sums them explicitly rather than double-counting delays.
          </p>
        </div>

        {/* Classifier & Graph Engine */}
        <div className="transparency-card">
          <div className="card-top-title">
            <div className="flex-center-gap">
              <Cpu size={20} className="text-primary" />
              <h4 className="section-title">Intelligent Incident Agent</h4>
            </div>
            <span className="badge badge-neutral">ML INFERENCE</span>
          </div>
          <p className="transparency-text">
            The pairwise incident deduplication and causal relation engine is powered by a <strong>Platt-calibrated LightGBM classifier</strong> trained on multimodal disaster telemetry. When an incoming observation is ingested, the backend compares spatial haversine distance, textual token overlap, temporal windowing, and spatial asset graphs to classify whether the observation is an isolated event or a confirmed disruption.
          </p>
        </div>

        {/* Causal Hierarchy */}
        <div className="transparency-card">
          <div className="card-top-title">
            <div className="flex-center-gap">
              <Database size={20} className="text-primary" />
              <h4 className="section-title">Root Cause vs Symptom Verification</h4>
            </div>
            <span className="badge badge-neutral">CAUSALITY</span>
          </div>
          <p className="transparency-text">
            UrbanPulse maintains a topological dependency graph of Mumbai's stormwater pumping stations, sluice gates, outfalls, and rail subways. An infrastructure outage (such as pump bank electrical failure) is treated as a <em>root-cause hypothesis</em> until corroborated by upstream IoT water level telemetry and downstream civic closure reports.
          </p>
        </div>
      </div>

      <div className="transparency-footer-card">
        <h4>Corridor Geographic Coverage</h4>
        <p className="text-sm text-muted">
          UrbanPulse focuses on Mumbai's Western Suburbs corridor spanning Bandra, Khar, Santacruz, Andheri, Jogeshwari, Goregaon, Malad, and Borivali, including critical bottleneck underpasses such as Andheri Subway, Milan Subway, Khar Subway, and Malad Subway.
        </p>
      </div>
    </div>
  );
}

export default DataTransparency;
