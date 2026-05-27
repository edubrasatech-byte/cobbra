const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, run, generateId } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'cobroo-secret-key-2026-CHANGE-ME-IN-PROD-use-32-chars-minimum';
const JWT_EXPIRES_IN = '7d';

// Warn if using default secret in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('[SECURITY] JWT_SECRET env var not set! Using default secret is DANGEROUS in production.');
}

// Hash password
async function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

// Verify password
async function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'cobbra.ai',
      audience: 'cobbra-users'
    }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'cobbra.ai',
      audience: 'cobbra-users'
    });
  } catch {
    return null;
  }
}

// Get user from request cookies
function getUserFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );

  const token = cookies['cobroo_token'];
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = queryOne('SELECT id, name, email, role, phone, pix_key, pix_key_type, business_name, business_description, business_niche, collection_rigor, plan, plan_expires_at, status, onboarding_completed, score_limit_good, score_limit_regular, created_at FROM users WHERE id = ?', [decoded.id]);
  return user || null;
}

// Register new user
async function registerUser({ name, email, password, phone, plan = 'starter' }) {
  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    throw new Error('Email já cadastrado');
  }

  const id = generateId();
  const password_hash = await hashPassword(password);
  const trialExpires = new Date();
  trialExpires.setDate(trialExpires.getDate() + 3); // 3 days trial

  run(
    `INSERT INTO users (id, name, email, password_hash, phone, role, plan, plan_expires_at)
     VALUES (?, ?, ?, ?, ?, 'user', ?, ?)`,
    [id, name, email, password_hash, phone || null, plan, trialExpires.toISOString()]
  );

  const user = queryOne('SELECT id, name, email, role, plan, status FROM users WHERE id = ?', [id]);
  return user;
}

// Login user
async function loginUser({ email, password }) {
  const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new Error('Email ou senha incorretos');
  }

  if (user.status === 'blocked') {
    throw new Error('Sua conta foi bloqueada. Entre em contato com o suporte.');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new Error('Email ou senha incorretos');
  }

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      status: user.status
    }
  };
}

// Check if user is admin
function isAdmin(user) {
  return user && (user.role === 'admin' || user.role === 'admin_senior');
}

// Check if user is admin senior
function isAdminSenior(user) {
  return user && user.role === 'admin_senior';
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getUserFromRequest,
  registerUser,
  loginUser,
  isAdmin,
  isAdminSenior,
  JWT_SECRET
};
