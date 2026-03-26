import React, { useState, useEffect, useRef } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolio } from '../context/PortfolioContext';
import Sidebar from '../components/Sidebar';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';

const PnL = () => {
    const { tradeHistory, closeOpenTrade, user, authFetch } = usePortfolio();
    const [stats, setStats] = useState(null);
    const [expandedTrade, setExpandedTrade] = useState(null);

    useEffect(() => {
        if (user) {
            authFetch(`/api/trades/stats/${user.username}`)
                .then(res => res.json())
                .then(data => { if (data.success) setStats(data.stats); })
                .catch(() => {});
        }
    }, [tradeHistory, user, authFetch]);

    const closedTrades = tradeHistory.filter(t => t.status === 'CLOSED');
    const openTrades = tradeHistory.filter(t => t.status === 'OPEN');
    
    // Derived Aggregates
    const actualProfits = closedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const actualLosses = closedTrades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);

    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current || closedTrades.length === 0 || !stats) return;
        
        if (!chartRef.current) {
            const chart = createChart(chartContainerRef.current, {
                layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#cbd5e1', fontFamily: 'Inter, sans-serif' },
                grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } },
                rightPriceScale: { borderVisible: false },
                timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
                height: 280,
            });
            chartRef.current = chart;
            
            const lineSeries = chart.addSeries(LineSeries, {
                color: '#6366f1', lineWidth: 3,
                crosshairMarkerVisible: true, crosshairMarkerRadius: 6,
                crosshairMarkerBorderColor: '#000000', crosshairMarkerBackgroundColor: '#6366f1',
            });

            // Reconstruct Equity Curve Chronologically
            let runningEquity = stats.balance - stats.netPnl;
            const chronological = [...closedTrades].reverse();
            // Start plotting times staggered so it aligns historically prior to current time
            let baseTime = Math.floor(Date.now() / 1000) - (chronological.length * 3600); 
            
            const data = [{ time: baseTime, value: runningEquity }];
            chronological.forEach(trade => {
                baseTime += 3600;
                runningEquity += trade.pnl || 0;
                data.push({ time: baseTime, value: runningEquity });
            });
            
            lineSeries.setData(data);
            chart.timeScale().fitContent();
        }
    }, [closedTrades, stats]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#050505] text-slate-200 font-sans antialiased selection:bg-[#6366f1]/30">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-y-auto relative p-8 md:p-12 gap-10">
                <header>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Profit & <span className="text-indigo-500">Loss</span></h1>
                    <p className="text-sm text-slate-400 mt-2 font-medium">End-of-day analytics, true profit vs loss distributions, and forensic ledger.</p>
                </header>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {/* Stat Card 1 */}
                    <motion.div whileHover={{ y: -5 }} className="relative p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-3xl overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest relative z-10">Total Net PnL</p>
                        <p className={`text-3xl font-black mt-2 italic tracking-tighter relative z-10 drop-shadow-lg ${stats?.netPnl >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                            {stats?.netPnl >= 0 ? '+' : ''}{stats?.netPnl ? stats.netPnl.toFixed(2) : '0.00'}
                        </p>
                    </motion.div>
                    
                    {/* Stat Card 2 */}
                    <motion.div whileHover={{ y: -5 }} className="relative p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-3xl overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Actual Profits (Gross)</p>
                        <p className="text-2xl text-emerald-400 font-black mt-2 italic tracking-tighter relative z-10">+{actualProfits.toFixed(2)}</p>
                    </motion.div>

                    {/* Stat Card 3 */}
                    <motion.div whileHover={{ y: -5 }} className="relative p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-3xl overflow-hidden group">
                        <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Actual Losses (Gross)</p>
                        <p className="text-2xl text-rose-500 font-black mt-2 italic tracking-tighter relative z-10">-{actualLosses.toFixed(2)}</p>
                    </motion.div>

                    {/* Stat Card 4 */}
                    <motion.div whileHover={{ y: -5 }} className="relative p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-3xl overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Total Trades Taken</p>
                        <p className="text-2xl text-white font-black mt-2 italic tracking-tighter relative z-10">{closedTrades.length}</p>
                    </motion.div>
                </motion.div>

                {/* Section: Equity Growth Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="p-8 bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 rounded-[30px] flex flex-col gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                            Account Equity Growth
                        </h2>
                        <span className="text-[10px] text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 rounded-full font-bold tracking-widest uppercase">Performance Curve</span>
                    </div>
                    {closedTrades.length > 0 ? (
                        <div ref={chartContainerRef} className="w-full h-[280px]"></div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20">
                            <p className="text-slate-500 font-medium tracking-wide">Execute trades to begin plotting your equity curve.</p>
                        </div>
                    )}
                </motion.div>

                {/* Section: Live Active Positions */}
                {openTrades.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="p-8 bg-gradient-to-b from-indigo-500/[0.02] to-transparent border border-indigo-500/20 rounded-[30px] flex flex-col gap-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-black text-indigo-400 uppercase tracking-widest italic flex items-center gap-2">
                                <Activity className="size-5" /> Live Positions
                            </h2>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            {openTrades.map((trade, i) => (
                                <LivePositionItem 
                                    key={trade.id} 
                                    trade={trade} 
                                    index={i} 
                                    expandedTrade={expandedTrade} 
                                    setExpandedTrade={setExpandedTrade} 
                                    closeOpenTrade={closeOpenTrade} 
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Section: Trade Details Ledger */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="p-8 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-[30px] flex flex-col gap-6 shadow-2xl backdrop-blur-xl relative"
                >
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50"></div>
                    
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-black text-white uppercase tracking-widest italic">Execution Ledger</h2>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {closedTrades.length === 0 ? (
                            <div className="py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-black/40 shadow-inner">
                                <p className="text-slate-500 font-medium tracking-wide">Ledger is completely flat. No executed positions found.</p>
                            </div>
                        ) : (
                            closedTrades.map((trade, i) => {
                                const isExpanded = expandedTrade === trade.id;
                                const isBuy = trade.type === 'BUY';
                                return (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    key={trade.id} 
                                    className={`bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-xl ${isBuy ? 'hover:shadow-emerald-500/5' : 'hover:shadow-rose-500/5'}`}
                                >
                                    <div 
                                        onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                                        className="p-5 flex justify-between items-center cursor-pointer bg-gradient-to-r from-white/[0.02] to-transparent"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-4 w-32 border-r border-white/5 pr-4">
                                                <div className={`w-1.5 h-8 rounded-full ${isBuy ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                                                <span className={`text-sm font-black tracking-widest ${isBuy ? 'text-emerald-400' : 'text-rose-500'}`}>{trade.type}</span>
                                            </div>
                                            <div className="w-48">
                                                <h4 className="text-white font-black text-lg italic tracking-tight">{trade.pair}</h4>
                                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1">{trade.lots} Standard Lots</p>
                                            </div>
                                            <div className="hidden lg:block">
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Date Executed</p>
                                                <p className="text-[11px] text-slate-300 font-bold mt-1 bg-white/5 px-2 py-1 rounded inline-block">{trade.date}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className={`text-xl font-black italic tabular-nums tracking-tighter ${trade.pnl >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]'}`}>
                                                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                            <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'}`}>
                                                {isExpanded ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Drill-down Detail Panel */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-white/5 bg-black/60 shadow-inner"
                                            >
                                                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Entry Price</p>
                                                        <p className="text-sm font-mono text-white mt-1 relative z-10">{Number(trade.entry || 0).toFixed(5)}</p>
                                                    </div>
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Target Closed</p>
                                                        <p className="text-sm font-mono text-white mt-1 relative z-10">{Number((trade.entry || 0) + ((trade.pnl||0) / ((trade.lots || 1) * 100000)) * (trade.type==='BUY'?1:-1)).toFixed(5)}</p>
                                                    </div>
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Capital Margin</p>
                                                        <p className="text-sm font-bold text-white mt-1 relative z-10">${(trade.margin || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-12 h-12 bg-slate-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Time Completed</p>
                                                        <p className="text-[11px] font-bold text-slate-300 mt-1 relative z-10">{trade.closed_at || trade.date}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                                )})
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

const LivePositionItem = ({ trade, index, expandedTrade, setExpandedTrade, closeOpenTrade }) => {
    const isExpanded = expandedTrade === trade.id;
    const isBuy = trade.type === 'BUY';
    const [base, target] = trade.pair.split('/');
    
    // Execute live polling for this specific asset instantly
    const { prices } = useMarketData(base, target, 30);
    
    // Fallback to entry price if the market is closed or API throttled
    const currentPrice = (isBuy ? prices.bid : prices.ask) || trade.entry;
    const priceDiff = isBuy ? currentPrice - trade.entry : trade.entry - currentPrice;
    
    // Dynamic sizing based on asset class to resolve BTC billion-dollar scaling bugs
    const contractSize = base === 'BTC' ? 1 : (base === 'XAU' ? 100 : 100000);
    const livePnl = priceDiff * (trade.lots * contractSize);

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
            className={`bg-[#0a0a0c] border border-indigo-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 relative`}
        >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 animate-pulse"></div>
            <div 
                onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                className="p-5 pl-6 flex justify-between items-center cursor-pointer bg-gradient-to-r from-indigo-500/[0.05] to-transparent relative"
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 w-32 border-r border-white/5 pr-4">
                        <div className={`w-1.5 h-8 rounded-full ${isBuy ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
                        <span className={`text-sm font-black tracking-widest ${isBuy ? 'text-emerald-400' : 'text-rose-500'}`}>{trade.type}</span>
                    </div>
                    <div className="w-48">
                        <h4 className="text-white font-black text-lg italic tracking-tight flex items-center gap-2">
                            {trade.pair}
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                        </h4>
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-1">{trade.lots} Standard Lots</p>
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Entry Price</p>
                        <p className="text-[11px] text-white font-mono font-bold mt-1 bg-white/5 px-2 py-1 rounded inline-block">{trade.entry.toFixed(5)}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Floating PnL</p>
                        <p className={`text-xl font-black italic tabular-nums tracking-tighter ${livePnl >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]'}`}>
                            {livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)}
                        </p>
                    </div>
                    <div className="pl-4 flex items-center gap-3 border-l border-white/5">
                        <button 
                            onClick={(e) => { e.stopPropagation(); closeOpenTrade(trade.id, currentPrice); }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/60 shadow-inner"
                    >
                        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Live Market Price</p>
                                <p className="text-sm font-mono text-white mt-1 relative z-10">{currentPrice.toFixed(5)}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Target Closed</p>
                                <p className="text-sm font-mono text-white mt-1 relative z-10">{Number((trade.entry || 0) + ((trade.pnl||0) / ((trade.lots || 1) * 100000)) * (isBuy?1:-1)).toFixed(5)}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Capital Margin</p>
                                <p className="text-sm font-bold text-white mt-1 relative z-10">${(trade.margin || 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-slate-500/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest relative z-10">Time Opened</p>
                                <p className="text-[11px] font-bold text-slate-300 mt-1 relative z-10">{trade.date}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PnL;
