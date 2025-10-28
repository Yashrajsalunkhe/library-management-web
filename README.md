# 📚 Library Management System# 📚 Library Management System



A professional desktop application for managing library memberships, attendance tracking, payment processing, and automated notifications.A comprehensive Electron-based desktop application for managing library memberships, attendance tracking, payment processing, and automated notifications with biometric integration support.



---## 🌟 Features



## ⚡ Quick Start (3 Minutes Setup)### Core Functionality

- **Member Management**: Complete CRUD operations for library members

### For Linux/Mac:- **Membership Plans**: Flexible plans with different durations and pricing

```bash- **Payment Tracking**: Multiple payment modes with receipt generation

./install.sh    # First time only (installs everything)- **Attendance System**: Manual and biometric check-in/check-out

./run.sh        # Run this every time you want to use the app- **Dashboard**: Real-time statistics and quick actions

```- **Reports**: Excel and PDF export capabilities



### For Windows:### Advanced Features

```cmd- **Automated Notifications**: Email and WhatsApp reminders for membership expiry

install.bat     # First time only (installs everything)- **Biometric Integration**: Fingerprint-based attendance (with C# helper)

run.bat         # Run this every time you want to use the app- **Scheduled Tasks**: Daily backups, status updates, and reminder notifications

```- **QR Code Support**: Member identification via QR codes

- **Receipt Generation**: Professional PDF receipts for payments

**That's it!** The application will open automatically.- **Data Export**: Multiple format support (Excel, PDF) for reports



---### Technical Highlights

- **Electron + React**: Modern desktop application architecture

## 🔑 First Login- **SQLite Database**: Reliable local data storage with better-sqlite3

- **Security**: Bcrypt password hashing, token-based authentication

- **Username:** `admin`- **Cross-platform**: Supports Windows, macOS, and Linux

- **Password:** `admin123`- **Real-time Updates**: Live dashboard statistics and notifications



⚠️ **Important:** Change this password after first login from Settings page!### Project Structure



---```

library-management/

## 📋 What You Need├── 📁 src/                    # React frontend source

│   ├── 📁 components/         # Reusable components

- **Node.js v18+** - [Download here](https://nodejs.org) (if not installed)│   ├── 📁 contexts/          # React contexts

- **4 GB RAM** (minimum)│   ├── 📁 pages/             # Application pages

- **500 MB** disk space│   └── 📁 styles/            # Styling files

- **Internet** (for initial installation only)├── 📁 electron/              # Electron backend

│   ├── 📄 main.js           # Main process

---│   ├── 📄 db.js             # Database operations

│   ├── 📄 ipcHandlers.js    # IPC handlers

## 🌟 Key Features│   └── 📄 library.db        # SQLite database

├── 📁 biometric-helper/      # C# biometric integration

### Member Management├── 📁 scripts/              # Build & utility scripts

- Add, edit, and manage member information├── 📁 config/               # Configuration files

- Track membership status (Active/Expired)├── 📁 docs/                 # Documentation

- Generate QR codes for quick identification├── 📁 backups/              # Database backups

- Search and filter members easily└── 📁 exports/              # Generated reports

```

### Payment System

- Record payments with multiple payment modes (Cash/UPI/Card)## 📚 Documentation

- Auto-generate professional PDF receipts

- Track payment history- [Development Guide](docs/DEVELOPMENT.md) - Setup and development workflow

- Automatic membership renewal- [API Documentation](docs/API.md) - IPC channels and database schema

- [User Manual](docs/USER_MANUAL.md) - How to use the application

### Attendance Tracking

- Quick check-in/check-out## 🚀 Quick Start

- Track visit duration

- View current attendance### Prerequisites

- Generate attendance reports- Node.js (v18 or higher)

- Optional biometric integration- npm or yarn

- .NET 6.0 (for biometric integration)

### Reports & Analytics

- Member reports (Excel & PDF)### Universal Installation (Works on Windows, Linux & macOS)

- Payment/revenue reports

- Attendance analytics1. **Clone and install**

- Custom date range reports   ```bash

- Export to multiple formats   git clone https://github.com/Yashrajsalunkhe/library-management.git

   cd library-management

### Automation   npm install

- Automated membership expiry reminders (Email/WhatsApp)   ```

- Daily database backups

- Automatic status updates2. **Start the application**

