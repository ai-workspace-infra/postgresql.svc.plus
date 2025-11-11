#!/usr/bin/env node

const { spawn } = require('node:child_process')

const args = process.argv.slice(2)

const child = spawn('next', ['start', ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('error', (error) => {
  console.error('Failed to launch Next.js:', error)
  process.exit(1)
})

child.on('close', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})
