import React, { useState, useEffect, useRef, Component } from 'react';

// Error Boundary — catches any render error and shows a fallback instead of a blank screen
class ErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen items-center justify-center bg-[#050505] text-slate-200">
                    <div className="text-center space-y-4 max-w-md p-8">
                        <p className="text-rose-400 text-4xl">⚠️</p>
                        <h2 className="text-xl font-bold text-white">Chart Error</h2>
                        <p className="text-slate-400 text-sm">{this.state.error?.message}</p>
                        <button onClick={() => this.setState({ hasError: false })} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Retry</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarketData } from '../hooks/useMarketData';
import { getAlphaSignal, getContractSize } from '../utils/mathHelpers';
import { Activity, LayoutGrid, Calculator, LineChart, PieChart, ChevronDown, ChevronUp, Zap, Crosshair, History, Target, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const HistoricalAnalysis = () => {
    const navigate = useNavigate();
    const { activeSymbol, setActiveSymbol, balance, tradeHistory, executeTrade, closeOpenTrade, user, authFetch } = usePortfolio();
    const [timeframe, setTimeframe] = useState('1M');
    const [chartType, setChartType] = useState('candle');
    const [isLoading, setIsLoading] = useState(false);
    const [lotSize, setLotSize] = useState(1.0);
    const [stopLossPips, setStopLossPips] = useState(30);
    const [takeProfitPips, setTakeProfitPips] = useState(50);
    const [portfolioStats, setPortfolioStats] = useState(null);

    // Live TwelveData REST feed — real OHLC + Bid/Ask spread, refreshes every 30s
    const { prices, ohlcData, isLive, lastUpdated } = useMarketData(activeSymbol.base, activeSymbol.target, 30, timeframe);

    // Safe current price — always a number
    const currentPrice   = prices?.mid   || 0;
    const yesterdayPrice = ohlcData.length >= 2 ? (ohlcData[ohlcData.length - 2]?.close || 0) : 0;
    const priceChange = (currentPrice > 0 && yesterdayPrice > 0)
        ? { value: currentPrice - yesterdayPrice, percent: ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100 }
        : { value: 0, percent: 0 };

    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const priceLinesRef = useRef([]);

    // Update chart when live data arrives from TwelveData
    const chartDataToUse = ohlcData;

    // Fetch live portfolio stats from backend whenever trade history changes
    useEffect(() => {
        if (!user) return;
        authFetch(`/api/trades/stats/${user.username}`)
            .then(res => res.json())
            .then(data => { if (data.success) setPortfolioStats(data.stats); })
            .catch(() => {});
    }, [tradeHistory, user, authFetch]);

    // Format tick multipliers accurately per asset
    const getPipMultiplier = (baseStr, targetStr) => {
        if (targetStr === 'JPY') return 0.01;
        if (baseStr === 'BTC') return 1.0; 
        if (baseStr === 'XAU') return 0.10; 
        return 0.0001; 
    };

    // Automated SL/TP Exists Engine
    useEffect(() => {
        if (!prices || !prices.bid || !prices.ask) return;

        tradeHistory.forEach(trade => {
            if (trade.status !== 'OPEN') return;
            
            const isBuy = trade.type === 'BUY';
            const tpPrice = trade.takeProfit || trade.take_profit;
            const slPrice = trade.stopLoss || trade.stop_loss;
            
            // To close a BUY trade, you sell at the BID price.
            // To close a SELL trade, you buy at the ASK price.
            const exitPrice = isBuy ? prices.bid : prices.ask;

            if (tpPrice && tpPrice > 0) {
                if ((isBuy && exitPrice >= tpPrice) || (!isBuy && exitPrice <= tpPrice)) {
                    console.log(`[Auto-Liquidation] T/P triggered for ${trade.id} at ${exitPrice}`);
                    closeOpenTrade(trade.id, exitPrice);
                    return;
                }
            }
            if (slPrice && slPrice > 0) {
                if ((isBuy && exitPrice <= slPrice) || (!isBuy && exitPrice >= slPrice)) {
                    console.log(`[Auto-Liquidation] S/L triggered for ${trade.id} at ${exitPrice}`);
                    closeOpenTrade(trade.id, exitPrice);
                }
            }
        });
    }, [prices, tradeHistory, closeOpenTrade]);

    // Format pair string & signal
    const formatPair = `${activeSymbol.base}/${activeSymbol.target}`;
    const signal = getAlphaSignal(currentPrice, yesterdayPrice);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Initialize chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#64748b',
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)', style: 1 },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)', style: 1 },
            },
            crosshair: {
                mode: 1,
                vertLine: { color: '#10b981', width: 1, style: 3, labelBackgroundColor: '#10b981' },
                horzLine: { color: '#10b981', width: 1, style: 3, labelBackgroundColor: '#10b981' },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                autoScale: true,
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
        });

        chartRef.current = chart;

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current) return;
        if (chartDataToUse.length === 0) return;

        try {
            // Recreate the series ONLY if it doesn't exist or chart type changed
            if (!seriesRef.current || seriesRef.current.chartType !== chartType) {
                if (seriesRef.current) {
                    chartRef.current.removeSeries(seriesRef.current);
                    priceLinesRef.current = []; // Clear old lines bound to the dying series!
                }

                if (chartType === 'candle') {
                    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
                        upColor: '#10b981', downColor: '#ef4444',
                        borderVisible: false,
                        wickUpColor: '#10b981', wickDownColor: '#ef4444',
                    });
                } else {
                    seriesRef.current = chartRef.current.addSeries(LineSeries, {
                        color: '#10b981', lineWidth: 2,
                        crosshairMarkerVisible: true, crosshairMarkerRadius: 6,
                        crosshairMarkerBorderColor: '#ffffff', crosshairMarkerBackgroundColor: '#10b981',
                    });
                }
                seriesRef.current.chartType = chartType;
            }
            
            // Update the data smoothly
            seriesRef.current.setData(chartDataToUse);
            chartRef.current.timeScale().fitContent();
        } catch (e) {
            console.warn('[Chart] setData failed, skipping render:', e.message);
        }
    }, [chartDataToUse, chartType]);

    // Render Dynamic Price Lines (Entry, TP, SL, Support/Resistance)
    useEffect(() => {
        if (!seriesRef.current) return;
        
        // Clear old price lines
        priceLinesRef.current.forEach(line => seriesRef.current.removePriceLine(line));
        priceLinesRef.current = [];

        // Find active trades
        const openTrades = tradeHistory.filter(t => t.status === 'OPEN' && t.pair === `${activeSymbol.base}/${activeSymbol.target}`);
        
        openTrades.forEach(trade => {
            // Draw Entry Line
            const entryLine = seriesRef.current.createPriceLine({
                price: trade.entry,
                color: '#00FF88',
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: `${trade.type} ENTRY`,
            });
            priceLinesRef.current.push(entryLine);

            const pipMult = getPipMultiplier(activeSymbol.base, activeSymbol.target);
            const takeProfitPrice = trade.takeProfit || trade.take_profit || (trade.type === 'BUY' ? trade.entry + (50 * pipMult) : trade.entry - (50 * pipMult));
            const stopLossPrice = trade.stopLoss || trade.stop_loss || (trade.type === 'BUY' ? trade.entry - (30 * pipMult) : trade.entry + (30 * pipMult));

            const tpLine = seriesRef.current.createPriceLine({
                price: takeProfitPrice,
                color: '#00FF88',
                lineWidth: 1,
                lineStyle: 1,
                axisLabelVisible: true,
                title: 'T/P (+50 PIP)',
            });
            priceLinesRef.current.push(tpLine);

            const slLine = seriesRef.current.createPriceLine({
                price: stopLossPrice,
                color: '#ef4444',
                lineWidth: 1,
                lineStyle: 1,
                axisLabelVisible: true,
                title: 'S/L (-30 PIP)',
            });
            priceLinesRef.current.push(slLine);
        });

        // Support / Resistance bounds based on visible data
        if (chartDataToUse.length > 0) {
           const highPrices = chartDataToUse.map(d => d.high || d.value || d.close);
           const lowPrices = chartDataToUse.map(d => d.low || d.value || d.close);
           const localHighest = Math.max(...highPrices);
           const localLowest = Math.min(...lowPrices);
           
           const resLine = seriesRef.current.createPriceLine({
                price: localHighest,
                color: '#3b82f6',
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: true,
                title: 'RESISTANCE',
            });
            const supLine = seriesRef.current.createPriceLine({
                price: localLowest,
                color: '#8b5cf6',
                lineWidth: 1,
                lineStyle: 2,
                axisLabelVisible: true,
                title: 'SUPPORT',
            });
            priceLinesRef.current.push(resLine, supLine);
        }
    }, [tradeHistory, activeSymbol, chartDataToUse]);

    const handleExecuteTrade = (type) => {
        if (!isNaN(lotSize) && lotSize > 0) {
            const executionPrice = type === 'BUY' ? (prices.ask || currentPrice) : (prices.bid || currentPrice);
            const contractSize = getContractSize(activeSymbol.base);
            const margin = parseFloat(((parseFloat(lotSize) * contractSize * executionPrice) / 500).toFixed(2));
            
            const pipMult = getPipMultiplier(activeSymbol.base, activeSymbol.target);
            const stopLossPrice = type === 'BUY' 
                 ? executionPrice - (stopLossPips * pipMult) 
                 : executionPrice + (stopLossPips * pipMult);
            const takeProfitPrice = type === 'BUY'
                 ? executionPrice + (takeProfitPips * pipMult)
                 : executionPrice - (takeProfitPips * pipMult);

            executeTrade(type, parseFloat(lotSize), margin, executionPrice, stopLossPrice, takeProfitPrice);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#050505] text-slate-200 font-sans antialiased selection:bg-indigo-500/30">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <header className="h-20 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                            <span className="material-symbols-outlined text-slate-400 text-sm">currency_exchange</span>
                            <select 
                                className="bg-transparent text-white font-bold outline-none cursor-pointer text-sm"
                                value={activeSymbol.base}
                                onChange={(e) => setActiveSymbol(p => ({ ...p, base: e.target.value }))}
                            >
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="USD">USD</option>
                                <option value="XAU">XAU</option>
                                <option value="BTC">BTC</option>
                            </select>
                            <span className="text-slate-500">/</span>
                            <select 
                                className="bg-transparent text-white font-bold outline-none cursor-pointer text-sm -ml-2"
                                value={activeSymbol.target}
                                onChange={(e) => setActiveSymbol(p => ({ ...p, target: e.target.value }))}
                            >
                                <option value="USD">USD</option>
                                <option value="JPY">JPY</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10"></div>
                        {/* Live Bid/Ask Price Display */}
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest">BID</p>
                                <p className="text-lg font-black text-rose-400 tabular-nums">{prices.bid > 0 ? prices.bid.toFixed(5) : '—'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">MID</p>
                                <p className="text-xl font-bold text-white tabular-nums">{currentPrice.toFixed(5)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">ASK</p>
                                <p className="text-lg font-black text-emerald-400 tabular-nums">{prices.ask > 0 ? prices.ask.toFixed(5) : '—'}</p>
                            </div>
                            <span className={`text-sm font-semibold flex items-center gap-0.5 ${priceChange.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {priceChange.value >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                                {Math.abs(priceChange.percent || 0).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-1.5 border rounded-full text-xs font-bold flex items-center gap-2 ${ isLive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                            <span className={`size-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                            {isLive ? 'LIVE' : 'CONNECTING...'}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Account Balance</p>
                            <p className="text-white font-bold">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </header>

                {/* Dashboard Grid */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8" style={{ scrollbarWidth: 'thin' }}>
                    <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6 xl:gap-8 items-start">
                        
                        {/* Left Column: Chart Area */}
                        <div className="space-y-6">
                            {/* Chart Container */}
                            <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-1 shadow-2xl overflow-hidden flex flex-col h-[500px] lg:h-[600px]">
                                {/* Chart Controls */}
                                <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-[#0a0a0c]/50">
                                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
                                        {['1W', '1M', '3M', '6M', '1Y'].map((tf) => (
                                            <button
                                                key={tf}
                                                onClick={() => setTimeframe(tf)}
                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${timeframe === tf ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                            >
                                                {tf}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
                                        <button 
                                            onClick={() => setChartType('line')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${chartType === 'line' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                        >
                                            <LineChart className="size-3.5" /> Line
                                        </button>
                                        <button 
                                            onClick={() => setChartType('candle')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${chartType === 'candle' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                        >
                                            <Crosshair className="size-3.5" /> Candle
                                        </button>
                                    </div>
                                </div>
                                {/* The Actual Chart */}
                                <div className="flex-1 relative w-full h-full bg-[#0a0a0c]/20">
                                    {isLoading && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f0f13]/80 backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-3 text-indigo-400">
                                                <RefreshCcw className="size-6 animate-spin" />
                                                <span className="text-xs font-bold tracking-widest uppercase">Syncing Data Server...</span>
                                            </div>
                                        </div>
                                    )}
                                    {!isLive && ohlcData.length === 0 && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f0f13]/80 backdrop-blur-sm text-center px-4">
                                            <div className="flex flex-col items-center gap-3 text-amber-500 max-w-sm">
                                                <span className="text-4xl">📡</span>
                                                <span className="text-sm font-bold tracking-widest uppercase">Data Feed Offline / Rate Limited</span>
                                                <p className="text-[10px] text-slate-400">TwelveData's Free Tier allows exactly 800 calls per day & 8 per minute. If you see this, wait one minute or check API limits.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chartContainerRef} className="absolute inset-0" />
                                </div>
                            </div>
                            
                                {/* Bottom Stats Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Alpha Signal Card */}
                                    <motion.div whileHover={{ y: -2 }} className="bg-[#0f0f13] border border-white/5 p-6 rounded-2xl shadow-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Target className="size-4" />
                                                Active Signals
                                            </h3>
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded border border-indigo-500/20">AI POWERED</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-2xl font-black tracking-tight ${signal.color}`}>{signal.label}</p>
                                                <p className="text-xs text-slate-500 mt-1">Based on 24h momentum</p>
                                            </div>
                                            <div className="size-16 rounded-full border-4 border-[#1c1c20] flex items-center justify-center relative">
                                                <svg className="absolute inset-0 size-full -rotate-90">
                                                    <circle cx="28" cy="28" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-white/5" />
                                                    <circle cx="28" cy="28" r="28" stroke="currentColor" strokeWidth="4" fill="none" 
                                                        className={signal.color} 
                                                        strokeDasharray="175" 
                                                        strokeDashoffset={175 - (175 * signal.confidence) / 100} 
                                                        strokeLinecap="round" 
                                                    />
                                                </svg>
                                                <span className="text-sm font-bold text-white relative z-10">{signal.confidence}%</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Live Portfolio Stats Card */}
                                    <motion.div 
                                        onClick={() => navigate('/pnl')}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        className="cursor-pointer bg-[#0f0f13] border border-white/5 p-6 rounded-2xl shadow-xl hover:border-indigo-500/30 hover:bg-[#121216] transition-all group"
                                    >
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="size-4 group-hover:text-indigo-400 transition-colors" /> Portfolio Performance
                                            </div>
                                            <span className="text-[9px] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">View PnL</span>
                                        </h3>
                                        {portfolioStats ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500">Net PnL</span>
                                                    <span className={`text-sm font-black ${portfolioStats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {portfolioStats.netPnl >= 0 ? '+' : ''}${(Number(portfolioStats.netPnl) || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500">Win Rate</span>
                                                    <span className="text-sm font-black text-indigo-400">{portfolioStats.winRate}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500">Account Health</span>
                                                    <span className="text-sm font-black text-white">${portfolioStats.accountHealth}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500">Favourite Pair</span>
                                                    <span className="text-sm font-black text-indigo-300">{portfolioStats.favouritePair}</span>
                                                </div>
                                                <div className="h-px bg-white/5 my-1"></div>
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-emerald-500">{portfolioStats.winningTrades}W</span>
                                                    <span className="text-slate-500">{portfolioStats.totalTrades} Total</span>
                                                    <span className="text-rose-500">{portfolioStats.losingTrades}L</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 text-center py-4">No trade history yet. Execute a trade to see stats.</p>
                                        )}
                                    </motion.div>
                                </div>
                        </div>

                        {/* Right Column: Order Entry & History */}
                        <div className="space-y-6">
                            {/* Order Execution Widget */}
                            <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-6 shadow-2xl">
                                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                                    <Zap className="size-4 text-indigo-400" />
                                    Order Execution
                                </h3>
                                
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Size</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={lotSize}
                                                onChange={(e) => setLotSize(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Lots</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stop Loss</label>
                                            <div className="relative">
                                                <input type="number" value={stopLossPips} onChange={(e) => setStopLossPips(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors" />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">Pips</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Take Profit</label>
                                            <div className="relative">
                                                <input type="number" value={takeProfitPips} onChange={(e) => setTakeProfitPips(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors" />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">Pips</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2 flex gap-3">
                                        <button 
                                            onClick={() => handleExecuteTrade('SELL')}
                                            className="flex-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 py-3 rounded-xl font-black tracking-widest transition-all active:scale-95"
                                        >
                                            SELL
                                        </button>
                                        <button 
                                            onClick={() => handleExecuteTrade('BUY')}
                                            className="flex-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-500 py-3 rounded-xl font-black tracking-widest transition-all active:scale-95"
                                        >
                                            BUY
                                        </button>
                                    </div>
                                    
                                    <div className="p-3 bg-black/20 rounded-lg border border-white/5 flex flex-col gap-2 mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-400 font-medium">Est. Margin</span>
                                            <span className="text-sm font-bold text-white">${(((lotSize === '' ? 0 : lotSize) * getContractSize(activeSymbol.base) * (prices.mid || currentPrice || 0)) / 500).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-400 font-medium">Spread Cost</span>
                                            <span className="text-xs font-bold text-amber-400">
                                                -${(((prices.ask - prices.bid) || 0) * (lotSize === '' ? 0 : lotSize) * getContractSize(activeSymbol.base)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Trades Sidebar */}
                            <div 
                                onClick={() => navigate('/pnl')}
                                className="cursor-pointer bg-[#0f0f13] border border-white/5 rounded-2xl p-6 shadow-2xl flex-1 max-h-[400px] flex flex-col hover:border-indigo-500/30 hover:bg-[#121216] transition-all group"
                            >
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <History className="size-4 text-indigo-400" />
                                        Recent Activity
                                    </div>
                                    <span className="text-[9px] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View Ledger →</span>
                                </h3>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ scrollbarWidth: 'none' }}>
                                    <AnimatePresence>
                                        {tradeHistory.length === 0 ? (
                                            <p className="text-xs text-slate-500 text-center py-8">No recent trades found.</p>
                                        ) : (
                                            tradeHistory.map((trade, idx) => {
                                                // Live Floating PnL for OPEN trades
                                                let floatingPnl = null;
                                                // Identify multiplier from pair (e.g. BTC/USD -> getContractSize('BTC'))
                                                const tradeBase = trade.pair.split('/')[0];
                                                const contractSize = getContractSize(tradeBase);
                                                
                                                if (trade.status === 'OPEN' && prices.bid > 0) {
                                                    const exitPrice = trade.type === 'BUY' ? prices.bid : prices.ask;
                                                    const priceDiff  = trade.type === 'BUY'
                                                        ? exitPrice - trade.entry
                                                        : trade.entry - exitPrice;
                                                    floatingPnl = priceDiff * (trade.lots * contractSize);
                                                }

                                                return (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        key={trade.id || idx}
                                                        className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-[10px] font-black tracking-widest ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {trade.type}
                                                            </span>
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                                                trade.status === 'OPEN'
                                                                    ? 'bg-indigo-500/10 text-indigo-400'
                                                                    : 'bg-slate-500/10 text-slate-500'
                                                            }`}>{trade.status}</span>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-sm font-bold text-white">{trade.pair}</p>
                                                                <p className="text-xs text-slate-400">{trade.lots} Lots @ {trade.entry?.toFixed(5)}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                {floatingPnl !== null ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <p className={`text-sm font-black tabular-nums ${
                                                                            floatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                                        }`}>
                                                                            {floatingPnl >= 0 ? '+' : ''}{(floatingPnl || 0).toFixed(2)}
                                                                        </p>
                                                                        {trade.status === 'OPEN' && (
                                                                            <button
                                                                                onClick={() => closeOpenTrade(trade.id, trade.type === 'BUY' ? prices.bid : prices.ask)}
                                                                                className="mt-2 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20 text-[10px] font-bold transition-all uppercase"
                                                                            >
                                                                                Close Trade
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-slate-500">{trade.date}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default function AnalysisPage() {
    return <ErrorBoundary><HistoricalAnalysis /></ErrorBoundary>;
}
