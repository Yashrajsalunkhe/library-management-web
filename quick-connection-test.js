const ZKLib = require('node-zklib');
require('dotenv').config();

const deviceIP = process.env.BIOMETRIC_DEVICE_IP || '172.16.253.65';
const port = parseInt(process.env.BIOMETRIC_DEVICE_PORT || '4370');

console.log(`Testing connection to ${deviceIP}:${port}...`);

async function quickConnectionTest() {
    const zk = new ZKLib(deviceIP, port, 5000, 10000);
    
    try {
        await zk.createSocket();
        console.log('✅ Socket created successfully');
        
        const info = await zk.getInfo();
        console.log('✅ Device info:', info);
        
        // Test users
        if (info.userCounts > 0) {
            try {
                const users = await zk.getUsers();
                console.log(`✅ Found ${users.data.length} users:`);
                users.data.forEach(user => {
                    console.log(`  - ID: ${user.userId || user.uid}, Name: ${user.name}`);
                });
            } catch (userError) {
                console.log('⚠️  Could not read users:', userError.message);
            }
        } else {
            console.log('ℹ️  No users on device');
        }
        
        // Test attendance
        if (info.logCounts > 0) {
            try {
                const attendance = await zk.getAttendances();
                console.log(`✅ Found ${attendance.data.length} attendance records`);
                if (attendance.data.length > 0) {
                    console.log('Recent attendance:');
                    attendance.data.slice(-3).forEach(record => {
                        console.log(`  - User: ${record.deviceUserId}, Time: ${record.recordTime}`);
                    });
                }
            } catch (attError) {
                console.log('⚠️  Could not read attendance:', attError.message);
            }
        } else {
            console.log('ℹ️  No attendance records on device');
        }
        
        await zk.disconnect();
        console.log('✅ Disconnected successfully');
        
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        console.log('\nPossible issues:');
        console.log('1. Device is powered off or disconnected');
        console.log('2. Wrong IP address - check device network settings');
        console.log('3. Device and computer not on same network');
        console.log('4. Firewall blocking connection');
        console.log(`\nTry pinging the device: ping ${deviceIP}`);
    }
}

quickConnectionTest();