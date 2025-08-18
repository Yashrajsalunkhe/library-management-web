# User Manual

## Getting Started

### First Time Setup

1. **Launch the Application**
   - Double-click the application icon or run from command line
   - The application will open in a desktop window

2. **Initial Login**
   - Default credentials:
     - Username: `admin`
     - Password: `admin123`
   - **Important**: Change the default password after first login

3. **Configure Settings**
   - Go to Settings page
   - Update email configuration for notifications
   - Set up membership plans
   - Configure biometric integration if available

## Main Features

### Dashboard
- **Overview Statistics**: Total members, active memberships, today's attendance
- **Quick Actions**: Add new member, record payment, mark attendance
- **Recent Activities**: Latest member registrations, payments, and check-ins
- **Alerts**: Expiring memberships, pending payments

### Member Management

#### Adding New Members
1. Click "Add Member" button or navigate to Members page
2. Fill in member details:
   - Full Name (required)
   - Email address
   - Phone number
   - Emergency contact
   - Address
3. Select membership plan
4. Set join date (defaults to today)
5. Upload photo (optional)
6. Generate QR code for quick identification

#### Managing Existing Members
- **Search**: Use the search bar to find members by name, email, or phone
- **Filter**: Filter by membership status, plan type, or expiry date
- **Edit**: Click on any member to edit their details
- **Extend Membership**: Renew or extend membership duration
- **Deactivate**: Temporarily suspend member access

### Membership Plans

#### Creating Plans
1. Go to Settings → Membership Plans
2. Click "Add New Plan"
3. Enter plan details:
   - Plan name (e.g., "Monthly", "Quarterly", "Annual")
   - Duration in months
   - Price
   - Description
   - Benefits included

#### Managing Plans
- Edit existing plans
- Activate/deactivate plans
- Set default plan for new members

### Payment Management

#### Recording Payments
1. Navigate to Payments page or use Quick Actions
2. Select member (search by name or scan QR code)
3. Enter payment details:
   - Amount
   - Payment method (Cash, Card, UPI, Bank Transfer)
   - Payment date
   - Description/notes
4. Generate receipt automatically

#### Payment History
- View all payment records
- Filter by date range, member, or payment method
- Export payment reports
- Print or email receipts

### Attendance Tracking

#### Manual Check-in/Check-out
1. Go to Attendance page
2. Search for member or scan QR code
3. Click "Check In" when member arrives
4. Click "Check Out" when member leaves
5. System automatically calculates duration

#### Biometric Attendance (if configured)
1. Member places finger on biometric device
2. System automatically identifies member
3. Records check-in or check-out based on current status
4. Displays confirmation message

#### Viewing Attendance Records
- See daily attendance list
- Filter by date range or member
- Export attendance reports
- View member-wise usage statistics

### Reports and Analytics

#### Available Reports
1. **Members Report**
   - Complete member list with details
   - Membership status and expiry dates
   - Contact information

2. **Payments Report**
   - Payment history by date range
   - Revenue analysis
   - Payment method breakdown

3. **Attendance Report**
   - Daily/monthly attendance records
   - Member usage patterns
   - Popular time slots

#### Generating Reports
1. Go to Reports page
2. Select report type
3. Choose date range
4. Select export format (Excel or PDF)
5. Download or email report

### Settings and Configuration

#### General Settings
- Application preferences
- Default membership plan
- Notification settings
- Backup configuration

#### Email Configuration
- SMTP server settings
- Email templates
- Notification schedules

#### Biometric Settings
- Device configuration
- Sensitivity settings
- Backup identification methods

## Best Practices

### Daily Operations
1. **Morning Routine**
   - Check dashboard for today's activities
   - Review expiring memberships
   - Verify overnight backups

2. **Member Check-ins**
   - Verify member identity
   - Check membership status
   - Record attendance promptly

3. **End of Day**
   - Review attendance records
   - Process any pending payments
   - Create daily backup

### Data Management
- **Regular Backups**: Use automatic daily backups
- **Manual Backups**: Create backups before major changes
- **Data Cleanup**: Regularly archive old records
- **Security**: Change passwords periodically

### Troubleshooting

#### Common Issues

1. **Member Not Found**
   - Check spelling of name/phone
   - Verify member is active
   - Use partial search terms

2. **Payment Not Recording**
   - Check internet connection
   - Verify payment amount format
   - Ensure member has active membership

3. **Biometric Not Working**
   - Clean fingerprint sensor
   - Check device connection
   - Re-enroll member's fingerprint

4. **Reports Not Generating**
   - Check date range selection
   - Verify data exists for selected period
   - Try different export format

#### Getting Help
- Check error messages for specific guidance
- Review log files for technical issues
- Contact system administrator
- Refer to technical documentation

## Keyboard Shortcuts

- `Ctrl + N` - Add new member
- `Ctrl + F` - Search members
- `Ctrl + P` - Record payment
- `Ctrl + A` - Mark attendance
- `Ctrl + R` - Generate report
- `Ctrl + S` - Save current form
- `Esc` - Close current dialog
- `F5` - Refresh current page

## Security Guidelines

1. **Password Security**
   - Use strong passwords
   - Change default passwords immediately
   - Don't share login credentials

2. **Data Protection**
   - Regular backups
   - Secure storage of backup files
   - Limit access to sensitive data

3. **Physical Security**
   - Lock workstation when away
   - Secure biometric devices
   - Protect database files

4. **Regular Maintenance**
   - Update software regularly
   - Monitor system performance
   - Review access logs