- Scheduled notifications   ```bash

   npm start

### Dashboard   ```

- Real-time statistics

- Quick action buttonsThe `npm start` command automatically detects your platform and starts both the development server and Electron app!

- Visual charts and graphs

- Today's summary### Platform-Specific Guides

- 🪟 **Windows**: See [WINDOWS_SETUP.md](WINDOWS_SETUP.md)

---- 🐧 **Linux/macOS**: Works out of the box with `npm start`

- 🔀 **Cross-Platform**: See [CROSS_PLATFORM.md](CROSS_PLATFORM.md)

## 📖 How to Use

### Development Scripts

### First Time Setup

```bash

1. **Install the application:**# Universal (recommended)

   ```bashnpm start                # Cross-platform startup

   ./install.sh    # Linux/Mac

   install.bat     # Windows# Platform-specific

   ```npm run start:windows    # Windows batch script

   Wait 2-5 minutes for installation to complete.npm run start:powershell # Windows PowerShell  

npm run start:linux      # Linux/macOS shell script

2. **Start the application:**

   ```bash# Development

   ./run.sh        # Linux/Macnpm run dev              # Frontend only

   run.bat         # Windowsnpm run electron         # Electron only

   ```npm run build            # Production build

npm run clean            # Clean cache

3. **Login** with default credentials (admin/admin123)```



4. **Change password** in Settings page### Prerequisites

- Node.js 16+ 

5. **Add membership plans** in Settings- npm or yarn

- .NET 6+ (for biometric helper, optional)

6. **Start adding members!**

### Installation

### Daily Usage

1. **Clone and Install Dependencies**

Simply run:   ```bash

```bash   git clone <repository-url>

./run.sh        # Linux/Mac   cd library-management

run.bat         # Windows   npm install

```   ```



The application remembers all your data automatically!2. **Environment Setup**

   ```bash

---   cp .env.example .env

   # Edit .env with your configuration

## 🎯 Common Tasks   ```



### Adding a New Member3. **Development Mode**

1. Click **Members** in sidebar   ```bash

2. Click **"Add Member"** button   # Terminal 1: Start React development server

3. Fill in details (Name, Phone, Email, etc.)   npm run dev

4. Click **Save**

   # Terminal 2: Start Electron app

### Recording a Payment   npm run electron

1. Click **Payments** in sidebar   ```

2. Click **"Record Payment"** button

3. Select member from dropdown4. **Production Build**

4. Enter amount and payment mode   ```bash

5. Click **Save**   npm run build

6. Receipt auto-generated in `exports/receipts/`   npm run electron:build

   ```

### Marking Attendance

1. Click **Attendance** in sidebar## 📁 Project Structure

2. Click **"Check In"** button

3. Select member```

4. Click **Save**library-management/

5. For check-out, click **"Check Out"** next to member name├── electron/                  # Electron main process files

│   ├── main.js               # Application entry point

### Generating Reports│   ├── preload.js            # Secure IPC bridge

1. Click **Reports** in sidebar│   ├── db.js                 # SQLite database setup

2. Select report type (Members/Payments/Attendance)│   ├── ipcHandlers.js        # API handlers

3. Choose date range│   ├── notifier.js           # Email/WhatsApp service

4. Click **"Generate Report"**│   ├── scheduler.js          # Automated tasks

5. Choose Excel or PDF format│   ├── reports.js            # Report generation

6. File saved in `exports/` folder│   ├── biometric-bridge.js   # Biometric device integration

│   └── library.db            # SQLite database file

---├── src/                      # React frontend

│   ├── components/           # Reusable UI components

## 📁 Folder Structure│   ├── pages/                # Application pages

│   ├── contexts/             # React contexts

After installation:│   ├── styles/               # Global styles

```│   └── App.jsx               # Main React component

library-management/├── biometric-helper/         # C# biometric integration

├── install.sh / install.bat    # Installation script│   ├── Program.cs            # Main C# application

├── run.sh / run.bat            # Start script│   └── BiometricHelper.csproj

├── exports/                    # Your generated reports├── exports/                  # Generated reports and receipts

│   └── receipts/               # Payment receipts├── backups/                  # Automatic database backups

├── backups/                    # Automatic database backups└── assets/                   # Application assets

├── electron/```

│   └── library.db              # Your data (automatically created)

└── docs/                       # Detailed documentation## 🔧 Configuration

```

