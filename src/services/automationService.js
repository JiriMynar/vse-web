import { z } from 'zod';

import { getDb } from '../../db.js';

const automationSchema = z.object({
  name: z.string().trim().min(2, 'Název musí mít alespoň 2 znaky.'),
  trigger: z.string().trim().min(1, 'Trigger je povinný.'),
  status: z.enum(['inactive', 'active']).optional(),
  config: z.record(z.any()).optional()
});

export async function listAutomations(userId, projectId) {
  const db = await getDb();
  const rows = await db.all(
    `SELECT a.* FROM automations a
      INNER JOIN projects p ON p.id = a.project_id
      INNER JOIN project_members m ON m.project_id = p.id
      WHERE m.user_id = ? AND p.id = ?
      ORDER BY a.updated_at DESC`,
    userId,
    projectId
  );
  return rows.map(normalizeAutomation);
}

export async function createAutomation(userId, projectId, payload) {
  const data = automationSchema.parse(payload || {});
  const db = await getDb();

  const membership = await db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', projectId, userId);
  if (!membership) {
    const error = new Error('K projektu nemáte přístup.');
    error.status = 404;
    throw error;
  }

  const now = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO automations (project_id, name, trigger, status, config, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    projectId,
    data.name,
    data.trigger,
    data.status || 'inactive',
    data.config ? JSON.stringify(data.config) : null,
    now,
    now
  );

  return getAutomationById(userId, result.lastID);
}

export async function updateAutomation(userId, automationId, payload) {
  const data = automationSchema.partial().parse(payload || {});
  const db = await getDb();

  const automation = await db.get(
    `SELECT a.* FROM automations a
      INNER JOIN projects p ON p.id = a.project_id
      INNER JOIN project_members m ON m.project_id = p.id
      WHERE a.id = ? AND m.user_id = ?`,
    automationId,
    userId
  );

  if (!automation) {
    const error = new Error('Automatizace nebyla nalezena.');
    error.status = 404;
    throw error;
  }

  const entries = Object.entries(data);
  if (!entries.length) {
    return normalizeAutomation(automation);
  }

  const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([key, value]) => (key === 'config' && value ? JSON.stringify(value) : value));
  await db.run(
    `UPDATE automations SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ...values,
    automationId
  );

  return getAutomationById(userId, automationId);
}

export async function getAutomationById(userId, automationId) {
  const db = await getDb();
  const automation = await db.get(
    `SELECT a.* FROM automations a
      INNER JOIN projects p ON p.id = a.project_id
      INNER JOIN project_members m ON m.project_id = p.id
      WHERE a.id = ? AND m.user_id = ?`,
    automationId,
    userId
  );

  if (!automation) {
    const error = new Error('Automatizace nebyla nalezena.');
    error.status = 404;
    throw error;
  }

  return normalizeAutomation(automation);
}

export async function deleteAutomation(userId, automationId) {
  const db = await getDb();
  const automation = await db.get(
    `SELECT a.id FROM automations a
      INNER JOIN projects p ON p.id = a.project_id
      INNER JOIN project_members m ON m.project_id = p.id
      WHERE a.id = ? AND m.user_id = ?`,
    automationId,
    userId
  );

  if (!automation) {
    const error = new Error('Automatizace nebyla nalezena.');
    error.status = 404;
    throw error;
  }

  await db.run('DELETE FROM automations WHERE id = ?', automationId);
}

export async function recordRun(automationId, status, payload = {}, result = {}) {
  const db = await getDb();
  await db.run(
    `INSERT INTO automation_runs (automation_id, status, payload, result, started_at, finished_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    automationId,
    status,
    JSON.stringify(payload || {}),
    JSON.stringify(result || {})
  );
}

function normalizeAutomation(automation) {
  return {
    ...automation,
    config: automation.config ? JSON.parse(automation.config) : null
  };
}
