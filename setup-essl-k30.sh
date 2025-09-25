#!/bin/bash

echo "🔧 eSSL K30 Integration Setup Script"
echo "======================================"

# Step 1: Find your eSSL K30 IP address
echo "📡 Step 1: Finding your eSSL K30 device..."
echo ""

# Get your network range
GATEWAY=$(ip route | grep default | awk '{print $3}')
NETWORK=$(echo $GATEWAY | sed 's/\.[0-9]*$//')

echo "🔍 Scanning network $NETWORK.0/24 for devices..."
echo "Looking for eSSL K30..."

# Scan common eSSL ports
echo ""
echo "Testing common eSSL K30 IP addresses:"

# Common default IPs for eSSL devices
COMMON_IPS=("172.16.50.20" "192.168.0.100" "192.168.1.201" "10.0.0.100")

FOUND_IP=""

for ip in "${COMMON_IPS[@]}"; do
    echo -n "Testing $ip... "
    if ping -c 1 -W 1 $ip &> /dev/null; then
        echo "✅ Responding"
        
        # Test HTTP connection
        if curl -s --max-time 3 "http://$ip" &> /dev/null; then
            echo "  🌐 HTTP accessible"
            FOUND_IP=$ip
            break
        elif nc -z -w3 $ip 4370 2>/dev/null; then
            echo "  🔌 Port 4370 open (eSSL SDK port)"
            FOUND_IP=$ip
            break
        else
            echo "  ⚠️  No eSSL service detected"
        fi
    else
        echo "❌ Not responding"
    fi
done

echo ""

if [ -n "$FOUND_IP" ]; then
    echo "🎉 Found potential eSSL K30 at: $FOUND_IP"
    echo ""
    echo "📝 Step 2: Updating configuration..."
    
    # Update the HTTP program with found IP
    if [ -f "biometric-helper/ESSLK30HttpProgram.cs" ]; then
        sed -i "s/deviceIP = \"192\.168\.1\.100\"/deviceIP = \"$FOUND_IP\"/" biometric-helper/ESSLK30HttpProgram.cs
        echo "✅ Updated ESSLK30HttpProgram.cs with IP: $FOUND_IP"
    fi
    
    # Update environment file
    if [ -f ".env" ]; then
        if grep -q "ESSL_DEVICE_IP" .env; then
            sed -i "s/ESSL_DEVICE_IP=.*/ESSL_DEVICE_IP=$FOUND_IP/" .env
        else
            echo "ESSL_DEVICE_IP=$FOUND_IP" >> .env
        fi
        echo "✅ Updated .env with ESSL device IP"
    fi
    
else
    echo "⚠️  No eSSL K30 device found automatically."
    echo ""
    echo "Please check:"
    echo "1. eSSL K30 is powered on"
    echo "2. Ethernet cable is connected"
    echo "3. Device is on the same network"
    echo ""
    echo "Manual setup:"
    echo "1. Press M/OK on eSSL K30"
    echo "2. Go to COMM → Network → IP Address"
    echo "3. Note the IP address"
    echo "4. Update ESSLK30HttpProgram.cs line 17 with the correct IP"
    echo ""
fi

echo "🏗️  Step 3: Building biometric helper..."
cd biometric-helper

if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET not found. Installing..."
    
    if command -v dnf &> /dev/null; then
        sudo dnf install -y dotnet-sdk-8.0
    elif command -v apt &> /dev/null; then
        sudo apt update && sudo apt install -y dotnet-sdk-6.0
    else
        echo "Please install .NET 8.0 manually"
        exit 1
    fi
fi

echo "Building C# biometric helper..."
dotnet build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Step 4: Ready to start!"
    echo ""
    echo "To run the integration:"
    echo "1. Start biometric helper:"
    echo "   cd biometric-helper"
    echo "   dotnet run ESSLK30HttpProgram.cs"
    echo ""
    echo "2. In another terminal, start main app:"
    echo "   npm start"
    echo ""
    echo "3. Check dashboard for biometric status"
    echo ""
    
    if [ -n "$FOUND_IP" ]; then
        echo "🔗 Your eSSL K30 should be accessible at: http://$FOUND_IP"
        echo ""
        echo "Device setup checklist:"
        echo "□ Device shows network connected status"
        echo "□ Can access device web interface at http://$FOUND_IP"
        echo "□ Biometric helper connects successfully"
        echo "□ Dashboard shows 'Connected' status"
    fi
    
else
    echo "❌ Build failed. Please check for errors above."
fi

cd ..

echo ""
echo "📚 For detailed setup, see: ESSL_K30_INTEGRATION_GUIDE.md"
echo "🆘 Need help? Check the troubleshooting section in the guide."