### Email Notifications (Optional)

---Set up in `.env`:

```env

## 🛟 TroubleshootingEMAIL_HOST=smtp.gmail.com

EMAIL_PORT=587

### Application won't start?EMAIL_USER=your-email@gmail.com

**Solution:** Make sure you ran `install.sh` or `install.bat` first!EMAIL_PASS=your-app-password

EMAIL_FROM=your-email@gmail.com

### "Node.js not installed" error?```

**Solution:** Download Node.js v18+ from https://nodejs.org and install it.

### WhatsApp Integration (Optional)

### Forgot admin password?Using Gupshup API:

**Solution:** Contact support or check documentation for password reset.```env

GUPSHUP_API_KEY=your-api-key

### Data not saving?GUPSHUP_APP_NAME=your-app-name

**Solution:** Don't force-close the application. Always close the window normally.GUPSHUP_BASE_URL=https://api.gupshup.io/sm/api/v1

```

### Need help?

- Check `docs/USER_MANUAL.md` for detailed guide### Biometric Integration (Optional)

- Check `QUICK_START.md` for installation helpConfigure the helper service:

- Review documentation in `docs/` folder```env

BIOMETRIC_HELPER_URL=http://localhost:5005

---BIOMETRIC_HELPER_TOKEN=your-secure-token

```

## 🔒 Security & Backup

## 📊 Database Schema

### Your Data is Safe

- All data stored locally in `electron/library.db`The application uses SQLite with the following main tables:

- Automatic daily backups in `backups/` folder

- No internet required after installation- **members**: Member information and membership details

- **membership_plans**: Available membership plans

### Backup Your Data- **payments**: Payment records and receipts

The application auto-backs up daily, but you can also:- **attendance**: Check-in/check-out records

1. Copy `electron/library.db` to a safe location- **users**: Application users (receptionists/admin)

2. Copy the entire `backups/` folder regularly- **notifications**: Sent notification tracking

3. Store backups on external drive/cloud- **settings**: Application configuration



### Restore from Backup## 🔐 Default Credentials

1. Close the application

2. Replace `electron/library.db` with your backup file- **Username**: `admin`

3. Restart the application- **Password**: `admin123`



---> ⚠️ **Important**: Change the default password after first login!



## 📧 Email Notifications (Optional)## 🏗️ Biometric Integration



To enable automated email reminders:### Setup Instructions



1. Create a `.env` file in the project root1. **Ensure .NET 6+ is installed**

2. Add your email configuration:2. **Navigate to biometric helper**:

   ```   ```bash

   EMAIL_HOST=smtp.gmail.com   cd biometric-helper

   EMAIL_PORT=587   dotnet run

   EMAIL_USER=your-email@gmail.com   ```

   EMAIL_PASS=your-app-password3. **The helper will start on** `http://localhost:5005`

   EMAIL_FROM=your-email@gmail.com4. **Integrate with your biometric device SDK** by replacing the sample implementation

   ```

3. Restart the application### API Endpoints

- `GET /api/biometric/status` - Device status

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).- `POST /api/biometric/start-scan` - Start scanning

- `POST /api/biometric/stop-scan` - Stop scanning

---- `POST /api/biometric/enroll` - Enroll fingerprint

- `DELETE /api/biometric/fingerprint/{id}` - Delete fingerprint

## 💻 System Requirements

## 📈 Reports and Analytics

### Minimum

- Node.js v18+### Available Reports

- 4 GB RAM1. **Attendance Report**: Member visit frequency and timing

- 500 MB disk space2. **Payment Report**: Revenue analysis and transaction history

- 1280x720 screen resolution3. **Member Report**: Complete member database with status

4. **Dashboard Analytics**: Real-time statistics and trends

### Recommended

- Node.js v20+### Export Formats

- 8 GB RAM- **Excel (.xlsx)**: Detailed tabular data

- 1 GB disk space- **PDF**: Professional formatted reports

- 1920x1080 screen resolution- **Receipts**: Payment confirmation documents



### Supported Platforms## 🔄 Automated Tasks

- ✅ Windows 10/11

- ✅ macOS 10.14+The system runs several automated background tasks:

- ✅ Linux (Ubuntu 20.04+, Fedora, etc.)

- **Daily 9:00 AM**: Send membership expiry reminders

---- **Daily 2:00 AM**: Create database backup

- **Weekly Sunday 1:00 AM**: Cleanup old notifications

## 🎓 Learning Resources- **Hourly**: Update expired member statuses



### Documentation Files## 🛠️ Development

- `QUICK_START.md` - Fast setup guide

- `docs/USER_MANUAL.md` - Complete user guide### Available Scripts

- `docs/DEVELOPMENT.md` - For developers```bash

