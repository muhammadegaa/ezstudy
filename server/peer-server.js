#!/usr/bin/env node
/**
 * Lightweight PeerJS signalling server.
 *
 * Usage:
 *   npm install
 *   npm run peer:server
 *
 * Environment variables:
 *   PORT           - Listening port (default 9000)
 *   HOST           - Host/interface to bind (default 0.0.0.0)
 *   PEER_PATH      - HTTP path for PeerJS signalling (default /peerjs)
 *   KEY            - Optional API key to restrict access
 *
 * Deploy this server to your preferred Node runtime (Render, Railway, Fly.io, etc.)
 * then set the corresponding NEXT_PUBLIC_PEER_* variables so the client connects
 * to your dedicated signalling infrastructure.
 */

const { PeerServer } = require('peer');

const port = Number(process.env.PORT || 9000);
const host = process.env.HOST || '0.0.0.0';
const path = process.env.PEER_PATH || '/peerjs';
const key = process.env.KEY;

const server = PeerServer({
  port,
  host,
  path,
  proxied: true,
  allow_discovery: true,
  key,
});

server.on('connection', (client) => {
  console.log(`[peer-server] client connected: ${client.getId()}`);
});

server.on('disconnect', (client) => {
  console.log(`[peer-server] client disconnected: ${client.getId()}`);
});

console.log(`[peer-server] running on http://${host}:${port}${path}${key ? ` (restricted key)` : ''}`);


