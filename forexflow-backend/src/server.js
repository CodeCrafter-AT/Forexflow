const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '../.env' });

// Route files
const userRoutes = require('./routes/userRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const protect = require('./middleware/authMiddleware');

const app = express();

// Body parser & CORS
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/users', protect, userRoutes);
app.use('/api/trades', protect, tradeRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Forex API running in MVC format on port ${PORT}`);
});

// Global Error Handler — must be LAST
app.use(errorHandler);
