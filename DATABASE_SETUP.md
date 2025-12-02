# Database Setup Instructions

## Overview
This project is a **Reading Room Management System** (not a book lending library). The database has been updated to match the desktop version structure.

## Important Changes Made

### 1. Schema Updates
- **Renamed**: `library_plans` → `membership_plans`
- **Removed**: `books` and `book_issues` tables (this is a reading room, not a lending library)
- **Added**: `notifications` table (for tracking email/WhatsApp/SMS notifications)
- **Added**: `password_change_otps` table (for password recovery)
- **Updated**: `members` table with additional columns:
  - `fingerprint_template` (for biometric integration)
  - `qr_code` (for QR code attendance)
  - `library_card_no` (unique library card ID)

### 2. Duration Field Change
- Changed from `duration_months` to `duration_days` for more flexibility
- Supports daily, weekly, monthly, quarterly, half-yearly, and annual plans

### 3. Initial Setup Feature
- New `/setup` route for first-time configuration
- Owner can configure:
  - Library name, address, contact details
  - Total seats available
  - Business hours
  - Receipt settings
  - Notification preferences
  - Biometric integration options

## How to Apply the Schema

### Step 1: Run the New Schema
Execute the `reading-room-schema.sql` file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the content from `reading-room-schema.sql`
5. Run the query

This will:
- Create all necessary tables
- Add indexes for performance
- Set up Row Level Security (RLS) policies
- Insert default membership plans
- Insert default settings
- Handle migration from old structure (if exists)

### Step 2: Verify Tables
After running the schema, verify these tables exist:
- ✅ `profiles` (user management)
- ✅ `membership_plans` (plan types)
- ✅ `members` (reading room members)
- ✅ `payments` (payment records)
- ✅ `expenditures` (operational costs)
- ✅ `attendance` (member visits)
- ✅ `notifications` (sent notifications)
- ✅ `settings` (library configuration)
- ✅ `password_change_otps` (password recovery)

### Step 3: First-Time Setup
1. After deploying, visit: `https://your-domain.com/setup`
2. Fill in all library details:
   - Library name and contact information
   - Complete address
   - Total seats available
   - Business hours
   - Other operational settings
3. Click "Complete Setup"
4. This only needs to be done once

## Default Membership Plans

The system comes with these pre-configured plans:

| Plan Name | Duration | Price | Description |
|-----------|----------|-------|-------------|
| Daily Reading | 1 day | ₹20.00 | Single day access |
| Weekly Reading | 7 days | ₹120.00 | One week access |
| Monthly Reading | 30 days | ₹500.00 | Monthly access |
| Student Monthly | 30 days | ₹300.00 | Student discount |
| Quarterly Reading | 90 days | ₹1,350.00 | 3 months access |
| Half Yearly | 180 days | ₹2,500.00 | 6 months access |
| Annual Reading | 365 days | ₹5,000.00 | Annual access |

You can add/modify/delete plans from the Settings page.

## Key Features

### For Owner (Admin)
- Complete dashboard overview
- Member management (add, edit, suspend, delete)
- Payment tracking and receipt generation
- Expenditure management
- Attendance monitoring
- Comprehensive reports
- Settings configuration
- Role-based access control for receptionist

### For Receptionist
- Limited access based on owner's permission settings
- Can manage members (if allowed)
- Can record payments (if allowed)
- Can mark attendance
- Cannot access sensitive settings or reports (configurable)

## Member Management Features

1. **Registration**
   - Personal details (name, phone, email, DOB, address)
   - ID document verification (Aadhaar, PAN, Voter ID, etc.)
   - Seat assignment
   - Photo upload
   - Plan selection
   - Payment recording

2. **Membership Plans**
   - Flexible duration (days-based)
   - Auto-expiry tracking
   - Renewal notifications

3. **Attendance Tracking**
   - Manual check-in/check-out
   - Biometric integration support
   - QR code scanning support
   - Attendance history

4. **Payment Management**
   - Multiple payment modes (Cash, UPI, Card, Bank Transfer)
   - Receipt generation
   - Payment history
   - Auto-generated receipt numbers

5. **Notifications**
   - Expiry reminders (configurable days before)
   - Email/WhatsApp/SMS support
   - Notification history tracking

## API Updates

The following API endpoints have been updated to use `membership_plans`:

- `api.plan.list()` - Get all plans
- `api.plan.add(planData)` - Add new plan
- `api.plan.update(planData)` - Update existing plan
- `api.plan.delete(id)` - Delete plan
- `api.member.list()` - Lists members with plan names
- `api.member.renew()` - Renewal calculations use `duration_days`

## Settings Structure

Default settings include:

```javascript
{
  library_name: '',
  library_address: '',
  library_city: '',
  library_state: '',
  library_pincode: '',
  library_phone: '',
  library_email: '',
  library_owner_name: '',
  total_seats: '0',
  notification_days: '10',
  receipt_prefix: 'RR',
  late_fee_per_day: '10',
  business_hours: '{"open": "06:00", "close": "22:00"}',
  gst_number: '',
  enable_biometric: 'false',
  enable_notifications: 'false',
  setup_completed: 'false'
}
```

## Security (RLS Policies)

- **Public**: Can view profiles
- **Authenticated**: Full access to all library management tables
- **User-specific**: Users can update their own profile only

## Next Steps

1. ✅ Run `reading-room-schema.sql` in Supabase
2. ✅ Verify all tables are created
3. ✅ Visit `/setup` to configure your library
4. ✅ Create your first admin user (if not exists)
5. ✅ Start adding members and plans

## Troubleshooting

### If migration fails:
1. Check Supabase logs for specific errors
2. Ensure you have proper permissions
3. Try running sections of the schema separately
4. Contact support if issues persist

### If old data exists:
The schema includes migration logic to:
- Rename `library_plans` to `membership_plans`
- Add missing columns to `members` table
- Preserve existing data during migration

## Notes

- This is a **reading room management system**, not a book lending library
- All book-related features have been removed
- Focus is on seat management, attendance, and membership tracking
- Duration is now in days for more flexibility
- Supports multiple payment modes and tracking
- Built-in notification system for expiry reminders
