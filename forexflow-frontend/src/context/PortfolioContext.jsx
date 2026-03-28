/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const item = localStorage.getItem('user');
      return item && item !== "undefined" ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [balance, setBalance] = useState(0);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [activeSymbol, setActiveSymbolState] = useState({ base: 'EUR', target: 'USD' });
  const [isLoaded, setIsLoaded] = useState(false);

  // Base URL for backend API (from Vite .env or Vercel Environment Variables)
  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Authentication Flow
  const authenticate = async (mode, username, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Backend server is unreachable or returned invalid data. Please ensure the backend is running.");
      }
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Authentication Failed');
      
      setToken(data.token);
      setUser(data.user);
      setBalance(data.user.balance);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network error connecting to backend.');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setBalance(0);
    setTradeHistory([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Safe fetch helper handling Bearer headers automatically
  const authFetch = useCallback((url, options = {}) => {
    return fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });
  }, [token, API_BASE]);

  useEffect(() => {
    if (!user || !token) {
        setIsLoaded(true);
        return;
    }
    
    // Auto-fetch profile dynamically utilizing logged in user
    authFetch(`/api/users/portfolio/${user.username}`)
      .then(res => {
          if (!res.ok) throw new Error(res.statusText || "Fetch failed");
          return res.json();
      })
      .then(data => {
        if (data.user) {
          setBalance(data.user.balance);
          setActiveSymbolState(data.user.activeSymbol);
          setTradeHistory(data.trades || []);
          setIsLoaded(true);
        } else {
          throw new Error("User data missing from response");
        }
      })
      .catch(err => {
          console.error("Token invalid or profile fetch failed", err);
          logout();
          setIsLoaded(true);
      });
  }, [user, token, authFetch]);

  const setActiveSymbol = (newSymbolOrFunc) => {
    if (!user) return;
    setActiveSymbolState(prev => {
      const nextSymbol = typeof newSymbolOrFunc === 'function' ? newSymbolOrFunc(prev) : newSymbolOrFunc;
      authFetch(`/api/users/portfolio/${user.username}/symbol`, {
         method: 'PUT',
         body: JSON.stringify(nextSymbol)
      }).catch(console.error);
      return nextSymbol;
    });
  };

  const executeTrade = async (type, lotSize, margin, currentPrice, stopLossPrice, takeProfitPrice) => {
    if (!user) return;
    if (margin > balance) {
      alert("INSUFFICIENT MARGIN: Lower your Lot Size or increase Leverage.");
      return;
    }

    const newTrade = {
      id: crypto.randomUUID(),
      pair: `${activeSymbol.base}/${activeSymbol.target}`,
      type: type,
      entry: currentPrice,
      lots: lotSize,
      margin: margin,
      date: new Date().toLocaleTimeString(),
      status: 'OPEN',
      stopLoss: stopLossPrice || 0,
      takeProfit: takeProfitPrice || 0
    };

    try {
      const res = await authFetch(`/api/trades/portfolio/${user.username}/trade`, {
          method: 'POST',
          body: JSON.stringify(newTrade)
      });
      const data = await res.json();
      if (data.success) {
          setBalance(data.newBalance);
          setTradeHistory(prev => [newTrade, ...prev]);
      } else {
          alert(data.error || "Trade Error");
      }
    } catch (err) {
        console.error("Trade failed", err);
        setBalance(prev => prev - margin);
        setTradeHistory(prev => [newTrade, ...prev]);
    }
  };

  const closeOpenTrade = async (tradeId, currentPrice) => {
    if (!user) return;
    try {
      const res = await authFetch(`/api/trades/portfolio/${user.username}/trade/close`, {
        method: 'PUT',
        body: JSON.stringify({ tradeId, currentPrice })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.newBalance);
        setTradeHistory(prev => prev.map(t => 
           t.id === tradeId ? { ...t, status: 'CLOSED', pnl: data.pnl, closed_at: new Date().toLocaleTimeString() } : t
        ));
        alert(`Trade Closed! PnL: $${data.pnl} (${data.result})`);
      } else {
        alert(data.error || "Failed to close trade.");
      }
    } catch (err) {
      console.error("Error closing trade", err);
    }
  };

  if (!isLoaded) return <div className="h-screen bg-[#0a120d] flex items-center justify-center text-[#13ec5b] font-black uppercase tracking-widest text-[10px] animate-pulse relative z-50">Initializing Secure Handshake...</div>;
  
  return (
    <PortfolioContext.Provider value={{ token, user, authenticate, logout, balance, tradeHistory, executeTrade, closeOpenTrade, activeSymbol, setActiveSymbol, authFetch }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
