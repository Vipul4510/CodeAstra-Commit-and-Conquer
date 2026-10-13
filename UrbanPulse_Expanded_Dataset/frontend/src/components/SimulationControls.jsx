import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Send, CheckCircle2, Sliders } from 'lucide-react';
import { SIMULATION_SCENARIOS } from '../data/simulationScenarios';

export function SimulationControls({
  selectedScenario,
  onSelectScenario,
  currentStepIndex,
  totalSteps,
  isRunning,
  isPaused,
  speed,
  onChangeSpeed,
  mode,
  onChangeMode,
  onStart,
  onPause,
  onResume,
  onReset,
  onStepForward,
  onSendCurrentStep,
  isSubmitting,
}) {
  return (
    <div className="sim-controls-card">
      <div className="controls-row-top">
        <div className="scenario-select-group">
          <label className="input-label">Select Demonstration Scenario:</label>
          <select
            className="select-field"
            value={selectedScenario.id}
            onChange={(e) => {
              const sc = SIMULATION_SCENARIOS.find((s) => s.id === e.target.value);
              if (sc) onSelectScenario(sc);
            }}
            disabled={isRunning && !isPaused}
          >
            {SIMULATION_SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title} ({sc.locality})
              </option>
            ))}
          </select>
        </div>

        <div className="mode-toggle-group">
          <label className="input-label">Submission Mode:</label>
          <div className="button-group-pills">
            <button
              className={`pill-btn ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => onChangeMode('manual')}
              disabled={isRunning && !isPaused}
            >
              Manual Step
            </button>
            <button
              className={`pill-btn ${mode === 'automatic' ? 'active' : ''}`}
              onClick={() => onChangeMode('automatic')}
              disabled={isRunning && !isPaused}
            >
              Auto Run
            </button>
          </div>
        </div>

        <div className="speed-group">
          <label className="input-label">Simulation Speed:</label>
          <div className="button-group-pills">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                className={`pill-btn ${speed === spd ? 'active' : ''}`}
                onClick={() => onChangeSpeed(spd)}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="scenario-info-banner">
        <div>
          <span className="font-semibold text-charcoal">{selectedScenario.title}: </span>
          <span className="text-muted text-sm">{selectedScenario.description}</span>
        </div>
        <div className="step-counter-badge">
          Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
        </div>
      </div>

      <div className="controls-action-bar">
        {mode === 'manual' ? (
          <div className="flex-row-gap">
            <button
              className="btn-primary flex-center-gap"
              onClick={onSendCurrentStep}
              disabled={isSubmitting || currentStepIndex >= totalSteps}
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Ingesting...' : 'Send Observation to Backend'}</span>
            </button>
            <button
              className="btn-secondary flex-center-gap"
              onClick={onStepForward}
              disabled={currentStepIndex >= totalSteps - 1 || isSubmitting}
            >
              <FastForward size={16} />
              <span>Next Step</span>
            </button>
            <button
              className="btn-secondary flex-center-gap"
              onClick={onReset}
              disabled={isSubmitting}
            >
              <RotateCcw size={16} />
              <span>Reset Simulation</span>
            </button>
          </div>
        ) : (
          <div className="flex-row-gap">
            {!isRunning ? (
              <button
                className="btn-primary flex-center-gap"
                onClick={onStart}
                disabled={currentStepIndex >= totalSteps || isSubmitting}
              >
                <Play size={16} />
                <span>Start Automatic Simulation ({totalSteps} steps)</span>
              </button>
            ) : isPaused ? (
              <button className="btn-primary flex-center-gap" onClick={onResume}>
                <Play size={16} />
                <span>Resume Simulation</span>
              </button>
            ) : (
              <button className="btn-warning flex-center-gap" onClick={onPause}>
                <Pause size={16} />
                <span>Pause</span>
              </button>
            )}

            <button
              className="btn-secondary flex-center-gap"
              onClick={onReset}
              disabled={isSubmitting}
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimulationControls;
