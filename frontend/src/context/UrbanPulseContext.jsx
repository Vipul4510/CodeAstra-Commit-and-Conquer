import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { healthCheck } from '../services/apiClient';
import { getActiveIncidents } from '../services/incidentService';
import { submitTelemetry } from '../services/telemetryService';
import { evaluateRoute } from '../services/routeService';
import { PRESET_JOURNEYS, CONTINUOUS_OBSERVATION_POOL } from '../data/simulationScenarios';
import {
  dispatchCriticalAlert,
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notificationService';

const UrbanPulseContext = createContext(null);

export function UrbanPulseProvider({ children }) {
  // Backend health & connectivity
  const [backendHealth, setBackendHealth] = useState({
    checked: false,
    online: false,
    service: 'UrbanPulse API',
    error: null,
    latencyMs: null,
  });

  // Active Incidents state (capped to 10 for clean dashboard presentation)
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentsError, setIncidentsError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Selected Incident for details inspection
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Map infrastructure assets overlay toggle
  const [showAssets, setShowAssets] = useState(false);

  // Saved Daily User Profile & Route Persistence
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('urbanpulse_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Vipul',
      phone: localStorage.getItem('urbanpulse_recipient_phone') || '',
      preferredMode: 'METRO',
      dailyOrigin: { latitude: 19.2307, longitude: 72.8567, label: 'Borivali West' },
      dailyDestination: { latitude: 19.1362, longitude: 72.8277, label: 'Andheri West / RGIT College' },
    };
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    return !localStorage.getItem('urbanpulse_user_profile');
  });

  const saveUserProfile = useCallback((profile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem('urbanpulse_user_profile', JSON.stringify(profile));
    } catch {}
  }, []);

  // Active Journey state initialized to user's saved daily route
  const [origin, setOrigin] = useState(() => {
    try {
      const saved = localStorage.getItem('urbanpulse_user_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.dailyOrigin) return p.dailyOrigin;
      }
    } catch {}
    return { latitude: 19.2307, longitude: 72.8567, label: 'Borivali West' };
  });

  const [destination, setDestination] = useState(() => {
    try {
      const saved = localStorage.getItem('urbanpulse_user_profile');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.dailyDestination) return p.dailyDestination;
      }
    } catch {}
    return { latitude: 19.1362, longitude: 72.8277, label: 'Andheri West / RGIT College' };
  });

  const [journeyName, setJourneyName] = useState('Borivali West to Andheri West / RGIT College');

  const restoreDailyRoute = useCallback(() => {
    if (userProfile?.dailyOrigin && userProfile?.dailyDestination) {
      setOrigin(userProfile.dailyOrigin);
      setDestination(userProfile.dailyDestination);
      setJourneyName(`${userProfile.dailyOrigin.label} to ${userProfile.dailyDestination.label}`);
    }
  }, [userProfile]);

  // Route Planning, Evaluation, Alternatives results
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [routePlanningLoading, setRoutePlanningLoading] = useState(false);
  const [routePlanError, setRoutePlanError] = useState(null);

  const [routeEvaluation, setRouteEvaluation] = useState(null);
  const [routeEvalLoading, setRouteEvalLoading] = useState(false);
  const [routeEvalError, setRouteEvalError] = useState(null);

  const [alternativeRoutes, setAlternativeRoutes] = useState(null);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [alternativesError, setAlternativesError] = useState(null);

  // Simulation Lab history & timeline
  const [simulationTimeline, setSimulationTimeline] = useState([]);
  const [activeSimulationScenario, setActiveSimulationScenario] = useState(null);

  // Continuous background real-world telemetry stream
  const [liveStreamActive, setLiveStreamActive] = useState(true);
  const [lastStreamEvent, setLastStreamEvent] = useState(null);
  const streamIndexRef = useRef(0);
  const streamTimerRef = useRef(null);

  // Critical Notification Dispatch state (Android + TextBee)
  const [notificationPerm, setNotificationPerm] = useState(getNotificationPermission());
  const [lastDispatchedAlert, setLastDispatchedAlert] = useState(null);

  const enableAndroidNotifications = useCallback(async () => {
    const res = await requestNotificationPermission();
    setNotificationPerm(getNotificationPermission());
    return res;
  }, []);

  // Check health on mount and periodically
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await healthCheck();
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setBackendHealth({
          checked: true,
          online: true,
          service: res.data?.service || 'UrbanPulse Backend',
          error: null,
          latencyMs: latency,
        });
      } else {
        setBackendHealth({
          checked: true,
          online: false,
          service: 'UrbanPulse Backend (Unavailable)',
          error: res.error || `HTTP ${res.status}`,
          latencyMs: latency,
        });
      }
    } catch (e) {
      setBackendHealth({
        checked: true,
        online: false,
        service: 'UrbanPulse Backend',
        error: e.message,
        latencyMs: null,
      });
    }
  }, []);

  // Fetch active incidents from backend (limited to top 10 for clean dashboard)
  const refreshIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    setIncidentsError(null);
    try {
      const res = await getActiveIncidents(null, true);
      if (res.ok && Array.isArray(res.data)) {
        // Enforce max 10 incidents at beginning for clean, legible dashboard
        setIncidents(res.data.slice(0, 10));
        setLastRefreshed(new Date().toISOString());
      } else {
        setIncidentsError(res.error || 'Failed to fetch active incidents');
      }
    } catch (err) {
      setIncidentsError(err.message || 'Network error fetching incidents');
    } finally {
      setIncidentsLoading(false);
    }
  }, []);

  // Continuous background telemetry feeder
  const feedNextTelemetryObservation = useCallback(async () => {
    const pool = CONTINUOUS_OBSERVATION_POOL;
    if (!pool || pool.length === 0) return;

    const currentObs = pool[streamIndexRef.current % pool.length];
    streamIndexRef.current = (streamIndexRef.current + 1) % pool.length;

    const start = performance.now();
    const payload = {
      event_id: `LIVE-${currentObs.event_id}-${Date.now().toString().slice(-4)}`,
      source_modality: currentObs.source_modality,
      event_type: currentObs.event_type,
      timestamp_iso: new Date().toISOString(),
      latitude: currentObs.latitude,
      longitude: currentObs.longitude,
      locality: currentObs.locality,
      description_or_text: currentObs.description_or_text,
      water_level_cm: currentObs.water_level_cm,
      rainfall_rate_mm: currentObs.rainfall_rate_mm,
      pump_status: currentObs.pump_status,
      power_status: currentObs.power_status,
      traffic: currentObs.traffic,
    };

    try {
      const res = await submitTelemetry(payload);
      const latency = Math.round(performance.now() - start);

      const logEntry = {
        timestamp: new Date().toLocaleTimeString(),
        payload,
        status: res.ok ? 'SUCCESS' : 'FAILED',
        httpStatus: res.status,
        latencyMs: latency,
        backendResponse: res.data,
      };

      setSimulationTimeline((prev) => [logEntry, ...prev.slice(0, 40)]);
      setLastStreamEvent(payload);

      if (res.ok) {
        // Add new ingested incident to active list while maintaining max 10 items
        const newIncident = {
          incident_id: res.data?.incident_id || payload.event_id,
          locality: payload.locality,
          event_type: payload.event_type,
          severity: (payload.traffic?.congestion_level === 'GRIDLOCK' || payload.water_level_cm > 50) ? 'CRITICAL' : 'MODERATE',
          road_passability: payload.traffic?.road_passability || 'RESTRICTED',
          latitude: payload.latitude,
          longitude: payload.longitude,
          description: payload.description_or_text,
          provenance: payload.source_modality,
          water_level_cm: payload.water_level_cm,
          rainfall_rate_mm: payload.rainfall_rate_mm,
        };

        setIncidents((prev) => [newIncident, ...prev.filter((item) => item.incident_id !== newIncident.incident_id)].slice(0, 10));
        setLastRefreshed(new Date().toISOString());

        // Dispatch critical notification to Android and TextBee gateway if critical
        if (
          newIncident.severity === 'CRITICAL' ||
          newIncident.road_passability === 'CLOSED' ||
          (newIncident.water_level_cm && newIncident.water_level_cm >= 50)
        ) {
          dispatchCriticalAlert(newIncident).then((alertLog) => {
            if (alertLog) setLastDispatchedAlert(alertLog);
          });
        }

        // If user has a journey planned, automatically re-evaluate disruption
        if (origin && destination && plannedRoute) {
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
    } catch {
      // Ignore background network hiccup
    }
  }, [origin, destination, plannedRoute]);

  // Manage continuous telemetry streaming interval (feeds every 10 seconds)
  useEffect(() => {
    if (!liveStreamActive) {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      return;
    }

    // Trigger one observation initially after 3 seconds, then every 10 seconds
    const initialTimer = setTimeout(() => {
      feedNextTelemetryObservation();
    }, 3000);

    streamTimerRef.current = setInterval(() => {
      feedNextTelemetryObservation();
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [liveStreamActive, feedNextTelemetryObservation]);

  // On mount: run health check and load initial 10 incidents
  useEffect(() => {
    checkHealth();
    refreshIncidents();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth, refreshIncidents]);

  const value = {
    backendHealth,
    checkHealth,
    incidents,
    incidentsLoading,
    incidentsError,
    lastRefreshed,
    refreshIncidents,
    selectedIncident,
    setSelectedIncident,
    showAssets,
    setShowAssets,
    origin,
    setOrigin,
    destination,
    setDestination,
    journeyName,
    setJourneyName,
    plannedRoute,
    setPlannedRoute,
    routePlanningLoading,
    setRoutePlanningLoading,
    routePlanError,
    setRoutePlanError,
    routeEvaluation,
    setRouteEvaluation,
    routeEvalLoading,
    setRouteEvalLoading,
    routeEvalError,
    setRouteEvalError,
    alternativeRoutes,
    setAlternativeRoutes,
    alternativesLoading,
    setAlternativesLoading,
    alternativesError,
    setAlternativesError,
    simulationTimeline,
    activeSimulationScenario,
    setActiveSimulationScenario,
    // Continuous live stream controls
    liveStreamActive,
    setLiveStreamActive,
    lastStreamEvent,
    triggerManualStreamFeed: feedNextTelemetryObservation,
    // Critical Notifications (Android Push + TextBee SMS Gateway)
    notificationPerm,
    enableAndroidNotifications,
    lastDispatchedAlert,
    // User Profile & Daily Route Persistence
    userProfile,
    saveUserProfile,
    isLoginModalOpen,
    setIsLoginModalOpen,
    restoreDailyRoute,
  };

  return (
    <UrbanPulseContext.Provider value={value}>
      {children}
    </UrbanPulseContext.Provider>
  );
}

export function useUrbanPulse() {
  const context = useContext(UrbanPulseContext);
  if (!context) {
    throw new Error('useUrbanPulse must be used within an UrbanPulseProvider');
  }
  return context;
}

export default UrbanPulseContext;
