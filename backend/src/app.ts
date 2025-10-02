import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import setImageRoutes from './routes/images';
import setTagRoutes from './routes/tags';
import { connectDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend communication
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize storage (file-based)
connectDatabase();

setImageRoutes(app);
setTagRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});