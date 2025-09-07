const { spawn } = require('child_process');
const http = require('http');

console.log('⏳ Waiting for Vite dev server to be ready...');

// Function to check if Vite dev server is running
function checkServer(url, callback) {
  const request = http.get(url, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      callback(false);
    }
  });
  
  request.on('error', () => {
    callback(false);
  });
  
  request.setTimeout(1000, () => {
    request.destroy();
    callback(false);
  });
}

// Wait for server with retry logic
function waitForServer(retries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const tryConnect = () => {
      attempts++;
      console.log(`🔄 Checking dev server (attempt ${attempts}/${retries})...`);
      
      // Try common Vite ports
      const ports = [5173, 5174, 5175, 3000];
      let checkedPorts = 0;
      
      ports.forEach(port => {
        checkServer(`http://localhost:${port}/`, (isReady) => {
          checkedPorts++;
          if (isReady) {
            console.log(`✅ Vite dev server is ready on port ${port}!`);
            resolve();
            return;
          }
          
          if (checkedPorts === ports.length) {
            if (attempts < retries) {
              setTimeout(tryConnect, 1000);
            } else {
              console.log('⚠️  Dev server not ready, starting Electron anyway...');
              resolve();
            }
          }
        });
      });
    };
    
    // Start checking after initial delay
    setTimeout(tryConnect, 2000);
  });
}

// Main function
async function startElectron() {
  try {
    await waitForServer();
    
    console.log('⚡ Starting Electron...');
    
    // Determine if we're on Windows
    const isWindows = process.platform === 'win32';
    
    // Start Electron with platform-specific command
    const command = isWindows ? 'npx.cmd' : 'npx';
    const electronProcess = spawn(command, ['electron', '.'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
      shell: isWindows
    });
    
    electronProcess.on('close', (code) => {
      console.log(`✅ Electron process exited with code ${code}`);
      process.exit(code);
    });
    
    electronProcess.on('error', (error) => {
      console.error('❌ Error starting Electron:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

startElectron();
