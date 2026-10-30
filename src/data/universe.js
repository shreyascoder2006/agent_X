// The 50-stock NIFTY universe Niyam scans. Prices are illustrative previous closes.
// [symbol, sector, previous close (₹), beta to NIFTY]
const RAW = [
  ['RELIANCE', 'Energy', 1412.0, 1.0], ['HDFCBANK', 'Banks', 992.0, 0.9], ['ICICIBANK', 'Banks', 1398.0, 1.0],
  ['INFY', 'IT', 1488.0, 0.8], ['TCS', 'IT', 3085.0, 0.7], ['BHARTIARTL', 'Telecom', 2010.0, 0.7],
  ['LT', 'Infra', 3790.0, 1.1], ['SBIN', 'Banks', 872.0, 1.2], ['ITC', 'FMCG', 412.0, 0.6],
  ['AXISBANK', 'Banks', 1178.0, 1.1], ['KOTAKBANK', 'Banks', 2104.0, 0.9], ['HINDUNILVR', 'FMCG', 2486.0, 0.5],
  ['BAJFINANCE', 'Financials', 1012.0, 1.3], ['MARUTI', 'Auto', 15980.0, 0.9], ['SUNPHARMA', 'Pharma', 1705.0, 0.6],
  ['TITAN', 'Consumer', 3520.0, 1.0], ['ULTRACEMCO', 'Cement', 12150.0, 0.9], ['NTPC', 'Power', 342.0, 0.9],
  ['POWERGRID', 'Power', 291.0, 0.7], ['ONGC', 'Energy', 246.0, 1.0], ['TATASTEEL', 'Metals', 168.0, 1.4],
  ['M&M', 'Auto', 3410.0, 1.1], ['ASIANPAINT', 'Consumer', 2395.0, 0.7], ['HCLTECH', 'IT', 1545.0, 0.8],
  ['WIPRO', 'IT', 248.0, 0.8], ['NESTLEIND', 'FMCG', 1215.0, 0.5], ['ADANIENT', 'Infra', 2410.0, 1.6],
  ['ADANIPORTS', 'Infra', 1420.0, 1.3], ['JSWSTEEL', 'Metals', 1135.0, 1.3], ['COALINDIA', 'Energy', 388.0, 0.9],
  ['BAJAJFINSV', 'Financials', 2035.0, 1.1], ['GRASIM', 'Cement', 2780.0, 1.0], ['TECHM', 'IT', 1480.0, 0.9],
  ['DRREDDY', 'Pharma', 1265.0, 0.5], ['CIPLA', 'Pharma', 1540.0, 0.5], ['HINDALCO', 'Metals', 742.0, 1.4],
  ['BPCL', 'Energy', 338.0, 1.1], ['BRITANNIA', 'FMCG', 5890.0, 0.5], ['EICHERMOT', 'Auto', 6980.0, 1.0],
  ['HEROMOTOCO', 'Auto', 5420.0, 0.9], ['APOLLOHOSP', 'Health', 7560.0, 0.7], ['TATACONSUM', 'FMCG', 1128.0, 0.7],
  ['SBILIFE', 'Insurance', 1842.0, 0.8], ['HDFCLIFE', 'Insurance', 768.0, 0.8], ['INDUSINDBK', 'Banks', 742.0, 1.4],
  ['BAJAJ-AUTO', 'Auto', 8860.0, 0.9], ['SHRIRAMFIN', 'Financials', 662.0, 1.3], ['TRENT', 'Consumer', 4980.0, 1.2],
  ['BEL', 'Defence', 412.0, 1.2], ['ETERNAL', 'Consumer', 318.0, 1.5],
];

export const UNIVERSE = RAW.map(([sym, sector, prev, beta], i) => ({
  sym,
  sector,
  prev,
  beta,
  i,
  // small fixed day bias so the scripted replay is not a pure index copy
  bias: (((i * 7919) % 97) / 97 - 0.45) * 0.008,
}));

export const UNI = Object.fromEntries(UNIVERSE.map((u) => [u.sym, u]));
