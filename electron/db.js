const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const os = require('os');

// Get user data directory - different in development vs production
const getUserDataPath = () => {
  if (process.env.NODE_ENV === 'development') {
    return __dirname;
  } else {
    // In production, use user's home directory for data storage
    if (app && app.getPath) {
      return app.getPath('userData');
    } else {
      // Fallback for when app is not available
      return path.join(os.homedir(), '.config', 'library-management');
    }
  }
};

const userDataPath = getUserDataPath();

// Ensure database directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

const dbPath = path.join(userDataPath, 'library.db');

// Copy default database if it doesn't exist
const defaultDbPath = path.join(__dirname, 'library.db');
if (!fs.existsSync(dbPath) && fs.existsSync(defaultDbPath)) {
  console.log('Copying default database to user data directory...');
  fs.copyFileSync(defaultDbPath, dbPath);
}

// Create database with explicit options to ensure write access
const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  fileMustExist: false,
  readonly: false
});

// Set pragmas for better performance and reliability
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000');
db.pragma('temp_store = memory');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Test database write access
try {
  db.prepare('CREATE TABLE IF NOT EXISTS _test_write (id INTEGER)').run();
  db.prepare('DROP TABLE IF EXISTS _test_write').run();
  console.log('Database write access verified');
} catch (error) {
  console.error('Database write access failed:', error.message);
  throw new Error(`Database is readonly or inaccessible: ${error.message}`);
}

// Create tables
const createTables = () => {
  // Membership plans table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS membership_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Members table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      birth_date TEXT,
      city TEXT,
      address TEXT,
      id_number TEXT,
      seat_no TEXT UNIQUE,
      plan_id INTEGER,
      join_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'suspended')),
      fingerprint_template BLOB,
      qr_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES membership_plans (id)
    )
  `).run();

  // Payments table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      amount REAL NOT NULL,
      mode TEXT DEFAULT 'cash' CHECK(mode IN ('cash', 'card', 'upi', 'bank_transfer')),
      plan_id INTEGER,
      note TEXT,
      receipt_number TEXT,
      paid_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE SET NULL,
      FOREIGN KEY (plan_id) REFERENCES membership_plans (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `).run();

  // Attendance table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      check_in TEXT DEFAULT CURRENT_TIMESTAMP,
      check_out TEXT,
      source TEXT DEFAULT 'manual' CHECK(source IN ('biometric', 'manual', 'card', 'qr')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
    )
  `).run();

  // Users table (for receptionists/admin)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'receptionist' CHECK(role IN ('admin', 'receptionist')),
      full_name TEXT,
      email TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    )
  `).run();

  // Notifications table (track sent notifications)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('email', 'whatsapp', 'sms')),
      subject TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
      sent_at TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
    )
  `).run();

  // Expenditures table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS expenditures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'cash' CHECK(payment_mode IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
      date TEXT NOT NULL,
      receipt_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `).run();

  // Settings table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Password change OTPs table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS password_change_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      otp TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `).run();

  // Migrate existing members table to add new columns
  try {
    // Check if new columns exist, if not add them
    const columns = db.prepare("PRAGMA table_info(members)").all();
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('birth_date')) {
      db.prepare('ALTER TABLE members ADD COLUMN birth_date TEXT').run();
    }
    if (!columnNames.includes('city')) {
      db.prepare('ALTER TABLE members ADD COLUMN city TEXT').run();
    }
    if (!columnNames.includes('seat_no')) {
      db.prepare('ALTER TABLE members ADD COLUMN seat_no TEXT UNIQUE').run();
    }
  } catch (error) {
    console.log('Migration skipped or already applied:', error.message);
  }

  // Insert default membership plans
  // Insert default admin user (password: admin123)
  const userExists = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userExists.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)').run('admin', hashedPassword, 'admin', 'System Administrator');
  }

  // Insert default settings
  const settingsExist = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsExist.count === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)');
    insertSetting.run('library_name', 'Study Room Library', 'Name of the library');
    insertSetting.run('library_address', 'Main Street, City', 'Library address');
    insertSetting.run('library_phone', '+1234567890', 'Library contact number');
    insertSetting.run('notification_days', '10', 'Days before expiry to send notifications');
    insertSetting.run('auto_backup', '1', 'Enable automatic database backup');
  }
};

// Initialize tables
createTables();

