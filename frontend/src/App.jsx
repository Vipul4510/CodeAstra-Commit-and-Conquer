import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UrbanPulseProvider } from './context/UrbanPulseContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import IncidentExplorer from './pages/IncidentExplorer';
import SimulationLab from './pages/SimulationLab';
import Evidence from './pages/Evidence';
import DataTransparency from './pages/DataTransparency';

import LoginModal from './components/LoginModal';
import { useUrbanPulse } from './context/UrbanPulseContext';

function AppContent() {
  const { isLoginModalOpen, setIsLoginModalOpen } = useUrbanPulse();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<LiveMap />} />
          <Route path="/incidents" element={<IncidentExplorer />} />
          <Route path="/simulation" element={<SimulationLab />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/transparency" element={<DataTransparency />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <UrbanPulseProvider>
      <AppContent />
    </UrbanPulseProvider>
  );
}

export default App;
