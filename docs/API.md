# API Documentation

## IPC Communication

The application uses Electron's IPC (Inter-Process Communication) to communicate between the frontend (renderer) and backend (main process).

### Available Channels

#### Authentication
- `login` - User authentication
- `logout` - User logout
- `get-user` - Get current user information

#### Members
- `get-members` - Get all members with optional filters
- `get-member` - Get specific member by ID
- `create-member` - Create new member
- `update-member` - Update existing member
- `delete-member` - Delete member
- `check-member-exists` - Check if member exists

#### Payments
- `get-payments` - Get payment records
- `create-payment` - Record new payment
- `update-payment` - Update payment record
- `delete-payment` - Delete payment record
- `generate-receipt` - Generate PDF receipt

#### Attendance
- `get-attendance` - Get attendance records
- `record-attendance` - Record check-in/check-out
- `get-active-sessions` - Get currently active sessions

#### Reports
- `generate-members-report` - Generate members report
- `generate-payments-report` - Generate payments report
- `generate-attendance-report` - Generate attendance report
- `export-to-excel` - Export data to Excel
- `export-to-pdf` - Export data to PDF

#### Dashboard
- `get-dashboard-stats` - Get dashboard statistics
- `get-recent-activities` - Get recent activities

#### Settings
- `get-settings` - Get application settings
- `update-settings` - Update application settings
- `backup-database` - Create database backup
- `restore-database` - Restore from backup

### Request/Response Format

All IPC communications follow this format:

#### Request
```javascript
// From renderer process
window.electronAPI.invoke('channel-name', {
  param1: 'value1',
  param2: 'value2'
})
```

#### Response
```javascript
// Success response
{
  success: true,
  data: { /* response data */ },
  message: 'Operation completed successfully'
}

// Error response
{
  success: false,
  error: 'Error message',
  details: { /* additional error details */ }
}
```

### Example Usage

#### Get All Members
```javascript
const response = await window.electronAPI.invoke('get-members', {
  page: 1,
  limit: 50,
  search: 'john',
  status: 'active'
});

if (response.success) {
  console.log('Members:', response.data.members);
  console.log('Total:', response.data.total);
} else {
  console.error('Error:', response.error);
}
```

#### Create New Member
```javascript
const memberData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  planId: 1,
  joinDate: '2025-08-16'
};

const response = await window.electronAPI.invoke('create-member', memberData);

if (response.success) {
  console.log('Member created:', response.data);
} else {
  console.error('Error:', response.error);
}
```

#### Record Payment
```javascript
const paymentData = {
  memberId: 123,
  amount: 100.00,
  paymentMode: 'cash',
  description: 'Monthly membership fee',
  receiptNumber: 'RCP-001'
};

const response = await window.electronAPI.invoke('create-payment', paymentData);
```

## Database Schema

### Tables

#### members
- `id` - Primary key
- `name` - Member name
- `email` - Email address
- `phone` - Phone number
- `plan_id` - Reference to membership_plans
- `join_date` - Join date
- `expiry_date` - Membership expiry date
- `status` - Member status (active, inactive, expired)
- `qr_code` - QR code for identification
- `biometric_id` - Biometric identifier
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

#### membership_plans
- `id` - Primary key
- `name` - Plan name
- `duration_months` - Duration in months
- `price` - Plan price
- `description` - Plan description
- `is_active` - Plan status

#### payments
- `id` - Primary key
- `member_id` - Reference to members
- `amount` - Payment amount
- `payment_mode` - Payment method (cash, card, upi, etc.)
- `payment_date` - Payment date
- `receipt_number` - Receipt number
- `description` - Payment description
- `created_at` - Creation timestamp

#### attendance
- `id` - Primary key
- `member_id` - Reference to members
- `check_in` - Check-in timestamp
- `check_out` - Check-out timestamp
- `date` - Attendance date
- `duration_minutes` - Session duration

#### users
- `id` - Primary key
- `username` - Username
- `password_hash` - Hashed password
- `role` - User role (admin, staff)
- `created_at` - Creation timestamp

### Relations

- `members.plan_id` → `membership_plans.id`
- `payments.member_id` → `members.id`
- `attendance.member_id` → `members.id`
