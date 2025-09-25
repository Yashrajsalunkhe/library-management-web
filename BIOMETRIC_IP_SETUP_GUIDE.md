# 🔧 **Quick Setup Guide: How to Set Biometric Device IP**

## 📍 **Step 1: Find Your Device IP Address**

### Method 1: From eSSL K30 Device
```
1. Press "M/OK" button on your eSSL K30 device
2. Navigate: Menu → COMM → Network → IP Address
3. Write down the IP (example: 172.16.50.20)
```

### Method 2: Check Your Router
```
1. Open router admin panel (usually 192.168.1.1)
2. Look for "Connected Devices" or "DHCP Client List"
3. Find your eSSL device (may show as "essl" or unknown device)
```

### Method 3: Network Scanner
```bash
# Install network scanner
sudo dnf install nmap

# Scan your network (replace with your network range)
nmap -sn 192.168.1.0/24

# Look for devices that respond
```

---

## ⚙️ **Step 2: Update Configuration File**

**Open your .env file in the project root:**
```bash
nano /home/yashraj/YASHRAJ/library-management/.env
```

**Update these lines with YOUR device IP:**
```env
# Biometric Integration
BIOMETRIC_HELPER_URL=http://localhost:5005
BIOMETRIC_HELPER_TOKEN=your-secure-token
ESSL_DEVICE_IP=172.16.50.20    # ← Change this to YOUR device IP
ESSL_DEVICE_PORT=4370           # ← Usually 4370 for eSSL K30
ESSL_DEVICE_ID=1                # ← Device ID (usually 1)
```

**Example with different IP:**
```env
ESSL_DEVICE_IP=192.168.0.150    # If your device is at this IP
ESSL_DEVICE_IP=172.16.50.20     # Or this IP
ESSL_DEVICE_IP=10.0.0.25        # Or this IP
```

---

## 🚀 **Step 3: Start the Biometric Service**

### Option A: Use the Startup Script
```bash
cd /home/yashraj/YASHRAJ/library-management/biometric-helper
./start-biometric-helper.sh
```

### Option B: Manual Start
```bash
cd /home/yashraj/YASHRAJ/library-management/biometric-helper

# Set environment variables
export ESSL_DEVICE_IP=172.16.50.20  # Your device IP
export ESSL_DEVICE_PORT=4370
export ESSL_DEVICE_ID=1

# Build and run
dotnet build
dotnet run
```

---

## ✅ **Step 4: Test Connection**

1. **In your library management app**, go to Settings or Dashboard
2. Look for **Biometric Status** - should show ✅ **Connected**
3. Or click **Test Connection** button if available

**If connection fails:**
- Check device is powered on
- Verify IP address is correct
- Test ping: `ping 172.16.50.20`
- Check firewall settings

---

## 📋 **Common IP Examples**

| Network Type | Typical IP Range | Example |
|-------------|------------------|---------|
| Home Router | 192.168.1.x | 172.16.50.20 |
| Business | 192.168.0.x | 192.168.0.150 |
| Office Network | 172.16.x.x | 172.16.50.20 |
| Corporate | 10.0.0.x | 10.0.0.25 |

---

## 🔍 **Your Current Configuration**

Based on your .env file, you have:
```
ESSL_DEVICE_IP=172.16.50.20
ESSL_DEVICE_PORT=4370
ESSL_DEVICE_ID=1
```

**To change it:**
1. Edit the `.env` file
2. Change `ESSL_DEVICE_IP=172.16.50.20` to your device's IP
3. Save the file
4. Restart the biometric helper service

---

## 🛠️ **Troubleshooting**

### Problem: Can't find device IP
```bash
# Scan network
nmap -sn 192.168.1.0/24

# Or check device menu directly on eSSL K30
```

### Problem: Connection timeout
```bash
# Test network connection
ping 172.16.50.20

# Check if port is open
telnet 172.16.50.20 4370
```

### Problem: Service won't start
```bash
# Check if .NET is installed
dotnet --version

# Rebuild the project
cd biometric-helper
dotnet clean
dotnet build
```

---

## 🎯 **Quick Commands**

**Test network connection:**
```bash
ping 172.16.50.20  # Replace with your device IP
```

**Start biometric service:**
```bash
cd /home/yashraj/YASHRAJ/library-management/biometric-helper
./start-biometric-helper.sh
```

**View current configuration:**
```bash
cat /home/yashraj/YASHRAJ/library-management/.env | grep ESSL
```

Once you have the correct IP address in your `.env` file, the biometric system will automatically use it when you start the helper service!