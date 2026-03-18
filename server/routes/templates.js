const { Router } = require('express');
const supabase = require('../config/supabase');
const tenantQuery = require('../utils/tenantQuery');

const router = Router();

const VALID_CATEGORIES = [
  'email',
  'estimate',
  'invoice',
  'project_update',
  'follow_up',
  'meeting_notes',
];

// ─── GET / ──────────────────────────────────────────────────────────────────
// List all templates for the org. Supports ?category= filter.
router.get('/', async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'templates', req.orgId);
    let query = tq.select();

    if (req.query.category) {
      query = query.eq('category', req.query.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id ───────────────────────────────────────────────────────────────
// Get a single template by id.
router.get('/:id', async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'templates', req.orgId);
    const { data, error } = await tq.selectOne(req.params.id);
    if (error || !data) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── POST / ─────────────────────────────────────────────────────────────────
// Create a new template.
router.post('/', async (req, res, next) => {
  try {
    const { name, category, subject, body, variables } = req.body;

    if (!name || !category || !body) {
      return res.status(400).json({ error: 'name, category, and body are required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    const tq = tenantQuery(supabase, 'templates', req.orgId);
    const { data, error } = await tq.insert({
      name,
      category,
      subject: subject || null,
      body,
      variables: variables || [],
      created_by: req.user.id,
    });
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /:id ───────────────────────────────────────────────────────────────
// Update an existing template.
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, subject, body, variables } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (subject !== undefined) updates.subject = subject;
    if (body !== undefined) updates.body = body;
    if (variables !== undefined) updates.variables = variables;

    const tq = tenantQuery(supabase, 'templates', req.orgId);
    const { data, error } = await tq.update(req.params.id, updates);
    if (error || !data) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id ────────────────────────────────────────────────────────────
// Delete a template.
router.delete('/:id', async (req, res, next) => {
  try {
    const tq = tenantQuery(supabase, 'templates', req.orgId);
    const { error } = await tq.remove(req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── POST /seed ─────────────────────────────────────────────────────────────
// Seed default professional templates for the org (only if none exist).
router.post('/seed', async (req, res, next) => {
  try {
    // Check if org already has templates
    const tq = tenantQuery(supabase, 'templates', req.orgId);
    const { data: existing, error: checkErr } = await tq.select('id');
    if (checkErr) throw checkErr;

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: 'Templates already exist for this organization',
        count: existing.length,
      });
    }

    const defaults = getDefaultTemplates(req.user.id);

    // Insert all templates in a single batch
    const { data, error } = await supabase
      .from('templates')
      .insert(defaults.map((t) => ({ ...t, org_id: req.orgId })))
      .select();
    if (error) throw error;

    res.status(201).json({ success: true, count: data.length, templates: data });
  } catch (err) {
    next(err);
  }
});

// ─── Default template definitions ───────────────────────────────────────────

function getDefaultTemplates(userId) {
  return [
    // ── Email templates ─────────────────────────────────────────────────
    {
      name: 'New Project Welcome',
      category: 'email',
      subject: 'Welcome to Your {{project_name}} Project',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>Thank you for choosing us for your <strong>{{project_name}}</strong> project. We are excited to get started and committed to delivering exceptional results.</p>

<p>Here is a quick overview of what to expect next:</p>
<ul>
  <li><strong>Project Kickoff Meeting:</strong> We will schedule a kickoff meeting within the next few days to review project scope, timelines, and any questions you may have.</li>
  <li><strong>Dedicated Project Manager:</strong> {{pm_name}} will be your primary point of contact throughout the project.</li>
  <li><strong>Project Portal:</strong> You will receive access to our project portal where you can track progress, view documents, and communicate with our team.</li>
</ul>

<p>If you have any immediate questions, please do not hesitate to reach out.</p>

<p>Best regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'pm_name', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Invoice Follow-Up',
      category: 'email',
      subject: 'Payment Reminder: Invoice #{{invoice_number}} for {{project_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>This is a friendly reminder that Invoice <strong>#{{invoice_number}}</strong> in the amount of <strong>{{invoice_amount}}</strong> was due on <strong>{{due_date}}</strong>.</p>

<p><strong>Invoice Details:</strong></p>
<ul>
  <li>Project: {{project_name}}</li>
  <li>Invoice Number: {{invoice_number}}</li>
  <li>Amount Due: {{invoice_amount}}</li>
  <li>Due Date: {{due_date}}</li>
</ul>

<p>If payment has already been submitted, please disregard this notice. Otherwise, we kindly request that payment be remitted at your earliest convenience.</p>

<p>Please contact us if you have any questions regarding this invoice.</p>

<p>Thank you,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'invoice_number', 'invoice_amount', 'due_date', 'project_name', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Meeting Invitation',
      category: 'email',
      subject: '{{meeting_type}} Meeting: {{project_name}} – {{meeting_date}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>You are invited to a <strong>{{meeting_type}}</strong> meeting for the <strong>{{project_name}}</strong> project.</p>

<p><strong>Meeting Details:</strong></p>
<ul>
  <li><strong>Date:</strong> {{meeting_date}}</li>
  <li><strong>Time:</strong> {{meeting_time}}</li>
  <li><strong>Location:</strong> {{meeting_location}}</li>
  <li><strong>Duration:</strong> {{meeting_duration}}</li>
</ul>

<p><strong>Agenda:</strong></p>
<p>{{meeting_agenda}}</p>

<p>Please confirm your attendance at your earliest convenience. If you are unable to attend, kindly let us know so we can arrange an alternative time.</p>

<p>Best regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'meeting_type', 'project_name', 'meeting_date', 'meeting_time', 'meeting_location', 'meeting_duration', 'meeting_agenda', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Project Status Update',
      category: 'email',
      subject: 'Project Update: {{project_name}} – Week of {{report_date}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>Please find below the weekly status update for your <strong>{{project_name}}</strong> project.</p>

<p><strong>Progress Summary:</strong></p>
<p>{{progress_summary}}</p>

<p><strong>Work Completed This Week:</strong></p>
<p>{{work_completed}}</p>

<p><strong>Upcoming Work:</strong></p>
<p>{{upcoming_work}}</p>

<p><strong>Schedule Status:</strong> {{schedule_status}}</p>
<p><strong>Budget Status:</strong> {{budget_status}}</p>

<p><strong>Items Requiring Attention:</strong></p>
<p>{{action_items}}</p>

<p>Please do not hesitate to reach out with any questions or concerns.</p>

<p>Regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'report_date', 'progress_summary', 'work_completed', 'upcoming_work', 'schedule_status', 'budget_status', 'action_items', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Thank You / Follow-Up',
      category: 'email',
      subject: 'Thank You – {{project_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>Thank you for the opportunity to work on your <strong>{{project_name}}</strong> project. It was a pleasure collaborating with you, and we hope the final result exceeds your expectations.</p>

<p>As we wrap up, here are a few important notes:</p>
<ul>
  <li><strong>Warranty:</strong> {{warranty_details}}</li>
  <li><strong>Final Documentation:</strong> All project documents, including as-built drawings and manuals, have been delivered.</li>
  <li><strong>Maintenance Tips:</strong> {{maintenance_notes}}</li>
</ul>

<p>We would greatly appreciate it if you could take a moment to share your experience by leaving a review or providing a testimonial. Your feedback helps us continue to improve.</p>

<p>We look forward to the opportunity to work with you again in the future.</p>

<p>Warm regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'warranty_details', 'maintenance_notes', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Estimate Submission',
      category: 'email',
      subject: 'Estimate for {{project_name}} – {{estimate_number}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>Thank you for the opportunity to provide an estimate for your <strong>{{project_name}}</strong> project. Please find the details below.</p>

<p><strong>Estimate Summary:</strong></p>
<ul>
  <li><strong>Estimate Number:</strong> {{estimate_number}}</li>
  <li><strong>Total Amount:</strong> {{estimate_amount}}</li>
  <li><strong>Valid Until:</strong> {{valid_until}}</li>
  <li><strong>Estimated Timeline:</strong> {{estimated_timeline}}</li>
</ul>

<p><strong>Scope of Work:</strong></p>
<p>{{scope_of_work}}</p>

<p>This estimate is valid for 30 days from the date above. Please review the attached detailed estimate at your convenience. We are happy to discuss any questions or adjustments.</p>

<p>To proceed, simply reply to this email or contact us directly.</p>

<p>Best regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'estimate_number', 'estimate_amount', 'valid_until', 'estimated_timeline', 'scope_of_work', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Change Order Notification',
      category: 'email',
      subject: 'Change Order #{{co_number}} – {{project_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>A change order has been submitted for your <strong>{{project_name}}</strong> project. Please review the details below.</p>

<p><strong>Change Order Details:</strong></p>
<ul>
  <li><strong>Change Order Number:</strong> #{{co_number}}</li>
  <li><strong>Description:</strong> {{co_description}}</li>
  <li><strong>Cost Impact:</strong> {{cost_impact}}</li>
  <li><strong>Schedule Impact:</strong> {{schedule_impact}}</li>
</ul>

<p><strong>Reason for Change:</strong></p>
<p>{{co_reason}}</p>

<p>Your approval is required before we can proceed with this change. Please review and respond at your earliest convenience. If you have any questions, we are happy to discuss.</p>

<p>Thank you,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'co_number', 'co_description', 'cost_impact', 'schedule_impact', 'co_reason', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Punch List Notification',
      category: 'email',
      subject: 'Punch List Items – {{project_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>As we approach the completion of your <strong>{{project_name}}</strong> project, we have compiled a punch list of remaining items that require attention.</p>

<p><strong>Punch List Summary:</strong></p>
<ul>
  <li><strong>Total Items:</strong> {{total_items}}</li>
  <li><strong>Target Completion Date:</strong> {{target_date}}</li>
</ul>

<p><strong>Items:</strong></p>
<p>{{punch_list_items}}</p>

<p>Our team is committed to addressing each item promptly to ensure your complete satisfaction. We will keep you updated on progress and notify you upon completion.</p>

<p>If you have additional items to add or any concerns, please let us know.</p>

<p>Best regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'total_items', 'target_date', 'punch_list_items', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Daily Log Summary',
      category: 'email',
      subject: 'Daily Log: {{project_name}} – {{log_date}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<p>Dear {{client_name}},</p>

<p>Here is the daily log summary for <strong>{{project_name}}</strong> on <strong>{{log_date}}</strong>.</p>

<p><strong>Weather:</strong> {{weather_conditions}}</p>

<p><strong>Crew On Site:</strong> {{crew_count}} workers</p>

<p><strong>Work Performed:</strong></p>
<p>{{work_performed}}</p>

<p><strong>Materials Received:</strong></p>
<p>{{materials_received}}</p>

<p><strong>Issues / Delays:</strong></p>
<p>{{issues}}</p>

<p><strong>Safety Observations:</strong></p>
<p>{{safety_notes}}</p>

<p>Regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'log_date', 'weather_conditions', 'crew_count', 'work_performed', 'materials_received', 'issues', 'safety_notes', 'sender_name', 'company_name'],
      created_by: userId,
    },

    // ── Estimate templates ──────────────────────────────────────────────
    {
      name: 'Standard Estimate Cover Letter',
      category: 'estimate',
      subject: 'Estimate: {{project_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<h2 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px;">Project Estimate</h2>

<p><strong>Prepared For:</strong> {{client_name}}<br/>
<strong>Project:</strong> {{project_name}}<br/>
<strong>Date:</strong> {{estimate_date}}<br/>
<strong>Estimate #:</strong> {{estimate_number}}</p>

<p>Dear {{client_name}},</p>

<p>Thank you for the opportunity to provide this estimate for your project. We have carefully reviewed the scope of work and are pleased to present the following proposal.</p>

<p><strong>Project Description:</strong></p>
<p>{{project_description}}</p>

<p><strong>Estimated Cost:</strong> {{estimate_amount}}</p>
<p><strong>Estimated Duration:</strong> {{estimated_timeline}}</p>

<p><strong>Inclusions:</strong></p>
<p>{{inclusions}}</p>

<p><strong>Exclusions:</strong></p>
<p>{{exclusions}}</p>

<p><strong>Terms and Conditions:</strong></p>
<ul>
  <li>This estimate is valid for 30 days from the date above.</li>
  <li>A {{deposit_percentage}}% deposit is required upon acceptance.</li>
  <li>Progress payments will be billed monthly based on work completed.</li>
  <li>Any changes to the scope of work may result in additional charges.</li>
</ul>

<p>We look forward to working with you on this project.</p>

<p>Sincerely,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'estimate_date', 'estimate_number', 'project_description', 'estimate_amount', 'estimated_timeline', 'inclusions', 'exclusions', 'deposit_percentage', 'sender_name', 'company_name'],
      created_by: userId,
    },

    // ── Invoice templates ───────────────────────────────────────────────
    {
      name: 'Payment Reminder',
      category: 'invoice',
      subject: 'Payment Reminder: Invoice #{{invoice_number}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<h2 style="color: #1e3a5f;">Payment Reminder</h2>

<p>Dear {{client_name}},</p>

<p>This is a courtesy reminder that the following invoice is approaching its due date:</p>

<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <tr style="background: #f3f4f6;">
    <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Invoice Number</strong></td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{invoice_number}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Project</strong></td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{project_name}}</td>
  </tr>
  <tr style="background: #f3f4f6;">
    <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Amount Due</strong></td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{invoice_amount}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Due Date</strong></td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{due_date}}</td>
  </tr>
</table>

<p>Please ensure payment is submitted by the due date to avoid any late fees. If payment has already been sent, please disregard this notice.</p>

<p>Thank you for your prompt attention to this matter.</p>

<p>Regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'invoice_number', 'project_name', 'invoice_amount', 'due_date', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Overdue Payment Notice',
      category: 'invoice',
      subject: 'OVERDUE: Invoice #{{invoice_number}} – Immediate Attention Required',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<h2 style="color: #dc2626;">Overdue Payment Notice</h2>

<p>Dear {{client_name}},</p>

<p>Our records indicate that the following invoice is now <strong>{{days_overdue}} days past due</strong>:</p>

<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <tr style="background: #fef2f2;">
    <td style="padding: 8px; border: 1px solid #fecaca;"><strong>Invoice Number</strong></td>
    <td style="padding: 8px; border: 1px solid #fecaca;">{{invoice_number}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #fecaca;"><strong>Project</strong></td>
    <td style="padding: 8px; border: 1px solid #fecaca;">{{project_name}}</td>
  </tr>
  <tr style="background: #fef2f2;">
    <td style="padding: 8px; border: 1px solid #fecaca;"><strong>Original Amount</strong></td>
    <td style="padding: 8px; border: 1px solid #fecaca;">{{invoice_amount}}</td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #fecaca;"><strong>Due Date</strong></td>
    <td style="padding: 8px; border: 1px solid #fecaca;">{{due_date}}</td>
  </tr>
  <tr style="background: #fef2f2;">
    <td style="padding: 8px; border: 1px solid #fecaca;"><strong>Days Overdue</strong></td>
    <td style="padding: 8px; border: 1px solid #fecaca;">{{days_overdue}}</td>
  </tr>
</table>

<p>Please remit payment immediately to avoid any disruption to ongoing project work. If there are circumstances preventing timely payment, we encourage you to contact us to discuss a payment arrangement.</p>

<p>If you believe this notice was sent in error or payment has already been made, please contact our office at your earliest convenience.</p>

<p>Sincerely,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'invoice_number', 'project_name', 'invoice_amount', 'due_date', 'days_overdue', 'sender_name', 'company_name'],
      created_by: userId,
    },

    // ── Project update templates ────────────────────────────────────────
    {
      name: 'Project Completion Notification',
      category: 'project_update',
      subject: 'Project Complete: {{project_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<h2 style="color: #16a34a;">Project Completion Notice</h2>

<p>Dear {{client_name}},</p>

<p>We are pleased to inform you that your <strong>{{project_name}}</strong> project has been completed.</p>

<p><strong>Project Summary:</strong></p>
<ul>
  <li><strong>Start Date:</strong> {{start_date}}</li>
  <li><strong>Completion Date:</strong> {{completion_date}}</li>
  <li><strong>Final Cost:</strong> {{final_cost}}</li>
</ul>

<p><strong>Final Walkthrough:</strong></p>
<p>We would like to schedule a final walkthrough with you to review the completed work and ensure everything meets your expectations. Please let us know your availability for the coming week.</p>

<p><strong>Warranty Information:</strong></p>
<p>{{warranty_details}}</p>

<p><strong>Next Steps:</strong></p>
<ul>
  <li>Final walkthrough and sign-off</li>
  <li>Delivery of all project documentation and as-built drawings</li>
  <li>Final invoice processing</li>
</ul>

<p>Thank you for trusting us with your project. We take pride in the work we deliver and hope you are delighted with the results.</p>

<p>Best regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'start_date', 'completion_date', 'final_cost', 'warranty_details', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Project Milestone Update',
      category: 'project_update',
      subject: 'Milestone Reached: {{milestone_name}} – {{project_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<h2 style="color: #2563eb;">Project Milestone Update</h2>

<p>Dear {{client_name}},</p>

<p>We are happy to report that a key milestone has been reached on your <strong>{{project_name}}</strong> project.</p>

<p><strong>Milestone:</strong> {{milestone_name}}</p>
<p><strong>Completed On:</strong> {{milestone_date}}</p>

<p><strong>Description:</strong></p>
<p>{{milestone_description}}</p>

<p><strong>Overall Progress:</strong> {{overall_progress}}% complete</p>

<p><strong>Next Milestone:</strong> {{next_milestone}}</p>
<p><strong>Expected Date:</strong> {{next_milestone_date}}</p>

<p>We continue to make strong progress and will keep you informed as we move forward. Please do not hesitate to reach out if you have any questions.</p>

<p>Best regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['client_name', 'project_name', 'milestone_name', 'milestone_date', 'milestone_description', 'overall_progress', 'next_milestone', 'next_milestone_date', 'sender_name', 'company_name'],
      created_by: userId,
    },

    // ── Meeting notes templates ─────────────────────────────────────────
    {
      name: 'Meeting Agenda',
      category: 'meeting_notes',
      subject: 'Agenda: {{meeting_type}} – {{project_name}} – {{meeting_date}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<h2 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px;">Meeting Agenda</h2>

<p><strong>Project:</strong> {{project_name}}<br/>
<strong>Meeting Type:</strong> {{meeting_type}}<br/>
<strong>Date:</strong> {{meeting_date}}<br/>
<strong>Time:</strong> {{meeting_time}}<br/>
<strong>Location:</strong> {{meeting_location}}<br/>
<strong>Facilitator:</strong> {{facilitator_name}}</p>

<p><strong>Attendees:</strong></p>
<p>{{attendees}}</p>

<hr style="border: none; border-top: 1px solid #e5e7eb;" />

<p><strong>Agenda Items:</strong></p>
<ol>
  <li><strong>Opening / Roll Call</strong> (5 min)</li>
  <li><strong>Review of Previous Meeting Action Items</strong> (10 min)</li>
  <li><strong>{{agenda_item_1}}</strong> ({{agenda_item_1_duration}})</li>
  <li><strong>{{agenda_item_2}}</strong> ({{agenda_item_2_duration}})</li>
  <li><strong>{{agenda_item_3}}</strong> ({{agenda_item_3_duration}})</li>
  <li><strong>Open Discussion / New Business</strong> (10 min)</li>
  <li><strong>Action Items and Next Steps</strong> (5 min)</li>
</ol>

<p><strong>Notes:</strong></p>
<p>{{additional_notes}}</p>

<p>Please come prepared to discuss the items listed above. If you have additional topics to add, please reply to this email before the meeting.</p>

<p>Regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['project_name', 'meeting_type', 'meeting_date', 'meeting_time', 'meeting_location', 'facilitator_name', 'attendees', 'agenda_item_1', 'agenda_item_1_duration', 'agenda_item_2', 'agenda_item_2_duration', 'agenda_item_3', 'agenda_item_3_duration', 'additional_notes', 'sender_name', 'company_name'],
      created_by: userId,
    },
    {
      name: 'Meeting Minutes',
      category: 'meeting_notes',
      subject: 'Minutes: {{meeting_type}} – {{project_name}} – {{meeting_date}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
<h2 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px;">Meeting Minutes</h2>

<p><strong>Project:</strong> {{project_name}}<br/>
<strong>Meeting Type:</strong> {{meeting_type}}<br/>
<strong>Date:</strong> {{meeting_date}}<br/>
<strong>Time:</strong> {{meeting_time}}<br/>
<strong>Location:</strong> {{meeting_location}}<br/>
<strong>Recorded By:</strong> {{recorder_name}}</p>

<p><strong>Attendees:</strong></p>
<p>{{attendees}}</p>

<p><strong>Absentees:</strong></p>
<p>{{absentees}}</p>

<hr style="border: none; border-top: 1px solid #e5e7eb;" />

<p><strong>Discussion Summary:</strong></p>
<p>{{discussion_summary}}</p>

<p><strong>Decisions Made:</strong></p>
<p>{{decisions}}</p>

<p><strong>Action Items:</strong></p>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <tr style="background: #f3f4f6;">
    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Action Item</th>
    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Assigned To</th>
    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Due Date</th>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{action_item_1}}</td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{assigned_to_1}}</td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{due_date_1}}</td>
  </tr>
  <tr style="background: #f3f4f6;">
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{action_item_2}}</td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{assigned_to_2}}</td>
    <td style="padding: 8px; border: 1px solid #e5e7eb;">{{due_date_2}}</td>
  </tr>
</table>

<p><strong>Next Meeting:</strong> {{next_meeting_date}} at {{next_meeting_time}}</p>

<p>Regards,<br/>{{sender_name}}<br/>{{company_name}}</p>
</div>`,
      variables: ['project_name', 'meeting_type', 'meeting_date', 'meeting_time', 'meeting_location', 'recorder_name', 'attendees', 'absentees', 'discussion_summary', 'decisions', 'action_item_1', 'assigned_to_1', 'due_date_1', 'action_item_2', 'assigned_to_2', 'due_date_2', 'next_meeting_date', 'next_meeting_time', 'sender_name', 'company_name'],
      created_by: userId,
    },
  ];
}

module.exports = router;
