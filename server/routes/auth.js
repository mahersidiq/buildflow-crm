const { Router } = require('express');
const { z } = require('zod');
const supabase = require('../config/supabase');
const { signToken } = require('../utils/jwt');
const { hashPassword, verifyPassword } = require('../utils/password');
const authenticate = require('../middleware/authenticate');

const router = Router();

// --- Validation schemas ---

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1),
  companyName: z.string().min(1),
  companySlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['viewer', 'member', 'admin']).default('member'),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

// --- Routes ---

/**
 * POST /api/auth/signup
 * Creates a new organization and the first user (owner).
 */
router.post('/signup', async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if slug already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', body.companySlug)
      .single();

    if (existingOrg) {
      return res.status(409).json({ error: 'Company slug already taken' });
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: body.companyName,
        slug: body.companySlug,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Create owner user
    const passwordHash = await hashPassword(body.password);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        org_id: org.id,
        email: body.email,
        password_hash: passwordHash,
        name: body.name,
        role: 'owner',
      })
      .select('id, org_id, email, name, role, created_at')
      .single();

    if (userError) throw userError;

    // Sign JWT
    const token = signToken({
      userId: user.id,
      orgId: org.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({ token, user, organization: org });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    // Fetch user with org info
    const { data: user, error } = await supabase
      .from('users')
      .select('id, org_id, email, name, role, password_hash, is_active')
      .eq('email', body.email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check org is active
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.org_id)
      .single();

    if (!org || !org.is_active) {
      return res.status(403).json({ error: 'Organization is deactivated' });
    }

    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Sign JWT
    const token = signToken({
      userId: user.id,
      orgId: user.org_id,
      email: user.email,
      role: user.role,
    });

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser, organization: org });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns the current user's profile and organization info.
 * Requires authentication.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, org_id, email, name, role, is_active, last_login, created_at')
      .eq('id', req.user.id)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.org_id)
      .single();

    res.json({ user, organization: org });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/invite
 * Invites a new user to the current organization.
 * Requires authentication + owner/admin role.
 */
router.post('/invite', authenticate, async (req, res, next) => {
  try {
    if (!['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only owners and admins can invite users' });
    }

    const body = inviteSchema.parse(req.body);

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create inactive user with a temporary password hash (they'll set password via accept)
    const tempHash = await hashPassword(require('crypto').randomBytes(32).toString('hex'));
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        org_id: req.user.orgId,
        email: body.email,
        password_hash: tempHash,
        name: body.name,
        role: body.role,
        is_active: false,
      })
      .select('id, org_id, email, name, role, created_at')
      .single();

    if (error) throw error;

    // Generate invite token (short-lived, 7 days)
    const inviteToken = signToken({
      type: 'invite',
      userId: user.id,
      orgId: req.user.orgId,
      email: body.email,
    });

    res.status(201).json({ user, inviteToken });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/accept
 * Accepts an invitation and sets the user's password.
 */
router.post('/accept', async (req, res, next) => {
  try {
    const body = acceptInviteSchema.parse(req.body);

    // Verify invite token
    const { verifyToken } = require('../utils/jwt');
    let decoded;
    try {
      decoded = verifyToken(body.token);
    } catch {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    if (decoded.type !== 'invite') {
      return res.status(400).json({ error: 'Invalid invitation token' });
    }

    // Activate user and set password
    const passwordHash = await hashPassword(body.password);
    const { data: user, error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        is_active: true,
      })
      .eq('id', decoded.userId)
      .select('id, org_id, email, name, role, created_at')
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Sign JWT for the newly activated user
    const token = signToken({
      userId: user.id,
      orgId: user.org_id,
      email: user.email,
      role: user.role,
    });

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.org_id)
      .single();

    res.json({ token, user, organization: org });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
