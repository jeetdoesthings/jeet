const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Secure HTTP headers with Helmet
// Configure Content Security Policy (CSP) to allow local assets and media players
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline allowed for SPA view toggles if any, but local scripts are preferred
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'", "data:", "blob:"], // critical for local background videos
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'same-origin' },
  })
);

// 2. Reject Oversized Payloads (DoS Mitigation)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// 3. Prevent exposure of sensitive files (Blacklist middleware)
app.use((req, res, next) => {
  const urlPath = req.path.toLowerCase();
  
  // Block any attempt to access sensitive files directly from the static directory
  const blockedPatterns = [
    '.env',
    'package.json',
    'package-lock.json',
    'server.js',
    '.git',
    '.gitignore',
    'spechtstudio.md'
  ];
  
  const isBlocked = blockedPatterns.some(pattern => {
    return urlPath.includes(pattern) || urlPath.startsWith('/.');
  });

  if (isBlocked) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'You do not have permission to access this resource.'
    });
  }
  next();
});

// 4. Rate Limiting Setup
// Global rate limiter: Max 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use(globalLimiter);

// Auth routes rate limiter: Max 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Login Attempts',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

// 5. Auth / API Endpoints with Input Sanitization & Validation
app.post(
  '/api/auth/login',
  authLimiter,
  [
    // Validate and sanitize input
    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      // Custom sanitizer to escape HTML characters
      .escape()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Bad Request',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    
    // Placeholder logic for auth matching environment configurations
    if (email === 'admin@domain.com' && password === 'SuperSecurePassword123!') {
      return res.json({
        success: true,
        message: 'Authentication successful',
        token: 'mock-jwt-token-from-env-configuration'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid email or password'
    });
  }
);

// 6. Serve Static Files
// Serve index.html, style.css, script.js, logo.svg, and the media/ folder safely
app.use(express.static(path.join(__dirname)));

// Fallback all non-matching routes to index.html (SPA routing behavior if any)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 7. Error Handling Middleware (prevents detailed stack traces from leaking)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : (err.name || 'Bad Request'),
    message: statusCode === 500 ? 'An unexpected error occurred on the server.' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'production'} mode on http://localhost:${PORT}`);
});
