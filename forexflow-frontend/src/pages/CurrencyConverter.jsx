import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useForexData } from '../hooks/useForexData';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
const CurrencyConverter = () => {
    const { balance, tradeHistory, executeTrade, activeSymbol, setActiveSymbol } = usePortfolio();
    const { rates, leaderboard, isLoading } = useForexData(activeSymbol);
    const [sourceAmount, setSourceAmount] = useState('1250.00');
    const [convertedAmount, setConvertedAmount] = useState('0.00');

    useEffect(() => {
        if (!rates) return;
        const amount = parseFloat(sourceAmount.replace(/,/g, ''))
        if (!isNaN(amount)) {
            const amountInUSD = amount / rates[activeSymbol.base];
            const result = amountInUSD * rates[activeSymbol.target];
            setConvertedAmount(result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } else {
            setConvertedAmount('0.00');
        }
    }, [sourceAmount, activeSymbol.base, activeSymbol.target, rates]);

    const handleSwap = () => {
        setActiveSymbol(prev => ({ base: prev.target, target: prev.base }));
    };

    const handleExecuteTrade = () => {
        const lotSize = parseFloat(sourceAmount.replace(/,/g, ''));
        const currentExecutionPrice = rates ? rates[activeSymbol.target] : 1.0;
        
        if (!isNaN(lotSize) && lotSize > 0) {
            // Defaulting to 100x leverage for now
            executeTrade('BUY', lotSize, 100, currentExecutionPrice); 
        }
    };

    return (
        <div className="flex flex-col min-h-screen text-slate-200 bg-[#0a0a0c] font-sans antialiased">
            <nav className="bg-[#0a0a0c]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="flex items-center justify-between px-6 h-16 max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-8">
                        {/* Logo removed as it exists in the Sidebar */}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden xl:flex items-center bg-black/20 rounded-full border border-white/5 px-2">
                            <div className="flex items-center gap-2 px-4 py-1 text-[11px] font-bold tracking-tight border-r border-white/5">
                                <span className="text-slate-400">EUR/USD</span>
                                <span className="text-emerald-400">1.0824</span>
                                <span className="material-symbols-outlined text-[12px] text-emerald-400">trending_up</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1 text-[11px] font-bold tracking-tight border-r border-white/5">
                                <span className="text-slate-400">GBP/USD</span>
                                <span className="text-rose-400">1.2642</span>
                                <span className="material-symbols-outlined text-[12px] text-rose-400">trending_down</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1 text-[11px] font-bold tracking-tight">
                                <span className="text-slate-400">USD/JPY</span>
                                <span className="text-emerald-400">149.82</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                            <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </button>
                            <div className="h-4 w-[1px] bg-white/10"></div>
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 cursor-pointer flex items-center justify-center text-xs font-bold">U</div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex" style={{ background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 60%)' }}>
                <Sidebar />
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <div className="max-w-5xl mx-auto p-8 lg:p-12 space-y-12">
                        {tradeHistory.length > 0 && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3">
                                <span className="material-symbols-outlined">check_circle</span>
                                Successfully executed {tradeHistory[0].type} order for {tradeHistory[0].lots} on {tradeHistory[0].pair}
                            </div>
                        )}
                        <section className="space-y-6">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Currency Converter</h1>
                                    <p className="text-slate-400 text-sm mt-1">Real-time institutional rates with zero latency.</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/5 px-3 py-1.5 rounded-full border border-emerald-400/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    LIVE FEED ACTIVE
                                </div>
                            </div>
                            <div className="bg-[#141416] border border-[#2a2a30] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600/0 via-blue-600 to-blue-600/0">
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Source Amount</label>
                                        <div className="bg-[#1c1c21] border border-[#2a2a30] rounded-2xl p-6 focus-within:border-blue-600/50 transition-colors">
                                            <div className="flex items-center justify-between gap-4">
                                                <input className="bg-transparent border-none p-0 text-3xl font-bold text-white focus:ring-0 w-full outline-none" type="text" value={sourceAmount} onChange={(e) => setSourceAmount(e.target.value)} />
                                                <div className="relative">
                                                    <select className="appearance-none flex items-center gap-2 bg-[#0a0a0c] px-3 py-2 pr-8 rounded-xl border border-[#2a2a30] hover:bg-[#2a2a30] transition-colors shrink-0 font-bold text-sm text-white outline-none cursor-pointer" value={activeSymbol.base} onChange={(e) => setActiveSymbol(p => ({ ...p, base: e.target.value }))} disabled={isLoading}>
                                                        {rates && Object.keys(rates).map(currency => (
                                                            <option key={currency} value={currency}>{currency}</option>
                                                        ))}
                                                    </select>
                                                    <span className="material-symbols-outlined text-slate-400 text-lg absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center md:pt-6">
                                        <button onClick={handleSwap} className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-110 active:scale-95 transition-all">
                                            <span className="material-symbols-outlined font-bold">swap_horiz</span>
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Converted Result</label>
                                        <div className="bg-[#1c1c21] border border-[#2a2a30] rounded-2xl p-6 relative">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="text-3xl font-bold text-blue-600">{isLoading ? '...' : convertedAmount}</div>
                                                <div className="relative">
                                                    <select className="appearance-none flex items-center gap-2 bg-[#0a0a0c] px-3 py-2 pr-8 rounded-xl border border-[#2a2a30] hover:bg-[#2a2a30] transition-colors shrink-0 font-bold text-sm text-white outline-none cursor-pointer" value={activeSymbol.target} onChange={(e) => setActiveSymbol(p => ({ ...p, target: e.target.value }))} disabled={isLoading}>
                                                        {rates && Object.keys(rates).map(currency => (
                                                            <option key={currency} value={currency}>{currency}</option>
                                                        ))}
                                                    </select>
                                                    <span className="material-symbols-outlined text-slate-400 text-lg absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                                                </div>
                                            </div>
                                            <button className="absolute -top-3 -right-3 bg-[#1c1c21] border border-[#2a2a30] p-2 rounded-lg text-slate-400 hover:text-white transition-colors shadow-xl group/copy">
                                                <span className="material-symbols-outlined text-sm">content_copy</span>
                                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#0a0a0c] text-[10px] px-2 py-1 rounded opacity-0 group-hover/copy:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Copy Result</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-[#2a2a30]">
                                    <div className="flex items-center gap-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exchange Rate</p>
                                            <p className="text-sm font-semibold text-white">
                                                {isLoading || !rates ? 'Loading...' : `1 ${activeSymbol.base} = ${((1 / rates[activeSymbol.base]) * rates[activeSymbol.target]).toFixed(4)} ${activeSymbol.target}`}
                                            </p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-[#2a2a30]"></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fee (0.01%)</p>
                                            <p className="text-sm font-semibold text-white">$0.13 <span className="text-slate-400 font-normal ml-1">Included</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button onClick={handleExecuteTrade} className="flex-1 md:flex-none px-8 py-4 bg-white text-[#0a0a0c] font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-xl">account_balance</span>
                                            Execute Trade
                                        </button>
                                        <button className="px-5 py-4 bg-[#1c1c21] border border-[#2a2a30] text-white font-bold rounded-2xl hover:bg-[#2a2a30] transition-all flex items-center justify-center">
                                            <span className="material-symbols-outlined">analytics</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-[#141416] border border-[#2a2a30] rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600">show_chart</span>
                                        Market Performance
                                    </h3>
                                    <div className="flex bg-[#0a0a0c] rounded-lg p-1 border border-[#2a2a30]">
                                        <button className="px-3 py-1 text-[10px] font-bold text-white bg-[#1c1c21] rounded shadow-sm">1H</button>
                                        <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-white transition-all">1D</button>
                                        <button className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-white transition-all">1W</button>
                                    </div>
                                </div>
                                <div className="h-48 flex items-end gap-3 px-2">
                                    <div className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-t-xl transition-all" style={{ height: '40%' }}></div>
                                    <div className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-t-xl transition-all" style={{ height: '65%' }}></div>
                                    <div className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-t-xl transition-all" style={{ height: '55%' }}></div>
                                    <div className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-t-xl transition-all" style={{ height: '85%' }}></div>
                                    <div className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-t-xl transition-all" style={{ height: '70%' }}></div>
                                    <div className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-t-xl transition-all" style={{ height: '90%' }}></div>
                                    <div className="flex-1 bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] rounded-t-xl" style={{ height: '75%' }}></div>
                                </div>
                                <div className="flex justify-between mt-6 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>08:00</span>
                                    <span>12:00</span>
                                    <span>16:00</span>
                                    <span>20:00</span>
                                    <span>00:00</span>
                                </div>
                            </div>
                            <div className="bg-[#141416] border border-[#2a2a30] rounded-3xl flex flex-col">
                                <div className="p-6 border-b border-[#2a2a30] flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-white">Live Rates</h3>
                                    <span className="text-[10px] font-medium text-slate-400">Updated 2s ago</span>
                                </div>
                                <div className="flex-1 divide-y divide-[#2a2a30]/50">
                                    {leaderboard.length === 0 ? (
                                        <div className="p-4 text-center text-xs font-bold text-slate-500 uppercase">Fetching live data...</div>
                                    ) : (
                                        leaderboard.map((item, idx) => (
                                            <div key={idx} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#0a0a0c] border border-[#2a2a30] flex items-center justify-center text-[10px] font-bold">
                                                        {item.symbol.split('/')[1].slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white group-hover:text-blue-600 transition-colors">{item.symbol}</p>
                                                        <p className="text-[10px] text-slate-400">Live Rate</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-white">{item.rate}</p>
                                                    <p className={`text-[10px] font-bold ${item.trend === 'UP' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {item.trend === 'UP' ? '+' : ''}{item.trend}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button className="p-4 text-[10px] font-bold text-slate-400 hover:text-white transition-colors border-t border-[#2a2a30] w-full text-center tracking-widest">
                                    VIEW ALL 150+ PAIRS
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-t border-[#2a2a30]">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Users</p>
                                <p className="text-lg font-bold text-white">1.2M+</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Volume</p>
                                <p className="text-lg font-bold text-white">$4.8B</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Speed</p>
                                <p className="text-lg font-bold text-white">12ms</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security</p>
                                <p className="text-lg font-bold text-white">SOC-2</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CurrencyConverter;
