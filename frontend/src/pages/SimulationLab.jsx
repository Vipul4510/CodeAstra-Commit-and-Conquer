import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUrbanPulse } from '../context/UrbanPulseContext';
import { submitTelemetry } from '../services/telemetryService';
import { evaluateRoute } from '../services/routeService';
import { SIMULATION_SCENARIOS } from '../data/simulationScenarios';
import SimulationControls from '../components/SimulationControls';
import SimulationTimeline from '../components/SimulationTimeline';
import BackendResponseViewer from '../components/BackendResponseViewer';
import {
  AlertTriangle,
  Cpu,
  RefreshCw,
  Send,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Terminal,
} from 'lucide-react';

export function SimulationLab() {
  const {
    refreshIncidents,
    origin,
    destination,
    setRouteEvaluation,
    simulationTimeline,
    addSimulationLog,
    clearSimulationLogs,
  } = useUrbanPulse();

  const [selectedScenario, setSelectedScenario] = useState(SIMULATION_SCENARIOS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mode, setMode] = useState('manual'); // 'manual' or 'automatic'
  const [speed, setSpeed] = useState(1); // 1, 2, 5
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Latest submission result
  const [latestSubmission, setLatestSubmission] = useState(null);

  // Simulation virtual clock
  const [simClockMinutes, setSimClockMinutes] = useState(0);
  const timerRef = useRef(null);

  const steps = selectedScenario.steps;
  const currentStep = steps[currentStepIndex] || steps[0];

  // Format virtual simulation clock
  const formatSimClock = (mins) => {
    const baseHour = 14; // start at 14:00 (2:00 PM)
    const totalMins = baseHour * 60 + mins;
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} IST (+${mins}m)`;
  };

  // Reset simulation state
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setSimClockMinutes(0);
    setLatestSubmission(null);
  };

  // Scenario change handler
  const handleSelectScenario = (sc) => {
    handleReset();
    setSelectedScenario(sc);
  };

  // Core submission function: Submits one observation to backend
  const submitObservation = useCallback(
    async (stepToSubmit) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const start = performance.now();
      const payload = {
        event_id: stepToSubmit.event_id,
        source_modality: stepToSubmit.source_modality,
        event_type: stepToSubmit.event_type,
        timestamp_iso: new Date().toISOString(),
        latitude: stepToSubmit.latitude,
        longitude: stepToSubmit.longitude,
        locality: stepToSubmit.locality,
        description_or_text: stepToSubmit.description_or_text,
        water_level_cm: stepToSubmit.water_level_cm,
        rainfall_rate_mm: stepToSubmit.rainfall_rate_mm,
        pump_status: stepToSubmit.pump_status,
        power_status: stepToSubmit.power_status,
        traffic: stepToSubmit.traffic,
      };

      try {
        const res = await submitTelemetry(payload);
        const latency = Math.round(performance.now() - start);

        const logEntry = {
          stepIndex: stepToSubmit.stepIndex,
          timestamp: new Date().toLocaleTimeString(),
          payload,
          status: res.ok ? 'SUCCESS' : 'FAILED',
          httpStatus: res.status,
          latencyMs: latency,
          error: res.error,
          backendResponse: res.data,
        };

        setLatestSubmission(logEntry);
        addSimulationLog(logEntry);

        // Advance simulation clock by 10 mins per observation step
        setSimClockMinutes((prev) => prev + 10);

        if (res.ok) {
          // Refresh active incidents on the dashboard and map
          refreshIncidents();

          // If a route is configured, trigger re-evaluation against newly ingested observation
          if (origin && destination) {
            evaluateRoute(
              { latitude: origin.latitude, longitude: origin.longitude },
              { latitude: destination.latitude, longitude: destination.longitude },
              500,
              true
            ).then((evalRes) => {
              if (evalRes.ok) setRouteEvaluation(evalRes.data);
            });
          }
        }
      } catch (err) {
        const latency = Math.round(performance.now() - start);
        const logEntry = {
          stepIndex: stepToSubmit.stepIndex,
          timestamp: new Date().toLocaleTimeString(),
          payload,
          status: 'FAILED',
          httpStatus: 0,
          latencyMs: latency,
          error: err.message || 'Network exception',
          backendResponse: null,
        };
        setLatestSubmission(logEntry);
        addSimulationLog(logEntry);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      addSimulationLog,
      refreshIncidents,
      origin,
      destination,
      setRouteEvaluation,
    ]
  );

  // Manual: send current step observation
  const handleSendCurrentStep = () => {
    if (currentStepIndex < steps.length) {
      submitObservation(steps[currentStepIndex]);
    }
  };

  // Manual: step forward to next observation
  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  // Automatic Run Interval
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    const intervalMs = Math.max(1000, 4000 / speed);

    timerRef.current = setInterval(() => {
      setCurrentStepIndex((curr) => {
        if (curr < steps.length) {
          submitObservation(steps[curr]);
          if (curr + 1 >= steps.length) {
            // Reached end of sequence: stop automatically
            setIsRunning(false);
            return curr;
          }
          return curr + 1;
        } else {
          setIsRunning(false);
          return curr;
        }
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused, speed, steps, submitObservation]);

  // Start automatic run
  const handleStartAuto = () => {
    setIsRunning(true);
    setIsPaused(false);
    // Immediately submit first step if on step 0
    if (currentStepIndex === 0) {
      submitObservation(steps[0]);
      if (steps.length > 1) {
        setCurrentStepIndex(1);
      }
    }
  };

  const handlePauseAuto = () => {
    setIsPaused(true);
  };

  const handleResumeAuto = () => {
    setIsPaused(false);
  };

  return (
    <div className="simlab-page">
      {/* Persistent Mandatory Disclosure Banner */}
      <div className="disclosure-banner" role="alert">
        <AlertTriangle size={20} className="disclosure-icon" />
        <div className="disclosure-text">
          <strong>SIMULATION MODE:</strong> Sensor readings, citizen reports, incident events and scenario timings generated by this page are synthetic demonstration data. Observations are submitted to the configured backend for processing. The backend's responses are displayed separately. This is not a verified live emergency feed.
        </div>
      </div>

      <div className="simlab-header">
        <div>
          <h2 className="page-title">Live Simulation Lab & Intelligent Ingestion</h2>
          <p className="page-subtitle">
            Generate and stream multi-modal synthetic observations (IoT depth, weather telemetry, citizen reports) to verify Intelligent Incident Agent response plans in real time.
          </p>
        </div>
      </div>

      {/* Simulation Controls Panel */}
      <SimulationControls
        selectedScenario={selectedScenario}
        onSelectScenario={handleSelectScenario}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        isRunning={isRunning}
        isPaused={isPaused}
        speed={speed}
        onChangeSpeed={setSpeed}
        mode={mode}
        onChangeMode={setMode}
        onStart={handleStartAuto}
        onPause={handlePauseAuto}
        onResume={handleResumeAuto}
        onReset={handleReset}
        onStepForward={handleStepForward}
        onSendCurrentStep={handleSendCurrentStep}
        isSubmitting={isSubmitting}
      />

      {/* Grid: Left Column (Timeline & Trends), Right Column (Backend Response Viewer) */}
      <div className="simlab-grid">
        <div className="simlab-timeline-col">
          <SimulationTimeline
            scenario={selectedScenario}
            currentStepIndex={currentStepIndex}
            timelineLogs={simulationTimeline}
            simClock={formatSimClock(simClockMinutes)}
          />
        </div>

        <div className="simlab-viewer-col">
          <BackendResponseViewer
            latestSubmission={latestSubmission}
            currentPayload={steps[currentStepIndex]}
          />
        </div>
      </div>
    </div>
  );
}

export default SimulationLab;
