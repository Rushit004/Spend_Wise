
interface ExchangeRateResponse {
    result: string;
    rates: { [key: string]: number };
}

const getExchangeRates = async (baseCurrency: string): Promise<{ [key: string]: number } | null> => {
    const cacheKey = `exchange_rates_${baseCurrency}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
        const { rates, timestamp } = JSON.parse(cachedData);
        // Cache for 1 hour
        if (new Date().getTime() - timestamp < 3600 * 1000) {
            return rates;
        }
    }

    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }
        const data: ExchangeRateResponse = await response.json();
        if (data.result === 'success') {
            const cachePayload = {
                rates: data.rates,
                timestamp: new Date().getTime()
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
            return data.rates;
        }
        return null;
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
        return null;
    }
};


export const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number | null> => {
    if (fromCurrency === toCurrency) {
        return amount;
    }
    
    // API provides rates based on USD, so we convert from FROM -> BASE -> TO
    const rates = await getExchangeRates(fromCurrency);
    if (!rates) {
        return null;
    }
    
    const rate = rates[toCurrency];
    if (!rate) {
        console.warn(`Conversion rate from ${fromCurrency} to ${toCurrency} not found.`);
        return null;
    }

    return amount * rate;
};
