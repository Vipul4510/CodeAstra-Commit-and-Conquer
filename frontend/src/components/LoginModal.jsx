import React, { useState } from 'react';
import { useUrbanPulse } from '../context/UrbanPulseContext';
import { saveMobilePhone } from '../services/notificationService';
import {
  User,
  MapPin,
  Navigation,
  Train,
  Car,
  Bus,
  CheckCircle2,
  X,
  Compass,
  Sliders,
} from 'lucide-react';

const COMMON_LOCATIONS = [
  { label: 'Borivali West (SV Road / Station)', lat: 19.2307, lon: 72.8567 },
  { label: 'Kandivali West (Link Road)', lat: 19.2062, lon: 72.8365 },
  { label: 'Malad West (Subway / Inorbit)', lat: 19.1860, lon: 72.8480 },
  { label: 'Goregaon West (SV Road)', lat: 19.1620, lon: 72.8450 },
  { label: 'Jogeshwari West (SV Road)', lat: 19.1360, lon: 72.8480 },
  { label: 'Andheri West / RGIT College (Versova)', lat: 19.1362, lon: 72.8277 },
  { label: 'Andheri West (Subway / SV Road)', lat: 19.1190, lon: 72.8460 },
  { label: 'Santacruz West (Milan Subway)', lat: 19.0880, lon: 72.8390 },
  { label: 'Bandra West (Linking Road / Hill Rd)', lat: 19.0596, lon: 72.8295 },
  { label: 'Bandra Kurla Complex (BKC)', lat: 19.0660, lon: 72.8680 },
];

