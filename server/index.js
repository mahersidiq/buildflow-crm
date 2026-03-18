const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authenticate = require('./middleware/authenticate');
const tenantScope = require('./middleware/tenantScope');

const app = express();

// --- Global middleware ---
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limit auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many requests, please try again later' },
});

// --- Public routes ---
app.use('/api/auth', authLimiter, require('./routes/auth'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// --- File upload route (auth + tenant scope) ---
app.use('/api/upload', authenticate, tenantScope, require('./routes/upload'));

// --- Protected routes (auth + tenant scope) ---
const protectedRoutes = [
  ['/api/projects',        require('./routes/projects')],
  ['/api/contacts',        require('./routes/contacts')],
  ['/api/budget-items',    require('./routes/budgetItems')],
  ['/api/estimates',       require('./routes/estimates')],
  ['/api/invoices',        require('./routes/invoices')],
  ['/api/change-orders',   require('./routes/changeOrders')],
  ['/api/daily-logs',      require('./routes/dailyLogs')],
  ['/api/bid-packages',    require('./routes/bidPackages')],
  ['/api/documents',       require('./routes/documents')],
  ['/api/photos',          require('./routes/photos')],
  ['/api/rfis',            require('./routes/rfis')],
  ['/api/punch-list',      require('./routes/punchList')],
  ['/api/purchase-orders', require('./routes/purchaseOrders')],
  ['/api/meetings',        require('./routes/meetings')],
  ['/api/settings',        require('./routes/tenantSettings')],
  ['/api/email',           require('./routes/email')],
  ['/api/templates',       require('./routes/templates')],
];

for (const [path, router] of protectedRoutes) {
  app.use(path, authenticate, tenantScope, router);
}

// --- Error handling ---
app.use(errorHandler);

// --- Start server (skip in serverless/Vercel) ---
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log(`BuildFlow CRM API running on port ${env.PORT}`);
  });
}

module.exports = app;
