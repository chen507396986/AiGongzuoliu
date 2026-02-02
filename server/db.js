import fs from 'fs/promises';

const DB_FILE = './database.json';
let db = { workflows: [] };

async function loadDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    db = JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, use default empty db
    if (error.code !== 'ENOENT') {
      console.error('Error loading DB:', error);
    }
  }
}

async function saveDB() {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

export async function initDB() {
  await loadDB();
  console.log('Database initialized (JSON file mode)');
}

export async function saveWorkflow(name, data) {
  const id = Date.now();
  const workflow = {
    id,
    name,
    data: JSON.stringify(data),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.workflows.push(workflow);
  await saveDB();
  return { id, name };
}

export async function updateWorkflow(id, name, data) {
  // Ensure id is number if comparing
  const index = db.workflows.findIndex(w => w.id == id);
  if (index !== -1) {
    db.workflows[index] = {
      ...db.workflows[index],
      name,
      data: JSON.stringify(data),
      updated_at: new Date().toISOString()
    };
    await saveDB();
    return { id, name };
  }
  throw new Error('Workflow not found');
}

export async function getWorkflows() {
  return db.workflows.map(({ id, name, created_at, updated_at }) => ({
    id, name, created_at, updated_at
  })).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getWorkflow(id) {
  const workflow = db.workflows.find(w => w.id == id);
  if (workflow) {
    return {
      ...workflow,
      data: JSON.parse(workflow.data)
    };
  }
  return null;
}
