const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true,
}));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const authRoutes = require('./routes/authRoutes');
const gigRoutes = require('./routes/gigRoutes'); // Import gig routes
const bidRoutes = require('./routes/bidRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes); // Use gig routes
app.use('/api/bids', bidRoutes);

// Routes will be imported here

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
