# 📚 Library Management System - Quick Start Guide

Welcome! This guide will help you install and run the Library Management System.

---

## 🚀 Quick Start (2 Simple Steps)

### For Linux/Mac Users:

#### Step 1: Install
```bash
./install.sh
```

#### Step 2: Run
```bash
./run.sh
```

### For Windows Users:

#### Step 1: Install
Double-click: `install.bat` or run in Command Prompt:
```cmd
install.bat
```

#### Step 2: Run
Double-click: `run.bat` or run in Command Prompt:
```cmd
run.bat
```

---

## 📋 System Requirements

Before installation, make sure you have:
- **Node.js v18 or higher** - [Download here](https://nodejs.org)
- **4 GB RAM** (minimum)
- **500 MB** free disk space
- **Internet connection** (for initial installation only)

---

## 🔑 Default Login

After starting the application:

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change this password immediately after first login!

---

## 📖 What Each Script Does

### `install.sh` / `install.bat` (Run Once)
- Checks system requirements
- Installs all necessary dependencies
- Sets up the database
- Creates required folders
- Prepares the application for first use

**Note:** You only need to run this once during initial setup.

### `run.sh` / `run.bat` (Run Every Time)
- Starts the development server
- Opens the application window
- Loads your library data

**Note:** Run this script every time you want to use the application.

---

## ✅ Installation Success Indicators

After running `install.sh` or `install.bat`, you should see:
- ✓ Node.js version detected
- ✓ Dependencies installed successfully
- ✓ Native modules built
- ✓ Directories created
- "INSTALLATION COMPLETED!" message

---

## 🎯 First-Time Setup

1. **Run installation script:**
   - Linux/Mac: `./install.sh`
   - Windows: `install.bat`

2. **Wait for installation to complete** (usually 2-5 minutes)

3. **Run the application:**
   - Linux/Mac: `./run.sh`
   - Windows: `run.bat`

4. **Login with default credentials**

5. **Change your password** in Settings

6. **Start using the system!**

---

## 💡 Common Issues & Solutions

### Issue: "Permission denied" on Linux/Mac
**Solution:**
```bash
chmod +x install.sh run.sh
./install.sh
```

### Issue: "Node.js is not installed"
**Solution:** Download and install Node.js v18+ from https://nodejs.org

### Issue: "Dependencies not installed" when running
**Solution:** Run the installation script first:
```bash
./install.sh  # or install.bat on Windows
```

### Issue: Port 5173 already in use
**Solution:** The run script will automatically handle this. If issues persist, restart your computer.

### Issue: Database errors
**Solution:** The database will be created automatically. If problems persist, delete `electron/library.db` and restart the application.

---

## 📁 Important Files & Folders

After installation, you'll see these folders:

- **`exports/`** - Generated reports and receipts
- **`backups/`** - Automatic database backups
- **`electron/`** - Application core files (don't modify)
- **`node_modules/`** - Dependencies (auto-generated)

---

## 🛟 Getting Help

### Documentation
- **User Manual:** `docs/USER_MANUAL.md`
- **Complete Documentation:** `docs/` folder
- **Testing Guide:** `TESTING_CHECKLIST.md`

### Support
If you encounter issues:
1. Check the console for error messages
2. Review the User Manual in `docs/USER_MANUAL.md`
3. Ensure Node.js v18+ is installed
4. Try reinstalling: run `install.sh` or `install.bat` again

---

## 🎓 Features Overview

This system includes:
- ✅ Member management (Add, Edit, Delete)
- ✅ Payment tracking with receipt generation
- ✅ Attendance system (Check-in/Check-out)
- ✅ Automated email reminders
- ✅ Excel & PDF reports
- ✅ Dashboard with statistics
- ✅ QR code generation
- ✅ Biometric support (optional)

---

## 🔄 Daily Usage

**To use the application daily:**

1. Run the start script:
   - Linux/Mac: `./run.sh`
   - Windows: Double-click `run.bat`

2. Login with your credentials

3. Use the application

4. Close the application window when done

**Note:** Your data is automatically saved. No need to "close" or "save" manually.

---

## 🔒 Security Tips

1. **Change default password** immediately after first login
2. **Regular backups** - Backups are automatic, but you can also manually copy the database file
3. **Keep software updated** - Regularly check for updates
4. **Protect admin credentials** - Don't share admin password

---

## 📊 Workflow Example

**Adding a New Member and Recording Payment:**

1. Start application: `./run.sh`
2. Login with credentials
3. Go to "Members" → Click "Add Member"
4. Fill in member details → Save
5. Go to "Payments" → Click "Record Payment"
6. Select member → Enter amount → Save
7. Receipt is auto-generated in `exports/receipts/`

**Marking Attendance:**

1. Go to "Attendance" page
2. Click "Check-in"
3. Select member from dropdown
4. Click "Save"
5. When member leaves, click "Check-out" next to their name

---

## 🎉 You're Ready!

Just follow these 2 simple steps:

```bash
# Step 1: Install (first time only)
./install.sh

# Step 2: Run (every time you want to use it)
./run.sh
```

**That's it! The application will open automatically.**

---

## 📞 Quick Reference Card

```
┌─────────────────────────────────────────┐
│  Library Management System              │
├─────────────────────────────────────────┤
│  FIRST TIME:                            │
│    ./install.sh   (or install.bat)      │
│                                         │
│  EVERY TIME:                            │
│    ./run.sh       (or run.bat)          │
│                                         │
│  LOGIN:                                 │
│    Username: admin                      │
│    Password: admin123                   │
│                                         │
│  STOP:                                  │
│    Press Ctrl+C or close window         │
└─────────────────────────────────────────┘
```

---

**Happy Managing! 📚✨**

For detailed features and usage, see the complete User Manual in `docs/USER_MANUAL.md`
