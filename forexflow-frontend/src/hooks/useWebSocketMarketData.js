import { useState, useEffect, useRef, useCallback } from 'react';

const SPREAD_HALF = 0.0001; // Half of a 2-pip spread on each side

/**
 * useWebSocketMarketData — connects to TwelveData WebSocket for real-time tick data.
 * Uses an isMounted guard to prevent setState after unmount (which was crashing React).
 *
 * @param {string} symbol - e.g. 'EUR/USD'
 * @returns {{ bid, ask, last, status, isLive }}
 */
export const useWebSocketMarketData = (symbol = 'EUR/USD') => {
    const [priceData, setPriceData] = useState({
        bid: 0, ask: 0, last: 0, status: 'connecting', isLive: false
    });
    const wsRef    = useRef(null);
    const retryRef = useRef(null);
    const mounted  = useRef(true); // guard against setState after unmount

    // Only update state if still mounted
    const safeSet = useCallback((updater) => {
        if (mounted.current) setPriceData(updater);
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            wsRef.current.close();
        }

        const ws = new WebSocket(
            `wss://ws.twelvedata.com/v1/quotes/price?apikey=9bb271536e0c4ab8a7b0d45d752007fd`
        );
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(`[WS] Connected — subscribing to ${symbol}`);
            ws.send(JSON.stringify({
                action: 'subscribe',
                params: { symbols: symbol }
            }));
            safeSet(prev => ({ ...prev, status: 'live', isLive: true }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'heartbeat' || data.event === 'subscribe-status') return;

                if (data.event === 'price' && data.price) {
                    const mid = parseFloat(data.price);
                    safeSet({
                        last:   mid,
                        bid:    parseFloat((mid - SPREAD_HALF).toFixed(5)),
                        ask:    parseFloat((mid + SPREAD_HALF).toFixed(5)),
                        status: 'live',
                        isLive: true,
                    });
                }
            } catch (e) {
                console.warn('[WS] Parse error:', e.message);
            }
        };

        ws.onerror = () => {
            console.warn('[WS] Error — will retry in 5s');
            safeSet(prev => ({ ...prev, status: 'error', isLive: false }));
        };

        ws.onclose = (e) => {
            safeSet(prev => ({ ...prev, status: 'reconnecting', isLive: false }));
            if (e.code !== 1000 && mounted.current) {
                retryRef.current = setTimeout(connect, 5000);
            }
        };
    }, [symbol, safeSet]);

    useEffect(() => {
        mounted.current = true;
        connect();
        return () => {
            mounted.current = false;
            clearTimeout(retryRef.current);
            if (wsRef.current) wsRef.current.close(1000, 'Component unmounted');
        };
    }, [connect]);

    return priceData;
};
