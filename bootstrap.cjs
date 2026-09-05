/**
 * BY SHIRO ANNA - Bootstrap Runner
 * Checks dependencies -> auto-installs if required -> starts server
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('[BY SHIRO ANNA] Initializing runtime bootstrap...');

// 1. Dependency verification
function checkAndInstallDependencies() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const nodeModulesPath = path.join(__dirname, 'node_modules');

  let needInstall = false;

  if (!fs.existsSync(nodeModulesPath)) {
    console.log('[BY SHIRO ANNA] node_modules directory missing. Triggering auto-install...');
    needInstall = true;
  } else {
    try {
      require.resolve('express');
      require.resolve('ws');
    } catch (err) {
      console.log('[BY SHIRO ANNA] Required packages missing. Triggering auto-install...');
      needInstall = true;
    }
  }

  if (needInstall) {
    try {
      console.log('[BY SHIRO ANNA] Executing: npm install...');
      execSync('npm install', { stdio: 'inherit', cwd: __dirname });
      console.log('[BY SHIRO ANNA] Dependencies successfully resolved and installed.');
    } catch (error) {
      console.error('[BY SHIRO ANNA] Dependency install failed:', error.message);
      process.exit(1);
    }
  } else {
    console.log('[BY SHIRO ANNA] Dependencies check passed.');
  }
}

checkAndInstallDependencies();

// 2. Start server
const distServer = path.join(__dirname, 'dist', 'server.cjs');
let command;
let args;

if (fs.existsSync(distServer)) {
  console.log('[BY SHIRO ANNA] Launching compiled production server (dist/server.cjs)...');
  command = process.execPath;
  args = [distServer];
} else {
  console.log('[BY SHIRO ANNA] Launching TypeScript server via tsx (server.ts)...');
  command = 'npx';
  args = ['tsx', 'server.ts'];
}

const child = spawn(command, args, {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: process.env.PORT || '3000',
    NODE_ENV: process.env.NODE_ENV || 'production',
  }
});

child.on('error', (err) => {
  console.error('[BY SHIRO ANNA] Failed to start server process:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (code !== null) {
    process.exit(code);
  } else {
    process.kill(process.pid, signal);
  }
});
