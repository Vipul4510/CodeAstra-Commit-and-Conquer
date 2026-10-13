import React, { useState } from 'react';
import { useUrbanPulse } from '../context/UrbanPulseContext';
import { planRoute, evaluateRoute, evaluateAlternatives } from '../services/routeService';
import { PRESET_JOURNEYS } from '../data/simulationScenarios';
import {
  dispatchCriticalAlert,
  getSavedMobilePhone,
  saveMobilePhone,
  sendCarrierMobileSMS,
} from '../services/notificationService';
import RouteMap from '../components/RouteMap';
import RouteComparison from '../components/RouteComparison';
import IncidentDetails from '../components/IncidentDetails';
import AlternateTransitRecommendations from '../components/AlternateTransitRecommendations';
import {
  Navigation,
  RefreshCw,
  AlertOctagon,
  ShieldAlert,
  ArrowRightLeft,
  Search,
  ExternalLink,
  Clock,
  Layers,
  MapPin,
  Bell,
  Smartphone,
  User,
  RotateCcw,
  Edit3,
  Compass,
  Train,
  CheckCircle,
} from 'lucide-react';

export function Dashboard() {
  const {
    backendHealth,
    incidents,
    incidentsLoading,
    lastRefreshed,
    refreshIncidents,
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
    selectedIncident,
    setSelectedIncident,
    liveStreamActive,
    setLiveStreamActive,
    lastStreamEvent,
    triggerManualStreamFeed,
    notificationPerm,
    enableAndroidNotifications,
    lastDispatchedAlert,
    userProfile,
    setIsLoginModalOpen,
    restoreDailyRoute,
  } = useUrbanPulse();

  const [testAlertSending, setTestAlertSending] = useState(false);
  const [mobilePhone, setMobilePhone] = useState(getSavedMobilePhone());
  const [smsDispatchStatus, setSmsDispatchStatus] = useState(null);

  // Stats
  const criticalCount = incidents.filter(
    (i) => (i.severity || '').toUpperCase() === 'CRITICAL' || (i.severity || '').toUpperCase() === 'HIGH'
  ).length;

  const baselineDistanceKm = plannedRoute
    ? plannedRoute.distance_km || plannedRoute.distance?.kilometers || 'N/A'
    : '—';

  const baselineDurationMin = plannedRoute
    ? Math.round((plannedRoute.duration_sec || plannedRoute.duration?.seconds || 0) / 60)
    : '—';

  // Handler: Plan Route
  const handlePlanRoute = async () => {
    if (!origin || !destination) return;
    setRoutePlanningLoading(true);
    setRoutePlanError(null);
    setRouteEvaluation(null);
    setAlternativeRoutes(null);

    try {
      const res = await planRoute(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );
      if (res.ok) {
        setPlannedRoute(res.data);
      } else {
        setRoutePlanError(res.error || 'Failed to plan route via OSRM');
      }
    } catch (err) {
      setRoutePlanError(err.message || 'Network error');
    } finally {
      setRoutePlanningLoading(false);
    }
  };

  // Auto-plan user's daily commute on initial load if route not yet planned
  React.useEffect(() => {
    if (origin?.latitude && destination?.latitude && !plannedRoute && !routePlanningLoading) {
      handlePlanRoute();
    }
  }, [origin?.latitude, destination?.latitude]);

  // Handler: Evaluate Route
  const handleEvaluateRoute = async () => {
    if (!origin || !destination) return;
    setRouteEvalLoading(true);
    setRouteEvalError(null);

    try {
      const res = await evaluateRoute(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
        500,
        true
      );
      if (res.ok) {
        setRouteEvaluation(res.data);
      } else {
        setRouteEvalError(res.error || 'Failed to evaluate route disruptions');
      }
    } catch (err) {
      setRouteEvalError(err.message || 'Network error');
    } finally {
      setRouteEvalLoading(false);
    }
  };

  // Handler: Compare Alternatives
  const handleCompareAlternatives = async () => {
    if (!origin || !destination) return;
    setAlternativesLoading(true);
    setAlternativesError(null);

    try {
      const res = await evaluateAlternatives(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
        500,
        true
      );
      if (res.ok) {
        setAlternativeRoutes(res.data);
      } else {
        setAlternativesError(res.error || 'Failed to evaluate route alternatives');
      }
    } catch (err) {
      setAlternativesError(err.message || 'Network error');
    } finally {
      setAlternativesLoading(false);
    }
  };

  // Handler: Swap origin and destination
  const handleSwapPoints = () => {
    const temp = { ...origin };
    setOrigin({ ...destination });
    setDestination(temp);
  };

  // Select a preset journey
  const handleSelectPreset = (e) => {
    const found = PRESET_JOURNEYS.find((p) => p.name === e.target.value);
    if (found) {
      setOrigin(found.origin);
      setDestination(found.destination);
      setJourneyName(found.name);
    }
  };

  return (
    <div className="dashboard-page">
      {/* macOS Welcome Card & Saved Daily Commute Status */}
      <div className="dashboard-welcome-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="macos-brand-logo" style={{ width: '42px', height: '42px', borderRadius: '12px' }}>
              <User size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                  Welcome back, {userProfile?.name || 'Vipul'}!
                </h2>
                <span className="badge badge-safe" style={{ fontSize: '11px' }}>
                  Daily Route Active
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
                Configured Daily Corridor:{' '}
                <strong style={{ color: '#0284c7' }}>
                  {userProfile?.dailyOrigin?.label || 'Borivali West'}
                </strong>{' '}
                ➔{' '}
                <strong style={{ color: '#7c3aed' }}>
                  {userProfile?.dailyDestination?.label || 'Andheri West / RGIT College'}
                </strong>
                <span style={{ marginLeft: '8px', color: '#64748b' }}>
                  ({userProfile?.preferredMode || 'METRO'} Preferred Mode)
                </span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="macos-btn-secondary"
              onClick={restoreDailyRoute}
              title="Reset coordinates and inputs to your saved daily route (Borivali to RGIT)"
            >
              <RotateCcw size={14} />
              <span>Restore Daily Route</span>
            </button>

            <button
              className="macos-btn-secondary"
              onClick={() => setIsLoginModalOpen(true)}
              title="Edit daily commute profile, origin, destination or phone number"
            >
              <Edit3 size={14} />
              <span>Edit Daily Route Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <section className="stats-kpi-bar">
        <div className="kpi-card">
          <span className="kpi-label">Backend Status</span>
          <div className="flex-center-gap">
            <span className={`kpi-status-dot ${backendHealth.online ? 'bg-safe' : 'bg-danger'}`}></span>
            <span className="kpi-value">{backendHealth.online ? 'Online' : 'Disconnected'}</span>
          </div>
          <span className="kpi-sub">{backendHealth.service}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Active Incidents</span>
          <span className="kpi-value text-primary">{incidents.length} / 10 Max</span>
          <span className="kpi-sub">Real-Time Suburban Buffer</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Critical Disruptions</span>
          <span className={`kpi-value ${criticalCount > 0 ? 'text-danger' : 'text-safe'}`}>
            {criticalCount}
          </span>
          <span className="kpi-sub">Severe or impassable</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Selected Route</span>
          <span className="kpi-value font-mono">
            {baselineDistanceKm !== '—' ? `${baselineDistanceKm} km` : 'None'}
          </span>
          <span className="kpi-sub">
            {baselineDurationMin !== '—' ? `${baselineDurationMin} min baseline` : 'Plan a route below'}
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Live Ingestion Stream</span>
          <div className="flex-center-gap">
            <span className={`kpi-status-dot ${liveStreamActive ? 'bg-safe pulsing-green' : 'bg-muted'}`}></span>
            <span className="kpi-value font-mono text-sm">{liveStreamActive ? 'Pulsing (10s)' : 'Paused'}</span>
          </div>
          <button
            className="kpi-refresh-btn"
            onClick={() => setLiveStreamActive(!liveStreamActive)}
          >
            <span>{liveStreamActive ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>
        </div>
      </section>

      {/* Real-World Continuous Simulation Feeder Banner */}
      <div className="live-stream-banner">
        <div className="flex-center-gap">
          <span className={`live-pulse-dot ${liveStreamActive ? 'pulsing-green' : 'paused-gray'}`} />
          <span className="font-semibold text-sm">
            {liveStreamActive ? 'Continuous Real-World Telemetry Feeder:' : 'Telemetry Stream Paused:'}
          </span>
          <span className="text-xs text-muted">
            {lastStreamEvent
              ? `Ingested ${lastStreamEvent.locality} [${lastStreamEvent.event_type}] into ML backend.`
              : 'Streaming synthetic IoT sensor readings & citizen alerts every 10s into backend.'}
          </span>
        </div>
        <div className="flex-center-gap">
          <button
            className="btn-secondary select-sm"
            onClick={triggerManualStreamFeed}
          >
            <span>+ Feed Observation Now</span>
          </button>
        </div>
      </div>

      {/* Critical Notification Dispatcher Banner (Mobile SMS + Android System Push) */}
      <div className="notification-gateway-banner">
        <div className="notification-info-col">
          <div className="flex-center-gap">
            <Smartphone size={18} className="text-danger" />
            <span className="font-semibold text-sm">Critical Mobile SMS & Android Dispatcher:</span>
            <span className="badge badge-critical">CARRIER SMS + ANDROID PUSH</span>
          </div>
          <p className="text-xs text-muted mt-1">
            Real carrier SMS warnings are dispatched directly to your mobile phone via the configured SMS gateway whenever a critical disruption occurs (subway water &gt;50cm or road closure).
          </p>

          {/* Recipient Phone Input Form */}
          <div className="sms-phone-bar mt-2">
            <span className="text-xs font-semibold text-charcoal">Recipient Mobile Number:</span>
            <div className="flex-center-gap flex-wrap">
              <input
                type="tel"
                className="input-text select-sm"
                placeholder="Enter 10-digit mobile number (e.g. 9820123456)"
                value={mobilePhone}
                style={{ maxWidth: '270px' }}
                onChange={(e) => {
                  setMobilePhone(e.target.value);
                  saveMobilePhone(e.target.value);
                }}
              />
              <button
                className="btn-primary select-sm flex-center-gap"
                disabled={testAlertSending || !mobilePhone || mobilePhone.trim().length < 10}
                onClick={async () => {
                  setTestAlertSending(true);
                  setSmsDispatchStatus('Transmitting carrier SMS to ' + mobilePhone + '...');
                  const res = await sendCarrierMobileSMS({
                    phoneNumber: mobilePhone,
                    message: '🚨 [URBANPULSE TEST SMS] Mobile gateway connected! Critical Mumbai subway & road flood alerts will be delivered here.',
                  });
                  setTestAlertSending(false);
                  if (res.ok) {
                    setSmsDispatchStatus(`✅ Carrier SMS successfully dispatched via ${res.provider || 'TextBee (Samsung Gateway)'} to ${mobilePhone}! Check your phone.`);
                  } else {
                    setSmsDispatchStatus(`❌ SMS gateway response: ${res.error || 'Failed to dispatch'}`);
                  }
                }}
              >
                <span>{testAlertSending ? 'Dispatching SMS...' : '📲 Send Test SMS to My Mobile'}</span>
              </button>
            </div>
            {smsDispatchStatus && (
              <div
                className="text-xs font-semibold mt-1"
                style={{ color: smsDispatchStatus.startsWith('✅') ? '#16a34a' : '#dc2626' }}
              >
                {smsDispatchStatus}
              </div>
            )}
          </div>
        </div>

        <div className="flex-center-gap notification-actions-col">
          {notificationPerm !== 'granted' ? (
            <button
              className="btn-secondary select-sm flex-center-gap"
              onClick={enableAndroidNotifications}
            >
              <Bell size={13} />
              <span>Enable Android Push</span>
            </button>
          ) : (
            <span className="badge badge-safe flex-center-gap">
              <Bell size={12} />
              <span>Android Push Active</span>
            </span>
          )}

          <button
            className="btn-secondary select-sm flex-center-gap"
            disabled={testAlertSending}
            onClick={async () => {
              setTestAlertSending(true);
              const alertLog = await dispatchCriticalAlert({
                incident_id: `CRIT-${Date.now().toString().slice(-4)}`,
                locality: 'Andheri Subway (SV Road)',
                description: 'Critical 65cm waterlogging. Pumping station bank offline. Subway CLOSED to traffic!',
                road_passability: 'CLOSED',
                severity: 'CRITICAL',
              }, mobilePhone);
              setTestAlertSending(false);
              if (alertLog?.smsResult?.ok) {
                setSmsDispatchStatus(`✅ Critical Alert SMS sent to ${mobilePhone}!`);
              }
            }}
          >
            <span>🚨 Trigger Full Critical Alert</span>
          </button>
        </div>
      </div>

      {/* Main Content: Two Columns (Left: Journey Planner & Comparison, Right: Interactive Map & Feed) */}
      <div className="dashboard-grid">
        <div className="dashboard-left-col">
          {/* Journey Planner Panel */}
          <div className="planner-card">
            <div className="planner-header">
              <div className="flex-center-gap">
                <Navigation size={18} className="text-primary" />
                <h3 className="section-title">Commute Route Advisory</h3>
              </div>
              <div className="preset-selector">
                <select className="select-field select-sm" onChange={handleSelectPreset} value={journeyName}>
                  <option value="">Select Mumbai Preset Corridor...</option>
                  {PRESET_JOURNEYS.map((pj, i) => (
                    <option key={i} value={pj.name}>
                      {pj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="coords-inputs-grid">
              <div className="coord-field">
                <label className="input-label">Origin (Location & Coords):</label>
                <input
                  type="text"
                  className="input-text select-sm"
                  style={{ marginBottom: '6px' }}
                  placeholder="e.g. Borivali West"
                  value={origin.label || ''}
                  onChange={(e) => setOrigin({ ...origin, label: e.target.value })}
                />
                <div className="inputs-pair">
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text"
                    placeholder="Latitude"
                    value={origin.latitude}
                    onChange={(e) => setOrigin({ ...origin, latitude: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text"
                    placeholder="Longitude"
                    value={origin.longitude}
                    onChange={(e) => setOrigin({ ...origin, longitude: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="swap-btn-container">
                <button className="btn-icon" onClick={handleSwapPoints} title="Swap Origin and Destination">
                  <ArrowRightLeft size={16} />
                </button>
              </div>

              <div className="coord-field">
                <label className="input-label">Destination (Location & Coords):</label>
                <input
                  type="text"
                  className="input-text select-sm"
                  style={{ marginBottom: '6px' }}
                  placeholder="e.g. Andheri West / RGIT College"
                  value={destination.label || ''}
                  onChange={(e) => setDestination({ ...destination, label: e.target.value })}
                />
                <div className="inputs-pair">
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text"
                    placeholder="Latitude"
                    value={destination.latitude}
                    onChange={(e) => setDestination({ ...destination, latitude: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text"
                    placeholder="Longitude"
                    value={destination.longitude}
                    onChange={(e) => setDestination({ ...destination, longitude: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Error Banners */}
            {routePlanError && <div className="error-banner">{routePlanError}</div>}
            {routeEvalError && <div className="error-banner">{routeEvalError}</div>}
            {alternativesError && <div className="error-banner">{alternativesError}</div>}

            {/* Action Buttons */}
            <div className="planner-actions-row">
              <button
                className="btn-primary flex-center-gap"
                onClick={handlePlanRoute}
                disabled={routePlanningLoading}
              >
                <Navigation size={15} />
                <span>{routePlanningLoading ? 'Calculating Route...' : '1. Plan Route'}</span>
              </button>

              <button
                className="btn-secondary flex-center-gap"
                onClick={handleEvaluateRoute}
                disabled={routeEvalLoading}
              >
                <AlertOctagon size={15} />
                <span>{routeEvalLoading ? 'Evaluating Incidents...' : '2. Evaluate Route'}</span>
              </button>

              <button
                className="btn-secondary flex-center-gap"
                onClick={handleCompareAlternatives}
                disabled={alternativesLoading}
              >
                <Layers size={15} />
                <span>{alternativesLoading ? 'Searching Bypass...' : '3. Compare Alternatives'}</span>
              </button>
            </div>
          </div>

          {/* Route Comparison and Disruption Details */}
          <RouteComparison
            plannedRoute={plannedRoute}
            routeEvaluation={routeEvaluation}
            alternativeRoutes={alternativeRoutes}
          />

          {/* Recommended Alternate Travelling Options */}
          <AlternateTransitRecommendations
            origin={origin}
            destination={destination}
            routeEvaluation={routeEvaluation}
          />
        </div>

        {/* Right Column: Live Map & Active Incidents Stream */}
        <div className="dashboard-right-col">
          <div className="map-panel-card">
            <div className="map-panel-header">
              <div className="flex-center-gap">
                <MapPin size={18} className="text-primary" />
                <h4 className="section-title">Western Suburbs Spatial Overview</h4>
              </div>
              <span className="badge badge-neutral">{incidents.length} Active Pins</span>
            </div>

            <RouteMap height="460px" onSelectIncident={(inc) => setSelectedIncident(inc)} />
          </div>

          {/* Active Incidents Feed */}
          <div className="incident-feed-card">
            <div className="feed-header">
              <h4 className="section-title">Active Incident Feed</h4>
              <span className="text-xs text-muted">Click any incident to inspect causal details</span>
            </div>

            <div className="feed-list">
              {incidents.slice(0, 5).map((inc, i) => {
                const sev = (inc.severity || 'MODERATE').toUpperCase();
                return (
                  <div
                    key={i}
                    className="feed-item"
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <div className="feed-item-top">
                      <span className={`badge ${sev === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}`}>
                        {sev}
                      </span>
                      <span className="feed-item-loc font-semibold">{inc.locality || 'Mumbai Suburb'}</span>
                      <span className="feed-item-time text-xs text-muted">
                        {inc.road_passability || 'PASSABLE'}
                      </span>
                    </div>
                    <p className="feed-item-desc">
                      {inc.description || inc.description_or_text || inc.event_type}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Drawer */}
      {selectedIncident && (
        <IncidentDetails
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          origin={origin}
          destination={destination}
        />
      )}
    </div>
  );
}

export default Dashboard;
