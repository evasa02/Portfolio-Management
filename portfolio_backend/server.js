const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// Add a test route to verify API is up
app.get('/', (req, res) => {
  res.send('Portfolio Management API is running');
});

// Import and use your portfolio routes
const portfolioRoutes = require('./routes/portfolioRoutes');
app.use('/api', portfolioRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

