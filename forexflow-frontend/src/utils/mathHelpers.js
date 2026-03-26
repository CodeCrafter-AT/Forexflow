export const getContractSize = (basePair) => {
    if (basePair.startsWith('BTC')) return 1;
    if (basePair.startsWith('XAU')) return 100;
    return 100000;
};

export const calculateMarginRequired = (lotSize, leverage, basePair = 'EUR') => {
    return (lotSize * getContractSize(basePair)) / leverage;
};

export const calculateMaxFluxLoss = (equityBase, riskExposure) => {
    return equityBase * (riskExposure / 100);
};

export const getAlphaSignal = (currentPrice, yesterdayPrice) => {
    if (!yesterdayPrice) return { label: "SCANNING...", color: "text-gray-400", confidence: 0 };
  
    const changePercent = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
    
    if (changePercent > 0.5) return { label: "STRONG BUY", color: "text-emerald-400", confidence: 94 };
    if (changePercent > 0) return { label: "BUY", color: "text-green-400", confidence: 72 };
    if (changePercent < -0.5) return { label: "STRONG SELL", color: "text-rose-400", confidence: 91 };
    if (changePercent < 0) return { label: "SELL", color: "text-red-400", confidence: 68 };
    
    return { label: "NEUTRAL", color: "text-yellow-400", confidence: 50 };
};