- `docs/API.md` - Technical documentationnpm run dev          # Start development server

npm run electron     # Start Electron in development

---npm run build        # Build for production

npm run electron:build  # Build Electron distribution

## 🔄 Updatesnpm run rebuild      # Rebuild native dependencies

```

### Checking for Updates

1. Visit the project repository### Adding New Features

2. Download the latest version

3. Run `install.sh` or `install.bat` again1. **Backend**: Add IPC handlers in `electron/ipcHandlers.js`

4. Your data will be preserved2. **Database**: Update schema in `electron/db.js`

3. **Frontend**: Create React components in `src/`

---4. **API**: Expose methods in `electron/preload.js`



## 📞 Support## 🔒 Security Features



### Need Help?- **Password Hashing**: Bcrypt with salt rounds

1. **Documentation:** Check `docs/USER_MANUAL.md`- **SQL Injection Protection**: Prepared statements

2. **Quick Start:** See `QUICK_START.md`- **Local Storage**: Encrypted sensitive data

3. **Issues:** Create an issue on GitHub- **Token Authentication**: Secure API communication

4. **Email:** [Add your support email]- **Audit Trail**: All actions logged with timestamps



---## 📦 Building for Distribution



## ⚙️ Advanced Features### Windows

```bash

### Biometric Integrationnpm run electron:build

- Supports fingerprint devices# Creates installer in dist-electron/

- Auto check-in on fingerprint match```

- See `docs/BIOMETRIC_INTEGRATION.md` for setup

### Code Signing (Optional)

### WhatsApp NotificationsAdd to `package.json`:

- Send membership expiry reminders via WhatsApp```json

- Configure in Settings page"build": {

- Requires Gupshup API key  "win": {

    "certificateFile": "path/to/certificate.p12",

### Custom Reports    "certificatePassword": "password"

- Filter by date range  }

- Export to Excel/PDF}

- Include custom data fields```



---## 🐛 Troubleshooting



## 🎉 Ready to Start!### Common Issues



```bash1. **Better-sqlite3 compilation errors**

# Step 1: Install (first time only)   ```bash

./install.sh       # or install.bat on Windows   npm run rebuild

   ```

# Step 2: Run (every time)

./run.sh           # or run.bat on Windows2. **Database locked errors**

```   - Ensure no other instances are running

   - Check file permissions

**Your library management made easy!** 📚✨

3. **Email notifications not working**

---   - Verify SMTP settings

   - Check app-specific passwords for Gmail

## 📄 License

4. **Biometric helper not connecting**

This project is licensed under the ISC License - see the LICENSE file for details.   - Ensure .NET runtime is installed

   - Check firewall settings for localhost:5005

---

### Debug Mode

## 🙏 CreditsStart with debugging enabled:

```bash

Built with:NODE_ENV=development npm run electron

- Electron - Desktop framework```

- React - UI framework

- SQLite - Database## 🤝 Contributing

- Node.js - Runtime

1. Fork the repository

---2. Create a feature branch

3. Make your changes

**Version:** 1.0.0  4. Add tests if applicable

**Last Updated:** October 20255. Submit a pull request



---## 📝 License



For detailed documentation, see the `docs/` folder.  This project is licensed under the ISC License.

For quick help, see `QUICK_START.md`.

## 📞 Support

**Happy Managing! 🚀**

For support and questions:
- Create an issue in the repository
- Email: [your-email@domain.com]
- Documentation: Check the `docs/` folder for detailed guides

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core member management
- ✅ Basic attendance tracking
- ✅ Payment processing
- ✅ Automated notifications

### Phase 2 (Next)
- 🔄 Advanced reporting and analytics
- 🔄 Mobile companion app
- 🔄 Cloud synchronization
- 🔄 Multi-location support

### Phase 3 (Future)
- 📋 Integration with external systems
- 📋 Advanced biometric features
- 📋 AI-powered insights
- 📋 API for third-party integrations

---

**Built with ❤️ using Electron, React, and SQLite**