export function LoginModal({ isOpen, onClose }) {
  const { userProfile, saveUserProfile, setOrigin, setDestination, setJourneyName } = useUrbanPulse();

  const [inputMode, setInputMode] = useState('preset'); // 'preset' | 'manual'
  const [name, setName] = useState(userProfile?.name || 'Vipul');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [originIndex, setOriginIndex] = useState(0); // Borivali West
  const [destIndex, setDestIndex] = useState(5); // Andheri West / RGIT College
  const [commuteMode, setCommuteMode] = useState(userProfile?.preferredMode || 'METRO');

  // Manual inputs state
  const [manualOriginLabel, setManualOriginLabel] = useState(userProfile?.dailyOrigin?.label || 'Borivali West');
  const [manualOriginLat, setManualOriginLat] = useState(userProfile?.dailyOrigin?.latitude || 19.2307);
  const [manualOriginLon, setManualOriginLon] = useState(userProfile?.dailyOrigin?.longitude || 72.8567);

  const [manualDestLabel, setManualDestLabel] = useState(userProfile?.dailyDestination?.label || 'Andheri West / RGIT College');
  const [manualDestLat, setManualDestLat] = useState(userProfile?.dailyDestination?.latitude || 19.1362);
  const [manualDestLon, setManualDestLon] = useState(userProfile?.dailyDestination?.longitude || 72.8277);

  if (!isOpen) return null;

  const handleSaveAndLogin = (e) => {
    e.preventDefault();

    let finalOrigin;
    let finalDest;

    if (inputMode === 'manual') {
      finalOrigin = {
        latitude: parseFloat(manualOriginLat) || 19.2307,
        longitude: parseFloat(manualOriginLon) || 72.8567,
        label: manualOriginLabel.trim() || 'Custom Origin',
      };
      finalDest = {
        latitude: parseFloat(manualDestLat) || 19.1362,
        longitude: parseFloat(manualDestLon) || 72.8277,
        label: manualDestLabel.trim() || 'Custom Destination',
      };
    } else {
      const selectedOrigin = COMMON_LOCATIONS[originIndex];
      const selectedDest = COMMON_LOCATIONS[destIndex];
      finalOrigin = {
        latitude: selectedOrigin.lat,
        longitude: selectedOrigin.lon,
        label: selectedOrigin.label,
      };
      finalDest = {
        latitude: selectedDest.lat,
        longitude: selectedDest.lon,
        label: selectedDest.label,
      };
    }

    const profileData = {
      name: name.trim() || 'Commuter',
      phone: phone.trim().replace(/[^\d]/g, ''),
      preferredMode: commuteMode,
      dailyOrigin: finalOrigin,
      dailyDestination: finalDest,
    };

    saveUserProfile(profileData);
    if (profileData.phone) {
      saveMobilePhone(profileData.phone);
    }

    // Set active route in context to daily route
    setOrigin(finalOrigin);
    setDestination(finalDest);
    setJourneyName(`${finalOrigin.label.split(' ')[0]} to ${finalDest.label.split(' ')[0]}`);

    if (onClose) onClose();
  };

  return (
    <div className="macos-modal-backdrop">
      <div className="macos-modal-card" style={{ maxWidth: '540px' }}>
        <div className="macos-card-header">
          <div className="flex-center-gap">
            <div className="macos-brand-logo" style={{ width: '32px', height: '32px' }}>
              <Compass size={18} />
            </div>
            <div>
              <h3 className="macos-card-title" style={{ fontSize: '17px', margin: 0 }}>
                {userProfile ? 'Daily Commute Profile & Login' : 'Welcome to UrbanPulse AI'}
              </h3>
              <p className="text-xs text-muted" style={{ margin: '2px 0 0 0' }}>
                Save your daily route (e.g. Borivali to Andheri West / RGIT) for automatic dashboard loading.
              </p>
            </div>
          </div>
          {userProfile && (
            <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSaveAndLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* User Name & Mobile Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="macos-form-group" style={{ margin: 0 }}>
              <label className="macos-label">Your Name</label>
              <div className="macos-input-box">
                <User size={15} className="text-muted" />
                <input
                  type="text"
                  className="macos-input"
                  placeholder="e.g. Vipul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="macos-form-group" style={{ margin: 0 }}>
              <label className="macos-label">Mobile Phone (SMS Alerts)</label>
              <div className="macos-input-box">
                <span className="text-xs font-semibold text-muted">+91</span>
                <input
                  type="tel"
                  className="macos-input"
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mode toggle: Presets vs Manual Coordinates */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="macos-label" style={{ margin: 0 }}>Daily Route Configuration</span>
            <div className="macos-segmented-tabs" style={{ padding: '2px' }}>
              <button
                type="button"
                className={`macos-tab-btn ${inputMode === 'preset' ? 'active' : ''}`}
                style={{ padding: '4px 12px', fontSize: '11px' }}
                onClick={() => setInputMode('preset')}
              >
                Mumbai Presets
              </button>
              <button
                type="button"
                className={`macos-tab-btn ${inputMode === 'manual' ? 'active' : ''}`}
                style={{ padding: '4px 12px', fontSize: '11px' }}
                onClick={() => setInputMode('manual')}
              >
                Manual Coords
              </button>
            </div>
          </div>

          {inputMode === 'preset' ? (
            <>
              {/* Daily Origin Dropdown */}
              <div className="macos-form-group" style={{ margin: 0 }}>
                <label className="macos-label">Daily Origin (Home)</label>
                <div className="macos-input-box">
                  <MapPin size={15} style={{ color: '#059669' }} />
                  <select
                    className="macos-input"
                    value={originIndex}
                    onChange={(e) => setOriginIndex(parseInt(e.target.value))}
                  >
                    {COMMON_LOCATIONS.map((loc, i) => (
                      <option key={i} value={i}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Daily Destination Dropdown */}
              <div className="macos-form-group" style={{ margin: 0 }}>
                <label className="macos-label">Daily Destination (College / Office)</label>
                <div className="macos-input-box">
                  <Navigation size={15} style={{ color: '#7c3aed' }} />
                  <select
                    className="macos-input"
                    value={destIndex}
                    onChange={(e) => setDestIndex(parseInt(e.target.value))}
                  >
                    {COMMON_LOCATIONS.map((loc, i) => (
                      <option key={i} value={i}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Manual Origin */}
              <div className="macos-form-group" style={{ margin: 0 }}>
                <label className="macos-label">Manual Origin (Label, Lat, Lon)</label>
                <input
                  type="text"
                  className="input-text select-sm"
                  style={{ marginBottom: '6px', width: '100%' }}
                  placeholder="Location name (e.g. Borivali West)"
                  value={manualOriginLabel}
                  onChange={(e) => setManualOriginLabel(e.target.value)}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text select-sm"
                    placeholder="Latitude"
                    value={manualOriginLat}
                    onChange={(e) => setManualOriginLat(e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text select-sm"
                    placeholder="Longitude"
                    value={manualOriginLon}
                    onChange={(e) => setManualOriginLon(e.target.value)}
                  />
                </div>
              </div>

              {/* Manual Destination */}
              <div className="macos-form-group" style={{ margin: 0 }}>
                <label className="macos-label">Manual Destination (Label, Lat, Lon)</label>
                <input
                  type="text"
                  className="input-text select-sm"
                  style={{ marginBottom: '6px', width: '100%' }}
                  placeholder="Destination name (e.g. Andheri West / RGIT College)"
                  value={manualDestLabel}
                  onChange={(e) => setManualDestLabel(e.target.value)}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text select-sm"
                    placeholder="Latitude"
                    value={manualDestLat}
                    onChange={(e) => setManualDestLat(e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="input-text select-sm"
                    placeholder="Longitude"
                    value={manualDestLon}
                    onChange={(e) => setManualDestLon(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Preferred Daily Mode */}
          <div className="macos-form-group" style={{ margin: 0 }}>
            <label className="macos-label">Primary Daily Travel Mode</label>
            <div className="macos-mode-selector" style={{ margin: 0 }}>
              <button
                type="button"
                className={`macos-mode-btn ${commuteMode === 'METRO' ? 'active' : ''}`}
                onClick={() => setCommuteMode('METRO')}
              >
                <Train size={16} />
                <span>Metro 2A/7</span>
              </button>
              <button
                type="button"
                className={`macos-mode-btn ${commuteMode === 'TRAIN' ? 'active' : ''}`}
                onClick={() => setCommuteMode('TRAIN')}
              >
                <Train size={16} />
                <span>Local Train</span>
              </button>
              <button
                type="button"
                className={`macos-mode-btn ${commuteMode === 'ROAD' ? 'active' : ''}`}
                onClick={() => setCommuteMode('ROAD')}
              >
                <Car size={16} />
                <span>Car / Auto</span>
              </button>
              <button
                type="button"
                className={`macos-mode-btn ${commuteMode === 'BUS' ? 'active' : ''}`}
                onClick={() => setCommuteMode('BUS')}
              >
                <Bus size={16} />
                <span>BEST Bus</span>
              </button>
            </div>
          </div>

          {/* Action button */}
          <div style={{ marginTop: '8px' }}>
            <button type="submit" className="macos-btn-primary">
              <CheckCircle2 size={16} />
              <span>Save Daily Route & Launch Dashboard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
