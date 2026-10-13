import React from 'react';
import {
  Train,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Clock,
  Car,
  Compass,
} from 'lucide-react';

export function AlternateTransitRecommendations({
  origin,
  destination,
  routeEvaluation,
  onSelectAlternative,
}) {
  const isRouteBlocked = routeEvaluation?.is_route_blocked || false;
  const isDisrupted = routeEvaluation?.should_alert || false;
  const delayMinutes = routeEvaluation?.delay?.additional_delay_minutes || 0;

  const originName = origin?.label?.split(' ')[0] || 'Borivali';
  const destName = destination?.label?.split(' ')[0] || 'Andheri / RGIT';

  const recommendations = [
    {
      id: 'METRO_2A',
      title: 'Metro Line 2A / 7 (Elevated Viaduct)',
      routeDesc: `${originName} West (Dahisar-Andheri Yellow Line) ➔ D.N. Nagar / RGIT College`,
      mode: 'METRO',
      durationMinutes: 24,
      floodRisk: '0% (Flood-Immune Elevated)',
      status: '100% OPERATIONAL',
      badgeClass: 'badge-safe',
      timeSaved: delayMinutes > 0 ? `${delayMinutes} min saved` : 'Fast & Reliable',
      rationale: 'Completely elevated transit corridor immune to road waterlogging at Andheri Subway and SV Road. Safest choice during monsoon.',
      isTopPick: true,
    },
    {
      id: 'LOCAL_TRAIN',
      title: 'Western Railway (Suburban Local)',
      routeDesc: `${originName} Station Fast Local ➔ Andheri Station (Platform 4/5)`,
      mode: 'TRAIN',
      durationMinutes: 18,
      floodRisk: 'Low (Tracks Clear)',
      status: 'NORMAL SERVICE',
      badgeClass: 'badge-safe',
      timeSaved: delayMinutes > 0 ? `${Math.max(10, delayMinutes - 5)} min saved` : 'Shortest Travel Time',
      rationale: 'High-frequency suburban service. Feeder auto or Metro Line 1 available outside Andheri West to reach RGIT College.',
      isTopPick: false,
    },
    {
      id: 'WEH_HIGHWAY',
      title: 'Western Express Highway (WEH Bypass)',
      routeDesc: `${originName} ➔ WEH Flyover Network ➔ JVLR ➔ Link Road`,
      mode: 'ROAD',
      durationMinutes: 38 + (isDisrupted ? Math.round(delayMinutes * 0.4) : 0),
      floodRisk: 'Moderate (Subways avoided)',
      status: 'SLOW MOVING',
      badgeClass: 'badge-warning',
      timeSaved: 'Bypasses Subway Waterlogging',
      rationale: 'Avoids low-lying Andheri Subway and Milan underpasses by staying on grade-separated arterial flyovers.',
      isTopPick: false,
    },
  ];

  return (
    <div className="macos-card" style={{ marginTop: '16px' }}>
      <div className="macos-card-header">
        <div className="flex-center-gap">
          <Compass size={17} style={{ color: '#0284c7' }} />
          <h4 className="macos-card-title">Recommended Alternate Travelling Options</h4>
        </div>
        <span className="badge badge-safe">AI TRANSIT MULTI-MODAL</span>
      </div>

      <p className="text-xs text-muted" style={{ marginTop: '-8px', marginBottom: '14px' }}>
        Evaluated multi-modal alternatives for commute between <strong>{origin?.label || 'Borivali'}</strong> and <strong>{destination?.label || 'RGIT College'}</strong> during active monsoon conditions:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`macos-recommendation-card ${rec.isTopPick ? 'top-recommendation' : ''}`}
            style={{
              background: rec.isTopPick ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' : '#ffffff',
              borderColor: rec.isTopPick ? '#86efac' : '#e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="flex-center-gap">
                {rec.mode === 'METRO' ? (
                  <div className="macos-brand-logo" style={{ background: '#059669', width: '28px', height: '28px' }}>
                    <Train size={15} />
                  </div>
                ) : rec.mode === 'TRAIN' ? (
                  <div className="macos-brand-logo" style={{ background: '#0284c7', width: '28px', height: '28px' }}>
                    <Train size={15} />
                  </div>
                ) : (
                  <div className="macos-brand-logo" style={{ background: '#d97706', width: '28px', height: '28px' }}>
                    <Car size={15} />
                  </div>
                )}
                <div>
                  <div className="flex-center-gap">
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{rec.title}</strong>
                    {rec.isTopPick && (
                      <span className="badge badge-safe" style={{ fontSize: '10px' }}>
                        TOP RECOMMENDATION
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted">{rec.routeDesc}</span>
                </div>
              </div>
              <span className={`badge ${rec.badgeClass}`}>{rec.status}</span>
            </div>

            <div className="recommendation-metrics-grid">
              <div className="recommendation-metric-box">
                <span className="kv-label">Transit Duration:</span>
                <div className="flex-center-gap mt-1">
                  <Clock size={14} className="text-muted" />
                  <strong style={{ fontSize: '15px' }}>{rec.durationMinutes} min</strong>
                  <span className="text-xs text-safe font-semibold">({rec.timeSaved})</span>
                </div>
              </div>

              <div className="recommendation-metric-box">
                <span className="kv-label">Flood Vulnerability:</span>
                <div className="flex-center-gap mt-1">
                  <ShieldCheck size={14} style={{ color: rec.isTopPick ? '#059669' : '#d97706' }} />
                  <strong style={{ fontSize: '13px', color: rec.isTopPick ? '#059669' : '#475569' }}>
                    {rec.floodRisk}
                  </strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, margin: '8px 0 0 0' }}>
              {rec.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlternateTransitRecommendations;
