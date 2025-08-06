const db = require('../db');
const { getHistoricalPrice, getLivePrice, getStockProfile } = require('../services/twelveDataService');

exports.getPortfolio = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM portfolio");

    const portfolioWithLive = await Promise.all(rows.map(async (stock) => {
      const livePrice = await getLivePrice(stock.stock_symbol);
      return {
        ...stock,
        current_price: livePrice ?? 0,
        value: livePrice ? (livePrice * stock.quantity).toFixed(2) : "0.00"
      };
    }));

    res.json(portfolioWithLive);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.buyStock = async (req, res) => {
  try {
    const { stock_symbol, company_name, quantity, purchase_date } = req.body;

    if (!stock_symbol || !quantity || !purchase_date) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const price = await getHistoricalPrice(stock_symbol, purchase_date);
    const total_cost = price * quantity;

    // ✅ Fetch sector & industry
    const { sector } = await getStockProfile(stock_symbol);

    // Insert into transactions
    await db.query(`
      INSERT INTO transactions (stock_symbol, type, quantity, price, date)
      VALUES (?, 'BUY', ?, ?, ?)`,
      [stock_symbol, quantity, price, purchase_date]);

    // Check if the stock exists in portfolio
    const [existing] = await db.query(`
      SELECT quantity, average_buy_price FROM portfolio WHERE stock_symbol = ?`,
      [stock_symbol]);

    if (existing.length > 0) {
      const oldQty = existing[0].quantity;
      const oldAvgPrice = existing[0].average_buy_price ?? 0;
      const newQty = oldQty + quantity;
      const newAvgPrice = ((oldQty * oldAvgPrice) + (quantity * price)) / newQty;

      await db.query(`
        UPDATE portfolio
        SET quantity = ?, average_buy_price = ?, purchase_date = ?, sector = ?
        WHERE stock_symbol = ?`,
        [newQty, newAvgPrice.toFixed(2), purchase_date, sector, stock_symbol]);
    } else {
      await db.query(`
        INSERT INTO portfolio (stock_symbol, company_name, quantity, average_buy_price, purchase_date, sector)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [stock_symbol, company_name, quantity, price.toFixed(2), purchase_date, sector]);
    }

    res.status(201).json({
      message: 'Stock purchase recorded successfully.',
      stock_symbol,
      company_name,
      quantity,
      purchase_date,
      price,
      total_cost: total_cost.toFixed(2),
      sector
    });
  } catch (error) {
    console.error('Buy stock error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

exports.sellStock = async (req, res) => {
  const { stock_symbol, quantity, sell_date } = req.body;
  try {
    const price = await getHistoricalPrice(stock_symbol, sell_date);

    await db.query(`
      INSERT INTO transactions (stock_symbol, type, quantity, price, date)
      VALUES (?, 'SELL', ?, ?, ?)`,
      [stock_symbol, quantity, price, sell_date]);

    await db.query(`
      UPDATE portfolio SET quantity = quantity - ? WHERE stock_symbol = ?`,
      [quantity, stock_symbol]);

    res.json({ message: 'Stock sold successfully', price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transactions ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT stock_symbol, SUM(CASE WHEN type='BUY' THEN quantity ELSE -quantity END) AS total_quantity,
             SUM(CASE WHEN type='BUY' THEN quantity*price ELSE -quantity*price END) AS net_spent
      FROM transactions
      GROUP BY stock_symbol`);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
