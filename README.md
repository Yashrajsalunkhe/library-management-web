# 📚 Libro

A modern management system for memberships, attendance tracking, payments, and daily operations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Yashrajsalunkhe/libro.git
cd libro
```

2. **Install dependencies**
```bash
npm install
npm install pg dotenv
```

3. **Setup PostgreSQL database**
```bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
CREATE DATABASE library_management;
CREATE USER library_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE library_management TO library_admin;
\q
```

4. **Configure environment**
```bash
# Create .env file
cp .env.example .env

# Edit .env with your database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=library_admin
DB_PASSWORD=your_password
```

5. **Load database schema**
```bash
psql -h localhost -U library_admin -d library_management -f library-schema.sql
psql -h localhost -U library_admin -d library_management -f create-admin-user.sql
```

6. **Start the application**
```bash
npm run dev
```

Visit `http://localhost:5173`

## 🔑 Default Login

- **Email:** admin@library.local
- **Password:** admin123

⚠️ Change this password after first login!

## ✨ Features

### Core Functionality
- 👥 **Member Management** - Add, edit, search members
- 📋 **Membership Plans** - Flexible duration and pricing
- 💰 **Payment Tracking** - Multiple payment methods
- ⏰ **Attendance System** - Check-in/check-out tracking
- 📊 **Dashboard** - Real-time statistics
- 📄 **Reports** - Excel and PDF exports

### Advanced Features
- 📧 **Email Notifications** - Membership reminders
- 🔔 **WhatsApp Integration** - Automated messages
- 👆 **Biometric Support** - Fingerprint attendance
- 📱 **QR Codes** - Member identification
- 🧾 **Receipt Generation** - Professional PDF receipts

## 📁 Project Structure

```
libro/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # State management
│   ├── pages/          # Application pages
│   ├── services/       # API services
│   ├── lib/            # Database connection
│   └── styles/         # CSS styles
├── docs/               # Documentation
├── library-schema.sql  # Database schema
├── .env               # Environment variables
└── package.json       # Dependencies
```

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Lucide Icons
- **Backend:** PostgreSQL, Node.js
- **Authentication:** bcrypt, JWT
- **Export:** ExcelJS, PDFMake
- **Notifications:** Nodemailer

## 📖 Documentation

- [User Manual](docs/USER_MANUAL.md)
- [Biometric Integration](docs/BIOMETRIC_INTEGRATION.md)
- [ZKLIB Integration](docs/ZKLIB_INTEGRATION.md)

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📝 Database Tables

- `profiles` - Admin/staff users
- `library_plans` - Membership plans
- `members` - Library members
- `books` - Book inventory
- `book_issues` - Borrowing records
- `attendance` - Check-in/out logs
- `payments` - Payment transactions
- `expenditures` - Operational costs
- `settings` - Application settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Yashraj Salunkhe**

## 🆘 Support

For issues or questions, please open an issue on GitHub.

---
