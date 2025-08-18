#!/bin/bash

# Database management script for Library Management System

set -e  # Exit on error

DB_PATH="./electron/library.db"
BACKUP_DIR="./backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

case "$1" in
    "backup")
        echo "💾 Creating database backup..."
        mkdir -p "$BACKUP_DIR"
        cp "$DB_PATH" "$BACKUP_DIR/library-backup-$DATE.db"
        echo "✅ Backup created: $BACKUP_DIR/library-backup-$DATE.db"
        ;;
    
    "restore")
        if [ -z "$2" ]; then
            echo "❌ Please specify backup file to restore from"
            echo "Usage: ./scripts/db.sh restore <backup-file>"
            exit 1
        fi
        
        if [ ! -f "$2" ]; then
            echo "❌ Backup file not found: $2"
            exit 1
        fi
        
        echo "🔄 Restoring database from: $2"
        cp "$2" "$DB_PATH"
        echo "✅ Database restored successfully"
        ;;
    
    "migrate")
        echo "🔄 Running database migrations..."
        cd electron
        node migrate-cascade.js
        cd ..
        echo "✅ Migrations completed"
        ;;
    
    "status")
        echo "📊 Database status:"
        if [ -f "$DB_PATH" ]; then
            echo "✅ Database exists: $DB_PATH"
            echo "📏 Size: $(du -h "$DB_PATH" | cut -f1)"
            echo "📅 Modified: $(stat -f "%Sm" "$DB_PATH" 2>/dev/null || stat -c "%y" "$DB_PATH" 2>/dev/null)"
        else
            echo "❌ Database not found: $DB_PATH"
        fi
        
        echo ""
        echo "📁 Available backups:"
        if [ -d "$BACKUP_DIR" ]; then
            ls -la "$BACKUP_DIR"/*.db 2>/dev/null || echo "No backups found"
        else
            echo "No backup directory found"
        fi
        ;;
    
    "clean")
        echo "🧹 Cleaning temporary database files..."
        rm -f "$DB_PATH-shm" "$DB_PATH-wal"
        echo "✅ Temporary files cleaned"
        ;;
    
    *)
        echo "Database management script for Library Management System"
        echo ""
        echo "Usage: ./scripts/db.sh <command>"
        echo ""
        echo "Commands:"
        echo "  backup          Create a backup of the current database"
        echo "  restore <file>  Restore database from backup file"
        echo "  migrate         Run database migrations"
        echo "  status          Show database status and available backups"
        echo "  clean           Clean temporary database files"
        echo ""
        echo "Examples:"
        echo "  ./scripts/db.sh backup"
        echo "  ./scripts/db.sh restore ./backups/library-backup-2025-08-16.db"
        echo "  ./scripts/db.sh status"
        ;;
esac