// Run migrations for existing databases
const runMigrations = () => {
  try {
    // Check if new columns exist in members table
    const tableInfo = db.prepare("PRAGMA table_info(members)").all();
    const columnNames = tableInfo.map(col => col.name);
    
    // Add missing columns one by one (without UNIQUE constraint first)
    const columnsToAdd = [
      { name: 'birth_date', sql: 'ALTER TABLE members ADD COLUMN birth_date TEXT' },
      { name: 'city', sql: 'ALTER TABLE members ADD COLUMN city TEXT' },
      { name: 'seat_no', sql: 'ALTER TABLE members ADD COLUMN seat_no TEXT' },
      { name: 'id_number', sql: 'ALTER TABLE members ADD COLUMN id_number TEXT' },
      { name: 'id_document_type', sql: 'ALTER TABLE members ADD COLUMN id_document_type TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.name)) {
        console.log(`Adding missing column: ${column.name}`);
        try {
          db.prepare(column.sql).run();
          console.log(`Successfully added column: ${column.name}`);
        } catch (error) {
          if (error.message.includes('duplicate column name')) {
            console.log(`Column ${column.name} already exists, skipping...`);
          } else {
            console.error(`Error adding column ${column.name}:`, error.message);
          }
        }
      }
    }

    // Migration to remove CASCADE DELETE from payments table
    try {
      // Check if we need to migrate payments table by looking for CASCADE or missing SET NULL constraint
      const foreignKeys = db.prepare("PRAGMA foreign_key_list(payments)").all();
      const needsMigration = foreignKeys.some(fk => fk.table === 'members' && (fk.on_delete !== 'SET NULL' || fk.notnull));
      
      if (needsMigration) {
        console.log('Migrating payments table to allow member deletion and preserve payment records...');
        // Temporarily disable foreign key checks for this migration
        const originalForeignKeys = db.pragma('foreign_keys');
        db.pragma('foreign_keys = OFF');
        
        const transaction = db.transaction(() => {
          // Step 1: Create backup table with existing data
          db.prepare(`
            CREATE TABLE payments_backup AS 
            SELECT * FROM payments
          `).run();
          
          // Step 2: Drop the old payments table
          db.prepare('DROP TABLE payments').run();
          
          // Step 3: Create new payments table with member_id nullable and ON DELETE SET NULL
          db.prepare(`
            CREATE TABLE payments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              member_id INTEGER,
              amount REAL NOT NULL,
              mode TEXT DEFAULT 'cash' CHECK(mode IN ('cash', 'card', 'upi', 'bank_transfer')),
              plan_id INTEGER,
              note TEXT,
              receipt_number TEXT,
              paid_at TEXT DEFAULT CURRENT_TIMESTAMP,
              created_by INTEGER,
              FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE SET NULL,
              FOREIGN KEY (plan_id) REFERENCES membership_plans (id),
              FOREIGN KEY (created_by) REFERENCES users (id)
            )
          `).run();
          
          // Step 4: Restore data from backup
          db.prepare(`
            INSERT INTO payments 
            SELECT * FROM payments_backup
          `).run();
          
          // Step 5: Drop backup table
          db.prepare('DROP TABLE payments_backup').run();
        });
        
        try {
          transaction();
          console.log('Successfully migrated payments table - payments will now be preserved when members are deleted and member_id will be set to NULL.');
        } finally {
          // Restore original foreign key setting
          db.pragma(`foreign_keys = ${originalForeignKeys ? 'ON' : 'OFF'}`);
        }
      } else {
        console.log('Payments table already has correct foreign key constraints');
      }
    } catch (error) {
      console.error('Error migrating payments table:', error.message);
      // If backup table exists from failed migration, clean it up
      try {
        db.prepare('DROP TABLE IF EXISTS payments_backup').run();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError.message);
      }
      // Ensure foreign keys are re-enabled
      try {
        db.pragma('foreign_keys = ON');
      } catch (pragmaError) {
        console.error('Error re-enabling foreign keys:', pragmaError.message);
      }
    }
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migrations
runMigrations();

// Helper functions for common database operations
const dbHelpers = {
  // Generic query helper
  query: (sql, params = []) => {
    try {
      return db.prepare(sql).all(params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Generic single row helper
  get: (sql, params = []) => {
    try {
      return db.prepare(sql).get(params);
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  },

  // Generic insert/update helper
  run: (sql, params = []) => {
    try {
      return db.prepare(sql).run(params);
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  },

  // Transaction helper
  transaction: (callback) => {
    const transaction = db.transaction(callback);
    return transaction();
  }
};

module.exports = { db, ...dbHelpers };
