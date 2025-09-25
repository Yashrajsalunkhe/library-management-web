const { exec } = require('child_process');
const ZKLib = require('node-zklib');

console.log('Scanning for ZKTeco biometric devices...');
console.log('==========================================');

// Common IP ranges to scan based on your network
const baseIPs = [
    '172.16.200.',  // Your subnet
    '172.16.1.',    // Gateway subnet
    '172.16.50.',   // Common device subnet
    '172.16.100.',  // Another common range
];

// Common device IPs that are often used
const commonLastOctets = [1, 2, 5, 10, 20, 50, 100, 200, 201, 202, 203, 204, 205];

async function scanForDevice(ip, timeout = 3000) {
    return new Promise((resolve) => {
        const zk = new ZKLib(ip, 4370, timeout, timeout);
        
        zk.createSocket()
            .then(() => zk.getInfo())
            .then((info) => {
                zk.disconnect().catch(() => {});
                resolve({ ip, success: true, info });
            })
            .catch((error) => {
                resolve({ ip, success: false, error: error.message });
            });
    });
}

async function findDevices() {
    console.log('Scanning common IP addresses...\n');
    
    const promises = [];
    
    // Generate IP addresses to scan
    for (const baseIP of baseIPs) {
        for (const lastOctet of commonLastOctets) {
            const ip = baseIP + lastOctet;
            promises.push(scanForDevice(ip, 2000));
        }
    }
    
    // Also try the original IP just in case
    promises.push(scanForDevice('172.16.253.65', 2000));
    
    console.log(`Checking ${promises.length} possible IP addresses...`);
    console.log('This will take about 10-15 seconds...\n');
    
    try {
        const results = await Promise.all(promises);
        
        const foundDevices = results.filter(result => result.success);
        const errors = results.filter(result => !result.success);
        
        if (foundDevices.length > 0) {
            console.log('🎉 Found biometric device(s):');
            foundDevices.forEach(device => {
                console.log(`\n✅ Device at ${device.ip}`);
                console.log(`   Users: ${device.info.userCounts}`);
                console.log(`   Attendance records: ${device.info.logCounts}`);
                console.log(`   Capacity: ${device.info.logCapacity}`);
            });
            
            console.log('\n📝 To fix your configuration:');
            console.log('1. Update your .env file with the correct IP:');
            foundDevices.forEach(device => {
                console.log(`   BIOMETRIC_DEVICE_IP=${device.ip}`);
            });
            console.log('2. Restart your application');
            
        } else {
            console.log('❌ No biometric devices found on common IP addresses.');
            console.log('\nTroubleshooting steps:');
            console.log('1. Check if the biometric device is powered on');
            console.log('2. Ensure device and computer are on same network');
            console.log('3. Check device network settings on the device menu');
            console.log('4. Try scanning a different IP range if needed');
        }
        
    } catch (error) {
        console.error('Scan error:', error);
    }
}

findDevices();