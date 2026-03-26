// Uses native fetch (available Node 18+)
const TWELVEDATA_KEY = process.env.TWELVEDATA_API_KEY;
const SPREAD = 0.0002; // 2-pip default spread

/**
 * Fetches the current live price from TwelveData and returns bid/ask.
 * Used by the backend to independently verify trade prices.
 */
async function getLivePrice(symbol = 'EUR/USD') {
    const url = `https://api.twelvedata.com/time_series?apikey=${TWELVEDATA_KEY}&symbol=${symbol}&interval=1min&outputsize=1`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data.status !== 'ok' || !data.values?.length) {
        throw new Error(`TwelveData returned no data for ${symbol}`);
    }

    const mid = parseFloat(data.values[0].close);
    return {
        mid,
        bid: parseFloat((mid - SPREAD).toFixed(5)),
        ask: parseFloat((mid + SPREAD).toFixed(5)),
    };
}

module.exports = { getLivePrice };
