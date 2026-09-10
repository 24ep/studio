#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { registerHriveTools } from './tools.js';

serveStdio(() => {
  const server = new McpServer({ name: 'hrive', version: '0.1.0' });
  registerHriveTools(server);
  return server;
});
