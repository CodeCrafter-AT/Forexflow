import { useState, useEffect } from 'react';

export const useForexData = (activeSymbol) => {
    const [rates, setRates] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState([]);

    const fetchLeaderboard = async () => {
        try {
            const pairs = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD'];
            const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${pairs.join(',')}`);
            const data = await res.json();
            
            const mappedData = Object.entries(data.rates).map(([symbol, rate]) => ({
                symbol: `USD/${symbol}`,
                rate: rate.toFixed(4),
                trend: rate > 1.0 ? 'UP' : 'DOWN' 
            }));

            // Inject Crypto & Metals manually for Live Viewer 
            mappedData.push({ symbol: 'XAU/USD', rate: '2150.45', trend: 'UP' });
            mappedData.push({ symbol: 'BTC/USD', rate: '64230.12', trend: 'UP' });

            setLeaderboard(mappedData);
        } catch (err) {
            console.error("Leaderboard fetch failed", err);
        }
    };

    const fetchLiveRates = () => {
        fetch('https://api.frankfurter.app/latest?from=USD')
            .then(res => res.json())
            .then(data => {
                // Frankfurter only supports fiat. Forcefully append XAU and BTC so the Converter accepts them!
                const completeRates = { USD: 1, ...data.rates, XAU: 1 / 2150.45, BTC: 1 / 64230.12 };
                setRates(completeRates);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch live rates:', err);
                setRates({ USD: 1, EUR: 0.9234, GBP: 0.7915, JPY: 149.82, INR: 89, XAU: 1/2150.45, BTC: 1/64230.12 });
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchLeaderboard();
        fetchLiveRates();
    }, []);

    return { rates, leaderboard, isLoading };
};
