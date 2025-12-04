# Database Schema Fix Guide

## Problem Identified

When deleting a member, payment records were also being deleted due to improper foreign key constraints. This is a critical issue for accounting and financial tracking.

## Root Cause

The `payments` table had a foreign key reference to `members` table without specifying the `ON DELETE` behavior, which defaults to `CASCADE` in some configurations. This caused payment records to be deleted when their associated member was deleted.

## Solution

We've created three approaches to fix this issue:

### Option 1: Quick Fix (Recommended for Existing Database)

Use the `fix-payment-cascade.sql` script to fix only the problematic constraint:

```sql
-- Run this in Supabase SQL Editor
\i fix-payment-cascade.sql
```

**What it does:**
- Drops the existing foreign key constraint on `payments.member_id`
- Recreates it with `ON DELETE SET NULL`
- Preserves all existing data
- Adds performance indexes
- Safe to run multiple times

### Option 2: Full Schema Migration (For New Setup or Complete Rebuild)

Use the `optimized-schema.sql` for a complete database setup with all optimizations:

```sql
-- Run this in Supabase SQL Editor (WARNING: Will recreate all tables)
\i optimized-schema.sql
```

**What it includes:**
- Proper foreign key constraints with appropriate ON DELETE behaviors
- Comprehensive indexes for better performance
- Data validation constraints
- Automatic triggers for timestamp updates
- Row-level security policies
- Sample data

## Foreign Key Strategies Explained

### ON DELETE SET NULL (Used for Payments)
```sql
member_id BIGINT REFERENCES members(id) ON DELETE SET NULL
```
- **When to use:** For historical/audit data that should be preserved
- **Example:** Payment records, transaction logs
- **Result:** When member is deleted, `member_id` becomes NULL but payment record remains

### ON DELETE CASCADE (Used for Attendance)
```sql
member_id BIGINT REFERENCES members(id) ON DELETE CASCADE
```
- **When to use:** For dependent data with no standalone value
- **Example:** Attendance records, notifications
- **Result:** When member is deleted, all related records are also deleted

### ON DELETE RESTRICT (Used for Plans)
```sql
plan_id BIGINT REFERENCES membership_plans(id) ON DELETE RESTRICT
```
- **When to use:** To prevent deletion of referenced records
- **Example:** Membership plans that are in use
- **Result:** Cannot delete a plan if members are using it

## Key Improvements in Optimized Schema

### 1. **Payment Preservation**
```sql
member_id BIGINT REFERENCES members(id) ON DELETE SET NULL
```
Payments are preserved for accounting even when members are deleted.

### 2. **Performance Indexes**
```sql
CREATE INDEX idx_payments_member_date ON payments(member_id, payment_date DESC);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, check_in DESC);
```
Faster queries for common operations.

### 3. **Data Integrity Constraints**
```sql
CHECK (amount >= 0)
CHECK (end_date IS NULL OR end_date >= join_date)
CHECK (available_copies <= total_copies)
```
Prevents invalid data from being inserted.

### 4. **Automatic Timestamp Updates**
```sql
CREATE TRIGGER update_members_updated_at 
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
Automatically tracks when records are modified.

## How to Apply the Fix

### Step-by-step Instructions:

1. **Backup your data first!**
   ```sql
   -- Export your current data
   SELECT * FROM payments INTO payments_backup;
   SELECT * FROM members INTO members_backup;
   ```

2. **Run the quick fix script:**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Copy contents of `fix-payment-cascade.sql`
   - Click "Run"

3. **Verify the fix:**
   ```sql
   -- Check the constraint
   SELECT 
     conname AS constraint_name,
     pg_get_constraintdef(oid) AS definition
   FROM pg_constraint
   WHERE conname = 'payments_member_id_fkey';
   ```
   
   You should see `ON DELETE SET NULL` in the definition.

4. **Test with a dummy member:**
   ```sql
   -- Create test member
   INSERT INTO members (name, phone) 
   VALUES ('Test Member', '1234567890') 
   RETURNING id;
   
   -- Create test payment (use the returned id)
   INSERT INTO payments (member_id, amount, payment_method) 
   VALUES (123, 100.00, 'cash');
   
   -- Delete the member
   DELETE FROM members WHERE id = 123;
   
   -- Check if payment still exists (member_id should be NULL)
   SELECT * FROM payments WHERE amount = 100.00;
   ```

## Database Structure Overview

### Core Tables
1. **profiles** - User authentication and roles
2. **membership_plans** - Subscription plans
3. **members** - Library members
4. **payments** - Payment records (NOW PRESERVED)
5. **attendance** - Member check-in/out
6. **expenditures** - Library expenses

### Optional Tables
7. **books** - Book inventory
8. **book_issues** - Book lending records
9. **notifications** - Member notifications
10. **settings** - Application settings

## Best Practices Going Forward

1. **Always specify ON DELETE behavior** when creating foreign keys
2. **Use SET NULL** for historical/financial data
3. **Use CASCADE** only for truly dependent data
4. **Use RESTRICT** to prevent accidental deletions
5. **Add indexes** on foreign keys and frequently queried columns
6. **Use CHECK constraints** to validate data at the database level
7. **Enable triggers** for automatic timestamp management

## Verification Queries

### Check all foreign key constraints:
```sql
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

### Check existing indexes:
```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Migration Checklist

- [ ] Backup current database
- [ ] Run fix-payment-cascade.sql
- [ ] Verify constraints are updated
- [ ] Test member deletion doesn't delete payments
- [ ] Check application still works correctly
- [ ] Monitor performance improvements
- [ ] Update application code if needed (handle NULL member_ids)

## Support

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify you have proper permissions
3. Ensure no active transactions are blocking the constraint changes
4. Contact database administrator if problems persist

---

**Created:** December 4, 2025
**Last Updated:** December 4, 2025
**Version:** 1.0
