import express from 'express';
import path from 'path';
import fs from 'fs';

export function startLocalApi(port, session) {
  const app = express();

  app.use(express.json());

  // API routes first (before static file server)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/latest', (req, res) => {
    const stateFile = path.join(session.path, 'current-state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      res.json(state);
    } else {
      res.json({ status: 'waiting' });
    }
  });

  app.get('/latest/console', (req, res) => {
    const stateFile = path.join(session.path, 'current-state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      res.json(state.console);
    } else {
      res.json([]);
    }
  });

  app.get('/latest/network', (req, res) => {
    const stateFile = path.join(session.path, 'current-state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      res.json(state.network);
    } else {
      res.json([]);
    }
  });

  app.get('/latest/errors', (req, res) => {
    const stateFile = path.join(session.path, 'current-state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      res.json(state.errors);
    } else {
      res.json([]);
    }
  });

  app.get('/latest/page', (req, res) => {
    const stateFile = path.join(session.path, 'current-state.json');
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      res.json(state.pageSnapshot);
    } else {
      res.json({});
    }
  });

  // Static file server (after API routes)
  app.use(express.static(path.join(session.path, '..')));

  const server = app.listen(port, () => {
    // API is running
  });

  return server;
}
