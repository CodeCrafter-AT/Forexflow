import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import GlobalRiskWatcher from './components/GlobalRiskWatcher';

// Pages
import CurrencyConverter from './pages/CurrencyConverter';
import LiveDesk from './pages/LiveDesk';
import HistoricalAnalysis from './pages/HistoricalAnalysis';
import Settings from './pages/Settings';
import PnL from './pages/PnL';
import Login from './pages/Login';

import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, token } = usePortfolio();
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AuthBarrier = () => {
  // If accessing /login whilst tokened, boot out to the application immediately
  const { user, token } = usePortfolio();
  if (user && token) {
     return <Navigate to="/dashboard" replace />;
  }
  return <Login />;
}

const App = () => {
  return (
    <PortfolioProvider>
      <GlobalRiskWatcher />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthBarrier />} />
          <Route path="/" element={<ProtectedRoute><CurrencyConverter /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><LiveDesk /></ProtectedRoute>} />
          <Route path="/analysis" element={<ProtectedRoute><HistoricalAnalysis /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/pnl" element={<ProtectedRoute><PnL /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PortfolioProvider>
  );
};

export default App;
