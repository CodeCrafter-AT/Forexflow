import { getContractSize } from './mathHelpers';

// Determine distance mapping based on standard Institutional tick sizes
const getPipMultiplier = (baseStr, targetStr) => {
    if (targetStr === 'JPY') return 0.01;
    if (baseStr === 'BTC') return 1.0; // Crypto distance 1=1
    if (baseStr === 'XAU') return 0.10; // Gold typical sub-pip difference (or just use 1.0 for ease)
    return 0.0001; // Standard Forex
}

export const calculateTradeStats = (
    userBalance,
    activeSymbol,
    currentLotSize,
    livePrice,
    stopLossDistancePips,
    leverage
) => {
    const baseStr = activeSymbol.base || activeSymbol.split('/')[0] || 'EUR';
    const targetStr = activeSymbol.target || activeSymbol.split('/')[1] || 'USD';
    const contractSize = getContractSize(baseStr);
    const floatLots = parseFloat(currentLotSize) || 0;
    
    // 1. Collateral (Margin)
    const collateral = (floatLots * contractSize * (livePrice || 1)) / leverage;

    // 2. Pip Value (Profit per Tick)
    const pipUnit = getPipMultiplier(baseStr, targetStr);
    const pipValueNum = floatLots * contractSize * pipUnit;
    let pipValueStr = `$${pipValueNum.toFixed(2)}`;

    // 3. Risk Percent (The "Red Zone")
    // Loss magnitude calculation depending entirely on stop out physical distance
    const priceDiffLoss = stopLossDistancePips * pipUnit;
    const moneyAtRisk = floatLots * contractSize * priceDiffLoss;
    
    let riskPercent = 0;
    if (userBalance > 0 && livePrice > 0) {
        riskPercent = (moneyAtRisk / userBalance) * 100;
    }

    return {
        pipValue: pipValueStr,
        riskPercent: parseFloat(riskPercent.toFixed(2)),
        collateral: parseFloat(collateral.toFixed(2)),
        moneyAtRisk: parseFloat(moneyAtRisk.toFixed(2))
    };
};
