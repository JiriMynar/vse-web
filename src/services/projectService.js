import { z } from 'zod';

import { getDb } from '../../db.js';

const projectSchema = z.object({
  name: z.string().trim().min(2, 'Název projektu musí mít alespoň 2 znaky.'),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().default('chat'),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Barva musí být ve formátu HEX (#RRGGBB).').optional()
});

export async function listProjects(userId) {
  const db = await getDb();
  const projects = await db.all(
    `SELECT
        p.*
      FROM projects p
      INNER JOIN project_members m ON m.project_id = p.id
      WHERE m.user_id = ?
      ORDER BY p.updated_at DESC
    `,
    userId
  );

  return projects;
}

export async function createProject(userId, payload) {
  const data = projectSchema.parse(payload || {});
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.run(
    `INSERT INTO projects (owner_id, name, description, category, status, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    userId,
    data.name,
    data.description || null,
    data.category,
    data.status || 'draft',
    data.color || '#2F80ED',
    now,
    now
  );

  await db.run('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', result.lastID, userId, 'owner');
  return getProjectById(userId, result.lastID);
}

export async function updateProject(userId, projectId, payload) {
  const data = projectSchema.partial().parse(payload || {});
  const db = await getDb();

  const membership = await db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', projectId, userId);
  if (!membership) {
    const error = new Error('K projektu nemáte přístup.');
    error.status = 404;
    throw error;
  }

  const entries = Object.entries(data);
  if (!entries.length) {
    return getProjectById(userId, projectId);
  }

  const assignments = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  await db.run(
    `UPDATE projects SET ${assignments}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ...values,
    projectId
  );

  return getProjectById(userId, projectId);
}

export async function getProjectById(userId, projectId) {
  const db = await getDb();
  const project = await db.get(
    `SELECT p.*
      FROM projects p
      INNER JOIN project_members m ON m.project_id = p.id
      WHERE p.id = ? AND m.user_id = ?`,
    projectId,
    userId
  );

  if (!project) {
    const error = new Error('Projekt nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  return project;
}

export async function archiveProject(userId, projectId) {
  return updateProject(userId, projectId, { status: 'archived' });
}

export async function deleteProject(userId, projectId) {
  const db = await getDb();
  const membership = await db.get('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', projectId, userId);
  if (!membership) {
    const error = new Error('Projekt nebyl nalezen.');
    error.status = 404;
    throw error;
  }

  await db.run('DELETE FROM projects WHERE id = ?', projectId);
}
