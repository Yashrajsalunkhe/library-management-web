# 🚀 How to Start the Complete Library Management System

## 📋 Quick Start Guide

### **Method 1: One Command Start (Recommended)**
```bash
cd /home/yashraj/YASHRAJ/library-management
./start-all.sh
```
This will:
- ✅ Check all prerequisites
- ✅ Load environment variables
- ✅ Start biometric helper service
- ✅ Start the main application
- ✅ Open in your browser automatically

---

### **Method 2: Manual Step-by-Step Start**

#### Step 1: Start Biometric Helper Service
```bash
cd /home/yashraj/YASHRAJ/library-management/biometric-helper
./start-biometric-helper.sh
```
*Keep this terminal open*

#### Step 2: Start Main Application (New Terminal)
```bash
cd /home/yashraj/YASHRAJ/library-management
npm start
```
*Keep this terminal open too*

---

### **Method 3: Background Services**

#### Start Everything in Background
```bash
cd /home/yashraj/YASHRAJ/library-management
./start-all.sh &
```

#### Check Running Services
```bash
# Check if biometric helper is running
ps aux | grep dotnet

# Check if main app is running
ps aux | grep electron

# Check logs
tail -f biometric-helper.log
```

---

## 🌐 **Access Points**

Once started, access your application at:

| Service | URL | Description |
|---------|-----|-------------|
| **Main Application** | http://localhost:5173 | Library Management Dashboard |
| **Biometric Service** | http://localhost:5005 | Biometric Helper API |

---

## 🛑 **How to Stop**

### Stop All Services
```bash
# If running in foreground - press Ctrl+C in terminal
# If running in background:
pkill -f "electron"
pkill -f "dotnet"
```

### Or use the stop script:
```bash
./stop-all.sh  # We'll create this next
```

---

## 🔧 **Prerequisites Check**

Before starting, ensure you have:
- ✅ **Node.js** (v16 or later)
- ✅ **npm** (usually comes with Node.js)
- ✅ **.NET 6.0+** (for biometric features)
- ✅ **eSSL K30 device** (connected to network)

### Install Missing Prerequisites:

**Node.js & npm:**
```bash
# Fedora/RHEL
sudo dnf install nodejs npm

# Ubuntu/Debian
sudo apt install nodejs npm
```

**.NET 6.0:**
```bash
# Fedora/RHEL
sudo dnf install dotnet-sdk-6.0

# Ubuntu/Debian
sudo apt install dotnet-sdk-6.0
```

---

## ⚙️ **Configuration**

### Environment Setup
1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit configuration:
```bash
nano .env
```

3. Set your device IP:
```env
ESSL_DEVICE_IP=192.168.1.100  # Your device IP
```

---

## 📊 **Startup Sequence**

When you run `./start-all.sh`, here's what happens:

1. **Prerequisites Check** ✅
   - Node.js, npm, .NET availability
   
2. **Environment Loading** ✅
   - Load .env configuration
   
3. **Dependencies Install** ✅
   - Install npm packages if needed
   
4. **Biometric Helper Start** ✅
   - Build C# helper service
   - Test device connection
   - Start on port 5005
   
5. **Main Application Start** ✅
   - Start Vite dev server (port 5173)
   - Launch Electron app
   - Open browser window

---

## 🐛 **Troubleshooting**

### Problem: "Permission denied"
```bash
chmod +x start-all.sh
chmod +x biometric-helper/start-biometric-helper.sh
```

### Problem: "Node.js not found"
```bash
# Install Node.js first
sudo dnf install nodejs npm  # Fedora
sudo apt install nodejs npm  # Ubuntu
```

### Problem: ".NET not found"
```bash
# Install .NET SDK
sudo dnf install dotnet-sdk-6.0  # Fedora
sudo apt install dotnet-sdk-6.0  # Ubuntu
```

### Problem: "Port already in use"
```bash
# Kill existing processes
pkill -f electron
pkill -f dotnet
pkill -f vite

# Then restart
./start-all.sh
```

### Problem: "Device not reachable"
1. Check device power and network cable
2. Verify IP in .env file
3. Test: `ping 192.168.1.100` (your device IP)

---

## 📱 **What You'll See**

### Terminal Output:
```
🏛️  Starting Library Management System...
==================================================
✅ Node.js found: v18.17.0
✅ npm found: 9.6.7
✅ .NET found: 6.0.100
✅ Environment variables loaded from .env
✅ Device is reachable
✅ Biometric helper service started (PID: 12345)
==================================================
🌐 Main Application will start on: http://localhost:5173
🔐 Biometric Service running on: http://localhost:5005
📊 Dashboard will be available in a few seconds
==================================================
```

### Browser Window:
- Library Management Dashboard opens automatically
- Login screen appears
- After login: Dashboard with biometric status

---

## 🎯 **Quick Commands Reference**

```bash
# Start everything
./start-all.sh

# Start only main app (if biometric already running)
npm start

# Start only biometric helper
cd biometric-helper && ./start-biometric-helper.sh

# Check what's running
ps aux | grep -E "(electron|dotnet|vite)"

# View logs
tail -f biometric-helper.log
tail -f dev.log

# Stop everything
pkill -f electron && pkill -f dotnet
```

That's it! Use `./start-all.sh` for the easiest one-command startup! 🚀