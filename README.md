# 📚 Library Management System

A comprehensive Electron-based desktop application for managing library memberships, attendance tracking, payment processing, and automated notifications with biometric integration support.

## 🌟 Features

### Core Functionality
- **Member Management**: Complete CRUD operations for library members
- **Membership Plans**: Flexible plans with different durations and pricing
- **Payment Tracking**: Multiple payment modes with receipt generation
- **Attendance System**: Manual and biometric check-in/check-out
- **Dashboard**: Real-time statistics and quick actions
- **Reports**: Excel and PDF export capabilities

### Advanced Features
- **Automated Notifications**: Email and WhatsApp reminders for membership expiry
- **Biometric Integration**: Fingerprint-based attendance (with C# helper)
- **Scheduled Tasks**: Daily backups, status updates, and reminder notifications
- **QR Code Support**: Member identification via QR codes
- **Receipt Generation**: Professional PDF receipts for payments
- **Data Export**: Multiple format support (Excel, PDF) for reports

### Technical Highlights
- **Electron + React**: Modern desktop application architecture
- **SQLite Database**: Reliable local data storage with better-sqlite3
- **Security**: Bcrypt password hashing, token-based authentication
- **Cross-platform**: Supports Windows, macOS, and Linux
- **Real-time Updates**: Live dashboard statistics and notifications

### Project Structure

```
library-management/
├── 📁 src/                    # React frontend source
│   ├── 📁 components/         # Reusable components
│   ├── 📁 contexts/          # React contexts
│   ├── 📁 pages/             # Application pages
│   └── 📁 styles/            # Styling files
├── 📁 electron/              # Electron backend
│   ├── 📄 main.js           # Main process
│   ├── 📄 db.js             # Database operations
│   ├── 📄 ipcHandlers.js    # IPC handlers
│   └── 📄 library.db        # SQLite database
├── 📁 biometric-helper/      # C# biometric integration
├── 📁 scripts/              # Build & utility scripts
├── 📁 config/               # Configuration files
├── 📁 docs/                 # Documentation
├── 📁 backups/              # Database backups
└── 📁 exports/              # Generated reports
```

## 📚 Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Setup and development workflow
- [API Documentation](docs/API.md) - IPC channels and database schema
- [User Manual](docs/USER_MANUAL.md) - How to use the application

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- .NET 6.0 (for biometric integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yashrajsalunkhe/library-management.git
   cd library-management
   ```

2. **Run setup script**
   ```bash
   ./scripts/setup.sh
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development**
   ```bash
   npm run start
   ```

### Development Scripts

```bash
# Development
npm run start        # Start both Vite and Electron
npm run dev          # Start only Vite dev server
npm run electron     # Start only Electron

# Production
npm run build        # Build React frontend
npm run electron:build  # Package Electron app
./scripts/build.sh   # Complete build process

# Database
./scripts/db.sh backup    # Backup database
./scripts/db.sh restore   # Restore database
./scripts/db.sh status    # Database status

# Utilities
npm run clean        # Clean build artifacts
npm run rebuild      # Rebuild native dependencies
```

### Prerequisites
- Node.js 16+ 
- npm or yarn
- .NET 6+ (for biometric helper, optional)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd library-management
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Development Mode**
   ```bash
   # Terminal 1: Start React development server
   npm run dev

   # Terminal 2: Start Electron app
   npm run electron
   ```

4. **Production Build**
   ```bash
   npm run build
   npm run electron:build
   ```

## 📁 Project Structure

```
library-management/
├── electron/                  # Electron main process files
│   ├── main.js               # Application entry point
│   ├── preload.js            # Secure IPC bridge
│   ├── db.js                 # SQLite database setup
│   ├── ipcHandlers.js        # API handlers
│   ├── notifier.js           # Email/WhatsApp service
│   ├── scheduler.js          # Automated tasks
│   ├── reports.js            # Report generation
│   ├── biometric-bridge.js   # Biometric device integration
│   └── library.db            # SQLite database file
├── src/                      # React frontend
│   ├── components/           # Reusable UI components
│   ├── pages/                # Application pages
│   ├── contexts/             # React contexts
│   ├── styles/               # Global styles
│   └── App.jsx               # Main React component
├── biometric-helper/         # C# biometric integration
│   ├── Program.cs            # Main C# application
│   └── BiometricHelper.csproj
├── exports/                  # Generated reports and receipts
├── backups/                  # Automatic database backups
└── assets/                   # Application assets
```

## 🔧 Configuration

### Email Notifications (Optional)
Set up in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### WhatsApp Integration (Optional)
Using Gupshup API:
```env
GUPSHUP_API_KEY=your-api-key
GUPSHUP_APP_NAME=your-app-name
GUPSHUP_BASE_URL=https://api.gupshup.io/sm/api/v1
```

### Biometric Integration (Optional)
Configure the helper service:
```env
BIOMETRIC_HELPER_URL=http://localhost:5005
BIOMETRIC_HELPER_TOKEN=your-secure-token
```

## 📊 Database Schema

The application uses SQLite with the following main tables:

- **members**: Member information and membership details
- **membership_plans**: Available membership plans
- **payments**: Payment records and receipts
- **attendance**: Check-in/check-out records
- **users**: Application users (receptionists/admin)
- **notifications**: Sent notification tracking
- **settings**: Application configuration

## 🔐 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **Important**: Change the default password after first login!

## 🏗️ Biometric Integration

### Setup Instructions

1. **Ensure .NET 6+ is installed**
2. **Navigate to biometric helper**:
   ```bash
   cd biometric-helper
   dotnet run
   ```
3. **The helper will start on** `http://localhost:5005`
4. **Integrate with your biometric device SDK** by replacing the sample implementation

### API Endpoints
- `GET /api/biometric/status` - Device status
- `POST /api/biometric/start-scan` - Start scanning
- `POST /api/biometric/stop-scan` - Stop scanning
- `POST /api/biometric/enroll` - Enroll fingerprint
- `DELETE /api/biometric/fingerprint/{id}` - Delete fingerprint

## 📈 Reports and Analytics

### Available Reports
1. **Attendance Report**: Member visit frequency and timing
2. **Payment Report**: Revenue analysis and transaction history
3. **Member Report**: Complete member database with status
4. **Dashboard Analytics**: Real-time statistics and trends

### Export Formats
- **Excel (.xlsx)**: Detailed tabular data
- **PDF**: Professional formatted reports
- **Receipts**: Payment confirmation documents

## 🔄 Automated Tasks

The system runs several automated background tasks:

- **Daily 9:00 AM**: Send membership expiry reminders
- **Daily 2:00 AM**: Create database backup
- **Weekly Sunday 1:00 AM**: Cleanup old notifications
- **Hourly**: Update expired member statuses

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run electron     # Start Electron in development
npm run build        # Build for production
npm run electron:build  # Build Electron distribution
npm run rebuild      # Rebuild native dependencies
```

### Adding New Features

1. **Backend**: Add IPC handlers in `electron/ipcHandlers.js`
2. **Database**: Update schema in `electron/db.js`
3. **Frontend**: Create React components in `src/`
4. **API**: Expose methods in `electron/preload.js`

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **SQL Injection Protection**: Prepared statements
- **Local Storage**: Encrypted sensitive data
- **Token Authentication**: Secure API communication
- **Audit Trail**: All actions logged with timestamps

## 📦 Building for Distribution

### Windows
```bash
npm run electron:build
# Creates installer in dist-electron/
```

### Code Signing (Optional)
Add to `package.json`:
```json
"build": {
  "win": {
    "certificateFile": "path/to/certificate.p12",
    "certificatePassword": "password"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Better-sqlite3 compilation errors**
   ```bash
   npm run rebuild
   ```

2. **Database locked errors**
   - Ensure no other instances are running
   - Check file permissions

3. **Email notifications not working**
   - Verify SMTP settings
   - Check app-specific passwords for Gmail

4. **Biometric helper not connecting**
   - Ensure .NET runtime is installed
   - Check firewall settings for localhost:5005

### Debug Mode
Start with debugging enabled:
```bash
NODE_ENV=development npm run electron
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

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
