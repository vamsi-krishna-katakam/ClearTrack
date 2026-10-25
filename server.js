import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import connectDB from './config/database.js';
import { populateLocals } from './middleware/auth.js';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import taskRoutes from './routes/task.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import auditRoutes from './routes/audit.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize application
const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (required for Render / cloud hosts terminating SSL)
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Core middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session configuration using connect-mongo
app.use(session({
  secret: process.env.SESSION_SECRET || 'cleartrack_dev_secret_key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleartrack',
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days session life
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Global template locals (user, flash notifications)
app.use(populateLocals);

// Route Handlers
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('index', { title: 'Home' });
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/tasks', taskRoutes);
app.use('/employees', employeeRoutes);
app.use('/audit-logs', auditRoutes);

// 404 Page Not Found Handler
app.use((req, res) => {
  res.status(404).render('errors/404', { title: '404 - Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Application Error]:', err);
  res.status(500).render('errors/500', { title: '500 - Server Error' });
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== 'test') {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[ClearTrack Server] Running at: http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
