# eSSL K30 Biometric Machine Integration Guide

## Complete Step-by-Step Setup for eSSL K30 (Ethernet Connection)

### What You Have:
- ✅ eSSL K30 Fingerprint Machine (Ethernet only)
- ✅ Library Management System with Biometric Integration
- ✅ Network connection capability

---

## 🔧 STEP 1: Hardware Setup

### 1.1 Connect the eSSL K30 Machine
```bash
1. Connect eSSL K30 to your router/switch using Ethernet cable
2. Power on the machine
3. Wait for the machine to boot up (usually shows eSSL logo)
4. Check the machine's display for network status
```

### 1.2 Find Machine's IP Address
**Method 1: From Machine Menu**
```
1. Press "M/OK" button on eSSL K30
2. Navigate to: COMM → Network → IP Address
3. Note down the IP address (example: 172.16.50.20)
```

**Method 2: Network Scanner**
```bash
# Install nmap if not available
sudo dnf install nmap  # For Fedora/RHEL
sudo apt install nmap  # For Ubuntu/Debian

# Scan your network (replace with your network range)
nmap -sn 192.168.1.0/24

# Look for device with hostname like "essl" or unknown device
```

---

## 🛠️ STEP 2: Download eSSL SDK

### 2.1 Get eSSL SDK Files
You need these files from eSSL:
- `essl.dll` (Windows) or `libessl.so` (Linux)
- `essl.h` (C header file)
- SDK documentation

**Download Options:**
1. Official eSSL website: https://www.essl.co.in
2. Contact eSSL support for Linux SDK
3. Use provided implementation (see next step)

### 2.2 Alternative: HTTP-based Integration
Since eSSL K30 supports HTTP API, we can use direct HTTP calls:

```bash
# Test connection to your eSSL K30
curl http://172.16.50.20/cgi-bin/AccessLog.cgi

# If this works, you can use HTTP-based integration
```

---

## 📝 STEP 3: Setup Project Files

### 3.1 Update Device IP Address
```bash
# Edit the eSSL program file
cd /home/yashraj/YASHRAJ/library-management/biometric-helper
```

Update `ESSLK30Program.cs` line 32:
```csharp
deviceIP = "172.16.50.20";  // Replace with YOUR machine's IP
```

### 3.2 Update Project File
```xml
<!-- Add to BiometricHelper.csproj -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
    <OutputType>Exe</OutputType>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.App" />
    <PackageReference Include="System.Net.Http" Version="4.3.4" />
  </ItemGroup>

  <!-- If you have essl.dll, add this: -->
  <ItemGroup>
    <Content Include="essl.dll">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </Content>
  </ItemGroup>
</Project>
```

---

## 🚀 STEP 4: Test Connection

### 4.1 Test eSSL K30 Network Connectivity
```bash
# Test ping to your machine
ping 172.16.50.20

# Test HTTP connection (if supported)
curl http://172.16.50.20

# Test telnet to eSSL port
telnet 172.16.50.20 4370
```

### 4.2 Configure eSSL K30 Machine Settings
**On the machine menu:**
```
1. Press M/OK → COMM → Ethernet
2. Set IP Address: 172.16.50.20 (or your desired IP)
3. Set Subnet Mask: 255.255.255.0
4. Set Gateway: 192.168.1.1 (your router IP)
5. Save settings and restart machine
```

---

## 🔧 STEP 5: Run the Integration

### 5.1 Start the eSSL Helper
```bash
cd /home/yashraj/YASHRAJ/library-management/biometric-helper

# Build and run the eSSL helper
dotnet build
dotnet run ESSLK30Program.cs

# You should see:
# "=== eSSL K30 Biometric Helper Starting ==="
# "Connecting to eSSL K30 at 172.16.50.20:4370..."
# "Successfully connected to eSSL K30!"
```

### 5.2 Start Main Application
```bash
# In another terminal
cd /home/yashraj/YASHRAJ/library-management
npm start

# Check dashboard for biometric status
```

---

## ✅ STEP 6: Test the Integration

### 6.1 Check Connection Status
1. Open your library management app
2. Go to **Dashboard**
3. Look for **Biometric Status** widget
4. Should show: ✅ **Connected** (green)

### 6.2 Enroll a Member's Fingerprint
1. Go to **Members** page
2. Find a member
3. Click the 🔓 biometric button
4. Click **Start Enrollment**
5. Follow instructions on eSSL K30 screen
6. Place finger on scanner when prompted

### 6.3 Test Live Attendance
1. After enrollment, member can scan fingerprint on eSSL K30
2. First scan = **Check-in**
3. Second scan = **Check-out**
4. Watch **Dashboard** for real-time notifications

---

## 🔧 TROUBLESHOOTING

### Problem: Cannot Connect to eSSL K30
**Solutions:**
```bash
1. Check network cable connection
2. Verify IP address on machine menu
3. Test ping: ping 172.16.50.20
4. Check firewall settings
5. Try different port (some eSSL use 80 or 4370)
```

### Problem: SDK DLL Not Found
**Solutions:**
```bash
1. Download essl.dll from official eSSL website
2. Place in biometric-helper/ directory
3. Or use HTTP-based integration (see alternative method)
```

### Problem: No Fingerprint Events
**Solutions:**
```bash
1. Check eSSL K30 is in "Online" mode
2. Verify network connectivity
3. Check member is enrolled in device
4. Test with device's local interface first
```

---

## 🌐 ALTERNATIVE: HTTP-Based Integration

If SDK doesn't work, use HTTP API:

### Update Environment Variables
```bash
# Edit .env file
BIOMETRIC_HELPER_URL=http://172.16.50.20
BIOMETRIC_DEVICE_TYPE=essl_k30_http
ESSL_DEVICE_IP=172.16.50.20
```

### HTTP Endpoints for eSSL K30
```bash
# Get device info
GET http://172.16.50.20/cgi-bin/DeviceStatus.cgi

# Get attendance logs
GET http://172.16.50.20/cgi-bin/AccessLog.cgi

# Add user (enrollment)
POST http://172.16.50.20/cgi-bin/AddUser.cgi

# Delete user
POST http://172.16.50.20/cgi-bin/DeleteUser.cgi
```

---

## 📋 QUICK CHECKLIST

- [ ] eSSL K30 connected to network
- [ ] Found device IP address
- [ ] Updated ESSLK30Program.cs with correct IP
- [ ] Built and started biometric helper
- [ ] Started main application
- [ ] Biometric status shows "Connected"
- [ ] Successfully enrolled a test fingerprint
- [ ] Tested live attendance scanning

---

## 📞 SUPPORT

**If you need help:**
1. Check eSSL K30 manual for network setup
2. Test device connectivity first
3. Verify IP address configuration
4. Check application logs for errors
5. Contact eSSL support for SDK issues

**Log Files to Check:**
- `/home/yashraj/YASHRAJ/library-management/dev.log`
- `/home/yashraj/YASHRAJ/library-management/electron.log`
- Console output from biometric helper

---

**🎉 Once everything is working, your members can simply scan their fingerprints on the eSSL K30 for automatic attendance tracking!**
