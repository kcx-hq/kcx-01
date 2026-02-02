import express from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import authRoutes from './modules/shared/auth/auth.route.js';
import inquiryRoutes from './modules/shared/inquiry/inquiry.route.js';
import etlRoutes from './modules/shared/ETL/etl.route.js'
import sequelize from './config/db.config.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import coreDashboardRoutes from './modules/core-dashboard/core-dashboard.routes.js';
import capabililitesRoutes from './modules/shared/capabilities/capabilities.routes.js';
import chatbotRoutes from './modules/shared/chatbot/chat.routes.js'

import getClientDashboardRoutes from './modules/clients/index.js'
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`
});


const app = express();


// PERFORMANCE: Add compression middleware to reduce response sizes
app.use(compression({ level: 6, threshold: 1024 })); // Compress responses > 1KB

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://master-01-git-master-kcx.vercel.app",
        process.env.FRONTEND_URL
      ].filter(Boolean);
      
      // Allow Vercel preview deployments (*.vercel.app)
      const isVercelPreview = origin && origin.match(/https:\/\/.*\.vercel\.app$/);
      
      if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,               // allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// // PERFORMANCE: Add HTTP caching headers for static-like API responses
// app.use((req, res, next) => {
//   // Cache filter options and static data for 5 minutes
//   if (req.path.includes('/filters') || req.path.includes('/options')) {
//     res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
//   }
//   // Cache overview data for 1 minute (can be stale)
//   else if (req.path.includes('/overview') || req.path.includes('/dashboard')) {
//     res.set('Cache-Control', 'public, max-age=60'); // 1 minute
//   }
//   next();
// });

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth' , authRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/etl' , etlRoutes )
app.use('/api/capabililites', capabililitesRoutes )
app.use('/api/dashboard', coreDashboardRoutes);
app.use('/api/chatbot' , chatbotRoutes)

getClientDashboardRoutes(app);

// Start server after DB connection
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
   return sequelize.sync({ force:  false , alter: false}); 
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('Database connection error:', err));


