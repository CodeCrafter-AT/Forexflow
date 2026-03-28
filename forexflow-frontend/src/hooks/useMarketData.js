import { useState, useEffect, useRef, useCallback } from 'react';

const TWELVEDATA_KEY = '9bb271536e0c4ab8a7b0d45d752007fd';
// Standard forex spread per pair (in price units)
const SPREADS = {
    'EUR/USD': 0.0002,
    'GBP/USD': 0.0003,
    'USD/JPY': 0.02,
};
const DEFAULT_SPREAD = 0.0002;

/**
 * useMarketData — polls TwelveData every 30s for live OHLC data.
 * Returns { bid, ask, mid, ohlcData, isLive, lastUpdated }
 */
export function useMarketData(base = 'EUR', target = 'USD', intervalSeconds = 30, timeframe = '1M') {
    const symbol = `${base}/${target}`;
    const spread = SPREADS[symbol] || DEFAULT_SPREAD;

    const [prices, setPrices] = useState({ bid: 0, ask: 0, mid: 0 });
    const [ohlcData, setOhlcData] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const intervalRef = useRef(null);

    const fetchLiveData = useCallback(async () => {
        let apiInterval = '1min';
        let outputSize = 60;
        
        switch (timeframe) {
            case '1H': apiInterval = '1min'; outputSize = 60; break;
            case '24H': apiInterval = '15min'; outputSize = 96; break;
            case '1W': apiInterval = '1h'; outputSize = 168; break;
            case '1M': apiInterval = '4h'; outputSize = 180; break;
            case '3M': apiInterval = '1day'; outputSize = 90; break;
            case '6M': apiInterval = '1day'; outputSize = 180; break;
            case '1Y': apiInterval = '1week'; outputSize = 52; break;
            default:   apiInterval = '1min'; outputSize = 60; break;
        }

        try {
            const res = await fetch(
                `https://api.twelvedata.com/time_series?apikey=${TWELVEDATA_KEY}&symbol=${symbol}&interval=${apiInterval}&outputsize=${outputSize}`
            );
            const data = await res.json();

            if (data.status !== 'ok' || !data.values?.length) return;

            // TwelveData returns newest-first; reverse to get chronological order
            const formatted = [];
            let lastTime = 0;
            [...data.values].reverse().forEach(v => {
                // Fix Safari parsing by changing space to T
                const safeDateStr = v.datetime.replace(' ', 'T') + 'Z'; 
                const timeUnixSeconds = Math.floor(new Date(safeDateStr).getTime() / 1000);
                
                // Lightweight-charts strictly crashes if time overlaps
                if (timeUnixSeconds > lastTime) {
                    formatted.push({
                        time:  timeUnixSeconds,
                        open:  parseFloat(v.open),
                        high:  parseFloat(v.high),
                        low:   parseFloat(v.low),
                        close: parseFloat(v.close),
                        value: parseFloat(v.close),
                    });
                    lastTime = timeUnixSeconds;
                }
            });

            const latestClose = formatted[formatted.length - 1].close;
            const bid = parseFloat((latestClose - spread).toFixed(5));
            const ask = parseFloat((latestClose + spread).toFixed(5));

            setPrices({ bid, ask, mid: latestClose });
            setOhlcData(formatted);
            setIsLive(true);
            setLastUpdated(new Date());
        } catch (err) {
            console.warn('[useMarketData] Fetch failed, retrying next interval:', err.message);
            setIsLive(false);
        }
    }, [symbol, spread, timeframe]);

    useEffect(() => {
        fetchLiveData(); // immediately on mount / symbol change
        intervalRef.current = setInterval(fetchLiveData, intervalSeconds * 1000);
        return () => clearInterval(intervalRef.current);
    }, [fetchLiveData, intervalSeconds]);

    return { prices, ohlcData, isLive, lastUpdated, refetch: fetchLiveData };
}
