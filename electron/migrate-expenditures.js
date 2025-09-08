const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');
const db = new Database(dbPath, { 
  verbose: console.log,
  fileMustExist: false,
  readonly: false
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Running expenditures table migration...');

try {
  // Check if expenditures table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='expenditures'").all();
  
  if (tables.length === 0) {
    console.log('Creating expenditures table...');
    
    // Create expenditures table
    db.prepare(`
      CREATE TABLE expenditures (
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
    
    console.log('Expenditures table created successfully!');
  } else {
    console.log('Expenditures table already exists.');
    
    // Check table structure
    const columns = db.prepare("PRAGMA table_info(expenditures)").all();
    const columnNames = columns.map(col => col.name);
    console.log('Expenditures table columns:', columnNames);
    
    // Check if we need to migrate the old structure to new structure
    const hasOldStructure = columnNames.includes('title') && columnNames.includes('bill_date');
    const hasNewStructure = columnNames.includes('description') && columnNames.includes('date');
    
    if (hasOldStructure && !hasNewStructure) {
      console.log('Migrating old expenditures table structure to new structure...');
      
      // Disable foreign keys temporarily for migration
      db.pragma('foreign_keys = OFF');
      
      const transaction = db.transaction(() => {
        // Step 1: Create backup
        db.prepare('CREATE TABLE expenditures_backup AS SELECT * FROM expenditures').run();
        
        // Step 2: Drop old table
        db.prepare('DROP TABLE expenditures').run();
        
        // Step 3: Create new table with correct structure
        db.prepare(`
          CREATE TABLE expenditures (
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
        
        // Step 4: Migrate data from backup (map old columns to new ones)
        const oldData = db.prepare('SELECT * FROM expenditures_backup').all();
        
        if (oldData.length > 0) {
          const insertStmt = db.prepare(`
            INSERT INTO expenditures (
              id, description, category, amount, payment_mode, date, notes, created_at, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          for (const row of oldData) {
            insertStmt.run(
              row.id,
              row.title || row.description || 'Migrated Expense',
              row.category || 'Other',
              row.amount || 0,
              row.payment_mode || 'cash',
              row.bill_date || row.date || new Date().toISOString().split('T')[0],
              row.description || row.notes || null,
              row.created_at || new Date().toISOString(),
              row.created_by || 1
            );
          }
          
          console.log(`Migrated ${oldData.length} existing records.`);
        }
        
        // Step 5: Drop backup table
        db.prepare('DROP TABLE expenditures_backup').run();
      });
      
      try {
        transaction();
        console.log('Migration completed successfully!');
      } finally {
        // Re-enable foreign keys
        db.pragma('foreign_keys = ON');
      }
    } else if (hasNewStructure) {
      console.log('Table already has the correct structure.');
    } else {
      console.log('Unable to determine table structure, may need manual migration.');
    }
  }
  
  // Verify we can query the table
  const count = db.prepare('SELECT COUNT(*) as count FROM expenditures').get();
  console.log(`Expenditures table has ${count.count} records.`);
  
  // Show final table structure
  const finalColumns = db.prepare("PRAGMA table_info(expenditures)").all();
  console.log('Final table structure:', finalColumns.map(col => `${col.name}(${col.type})`));
  
  console.log('Migration completed successfully!');
  
} catch (error) {
  console.error('Migration failed:', error);
} finally {
  db.close();
}
