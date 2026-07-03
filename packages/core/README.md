# @erlcjs/core

  [![npm version](https://img.shields.io/npm/v/@erlcjs/core?style=flat-square)](https://www.npmjs.com/package/@erlcjs/core)
  [![npm downloads](https://img.shields.io/npm/dm/@erlcjs/core?style=flat-square)](https://www.npmjs.com/package/@erlcjs/core)
  [![bundle size](https://img.shields.io/bundlephobia/min/@erlcjs/core?style=flat-square)](https://bundlephobia.com/package/@erlcjs/core)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)
  [![license](https://img.shields.io/npm/l/@erlcjs/core?style=flat-square)](https://github.com/erlc-js/erlcjs/blob/main/LICENSE)

`@erlcjs/core` is a lightweight, fully-featured, and strongly-typed API wrapper for Roblox's **Emergency Response: Liberty County (ER:LC)** private servers. It handles the low-level API mechanics, caching, and rate limiting so you can focus on building server integrations, moderation tools, and dashboards.

## Features

*   **TypeScript Native**: Written completely in TypeScript with comprehensive declarations.
*   **Automatic Rate Limiting**: Built-in REST client queues API commands and handles rate limit resets.
*   **Real-time Event Emitters**: Track game updates using high-frequency Polling or Webhook Gateway modes.
*   **Entity Cache**: Caches player states, spawned vehicles, active emergency calls, kill logs, and mod calls automatically.
*   **Console Commands**: Easily trigger commands like `:kick`, `:kill`, `:pm` directly through JS/TS methods.

## Prerequisites
- Node.js V16.0.0 or higher or Bun V1.0.0 or higher.
- A valid ER:LC Private Server API Key.

## Installation

Install `@erlcjs/core` in your project:

```bash
npm install @erlcjs/core
# or
pnpm add @erlcjs/core
# or
yarn add @erlcjs/core
```

## Quick Start

### Polling Mode

Polling is the simplest way to get started. It queries the ER:LC HTTP API every 5 seconds to fetch server changes.

```typescript
import { Client, ERLCEvents } from '@erlcjs/core';

const client = new Client({
  serverKey: 'YOUR_ERLC_SERVER_API_KEY',
  polling: true
});

client.on(ERLCEvents.playerJoin, (player) => {
  console.log(`Player joined: ${player.username} (ID: ${player.id})`);
  
  // Send a welcome message in-game
  player.message('Welcome to our server!');
});

client.on(ERLCEvents.kill, (killLog) => {
  console.log(`${killLog.killerUsername} killed ${killLog.killedUsername}`);
});

client.on(ERLCEvents.emergencyCallAdd, (call) => {
  console.log(`Emergency Call #${call.callNumber}: ${call.description}`);
});
```

### Webhook Gateway Mode (Alpha)

Set up a local server to receive real-time webhook events pushed directly by ER:LC.

```typescript
import { Client, ERLCEvents } from '@erlcjs/core';

const client = new Client({
  serverKey: 'YOUR_ERLC_SERVER_API_KEY',
  webhook: {
    enabled: true,
    port: 3000,
    path: '/events-webhook'
  }
});

client.on(ERLCEvents.playerJoin, (player) => {
  console.log(`${player.username} joined via gateway webhook!`);
});
```

## Core Structure Methods

The wrapper resolves entities into structures representing in-game components.

### Players
Retrieve cached players, or issue immediate actions:
```typescript
const player = client.players.cache.get(1234567); // get by UserId

// Kick a player
await player.kick('Violating server rules');

// Kill a player
await player.kill();

// Message a player
await player.message('Please review the rules');
```

### Vehicles
Retrieve vehicle details:
```typescript
const vehicle = client.vehicles.cache.get('PLATE_ABC_123');
console.log(`Vehicle model: ${vehicle.name}, Owner: ${vehicle.ownerUsername}`);
```

### Executing Commands
Issue custom commands directly:
```typescript
await client.commands.execute(':heal user');
```

## Documentation

To read the complete API Reference and detailed guides, view the documentation site:
[erlc.js Documentation Portal](https://erlcjs.xyz)

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
Distributed under the Apache-2.0 License. See `LICENSE` for more information.