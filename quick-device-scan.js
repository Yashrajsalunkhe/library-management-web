const { exec } = require('child_process');
const ZKLib = require('node-zklib');

console.log('Quick scan for ZKTeco devices near your IP...');
console.log('============================================');

// Your IP is 172.16.200.32, so let's check nearby IPs first
const yourSubnet = '172.16.200.';
const nearbyIPs = [];

// Check IPs around yours (200.1 to 200.50)
for (let i = 1; i <= 50; i++) {
    nearbyIPs.push(yourSubnet + i);
}

// Add some common device IPs in other subnets
const otherCommonIPs = [
    '172.16.1.1',
    '172.16.1.100',
    '172.16.50.1',
    '172.16.100.1',
    '172.16.85.85',  // Original IP
];

const allIPs = [...nearbyIPs, ...otherCommonIPs];

async function quickScan(ip) {
    return new Promise((resolve) => {
        const zk = new ZKLib(ip, 4370, 1000, 1000);  // Very short timeout
        
        const timer = setTimeout(() => {
            resolve({ ip, success: false, error: 'timeout' });
        }, 1500);
        
        zk.createSocket()
            .then(() => zk.getInfo())
            .then((info) => {
                clearTimeout(timer);
                zk.disconnect().catch(() => {});
                resolve({ ip, success: true, info });
            })
            .catch((error) => {
                clearTimeout(timer);
                resolve({ ip, success: false, error: error.message });
            });
    });
}

async function scanDevices() {
    console.log(`Scanning ${allIPs.length} IP addresses with fast timeout...\n`);
    
    const results = [];
    let completed = 0;
    
    // Scan in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < allIPs.length; i += batchSize) {
        const batch = allIPs.slice(i, i + batchSize);
        const batchPromises = batch.map(ip => quickScan(ip));
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        completed += batchResults.length;
        
        process.stdout.write(`\rScanned: ${completed}/${allIPs.length} IPs`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n');
    
    const foundDevices = results.filter(result => result.success);
    
    if (foundDevices.length > 0) {
        console.log('🎉 Found biometric device(s):');
        foundDevices.forEach(device => {
            console.log(`\n✅ Device at ${device.ip}`);
            console.log(`   Users: ${device.info.userCounts}`);
            console.log(`   Attendance: ${device.info.logCounts}`);
        });
        
        // Show the command to update .env
        console.log('\n📝 Update your .env file:');
        console.log(`BIOMETRIC_DEVICE_IP=${foundDevices[0].ip}`);
        
    } else {
        console.log('❌ No devices found in quick scan.');
        console.log('\nNext steps:');
        console.log('1. Check if device is powered on');
        console.log('2. Check device IP settings on device menu');
        console.log('3. Try: Menu → Comm → Ethernet → check IP address');
    }
}

scanDevices().catch(console.error);