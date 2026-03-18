const { Router } = require('express');
const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');
const tenantQuery = require('../utils/tenantQuery');
const env = require('../config/env');

const router = Router();

/**
 * Build an SMTP transport from environment variables.
 * Returns null if SMTP is not configured.
 */
function createTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

// ─── POST /send ──────────────────────────────────────────────────────────────
// Send an email and log it to the email_log table.
router.post('/send', async (req, res, next) => {
  try {
    const transporter = createTransport();
    if (!transporter) {
      return res.status(503).json({
        error: 'SMTP not configured',
        message:
          'Email sending requires SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in your environment variables.',
      });
    }

    const { to, subject, body, templateId, contactId, projectId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'to, subject, and body are required' });
    }

    // If a templateId is provided, we could resolve template variables here in the future.
    // For now we send the body as-is.

    const info = await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html: body,
    });

    // Log to email_log table
    const tq = tenantQuery(supabase, 'email_log', req.orgId);
    await tq.insert({
      to,
      subject,
      body,
      contact_id: contactId || null,
      project_id: projectId || null,
      template_id: templateId || null,
      user_id: req.user.id,
      sent_at: new Date().toISOString(),
      status: 'sent',
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    // Log failed attempt
    try {
      const { to, subject, body, contactId, projectId, templateId } = req.body;
      const tq = tenantQuery(supabase, 'email_log', req.orgId);
      await tq.insert({
        to: to || '',
        subject: subject || '',
        body: body || '',
        contact_id: contactId || null,
        project_id: projectId || null,
        template_id: templateId || null,
        user_id: req.user.id,
        sent_at: new Date().toISOString(),
        status: 'failed',
      });
    } catch (_logErr) {
      // Swallow logging errors so the real error surfaces
    }
    next(err);
  }
});

// ─── GET /log ────────────────────────────────────────────────────────────────
// Retrieve sent email history for the org. Supports filtering by contactId and projectId.
router.get('/log', async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'email_log', req.orgId);
    let query = tq.select();

    if (req.query.contactId) {
      query = query.eq('contact_id', req.query.contactId);
    }
    if (req.query.projectId) {
      query = query.eq('project_id', req.query.projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── POST /test ──────────────────────────────────────────────────────────────
// Send a test email to the authenticated user's email to verify SMTP configuration.
router.post('/test', async (req, res, next) => {
  try {
    const transporter = createTransport();
    if (!transporter) {
      return res.status(503).json({
        error: 'SMTP not configured',
        message:
          'Email sending requires SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in your environment variables.',
      });
    }

    const userEmail = req.user.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'No email address found for the current user' });
    }

    const info = await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: userEmail,
      subject: 'BuildFlow CRM – SMTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Configuration Verified</h2>
          <p>This is a test email from <strong>BuildFlow CRM</strong>.</p>
          <p>If you're reading this, your SMTP settings are working correctly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Sent at ${new Date().toISOString()}</p>
        </div>
      `,
    });

    res.json({ success: true, messageId: info.messageId, sentTo: userEmail });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
