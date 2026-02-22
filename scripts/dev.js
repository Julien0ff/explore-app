const { spawn } = require('child_process');
const waitOn = require('wait-on');

// Function to run a command
function runCommand(command, args, name) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: 'pwsh', 
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  return child;
}

console.log('Starting Vite server...');
const server = runCommand('npm', ['run', 'dev:server'], 'server');

// Wait for port 3000
waitOn({ 
  resources: ['tcp:3002'],
  interval: 100,
  timeout: 30000
})
  .then(() => {
    console.log('Server is ready. Running type check...');
    // Run type check
    const typeCheck = runCommand('npm', ['run', 'type-check:electron'], 'type-check');
    
    typeCheck.on('exit', (code) => {
        if (code === 0) {
            console.log('Type check passed. Starting Electron...');
            const electron = runCommand('npm', ['run', 'start:electron'], 'electron');
            
            electron.on('exit', () => {
                console.log('Electron exited, stopping server...');
                server.kill();
                process.exit(0);
            });
        } else {
            console.error('Type check failed.');
            server.kill();
            process.exit(1);
        }
    });
  })
  .catch((err) => {
    console.error('Error waiting for server:', err);
    server.kill();
    process.exit(1);
  });

// Handle termination
const cleanup = () => {
    try {
        server.kill();
    } catch (e) {}
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
