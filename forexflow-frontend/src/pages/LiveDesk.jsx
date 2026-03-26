import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { calculateMaxFluxLoss, getContractSize } from '../utils/mathHelpers';
import { calculateTradeStats } from '../utils/RiskEngine';
import { useMarketData } from '../hooks/useMarketData';
import { Zap, LayoutGrid, Calculator, LineChart, ShieldCheck, AlertTriangle, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const LiveDesk = () => {
    const { activeSymbol, setActiveSymbol, balance } = usePortfolio();
    const { prices } = useMarketData(activeSymbol.base, activeSymbol.target);
    const livePrice = prices?.mid || 0;
    
    const [lotSize, setLotSize] = useState(1.0);
    const [leverage, setLeverage] = useState(500);
    const [stopLossPips, setStopLossPips] = useState(50);

    const { pipValue, riskPercent, collateral, moneyAtRisk } = calculateTradeStats(
        balance || 1000000,
        activeSymbol,
        lotSize,
        livePrice,
        stopLossPips,
        leverage
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#050505] text-slate-100 font-display">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-20 border-b border-[#1e3a27] bg-[#121212]/80 backdrop-blur-md flex items-center justify-between px-10 z-10">
                    <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">Node</span>
                        <span className="text-slate-700">/</span>
                        <span className="text-white italic">London_L1_Desk</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-6 pr-6 border-r border-[#1e3a27]">
                            <button className="relative text-slate-400 hover:text-[#00FF88] transition-colors"><Bell className="size-5" />
                                <span className="absolute -top-1 -right-1 size-2 bg-[#00FF88] rounded-full border-2 border-[#121212]"></span>
                            </button>
                            <button className="text-slate-400 hover:text-[#00FF88] transition-colors"><Search className="size-5" /></button>
                        </div>
                        <div className="flex items-center gap-2 bg-[#050505] px-4 py-2 rounded-xl border border-[#1e3a27]">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latency:</span>
                            <span className="text-[10px] font-black text-[#00FF88]">8.4ms</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-[#050505]">
                    <div className="max-w-7xl mx-auto space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                <h2 className="text-6xl font-black tracking-tighter text-white uppercase italic">Trading <span className="text-[#00FF88]">Desk</span></h2>
                                <p className="text-slate-500 mt-4 text-base max-w-lg leading-relaxed font-semibold">Modular order configuration with institutional-grade risk parameters.</p>
                            </motion.div>
                            <div className="flex gap-4">
                                <button className="px-8 py-4 bg-[#121212] text-[10px] font-black rounded-2xl border border-[#1e3a27] hover:bg-white/5 transition-all uppercase tracking-[0.2em] text-slate-300 italic">
                                    Reset Desk
                                </button>
                                <button className="px-8 py-4 bg-[#00FF88] text-[#102216] text-[10px] font-black rounded-2xl hover:brightness-110 transition-all shadow-2xl shadow-[#00FF88]/20 uppercase tracking-[0.2em] italic">
                                    Sync State
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Pip Value Widget */}
                            <motion.div whileHover={{ y: -5 }} className="bg-[#121212] rounded-[40px] border border-[#1e3a27] p-10 space-y-8 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-[#00FF88]/10 text-[#00FF88] rounded-2xl">
                                            <Zap className="size-6 fill-[#00FF88]" />
                                        </div>
                                        <h3 className="font-black text-lg tracking-tight uppercase italic">Pip Valuator</h3>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pair Cluster</label>
                                        <select 
                                            className="w-full bg-[#050505] border border-[#1e3a27] rounded-2xl text-sm py-4 px-6 focus:ring-2 focus:ring-[#00FF88]/50 outline-none text-white font-black italic"
                                            value={`${activeSymbol.base}/${activeSymbol.target}`}
                                            onChange={(e) => {
                                                const [base, target] = e.target.value.split('/');
                                                setActiveSymbol({ base, target });
                                            }}
                                        >
                                            <option value="EUR/USD">EUR / USD</option>
                                            <option value="GBP/USD">GBP / USD</option>
                                            <option value="USD/JPY">USD / JPY</option>
                                            <option value="XAU/USD">XAU / USD (Gold)</option>
                                            <option value="BTC/USD">BTC / USD (Bitcoin)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lot Sizing</label>
                                            <span className="text-[10px] font-black text-[#00FF88] bg-[#00FF88]/10 px-3 py-1 rounded-full uppercase">{lotSize.toFixed(2)} Lots</span>
                                        </div>
                                        <input className="w-full h-2 bg-[#050505] rounded-full appearance-none cursor-pointer accent-[#00FF88]" max="100" min="0.1" step="0.1" type="range" value={lotSize} onChange={(e) => setLotSize(parseFloat(e.target.value))} />
                                    </div>
                                    <div className="pt-10 border-t border-[#1e3a27] space-y-2">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Estimated Flux Value</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-[#00FF88] italic">{pipValue}</span>
                                            <span className="text-sm font-black text-slate-500 italic">/ PIP</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Required Margin Widget */}
                            <motion.div whileHover={{ y: -5 }} className="bg-[#121212] rounded-[40px] border border-[#1e3a27] p-10 space-y-8 shadow-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                                            <ShieldCheck className="size-6" />
                                        </div>
                                        <h3 className="font-black text-lg tracking-tight uppercase italic">Collateral</h3>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leverage Factor</label>
                                            <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full uppercase">1:{leverage}</span>
                                        </div>
                                        <input className="w-full h-2 bg-[#050505] rounded-full appearance-none cursor-pointer accent-blue-500" max="1000" min="1" step="1" type="range" value={leverage} onChange={(e) => setLeverage(parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Position Base Units</label>
                                        <div className="relative group">
                                            <input className="w-full bg-[#050505] border border-[#1e3a27] group-focus-within:border-blue-500 rounded-2xl text-xl py-5 px-6 outline-none font-black italic text-slate-400" type="number" readOnly value={getContractSize(activeSymbol.base)} />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase tracking-tighter">Units</span>
                                        </div>
                                    </div>
                                    <div className="pt-10 border-t border-[#1e3a27] space-y-2">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Locked Margin</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-blue-500 italic">${collateral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span className="text-sm font-black text-slate-500 italic">USD</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Risk Management Widget */}
                            <motion.div whileHover={{ y: -5 }} className={`bg-[#121212] rounded-[40px] border p-10 space-y-8 shadow-2xl relative overflow-hidden transition-colors ${riskPercent > 2.0 ? 'border-red-500/50' : 'border-amber-500/20'}`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl transition-colors ${riskPercent > 2.0 ? 'bg-red-500/10' : 'bg-amber-500/5'}`}></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${riskPercent > 2.0 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            <AlertTriangle className="size-6" />
                                        </div>
                                        <h3 className={`font-black text-lg tracking-tight uppercase italic ${riskPercent > 2.0 ? 'text-red-500' : 'text-amber-500'}`}>Risk Sensor</h3>
                                    </div>
                                </div>
                                <div className="space-y-8 relative z-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equity Base (Live Balance)</label>
                                        <input className="w-full bg-[#050505] border border-white/5 rounded-2xl text-xl py-5 px-6 outline-none font-black italic text-slate-400" type="text" readOnly value={`$${balance.toLocaleString()}`} />
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stop Loss Distance (Pips)</label>
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${riskPercent > 2.0 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                Risk: {riskPercent}% {riskPercent > 2.0 ? '- HIGH' : '- OK'}
                                            </span>
                                        </div>
                                        <input className={`w-full h-2 bg-[#050505] rounded-full appearance-none cursor-pointer ${riskPercent > 2.0 ? 'accent-red-500' : 'accent-amber-500'}`} max="500" min="10" step="5" type="range" value={stopLossPips} onChange={(e) => setStopLossPips(parseFloat(e.target.value))} />
                                    </div>
                                    <div className={`pt-10 border-t space-y-4 ${riskPercent > 2.0 ? 'border-red-500/20' : 'border-amber-500/10'}`}>
                                        <div className={`border p-6 rounded-3xl ${riskPercent > 2.0 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 leading-none ${riskPercent > 2.0 ? 'text-red-400' : 'text-amber-400'}`}>Capital Exposure at Stop</p>
                                            <p className={`text-4xl font-black italic tracking-tighter ${riskPercent > 2.0 ? 'text-red-500' : 'text-amber-500'}`}>${moneyAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LiveDesk;
