// The app charges and displays prices in Indian rupees only.
export const CURRENCY = 'INR'
export const CURRENCY_SYMBOL = '₹'

export const formatMoney = (n: number) =>
  `${CURRENCY_SYMBOL}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
