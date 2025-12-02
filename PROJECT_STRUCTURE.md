# 📁 Project Structure

```
library-management/
│
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/               # React components
│   │   ├── BiometricEnrollment.jsx
│   │   ├── BiometricStatus.jsx
│   │   ├── Layout.jsx
│   │   ├── LoginPage.jsx
│   │   └── NotificationContainer.jsx
│   │
│   ├── 📁 contexts/                 # React context providers
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── 📁 pages/                    # Application pages
│   │   ├── Dashboard.jsx
│   │   ├── Members.jsx
│   │   ├── Attendance.jsx
│   │   ├── Payments.jsx
│   │   ├── Expenditures.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   │
│   ├── 📁 services/                 # API services
│   │   └── api.js
│   │
│   ├── 📁 lib/                      # Utilities & database
│   │   └── supabase.js
│   │
│   ├── 📁 styles/                   # Stylesheets
│   │   └── globals.css
│   │
│   ├── App.jsx                      # Main app component
│   └── main.jsx                     # App entry point
│
├── 📁 docs/                         # Documentation
│   ├── USER_MANUAL.md
│   ├── BIOMETRIC_INTEGRATION.md
│   └── ZKLIB_INTEGRATION.md
│
├── 📁 dist/                         # Production build (auto-generated)
├── 📁 node_modules/                 # Dependencies (auto-generated)
│
├── 📄 index.html                    # HTML entry point
├── 📄 vite.config.js               # Vite configuration
├── 📄 package.json                  # Project metadata & dependencies
├── 📄 package-lock.json            # Locked dependency versions
│
├── 📄 library-schema.sql           # PostgreSQL database schema
├── 📄 create-admin-user.sql        # Admin user setup script
│
├── 📄 .env                          # Environment variables (local)
├── 📄 .env.example                  # Environment template
├── �� .gitignore                    # Git ignore rules
│
├── 📄 README.md                     # Main documentation
├── 📄 LICENSE                       # ISC License
└── 📄 PROJECT_STRUCTURE.md         # This file

```

## 🎯 Key Directories

### `/src` - Frontend Application
Contains all React components, pages, and frontend logic.

### `/docs` - Documentation
User guides and technical documentation.

### `/dist` - Production Build
Generated when running `npm run build`. Deploy this folder.

## 📝 Important Files

- **`library-schema.sql`** - Database structure definition
- **`create-admin-user.sql`** - Initial admin setup
- **`.env`** - Local configuration (not in git)
- **`.env.example`** - Configuration template
- **`vite.config.js`** - Build tool configuration

## 🚀 Development Workflow

1. Edit files in `/src`
2. Run `npm run dev` for live preview
3. Build with `npm run build`
4. Deploy `/dist` folder

## 📦 Dependencies Location

- Runtime dependencies → `node_modules/`
- Dependency list → `package.json`
- Locked versions → `package-lock.json`

---

**Note:** Files like `node_modules/` and `dist/` are auto-generated and should not be edited manually.
