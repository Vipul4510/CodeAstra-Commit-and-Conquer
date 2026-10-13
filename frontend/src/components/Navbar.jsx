import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUrbanPulse } from '../context/UrbanPulseContext';
import { Activity, MapPin, AlertTriangle, Cpu, FileText, Info, ShieldCheck, User } from 'lucide-react';

export function Navbar() {
  const { backendHealth, incidents, userProfile, setIsLoginModalOpen } = useUrbanPulse();

  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <NavLink to="/" className="brand-link">
          <div className="brand-logo">
            <span className="logo-pulse"></span>
            <Activity size={20} className="logo-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-name">UrbanPulse</span>
            <span className="brand-subtitle">Mumbai Suburbs Intelligence</span>
          </div>
        </NavLink>
        <div className={`status-pill ${backendHealth.online ? 'status-online' : 'status-offline'}`}>
          <span className="status-dot"></span>
          <span>{backendHealth.online ? 'Backend Connected' : 'Offline / Reconnecting'}</span>
          {backendHealth.latencyMs != null && backendHealth.online && (
            <span className="latency-badge">{backendHealth.latencyMs}ms</span>
          )}
        </div>
      </div>

      <nav className="navbar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Activity size={16} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MapPin size={16} />
          <span>Live Map</span>
        </NavLink>
        <NavLink to="/incidents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={16} />
          <span>Incidents</span>
          {incidents.length > 0 && <span className="nav-badge">{incidents.length}</span>}
        </NavLink>
        <NavLink to="/simulation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Cpu size={16} />
          <span className="nav-sim-label">Simulation Lab</span>
        </NavLink>
        <NavLink to="/evidence" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldCheck size={16} />
          <span>Evidence & Graph</span>
        </NavLink>
        <NavLink to="/transparency" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Info size={16} />
          <span>Transparency</span>
        </NavLink>

        {/* User Daily Commute Profile Chip */}
        <button
          className="pill-btn flex-center-gap ml-2"
          onClick={() => setIsLoginModalOpen(true)}
          title="Edit your daily commute route (Borivali to RGIT College)"
        >
          <User size={14} style={{ color: '#0284c7' }} />
          <span>{userProfile?.name || 'Vipul'}</span>
          <span className="badge badge-neutral text-xs" style={{ padding: '1px 5px' }}>
            Daily Route
          </span>
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
