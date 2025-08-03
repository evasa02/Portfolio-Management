const axios = require('axios');
// const STOCK_API_KEY = 'ff4f33354a664290aa43ce3cd7d5c0af';
require('dotenv').config();
const STOCK_API_KEY = process.env.STOCK_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

async function getHistoricalPrice(symbol, purchaseDate) {
  try {
    const response = await axios.get(`${BASE_URL}/time_series`, {
      params: {
        symbol,
        interval: '1day',
        start_date: '2025-02-01',        // You can adjust this window
        end_date: '2025-08-02',
        apikey: STOCK_API_KEY
      }
    });

    const values = response.data?.values;
    if (!values || values.length === 0) {
      throw new Error('No historical price data available.');
    }

    // Search for the price on the requested date
    const match = values.find(entry => entry.datetime === purchaseDate);
    if (!match) {
      console.log(`No price data found for ${symbol} on ${purchaseDate}`);
      throw new Error('No historical price data available.');
    }

    return parseFloat(match.close);
  } catch (err) {
    console.error('Error fetching historical price:', err.message);
    throw new Error('Failed to fetch historical price.');
  }
}


// // 🔁 Get historical price (e.g., for a "buy" date)
// exports.getHistoricalPrice = async (symbol, date) => {
//   try {
//     const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&start_date=${date}&end_date=${date}&apikey=${STOCK_API_KEY}`;
//     const response = await axios.get(url);
//     const price = parseFloat(response.data.values[0].close);
//     return price;
//   } catch (error) {
//     console.error('Error fetching historical price:', error.response?.data || error.message);
//     throw new Error("Failed to fetch historical price.");
//   }
// };

// 🟢 Get current (live) price
async function getLivePrice(symbol){
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${STOCK_API_KEY}`;
    const response = await axios.get(url);

    // Use 'close' from the response instead of 'price'
    const price = parseFloat(response.data.close);

    if (isNaN(price)) {
      console.warn(`⚠️ Could not parse live price for ${symbol}:`, response.data);
      return null;
    }

    return price;
  } catch (error) {
    console.error(`Error fetching live price for ${symbol}:`, error.response?.data || error.message);
    return null;
  }
};


module.exports = {
  getHistoricalPrice,
  getLivePrice
};
