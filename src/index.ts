import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CogniReviewAnalyzer } from './analyzer/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: '20mb' }));

const analyzer = new CogniReviewAnalyzer();

// Serve the Landing Page & Developer Studio HTML
app.get('/', (_req: Request, res: Response) => {
  const htmlPath = path.join(__dirname, 'views', 'index.html');
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  return res.send(`<h1>CogniReview Engine Online</h1><p>Views file missing.</p>`);
});

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'CogniReview - Self-Learning Code Reviewer',
    timestamp: new Date().toISOString()
  });
});

// Audit an Entire Local Directory (Zero Copy-Pasting Required!)
app.post('/api/audit/directory', (req: Request, res: Response) => {
  const { dirPath, repository } = req.body;

  if (!dirPath) {
    return res.status(400).json({ error: 'Missing required parameter: dirPath' });
  }

  if (!fs.existsSync(dirPath)) {
    return res.status(404).json({ error: `Directory not found: ${dirPath}` });
  }

  try {
    const result = analyzer.auditDirectory(dirPath, repository || 'default');
    return res.json({ success: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Audit a Single File
app.post('/api/audit/file', (req: Request, res: Response) => {
  const { path: filePath, content, repository } = req.body;

  if (!filePath || content === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: path and content' });
  }

  const report = analyzer.auditFile(filePath, content, repository || 'default');
  return res.json({ success: true, report });
});

// Audit Multiple Files / Full Codebase
app.post('/api/audit/codebase', (req: Request, res: Response) => {
  const { files, repository } = req.body;

  if (!Array.isArray(files)) {
    return res.status(400).json({ error: 'Expected an array of files ({ path, content })' });
  }

  const result = analyzer.auditFiles(files, repository || 'default');
  return res.json({ success: true, result });
});

// Get Learned Rules for a Repository
app.get('/api/rules', (req: Request, res: Response) => {
  const repo = (req.query.repository as string) || 'default';
  const rules = analyzer.ruleStore.getRulesForRepo(repo);
  return res.json({ repository: repo, rules });
});

// Developer Feedback Endpoint (Compound Learning Flywheel)
app.post('/api/rules/feedback', (req: Request, res: Response) => {
  const { ruleId, repository, action } = req.body;

  if (!ruleId || !action || !['ACCEPTED', 'OVERRIDDEN'].includes(action)) {
    return res.status(400).json({ error: 'Valid ruleId and action (ACCEPTED | OVERRIDDEN) required.' });
  }

  analyzer.ruleStore.recordFeedback(ruleId, repository || 'default', action);
  return res.json({
    success: true,
    message: `Feedback recorded: Rule ${ruleId} marked as ${action}. Updated confidence scores.`,
    rules: analyzer.ruleStore.getRulesForRepo(repository || 'default')
  });
});

// GitHub Webhook Listener for PRs
app.post('/api/webhooks/github', (req: Request, res: Response) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  console.log(`[GitHub Webhook] Received event: ${event}`);

  if (event === 'pull_request') {
    const action = payload.action;
    const prNumber = payload.pull_request?.number;
    const repoName = payload.repository?.full_name;

    console.log(`[PR Event] Action: ${action} | PR #${prNumber} on ${repoName}`);

    if (['opened', 'synchronize', 'reopened'].includes(action)) {
      return res.status(202).json({
        message: `Review scheduled for PR #${prNumber} on ${repoName}.`,
        status: 'PROCESSING'
      });
    }
  }

  return res.status(200).json({ received: true });
});

app.listen(port, () => {
  console.log(`====================================================`);
  console.log(`🚀 CogniReview Engine is running on port ${port}`);
  console.log(`📡 Dashboard: http://localhost:${port}`);
  console.log(`   - POST /api/audit/directory  (Audit local folder)`);
  console.log(`   - POST /api/audit/file       (Audit a file)`);
  console.log(`   - POST /api/audit/codebase   (Audit full PR files)`);
  console.log(`   - GET  /api/rules            (View learned rules)`);
  console.log(`   - POST /api/rules/feedback   (Learn from feedback)`);
  console.log(`====================================================`);
});
