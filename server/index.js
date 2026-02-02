import express from 'express';
import cors from 'cors';
import { initDB, saveWorkflow, getWorkflows, getWorkflow, updateWorkflow } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Init DB
initDB().then(() => {
  console.log('Database initialized');
}).catch(err => {
  console.error('Failed to init DB', err);
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Get all workflows (metadata only)
app.get('/api/workflows', async (req, res) => {
  try {
    const workflows = await getWorkflows();
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single workflow
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const workflow = await getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new workflow
app.post('/api/workflows', async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: 'Name and data are required' });
    }
    const result = await saveWorkflow(name, data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update workflow
app.put('/api/workflows/:id', async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: 'Name and data are required' });
    }
    const result = await updateWorkflow(req.params.id, name, data);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
