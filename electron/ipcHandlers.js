const { db, query, get, run, transaction } = require('./db');
const bcrypt = require('bcryptjs');
const { format, addDays, parseISO } = require('date-fns');
const fs = require('fs');
const path = require('path');
const ReportsService = require('./reports');

// Create a reports service instance to generate receipts/reports
const reports = new ReportsService();

// Helper function to check if current time is within operating hours
const isTimeWithinOperatingHours = (currentTime, operatingHours) => {
  if (!operatingHours || !currentTime) return true;

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentMinutes = timeToMinutes(currentTime);
  
  // Check day shift
  const dayOpenMinutes = timeToMinutes(operatingHours.dayShift.openTime);
  const dayCloseMinutes = timeToMinutes(operatingHours.dayShift.closeTime);
  
  if (dayOpenMinutes <= dayCloseMinutes) {
    // Normal day shift (e.g., 8:00 to 18:00)
    if (currentMinutes >= dayOpenMinutes && currentMinutes <= dayCloseMinutes) {
      return true;
    }
  } else {
    // Overnight day shift (e.g., 22:00 to 06:00)
    if (currentMinutes >= dayOpenMinutes || currentMinutes <= dayCloseMinutes) {
      return true;
    }
  }

  // Check night shift if enabled
  if (operatingHours.enableNightShift) {
    const nightOpenMinutes = timeToMinutes(operatingHours.nightShift.openTime);
    const nightCloseMinutes = timeToMinutes(operatingHours.nightShift.closeTime);
    
    if (nightOpenMinutes <= nightCloseMinutes) {
      // Normal night shift
      if (currentMinutes >= nightOpenMinutes && currentMinutes <= nightCloseMinutes) {
        return true;
      }
    } else {
      // Overnight night shift
      if (currentMinutes >= nightOpenMinutes || currentMinutes <= nightCloseMinutes) {
        return true;
      }
    }
  }

  return false;
};

module.exports = (ipcMain) => {
  // ===================
  // AUTHENTICATION
  // ===================
  
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      const user = get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username]);
      
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Update last login
      run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.full_name
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // Password change OTP generation
  ipcMain.handle('auth:request-password-change-otp', async (event, { currentPassword, userId }) => {
    try {
      // Get the specific user by ID, fallback to any active user for backward compatibility
      const user = userId 
        ? get('SELECT * FROM users WHERE id = ? AND is_active = 1', [userId])
        : get('SELECT * FROM users WHERE is_active = 1 LIMIT 1');
      
      if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Store OTP in database or memory (for simplicity, using a table)
      run(`
        INSERT OR REPLACE INTO password_change_otps (user_id, otp, expires_at, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [user.id, otp, expiryTime.toISOString()]);

      // Get user email from settings or user table
      const emailSetting = get('SELECT value FROM settings WHERE key = ?', ['general.email']);
      const userEmail = user.email || emailSetting?.value;

      if (!userEmail) {
        return { success: false, message: 'No email address configured for OTP delivery' };
      }

      // Send OTP via email using the notification service
      const NotificationService = require('./notifier');
      const notifier = new NotificationService();
      
      const emailResult = await notifier.sendEmail({
        to: userEmail,
        subject: 'Password Change Verification - Library Management System',
        text: `Your OTP for password change is: ${otp}. This OTP will expire in 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Change Verification</h2>
            <p>You have requested to change your password. Please use the following OTP to complete the process:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 5 minutes.</strong></p>
            <p>If you did not request this password change, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">This is an automated message from Library Management System.</p>
          </div>
        `
      });

      if (emailResult.success) {
        return { success: true, message: 'OTP sent to your email address' };
      } else {
        return { success: false, message: 'Failed to send OTP email' };
      }
    } catch (error) {
      console.error('Password change OTP error:', error);
      return { success: false, message: 'Failed to generate OTP' };
    }
  });

  // Password change with OTP verification
  ipcMain.handle('auth:change-password', async (event, { currentPassword, newPassword, otp, userId }) => {
    try {
      // Get the specific user by ID, fallback to any active user for backward compatibility
      const user = userId 
        ? get('SELECT * FROM users WHERE id = ? AND is_active = 1', [userId])
        : get('SELECT * FROM users WHERE is_active = 1 LIMIT 1');
      
      if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Verify OTP
      const otpRecord = get(`
        SELECT * FROM password_change_otps 
        WHERE user_id = ? AND otp = ? AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC LIMIT 1
      `, [user.id, otp]);

      if (!otpRecord) {
        return { success: false, message: 'Invalid or expired OTP' };
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = bcrypt.hashSync(newPassword, saltRounds);

      // Update password
      run('UPDATE users SET password_hash = ? WHERE id = ?', 
        [newPasswordHash, user.id]);

      // Remove used OTP
      run('DELETE FROM password_change_otps WHERE user_id = ?', [user.id]);

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  });

  // ===================
  // MEMBERS MANAGEMENT
  // ===================
  
  ipcMain.handle('member:add', async (event, member) => {
    try {
      const result = transaction(() => {
        // Get total seats from settings
        const totalSeatsRecord = get('SELECT value FROM settings WHERE key = ?', ['general.totalSeats']);
        const totalSeats = totalSeatsRecord ? parseInt(totalSeatsRecord.value) : 50; // Default to 50 if not set
        
        // Generate QR code data
        const qrData = `LMS-${Date.now()}`;
        
        // Auto-assign seat number if not provided
        let seatNo = member.seatNo;
        if (!seatNo) {
          // Find next available seat number
          const existingSeats = query('SELECT seat_no FROM members WHERE seat_no IS NOT NULL ORDER BY CAST(seat_no AS INTEGER)');
          const seatNumbers = existingSeats.map(s => parseInt(s.seat_no)).filter(n => !isNaN(n));
          
          let nextSeat = 1;
          for (let i = 0; i < seatNumbers.length; i++) {
            if (seatNumbers[i] !== nextSeat) {
              break;
            }
            nextSeat++;
          }
          
          // Check if next seat exceeds total seats
          if (nextSeat > totalSeats) {
            throw new Error(`Cannot allocate seat. All ${totalSeats} seats are occupied.`);
          }
          
          seatNo = nextSeat.toString();
        } else {
          // Validate manually entered seat number
          const seatNumber = parseInt(seatNo.trim());
          
          // Check if seat number is valid
          if (isNaN(seatNumber) || seatNumber <= 0) {
            throw new Error('Seat number must be a positive number');
          }
          
          // Check if seat number exceeds total seats
          if (seatNumber > totalSeats) {
            throw new Error(`Seat number cannot exceed total seats (${totalSeats})`);
          }
          
          const existingMember = get('SELECT id FROM members WHERE seat_no = ?', [seatNo.trim()]);
          if (existingMember) {
            throw new Error(`Seat number ${seatNo} is already taken`);
          }
        }
        
        // Handle case where no plan is assigned - use dummy dates that will be updated when plan is assigned
        const joinDate = member.joinDate || '1900-01-01';
        const endDate = member.endDate || '1900-01-01';
        
        const info = run(`
          INSERT INTO members (name, email, phone, birth_date, city, address, id_number, id_document_type, seat_no, plan_id, join_date, end_date, qr_code)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          member.name,
          member.email,
          member.phone,
          member.birthDate,
          member.city,
          member.address,
          member.idNumber,
          member.idDocumentType,
          seatNo,
          member.planId,
          joinDate,
          endDate,
          qrData
        ]);

        return { id: info.lastInsertRowid, qrCode: qrData, seatNo };
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:getNextSeatNumber', async (event) => {
    try {
      // Get total seats from settings - use the raw value as stored
      const totalSeatsRecord = get('SELECT value FROM settings WHERE key = ?', ['general.totalSeats']);
      console.log('Total seats record from DB (raw value):', totalSeatsRecord ? totalSeatsRecord.value : 'null', 
                  'Type:', totalSeatsRecord ? typeof totalSeatsRecord.value : 'N/A');
                  
      // Parse to integer, using the exact string value
      const totalSeatsStr = totalSeatsRecord ? totalSeatsRecord.value : '50'; // Default to '50' if not set
      const totalSeats = parseInt(totalSeatsStr, 10);
      console.log('Using total seats value:', totalSeatsStr, '→', totalSeats);
      
      const existingSeats = query('SELECT seat_no FROM members WHERE seat_no IS NOT NULL ORDER BY CAST(seat_no AS INTEGER)');
      const seatNumbers = existingSeats.map(s => parseInt(s.seat_no, 10)).filter(n => !isNaN(n));
      
      let nextSeat = 1;
      for (let i = 0; i < seatNumbers.length; i++) {
        if (seatNumbers[i] !== nextSeat) {
          break;
        }
        nextSeat++;
      }
      
      // Check if next seat exceeds total seats
      if (nextSeat > totalSeats) {
        return { 
          success: false, 
          message: `All seats are occupied. Total available seats: ${totalSeats}` 
        };
      }
      
      return { success: true, data: nextSeat.toString() };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:validateSeatNumber', async (event, { seatNo, memberId = null }) => {
    try {
      if (!seatNo || seatNo.trim() === '') {
        return { success: true, available: true };
      }

      const seatNumber = parseInt(seatNo.trim());
      
      // Check if seat number is valid (positive integer)
      if (isNaN(seatNumber) || seatNumber <= 0) {
        return { 
          success: true, 
          available: false,
          message: 'Seat number must be a positive number'
        };
      }

      // Get total seats from settings
      const totalSeatsRecord = get('SELECT value FROM settings WHERE key = ?', ['general.totalSeats']);
      const totalSeats = totalSeatsRecord ? parseInt(totalSeatsRecord.value) : 50; // Default to 50 if not set
      
      // Check if seat number exceeds total seats
      if (seatNumber > totalSeats) {
        return { 
          success: true, 
          available: false,
          message: `Seat number cannot exceed total seats (${totalSeats})`
        };
      }

      let sql = 'SELECT id FROM members WHERE seat_no = ?';
      const params = [seatNo.trim()];
      
      // If editing an existing member, exclude their current seat
      if (memberId) {
        sql += ' AND id != ?';
        params.push(memberId);
      }
      
      const existingMember = get(sql, params);
      
      return { 
        success: true, 
        available: !existingMember,
        message: existingMember ? `Seat number ${seatNo} is already taken` : null
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:getSeatStats', async (event) => {
    try {
      // Get total seats from settings
      const totalSeatsRecord = get('SELECT value FROM settings WHERE key = ?', ['general.totalSeats']);
      const totalSeats = totalSeatsRecord ? parseInt(totalSeatsRecord.value) : 50;
      
      // Count occupied seats (active members with seat numbers)
      const occupiedSeatsResult = get('SELECT COUNT(*) as count FROM members WHERE seat_no IS NOT NULL AND seat_no != "" AND status = "active"');
      const occupiedSeats = occupiedSeatsResult ? occupiedSeatsResult.count : 0;
      
      // Calculate available seats
      const availableSeats = Math.max(0, totalSeats - occupiedSeats);
      
      // Calculate utilization percentage
      const utilizationPercentage = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
      
      return { 
        success: true, 
        data: {
          totalSeats,
          occupiedSeats,
          availableSeats,
          utilizationPercentage
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:list', async (event, filters = {}) => {
    try {
      let sql = `
        SELECT m.*, mp.name as plan_name, mp.price as plan_price
        FROM members m
        LEFT JOIN membership_plans mp ON m.plan_id = mp.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        sql += ' AND m.status = ?';
        params.push(filters.status);
      }

      if (filters.search) {
        sql += ' AND (m.name LIKE ? OR m.email LIKE ? OR m.phone LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      sql += ' ORDER BY m.created_at DESC';

      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }

      const members = query(sql, params);
      return { success: true, data: members };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:get', async (event, id) => {
    try {
      const member = get(`
        SELECT m.*, mp.name as plan_name, mp.price as plan_price, mp.duration_days
        FROM members m
        LEFT JOIN membership_plans mp ON m.plan_id = mp.id
        WHERE m.id = ?
      `, [id]);

      if (!member) {
        return { success: false, message: 'Member not found' };
      }

      return { success: true, data: member };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:update', async (event, { id, ...updates }) => {
    try {
      // Validate seat number if it's being updated
      if (updates.seatNo !== undefined && updates.seatNo !== null && updates.seatNo.trim() !== '') {
        const existingMember = get('SELECT id FROM members WHERE seat_no = ? AND id != ?', [updates.seatNo.trim(), id]);
        if (existingMember) {
          return { success: false, message: `Seat number ${updates.seatNo} is already taken` };
        }
      }

      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(id);

      run(`UPDATE members SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:delete', async (event, id) => {
    try {
      // Get current member status
      const member = get('SELECT status FROM members WHERE id = ?', [id]);
      if (!member) {
        return { success: false, message: 'Member not found' };
      }
      
      // Toggle status between suspended and active
      const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
      run('UPDATE members SET status = ? WHERE id = ?', [newStatus, id]);
      
      return { success: true, message: `Member ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:permanentDelete', async (event, id) => {
    try {
      // Get member details before deletion
      const member = get('SELECT * FROM members WHERE id = ?', [id]);
      if (!member) {
        return { success: false, message: 'Member not found' };
      }
      
      // Only allow permanent deletion of suspended members
      if (member.status !== 'suspended') {
        return { success: false, message: 'Only suspended members can be permanently deleted' };
      }

      // Keep foreign keys enabled so ON DELETE SET NULL works properly
      const result = transaction(() => {
        // Delete related records in order (but keep payments)
        // Delete notifications (these have CASCADE)
        const notificationsDeleted = run('DELETE FROM notifications WHERE member_id = ?', [id]);
        console.log(`Deleted ${notificationsDeleted.changes} notifications for member ${id}`);
        
        // Delete attendance records (these have CASCADE)
        const attendanceDeleted = run('DELETE FROM attendance WHERE member_id = ?', [id]);
        console.log(`Deleted ${attendanceDeleted.changes} attendance records for member ${id}`);
        
        // Check payment records before deletion (these should be preserved with member_id set to NULL)
        const paymentCount = get('SELECT COUNT(*) as count FROM payments WHERE member_id = ?', [id]);
        console.log(`Member ${id} has ${paymentCount.count} payment records that will be preserved`);
        
        // Delete the member - this will trigger ON DELETE SET NULL for payments
        const memberDeleted = run('DELETE FROM members WHERE id = ?', [id]);
        console.log(`Deleted member ${id}, affected rows: ${memberDeleted.changes}`);
        
        // Verify payment records are preserved with NULL member_id
        const preservedPayments = get('SELECT COUNT(*) as count FROM payments WHERE member_id IS NULL');
        console.log(`Total payment records with NULL member_id: ${preservedPayments.count}`);
        
        if (memberDeleted.changes === 0) {
          throw new Error('Member not found or could not be deleted');
        }
        
        return { 
          success: true, 
          message: `Member permanently deleted successfully. ${paymentCount.count} payment records have been preserved with member_id set to NULL.` 
        };
      });
      
      return result;
      
    } catch (error) {
      console.error('Error during member deletion:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('member:renew', async (event, { memberId, planId, paymentDetails }) => {
    try {
      const result = transaction(() => {
        // Get current member and new plan details
        const member = get('SELECT * FROM members WHERE id = ?', [memberId]);
        const plan = get('SELECT * FROM membership_plans WHERE id = ?', [planId]);
        
        if (!member || !plan) {
          throw new Error('Member or plan not found');
        }

        // Check if this is the first plan assignment (dummy date indicates no plan)
        const isFirstPlan = !member.plan_id || member.join_date === '1900-01-01';
        
        let newEndDate;
        let joinDate;
        
        if (isFirstPlan) {
          // For first plan assignment, start from today
          joinDate = format(new Date(), 'yyyy-MM-dd');
          newEndDate = addDays(new Date(), plan.duration_days);
        } else {
          // For renewals, extend from current end date or today, whichever is later
          const currentEndDate = new Date(member.end_date);
          const today = new Date();
          const startDate = currentEndDate > today ? currentEndDate : today;
          newEndDate = addDays(startDate, plan.duration_days);
          joinDate = member.join_date; // Keep existing join date
        }

        // Update member
        run(`
          UPDATE members 
          SET plan_id = ?, join_date = ?, end_date = ?, status = 'active', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [planId, joinDate, format(newEndDate, 'yyyy-MM-dd'), memberId]);

        // Add payment record
        const receiptNumber = `RCP-${Date.now()}`;
        const paymentInfo = run(`
          INSERT INTO payments (member_id, amount, mode, plan_id, note, receipt_number)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          memberId,
          plan.price,
          paymentDetails.mode,
          planId,
          paymentDetails.note || (isFirstPlan ? 'New membership plan' : 'Membership renewal'),
          receiptNumber
        ]);

        return { 
          paymentId: paymentInfo.lastInsertRowid,
          newEndDate: format(newEndDate, 'yyyy-MM-dd'),
          joinDate: joinDate,
          isFirstPlan: isFirstPlan,
          receiptNumber: receiptNumber,
          member: member,
          plan: plan
        };
      });

      // Send payment confirmation email if member has an email
      if (result.member.email) {
        try {
          const NotificationService = require('./notifier');
          const notifier = new NotificationService();
          
          // Wait a moment for the service to initialize
          await new Promise(resolve => setTimeout(resolve, 500));

          const emailSubject = result.isFirstPlan ? 
            `Welcome to our Library - Membership Activated` : 
            `Membership Renewed Successfully - ${result.member.name}`;
          
          const emailText = `
Dear ${result.member.name},

${result.isFirstPlan ? 'Welcome to our library! Your membership has been activated.' : 'Your membership has been successfully renewed.'}

Payment Details:
- Amount: ₹${result.plan.price}
- Plan: ${result.plan.name}
- Valid until: ${result.newEndDate}
- Receipt Number: ${result.receiptNumber}
- Payment Mode: ${paymentDetails.mode}

Thank you for your payment!
Library Management Team
          `;

          const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">${result.isFirstPlan ? 'Welcome to Our Library!' : 'Membership Renewed Successfully'}</h2>
  <p>Dear <strong>${result.member.name}</strong>,</p>
  
  <p>${result.isFirstPlan ? 'Welcome to our library! Your membership has been activated.' : 'Your membership has been successfully renewed.'}</p>
  
  <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #155724;">Payment Details</h3>
    <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${result.plan.price}</p>
    <p style="margin: 5px 0;"><strong>Plan:</strong> ${result.plan.name}</p>
    <p style="margin: 5px 0;"><strong>Valid until:</strong> ${result.newEndDate}</p>
    <p style="margin: 5px 0;"><strong>Receipt Number:</strong> ${result.receiptNumber}</p>
    <p style="margin: 5px 0;"><strong>Payment Mode:</strong> ${paymentDetails.mode}</p>
  </div>
  
  <p>Thank you for your payment!</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #666; font-size: 12px;">Library Management Team</p>
</div>
          `;

          await notifier.sendEmail({
            to: result.member.email,
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
            memberId: result.member.id
          });

          console.log(`Payment confirmation email sent to ${result.member.email}`);
        } catch (emailError) {
          console.warn('Failed to send payment confirmation email:', emailError.message);
          // Don't fail the entire operation if email fails
        }
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ===================
  // MEMBERSHIP PLANS
  // ===================
  
  ipcMain.handle('plan:list', async () => {
    try {
      const plans = query('SELECT * FROM membership_plans ORDER BY created_at DESC');
      return { success: true, data: plans };
    } catch (error) {
      console.error('List plans error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('plan:add', async (event, plan) => {
    try {
      const info = run(`
        INSERT INTO membership_plans (name, duration_days, price, description)
        VALUES (?, ?, ?, ?)
      `, [plan.name, plan.duration_days, plan.price, plan.description]);

      return { success: true, data: { id: info.lastInsertRowid } };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('plan:update', async (event, planId, plan) => {
    try {
      run(`
        UPDATE membership_plans 
        SET name = ?, duration_days = ?, price = ?, description = ?
        WHERE id = ?
      `, [plan.name, plan.duration_days, plan.price, plan.description, planId]);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('plan:delete', async (event, planId) => {
    try {
      run(`DELETE FROM membership_plans WHERE id = ?`, [planId]);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ===================
  // PAYMENTS
  // ===================
  
  ipcMain.handle('payment:add', async (event, payment) => {
    try {
      const info = run(`
        INSERT INTO payments (member_id, amount, mode, note, receipt_number)
        VALUES (?, ?, ?, ?, ?)
      `, [
        payment.memberId,
        payment.amount,
        payment.mode,
        payment.note,
        payment.receiptNumber || `RCP-${Date.now()}`
      ]);

      const paymentId = info.lastInsertRowid;

      // Attempt to generate a PDF receipt for this payment.
      try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileName = `receipt-${paymentId}-${timestamp}.pdf`;
        const outputPath = path.join(__dirname, '..', 'exports', 'receipts', fileName);

        // Ensure receipts directory exists
        const receiptsDir = path.dirname(outputPath);
        if (!fs.existsSync(receiptsDir)) {
          fs.mkdirSync(receiptsDir, { recursive: true });
        }

        const receiptResult = await reports.generatePaymentReceiptPdf(paymentId, outputPath);

        return {
          success: true,
          data: {
            id: paymentId,
            receipt: receiptResult.success ? receiptResult.path : null,
            receiptError: receiptResult.success ? null : receiptResult.error
          }
        };
      } catch (receiptError) {
        // Payment was successfully recorded but receipt generation failed
        return {
          success: true,
          data: {
            id: paymentId,
            receipt: null,
            receiptError: receiptError.message || String(receiptError)
          }
        };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('payment:list', async (event, filters = {}) => {
    try {
      let sql = `
        SELECT p.*, m.name as member_name, mp.name as plan_name
        FROM payments p
        LEFT JOIN members m ON p.member_id = m.id
        LEFT JOIN membership_plans mp ON p.plan_id = mp.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.memberId) {
        sql += ' AND p.member_id = ?';
        params.push(filters.memberId);
      }

      if (filters.search) {
        sql += ' AND (COALESCE(m.name, "") LIKE ? OR COALESCE(m.email, "") LIKE ? OR COALESCE(m.phone, "") LIKE ? OR p.receipt_number LIKE ? OR (m.name IS NULL AND ? LIKE "%deleted%"))';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, filters.search.toLowerCase());
      }

      if (filters.mode) {
        sql += ' AND p.mode = ?';
        params.push(filters.mode);
      }

      if (filters.dateFrom) {
        sql += ' AND DATE(p.paid_at) >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        sql += ' AND DATE(p.paid_at) <= ?';
        params.push(filters.dateTo);
      }

      if (filters.planId) {
        sql += ' AND p.plan_id = ?';
        params.push(parseInt(filters.planId));
      }

      sql += ' ORDER BY p.paid_at DESC';

      const payments = query(sql, params);
      return { success: true, data: payments };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ===================
  // ATTENDANCE
  // ===================
  
  ipcMain.handle('attendance:checkin', async (event, { memberId, source = 'manual' }) => {
    try {
      // Get operating hours from settings
      const operatingHoursSettings = query('SELECT value FROM settings WHERE key = ?', ['general.operatingHours']);
      let operatingHours = null;
      
      if (operatingHoursSettings.length > 0) {
        try {
          operatingHours = JSON.parse(operatingHoursSettings[0].value);
        } catch (e) {
          console.log('Could not parse operating hours settings');
        }
      }

      // Validate operating hours if configured
      if (operatingHours && source === 'manual') {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const isWithinHours = isTimeWithinOperatingHours(currentTime, operatingHours);

        if (!isWithinHours) {
          return { 
            success: false, 
            message: 'Check-in not allowed outside operating hours. Please contact administration.' 
          };
        }
      }

      // Check if already checked in today
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingEntry = get(`
        SELECT * FROM attendance 
        WHERE member_id = ? AND DATE(check_in) = ? AND check_out IS NULL
      `, [memberId, today]);

      if (existingEntry) {
        return { success: false, message: 'Already checked in today' };
      }

      const info = run(`
        INSERT INTO attendance (member_id, source)
        VALUES (?, ?)
      `, [memberId, source]);

      return { success: true, data: { id: info.lastInsertRowid } };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('attendance:checkout', async (event, { memberId }) => {
    try {
      // Get operating hours from settings
      const operatingHoursSettings = query('SELECT value FROM settings WHERE key = ?', ['general.operatingHours']);
      let operatingHours = null;
      
      if (operatingHoursSettings.length > 0) {
        try {
          operatingHours = JSON.parse(operatingHoursSettings[0].value);
        } catch (e) {
          console.log('Could not parse operating hours settings');
        }
      }

      // Validate operating hours if configured (allow checkout during any time, but warn)
      if (operatingHours) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const isWithinHours = isTimeWithinOperatingHours(currentTime, operatingHours);

        if (!isWithinHours) {
          console.log('Check-out performed outside operating hours for member:', memberId);
        }
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const result = run(`
        UPDATE attendance 
        SET check_out = CURRENT_TIMESTAMP 
        WHERE member_id = ? AND DATE(check_in) = ? AND check_out IS NULL
      `, [memberId, today]);

      if (result.changes === 0) {
        return { success: false, message: 'No active check-in found for today' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('attendance:list', async (event, filters = {}) => {
    try {
      let sql = `
        SELECT a.*, m.name as member_name
        FROM attendance a
        JOIN members m ON a.member_id = m.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.date) {
        sql += ' AND DATE(a.check_in) = ?';
        params.push(filters.date);
      }

      if (filters.memberId) {
        sql += ' AND a.member_id = ?';
        params.push(filters.memberId);
      }

      if (filters.source) {
        sql += ' AND a.source = ?';
        params.push(filters.source);
      }

      if (filters.dateFrom) {
        sql += ' AND DATE(a.check_in) >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        sql += ' AND DATE(a.check_in) <= ?';
        params.push(filters.dateTo);
      }

      sql += ' ORDER BY a.check_in DESC';

      const attendance = query(sql, params);
      return { success: true, data: attendance };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('attendance:add', async (event, attendanceData) => {
    try {
      const { memberId, checkIn, checkOut, source = 'manual' } = attendanceData;
      
      if (!memberId) {
        return { success: false, message: 'Member ID is required' };
      }

      let sql = `INSERT INTO attendance (member_id, source`;
      let params = [memberId, source];
      let values = `?, ?`;

      if (checkIn) {
        sql += `, check_in`;
        values += `, ?`;
        params.push(checkIn);
      }

      if (checkOut) {
        sql += `, check_out`;
        values += `, ?`;
        params.push(checkOut);
      }

      sql += `) VALUES (${values})`;

      const info = run(sql, params);
      return { success: true, data: { id: info.lastInsertRowid } };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('attendance:today', async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const attendance = query(`
        SELECT a.*, m.name as member_name, m.phone
        FROM attendance a
        JOIN members m ON a.member_id = m.id
        WHERE DATE(a.check_in) = ?
        ORDER BY a.check_in DESC
      `, [today]);

      return { success: true, data: attendance };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ===================
  // DASHBOARD STATS
  // ===================
  
  ipcMain.handle('dashboard:stats', async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const thisMonth = format(new Date(), 'yyyy-MM');
      
      // Get payment statistics
      const todayIncome = get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(paid_at) = ?', [today])?.total || 0;
      const monthlyIncome = get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime(\'%Y-%m\', paid_at) = ?', [thisMonth])?.total || 0;
      
      // Get expenditure statistics
      const todayExpenditure = get('SELECT COALESCE(SUM(amount), 0) as total FROM expenditures WHERE DATE(date) = ?', [today])?.total || 0;
      const monthlyExpenditure = get('SELECT COALESCE(SUM(amount), 0) as total FROM expenditures WHERE strftime(\'%Y-%m\', date) = ?', [thisMonth])?.total || 0;
      const totalExpenditure = get('SELECT COALESCE(SUM(amount), 0) as total FROM expenditures')?.total || 0;
      
      const stats = {
        totalMembers: get('SELECT COUNT(*) as count FROM members WHERE status = ?', ['active'])?.count || 0,
        todayAttendance: get('SELECT COUNT(*) as count FROM attendance WHERE DATE(check_in) = ?', [today])?.count || 0,
        todayIncome: todayIncome,
        todayExpenditure: todayExpenditure,
        totalExpenditure: totalExpenditure,
        todayNetIncome: todayIncome - todayExpenditure,
        monthlyIncome: monthlyIncome,
        monthlyExpenditure: monthlyExpenditure,
        monthlyNetIncome: monthlyIncome - monthlyExpenditure,
        expiringMembers: get(`
          SELECT COUNT(*) as count FROM members 
          WHERE status = ? AND DATE(end_date) <= DATE('now', '+10 days')
        `, ['active'])?.count || 0
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // ===================
  // REPORTS
  // ===================
  
  ipcMain.handle('report:attendance', async (event, { dateFrom, dateTo }) => {
    try {
      console.log('Fetching attendance report from', dateFrom, 'to', dateTo);
      
      // Validate date inputs
      if (!dateFrom || !dateTo) {
        return { success: false, message: 'Date range is required' };
      }
      
      // Ensure proper date format (YYYY-MM-DD)
      const fromDate = new Date(dateFrom).toISOString().slice(0, 10);
      const toDate = new Date(dateTo).toISOString().slice(0, 10);
      
      const attendance = query(`
        SELECT 
          a.id,
          a.member_id,
          m.name as member_name,
          m.phone,
          DATE(a.check_in) as date,
          a.check_in as original_check_in,
          a.check_out as original_check_out,
          TIME(a.check_in) as check_in,
          TIME(a.check_out) as check_out,
          a.source,
          CASE 
            WHEN a.check_out IS NOT NULL THEN 'Completed'
            ELSE 'In Progress'
          END as status,
          CASE 
            WHEN a.check_out IS NOT NULL THEN 
              printf('%d hours %d mins', 
                (strftime('%s', a.check_out) - strftime('%s', a.check_in)) / 3600,
                ((strftime('%s', a.check_out) - strftime('%s', a.check_in)) % 3600) / 60
              )
            ELSE NULL
          END as duration
        FROM attendance a
        JOIN members m ON a.member_id = m.id
        WHERE DATE(a.check_in) BETWEEN ? AND ?
        ORDER BY a.check_in DESC
      `, [fromDate, toDate]);

      console.log('Found', attendance.length, 'attendance records');
      return { success: true, data: attendance };
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('report:payments', async (event, { dateFrom, dateTo }) => {
    try {
      console.log('Fetching payments report from', dateFrom, 'to', dateTo);
      
      // Validate date inputs
      if (!dateFrom || !dateTo) {
        return { success: false, message: 'Date range is required' };
      }
      
      // Ensure proper date format (YYYY-MM-DD)
      const fromDate = new Date(dateFrom).toISOString().slice(0, 10);
      const toDate = new Date(dateTo).toISOString().slice(0, 10);
      
      const payments = query(`
        SELECT 
          p.id,
          p.member_id,
          p.amount,
          p.mode as payment_method,
          p.note,
          p.receipt_number,
          p.paid_at as payment_date,
          m.name as member_name,
          mp.name as plan_name,
          'Paid' as status
        FROM payments p
        JOIN members m ON p.member_id = m.id
        LEFT JOIN membership_plans mp ON p.plan_id = mp.id
        WHERE DATE(p.paid_at) BETWEEN ? AND ?
        ORDER BY p.paid_at DESC
      `, [fromDate, toDate]);

      console.log('Found', payments.length, 'payment records');
      return { success: true, data: payments };
    } catch (error) {
      console.error('Error fetching payments report:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('report:expenditures', async (event, { dateFrom, dateTo }) => {
    try {
      console.log('Fetching expenditures report from', dateFrom, 'to', dateTo);
      
      // Validate date inputs
      if (!dateFrom || !dateTo) {
        return { success: false, message: 'Date range is required' };
      }
      
      // Ensure proper date format (YYYY-MM-DD)
      const fromDate = new Date(dateFrom).toISOString().slice(0, 10);
      const toDate = new Date(dateTo).toISOString().slice(0, 10);
      
      const expenditures = query(`
        SELECT 
          e.id,
          e.description,
          e.category,
          e.amount,
          e.payment_mode,
          e.receipt_number,
          e.date as expenditure_date,
          e.notes,
          e.created_at,
          u.full_name as created_by_name
        FROM expenditures e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE DATE(e.date) BETWEEN ? AND ?
        ORDER BY e.date DESC, e.created_at DESC
      `, [fromDate, toDate]);

      console.log('Found', expenditures.length, 'expenditure records');
      return { success: true, data: expenditures };
    } catch (error) {
      console.error('Error fetching expenditures report:', error);
      return { success: false, message: error.message };
    }
  });

  // Generate receipt on demand
  ipcMain.handle('report:generate-receipt', async (event, { paymentId }) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const fileName = `receipt-${paymentId}-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '..', 'exports', 'receipts', fileName);

      // Ensure receipts directory exists
      const receiptsDir = path.dirname(outputPath);
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const result = await reports.generatePaymentReceiptPdf(paymentId, outputPath);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Download (save as) receipt - opens a save dialog and writes PDF to chosen path
  const { dialog } = require('electron');
  ipcMain.handle('report:download-receipt', async (event, { paymentId }) => {
    try {
      console.log('report:download-receipt invoked for paymentId:', paymentId);
      const defaultFileName = `receipt-${paymentId}.pdf`;
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save Receipt',
        defaultPath: defaultFileName,
        filters: [
          { name: 'PDF', extensions: ['pdf'] }
        ]
      });

      console.log('Save dialog result - canceled:', canceled, 'filePath:', filePath);
      if (canceled || !filePath) {
        console.log('User canceled save dialog');
        return { success: false, message: 'Save canceled by user' };
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      console.log('Generating receipt at:', filePath);
      const result = await reports.generatePaymentReceiptPdf(paymentId, filePath);
      console.log('Receipt generation result:', result && (result.success ? 'success' : result.error || 'failed'));
      if (result.success) {
        try {
          const { shell } = require('electron');
          // Show the file in the system file manager
          shell.showItemInFolder(filePath);
        } catch (e) {
          console.error('Failed to show file in folder:', e);
        }
        return { success: true, path: filePath };
      }
      return { success: false, error: result.error || 'Failed to generate receipt' };
    } catch (error) {
      console.error('report:download-receipt error:', error);
      return { success: false, error: error.message };
    }
  });

  // ===================
  // SETTINGS
  // ===================
  
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = query('SELECT * FROM settings');
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return { success: true, data: settingsObj };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('settings:update', async (event, settings) => {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);

      transaction(() => {
        Object.entries(settings).forEach(([key, value]) => {
          stmt.run(key, value);
        });
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('report:export', async (event, { type, format, dateRange, data }) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const { shell } = require('electron');
      
      console.log('Export request:', { type, format, dateRange, dataLength: data?.length });
      
      if (!data || data.length === 0) {
        return { success: false, message: `No ${type} data available for the selected date range` };
      }
      
      // Create exports directory if it doesn't exist
      const exportsDir = path.join(__dirname, '..', 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const dateRangeStr = dateRange ? `_${dateRange.from}_to_${dateRange.to}` : '';
      const filename = `${type}_report${dateRangeStr}_${timestamp}.${format}`;
      const filepath = path.join(exportsDir, filename);

      if (format === 'xlsx') {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`);
        
        // Set workbook properties
        workbook.creator = 'Library Management System';
        workbook.created = new Date();
        
        // Add title and date range info
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        
        if (dateRange) {
          worksheet.mergeCells('A2:F2');
          worksheet.getCell('A2').value = `Period: ${dateRange.from} to ${dateRange.to}`;
          worksheet.getCell('A2').font = { size: 12 };
          worksheet.getCell('A2').alignment = { horizontal: 'center' };
        }
        
        // Add empty row
        worksheet.addRow([]);
        const headerRowIndex = dateRange ? 4 : 3;
        
        switch (type) {
          case 'attendance':
            // Set headers starting from the appropriate row
            const headers = ['Date', 'Member', 'Phone', 'Check In', 'Check Out', 'Duration', 'Status'];
            worksheet.getRow(headerRowIndex).values = headers;
            
            data.forEach(record => {
              const date = record.date || (record.original_check_in ? new Date(record.original_check_in).toISOString().slice(0, 10) : '');
              const checkInTime = record.check_in || '';
              const checkOutTime = record.check_out || '';
              const duration = record.duration || '';
              const status = record.status || 'In Progress';
              
              worksheet.addRow([
                date,
                record.member_name || '',
                record.phone || '',
                checkInTime,
                checkOutTime === '' ? 'Active' : checkOutTime,
                duration,
                status
              ]);
            });
            
            // Set column widths
            worksheet.columns = [
              { width: 12 }, // Date
              { width: 20 }, // Member
              { width: 15 }, // Phone
              { width: 12 }, // Check In
              { width: 12 }, // Check Out
              { width: 15 }, // Duration
              { width: 12 }  // Status
            ];
            break;
            
          case 'payments':
            // Set headers
            const paymentHeaders = ['Date', 'Receipt #', 'Member', 'Amount (₹)', 'Mode', 'Plan', 'Note'];
            worksheet.getRow(headerRowIndex).values = paymentHeaders;
            
            data.forEach(payment => {
              const paymentDate = payment.payment_date || payment.paid_at;
              const date = paymentDate ? new Date(paymentDate).toISOString().slice(0, 10) : '';
              
              worksheet.addRow([
                date,
                payment.receipt_number || '',
                payment.member_name || '',
                payment.amount || 0,
                (payment.payment_method || payment.mode || '').charAt(0).toUpperCase() + (payment.payment_method || payment.mode || '').slice(1),
                payment.plan_name || '',
                payment.note || ''
              ]);
            });
            
            // Set column widths
            worksheet.columns = [
              { width: 12 }, // Date
              { width: 15 }, // Receipt
              { width: 20 }, // Member
              { width: 12 }, // Amount
              { width: 12 }, // Mode
              { width: 15 }, // Plan
              { width: 25 }  // Note
            ];
            
            // Format amount column as currency
            const amountColumn = worksheet.getColumn(4);
            amountColumn.numFmt = '₹#,##0.00';
            break;
            
          case 'expenditures':
            // Set headers
            const expenditureHeaders = ['Date', 'Description', 'Category', 'Amount (₹)', 'Payment Mode', 'Receipt #', 'Notes', 'Created By'];
            worksheet.getRow(headerRowIndex).values = expenditureHeaders;
            
            data.forEach(expenditure => {
              const expenditureDate = expenditure.expenditure_date || expenditure.date;
              const date = expenditureDate ? new Date(expenditureDate).toISOString().slice(0, 10) : '';
              
              worksheet.addRow([
                date,
                expenditure.description || '',
                expenditure.category || '',
                expenditure.amount || 0,
                (expenditure.payment_mode || '').charAt(0).toUpperCase() + (expenditure.payment_mode || '').slice(1),
                expenditure.receipt_number || '',
                expenditure.notes || '',
                expenditure.created_by_name || ''
              ]);
            });
            
            // Set column widths
            worksheet.columns = [
              { width: 12 }, // Date
              { width: 25 }, // Description
              { width: 15 }, // Category
              { width: 12 }, // Amount
              { width: 15 }, // Payment Mode
              { width: 15 }, // Receipt #
              { width: 30 }, // Notes
              { width: 15 }  // Created By
            ];
            
            // Format amount column as currency
            const expenditureAmountColumn = worksheet.getColumn(4);
            expenditureAmountColumn.numFmt = '₹#,##0.00';
            break;
            
          case 'members':
            // Set headers
            const memberHeaders = ['Name', 'Email', 'Phone', 'Plan', 'Join Date', 'End Date', 'Status'];
            worksheet.getRow(headerRowIndex).values = memberHeaders;
            
            data.forEach(member => {
              const joinDate = member.join_date ? new Date(member.join_date).toISOString().slice(0, 10) : '';
              const endDate = member.end_date ? new Date(member.end_date).toISOString().slice(0, 10) : '';
              
              worksheet.addRow([
                member.name || '',
                member.email || '',
                member.phone || '',
                member.plan_name || member.plan || '',
                joinDate,
                endDate,
                (member.status || '').charAt(0).toUpperCase() + (member.status || '').slice(1)
              ]);
            });
            
            // Set column widths
            worksheet.columns = [
              { width: 20 }, // Name
              { width: 25 }, // Email
              { width: 15 }, // Phone
              { width: 15 }, // Plan
              { width: 12 }, // Join Date
              { width: 12 }, // End Date
              { width: 10 }  // Status
            ];
            break;
        }
        
        // Style the header row
        const headerRow = worksheet.getRow(headerRowIndex);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6F3FF' }
        };
        
        // Add borders to all cells with data
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber >= headerRowIndex) {
            row.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
          }
        });
        
        await workbook.xlsx.writeFile(filepath);
        
      } else if (format === 'csv') {
        let csvContent = '';
        
        switch (type) {
          case 'attendance':
            csvContent = 'Date,Member,Phone,Check In,Check Out,Duration,Status\n';
            data.forEach(record => {
              const date = record.date || (record.original_check_in ? new Date(record.original_check_in).toISOString().slice(0, 10) : '');
              const checkInTime = record.check_in || '';
              const checkOutTime = record.check_out || '';
              const duration = record.duration || '';
              const status = record.status || 'In Progress';
              
              // Escape quotes in data and wrap in quotes
              const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
              
              csvContent += `${escapeCsv(date)},${escapeCsv(record.member_name)},${escapeCsv(record.phone)},${escapeCsv(checkInTime)},${escapeCsv(checkOutTime === '' ? 'Active' : checkOutTime)},${escapeCsv(duration)},${escapeCsv(status)}\n`;
            });
            break;
            
          case 'payments':
            csvContent = 'Date,Receipt #,Member,Amount,Mode,Plan,Note\n';
            data.forEach(payment => {
              const paymentDate = payment.payment_date || payment.paid_at;
              const date = paymentDate ? new Date(paymentDate).toISOString().slice(0, 10) : '';
              const mode = payment.payment_method || payment.mode || '';
              
              // Escape quotes in data and wrap in quotes
              const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
              
              csvContent += `${escapeCsv(date)},${escapeCsv(payment.receipt_number)},${escapeCsv(payment.member_name)},${escapeCsv(payment.amount)},${escapeCsv(mode)},${escapeCsv(payment.plan_name)},${escapeCsv(payment.note)}\n`;
            });
            break;
            
          case 'members':
            csvContent = 'Name,Email,Phone,Plan,Join Date,End Date,Status\n';
            data.forEach(member => {
              const joinDate = member.join_date ? new Date(member.join_date).toISOString().slice(0, 10) : '';
              const endDate = member.end_date ? new Date(member.end_date).toISOString().slice(0, 10) : '';
              
              // Escape quotes in data and wrap in quotes
              const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
              
              csvContent += `${escapeCsv(member.name)},${escapeCsv(member.email)},${escapeCsv(member.phone)},${escapeCsv(member.plan_name || member.plan)},${escapeCsv(joinDate)},${escapeCsv(endDate)},${escapeCsv(member.status)}\n`;
            });
            break;
            
          case 'expenditures':
            csvContent = 'Date,Description,Category,Amount,Payment Mode,Receipt #,Notes,Created By\n';
            data.forEach(expenditure => {
              const expenditureDate = expenditure.expenditure_date || expenditure.date;
              const date = expenditureDate ? new Date(expenditureDate).toISOString().slice(0, 10) : '';
              
              // Escape quotes in data and wrap in quotes
              const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
              
              csvContent += `${escapeCsv(date)},${escapeCsv(expenditure.description)},${escapeCsv(expenditure.category)},${escapeCsv(expenditure.amount)},${escapeCsv(expenditure.payment_mode)},${escapeCsv(expenditure.receipt_number)},${escapeCsv(expenditure.notes)},${escapeCsv(expenditure.created_by_name)}\n`;
            });
            break;
        }
        
        fs.writeFileSync(filepath, csvContent, 'utf8');
      }

      // Open the exports folder
      shell.showItemInFolder(filepath);
      
      return { 
        success: true, 
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully!`,
        filename,
        filepath,
        recordCount: data.length
      };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, message: `Export failed: ${error.message}` };
    }
  });

  // ===================
  // SETTINGS MANAGEMENT
  // ===================
  
  ipcMain.handle('settings:getSettings', async (event) => {
    try {
      const settings = query('SELECT * FROM settings');
      const settingsObj = {};
      
      settings.forEach(setting => {
        const [category, key] = setting.key.split('.');
        if (!settingsObj[category]) {
          settingsObj[category] = {};
        }
        
        // Special handling for totalSeats - keep the exact raw value from DB
        if (category === 'general' && key === 'totalSeats') {
          console.log('Retrieved totalSeats from DB (raw value):', setting.value, 'Type:', typeof setting.value);
          // Use the exact value as stored in the database without any conversion
          settingsObj[category][key] = setting.value;
          return; // Skip the regular processing below
        }
        
        // Parse JSON values or use string values
        try {
          settingsObj[category][key] = JSON.parse(setting.value);
        } catch {
          settingsObj[category][key] = setting.value;
        }
      });
      
      // Log the total seats value we're returning
      if (settingsObj.general && settingsObj.general.totalSeats !== undefined) {
        console.log('Returning totalSeats to frontend:', settingsObj.general.totalSeats, 
                    'Type:', typeof settingsObj.general.totalSeats);
      }
      
      return { success: true, settings: settingsObj };
    } catch (error) {
      console.error('Get settings error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('settings:saveSettings', async (event, settings) => {
    try {
      // Log the incoming totalSeats value for debugging
      if (settings.general && settings.general.totalSeats !== undefined) {
        console.log('Saving totalSeats (raw value):', settings.general.totalSeats, 
                    'Type:', typeof settings.general.totalSeats);
        
        // IMPORTANT: Do not convert or modify the totalSeats value at all
        // Keep exactly what was sent from the frontend
      }
      
      transaction(() => {
        // Clear existing settings
        run('DELETE FROM settings');
        
        // Insert new settings
        Object.keys(settings).forEach(category => {
          Object.keys(settings[category]).forEach(key => {
            const settingKey = `${category}.${key}`;
            const value = typeof settings[category][key] === 'object' 
              ? JSON.stringify(settings[category][key])
              : settings[category][key].toString();
            
            // Log when saving totalSeats
            if (category === 'general' && key === 'totalSeats') {
              console.log('Inserting totalSeats into DB:', value, 'Type:', typeof value);
            }
            
            run('INSERT INTO settings (key, value) VALUES (?, ?)', [settingKey, value]);
          });
        });
      });
      
      return { success: true, message: 'Settings saved successfully' };
    } catch (error) {
      console.error('Save settings error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('settings:applySystemWide', async (event, settings) => {
    try {
      // Apply operating hours validation to attendance system
      if (settings.general?.operatingHours) {
        console.log('Operating hours updated:', settings.general.operatingHours);
        // This will be used by attendance check-in/check-out validation
      }

      // Custom payment plans are now managed entirely through settings.payment.customPlans
      // No more automatic creation or updates to membership_plans table

      // Apply total seats configuration
      if (settings.general?.totalSeats) {
        console.log('Total seats updated:', settings.general.totalSeats);
        // This will be used for seat allocation validation
      }

      // Apply holidays to the system
      if (settings.general?.holidays) {
        console.log('Holidays updated:', settings.general.holidays.length, 'holidays');
        // This will be used in booking and attendance modules
      }

      // Apply notification settings
      if (settings.notifications?.paymentReminderDays) {
        console.log('Payment reminder days updated:', settings.notifications.paymentReminderDays);
        // This will be used by the notification service
      }

      return { success: true, message: 'Settings applied system-wide successfully' };
    } catch (error) {
      console.error('Apply system-wide settings error:', error);
      return { success: false, message: error.message };
    }
  });

  // ===================
  // BACKUP MANAGEMENT
  // ===================
  
  ipcMain.handle('backup:createBackup', async (event) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const backupDir = path.join(__dirname, '..', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Create timestamp with both date and time to avoid collisions
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFile = path.join(backupDir, `library-backup-${timestamp}.db`);
      const dbFile = path.join(__dirname, 'library.db');
      
      // Check if database file exists
      if (!fs.existsSync(dbFile)) {
        return { success: false, message: 'Database file not found. Cannot create backup.' };
      }
      
      // Ensure database connections are closed before backup
      if (db) {
        // Checkpoint the WAL file to main database
        try {
          await new Promise((resolve, reject) => {
            db.run('PRAGMA wal_checkpoint(TRUNCATE)', (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (checkpointError) {
          console.warn('WAL checkpoint warning:', checkpointError);
        }
      }
      
      // Copy database file
      fs.copyFileSync(dbFile, backupFile);
      
      // Copy WAL and SHM files if they exist
      const walFile = dbFile + '-wal';
      const shmFile = dbFile + '-shm';
      
      if (fs.existsSync(walFile)) {
        fs.copyFileSync(walFile, backupFile + '-wal');
      }
      if (fs.existsSync(shmFile)) {
        fs.copyFileSync(shmFile, backupFile + '-shm');
      }
      
      return { 
        success: true, 
        message: 'Backup created successfully', 
        filepath: backupFile,
        timestamp: timestamp
      };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, message: `Failed to create backup: ${error.message}` };
    }
  });

  ipcMain.handle('backup:listBackups', async (event) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const backupDir = path.join(__dirname, '..', 'backups');
      
      if (!fs.existsSync(backupDir)) {
        return { success: true, backups: [] };
      }
      
      const files = fs.readdirSync(backupDir);
      const backups = files
        .filter(file => file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.mtime,
            sizeFormatted: formatFileSize(stats.size)
          };
        })
        .sort((a, b) => b.created - a.created); // Sort by creation date, newest first
      
      return { success: true, backups };
    } catch (error) {
      console.error('List backups error:', error);
      return { success: false, message: `Failed to list backups: ${error.message}` };
    }
  });

  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  ipcMain.handle('backup:restoreSpecificBackup', async (event, backupPath) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Validate backup file exists and is readable
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Selected backup file does not exist' };
      }
      
      // Check if backup file is a valid SQLite database
      try {
        const stats = fs.statSync(backupPath);
        if (stats.size === 0) {
          return { success: false, message: 'Selected backup file is empty' };
        }
      } catch (statsError) {
        return { success: false, message: 'Cannot read backup file properties' };
      }
      
      const dbFile = path.join(__dirname, 'library.db');
      
      // Close current database connection before restore
      if (db) {
        try {
          await new Promise((resolve, reject) => {
            db.close((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (closeError) {
          console.warn('Database close warning:', closeError);
        }
      }
      
      // Create backup of current database before restore
      const currentBackupFile = path.join(path.dirname(dbFile), 
        `library-backup-before-restore-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`);
      
      if (fs.existsSync(dbFile)) {
        try {
          fs.copyFileSync(dbFile, currentBackupFile);
        } catch (backupCurrentError) {
          console.warn('Could not backup current database:', backupCurrentError);
        }
      }
      
      // Copy backup file to database location
      fs.copyFileSync(backupPath, dbFile);
      
      // Also restore WAL and SHM files if they exist with the backup
      const backupWalFile = backupPath + '-wal';
      const backupShmFile = backupPath + '-shm';
      const dbWalFile = dbFile + '-wal';
      const dbShmFile = dbFile + '-shm';
      
      // Remove existing WAL and SHM files
      if (fs.existsSync(dbWalFile)) {
        fs.unlinkSync(dbWalFile);
      }
      if (fs.existsSync(dbShmFile)) {
        fs.unlinkSync(dbShmFile);
      }
      
      // Copy backup WAL and SHM files if they exist
      if (fs.existsSync(backupWalFile)) {
        fs.copyFileSync(backupWalFile, dbWalFile);
      }
      if (fs.existsSync(backupShmFile)) {
        fs.copyFileSync(backupShmFile, dbShmFile);
      }
      
      // Reinitialize database connection
      await initDatabase();
      
      return { 
        success: true, 
        message: 'Backup restored successfully. Application will restart to ensure all data is properly loaded.',
        requiresRestart: true
      };
    } catch (error) {
      console.error('Restore specific backup error:', error);
      return { success: false, message: `Failed to restore backup: ${error.message}` };
    }
  });

  ipcMain.handle('backup:deleteBackup', async (event, backupPath) => {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Validate backup file exists
      if (!fs.existsSync(backupPath)) {
        return { success: false, message: 'Backup file does not exist' };
      }
      
      // Ensure the backup is in the backups directory for security
      const backupDir = path.join(__dirname, '..', 'backups');
      const normalizedBackupPath = path.resolve(backupPath);
      const normalizedBackupDir = path.resolve(backupDir);
      
      if (!normalizedBackupPath.startsWith(normalizedBackupDir)) {
        return { success: false, message: 'Invalid backup file location' };
      }
      
      // Delete the backup file
      fs.unlinkSync(backupPath);
      
      // Also delete associated WAL and SHM files if they exist
      const walFile = backupPath + '-wal';
      const shmFile = backupPath + '-shm';
      
      if (fs.existsSync(walFile)) {
        fs.unlinkSync(walFile);
      }
      if (fs.existsSync(shmFile)) {
        fs.unlinkSync(shmFile);
      }
      
      return { success: true, message: 'Backup deleted successfully' };
    } catch (error) {
      console.error('Delete backup error:', error);
      return { success: false, message: `Failed to delete backup: ${error.message}` };
    }
  });

  ipcMain.handle('backup:restoreBackup', async (event) => {
    try {
      const { dialog } = require('electron');
      const fs = require('fs');
      const path = require('path');
      
      // Show file dialog to select backup file
      const result = await dialog.showOpenDialog({
        title: 'Select Backup File',
        defaultPath: path.join(__dirname, '..', 'backups'),
        filters: [{ name: 'Database Files', extensions: ['db'] }],
        properties: ['openFile']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const backupFile = result.filePaths[0];
        const dbFile = path.join(__dirname, 'library.db');
        
        // Validate backup file exists and is readable
        if (!fs.existsSync(backupFile)) {
          return { success: false, message: 'Selected backup file does not exist' };
        }
        
        // Check if backup file is a valid SQLite database
        try {
          const stats = fs.statSync(backupFile);
          if (stats.size === 0) {
            return { success: false, message: 'Selected backup file is empty' };
          }
        } catch (statsError) {
          return { success: false, message: 'Cannot read backup file properties' };
        }
        
        // Close current database connection before restore
        if (db) {
          try {
            await new Promise((resolve, reject) => {
              db.close((err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } catch (closeError) {
            console.warn('Database close warning:', closeError);
          }
        }
        
        // Create backup of current database before restore
        const currentBackupFile = path.join(path.dirname(dbFile), 
          `library-backup-before-restore-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`);
        
        if (fs.existsSync(dbFile)) {
          try {
            fs.copyFileSync(dbFile, currentBackupFile);
          } catch (backupCurrentError) {
            console.warn('Could not backup current database:', backupCurrentError);
          }
        }
        
        // Copy backup file to database location
        fs.copyFileSync(backupFile, dbFile);
        
        // Also restore WAL and SHM files if they exist with the backup
        const backupWalFile = backupFile + '-wal';
        const backupShmFile = backupFile + '-shm';
        const dbWalFile = dbFile + '-wal';
        const dbShmFile = dbFile + '-shm';
        
        // Remove existing WAL and SHM files
        if (fs.existsSync(dbWalFile)) {
          fs.unlinkSync(dbWalFile);
        }
        if (fs.existsSync(dbShmFile)) {
          fs.unlinkSync(dbShmFile);
        }
        
        // Copy backup WAL and SHM files if they exist
        if (fs.existsSync(backupWalFile)) {
          fs.copyFileSync(backupWalFile, dbWalFile);
        }
        if (fs.existsSync(backupShmFile)) {
          fs.copyFileSync(backupShmFile, dbShmFile);
        }
        
        // Reinitialize database connection
        await initDatabase();
        
        return { 
          success: true, 
          message: 'Backup restored successfully. Application will restart to ensure all data is properly loaded.',
          requiresRestart: true
        };
      }
      
      return { success: false, message: 'No backup file selected' };
    } catch (error) {
      console.error('Restore backup error:', error);
      return { success: false, message: `Failed to restore backup: ${error.message}` };
    }
  });

  // ===================
  // DATA EXPORT
  // ===================
  
  ipcMain.handle('data:exportData', async (event) => {
    try {
      const { dialog, shell } = require('electron');
      const fs = require('fs');
      const path = require('path');
      
      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Data',
        defaultPath: 'library-data-export.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });
      
      if (!result.canceled) {
        // Export all data
        const exportData = {
          members: query('SELECT * FROM members'),
          plans: query('SELECT * FROM plans'),
          payments: query('SELECT * FROM payments'),
          attendance: query('SELECT * FROM attendance'),
          settings: query('SELECT * FROM settings'),
          exportDate: new Date().toISOString()
        };
        
        fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2));
        shell.showItemInFolder(result.filePath);
        
        return { success: true, message: 'Data exported successfully' };
      }
      
      return { success: false, message: 'Export cancelled' };
    } catch (error) {
      console.error('Export data error:', error);
      return { success: false, message: error.message };
    }
  });

  // ===================
  // NOTIFICATIONS
  // ===================
  
  ipcMain.handle('notification:send-welcome', async (event, memberData) => {
    try {
      // Import notification service directly
      const NotificationService = require('./notifier');
      const notifier = new NotificationService();
      
      // Wait a moment for the service to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send welcome message using the notification service
      const results = await notifier.sendWelcomeMessage(memberData);
      
      console.log('Welcome notification sent for member:', memberData?.name || 'Unknown');
      console.log('Results:', results);
      
      return { 
        success: true, 
        message: 'Welcome notification sent successfully',
        results: results
      };
    } catch (error) {
      console.error('Welcome notification error:', error);
      return { success: false, message: error.message };
    }
  });

  // ===================
  // EXPENDITURES MANAGEMENT
  // ===================
  
  ipcMain.handle('expenditure:list', async (event, filters = {}) => {
    try {
      let sql = `
        SELECT 
          e.*,
          u.full_name as created_by_name
        FROM expenditures e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      // Apply filters
      if (filters.search) {
        sql += ` AND (e.description LIKE ? OR e.notes LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (filters.category) {
        sql += ` AND e.category = ?`;
        params.push(filters.category);
      }

      if (filters.dateFrom) {
        sql += ` AND DATE(e.date) >= DATE(?)`;
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        sql += ` AND DATE(e.date) <= DATE(?)`;
        params.push(filters.dateTo);
      }

      sql += ` ORDER BY e.date DESC, e.created_at DESC`;

      const expenditures = query(sql, params);
      return { success: true, data: expenditures };
    } catch (error) {
      console.error('List expenditures error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('expenditure:add', async (event, expenditureData) => {
    try {
      const { description, category, amount, payment_mode, date, receipt_number, notes } = expenditureData;

      if (!description || !category || !amount || !date) {
        return { success: false, message: 'Missing required fields' };
      }

      if (amount <= 0) {
        return { success: false, message: 'Amount must be greater than 0' };
      }

      const result = run(`
        INSERT INTO expenditures (
          description, category, amount, payment_mode, date, 
          receipt_number, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        description,
        category,
        parseFloat(amount),
        payment_mode || 'cash',
        date,
        receipt_number || null,
        notes || null,
        1 // Default to user ID 1, you might want to pass this from the session
      ]);

      return { 
        success: true, 
        data: { id: result.lastInsertRowid },
        message: 'Expenditure added successfully' 
      };
    } catch (error) {
      console.error('Add expenditure error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('expenditure:update', async (event, expenditureData) => {
    try {
      const { id, description, category, amount, payment_mode, date, receipt_number, notes } = expenditureData;

      if (!id || !description || !category || !amount || !date) {
        return { success: false, message: 'Missing required fields' };
      }

      if (amount <= 0) {
        return { success: false, message: 'Amount must be greater than 0' };
      }

      const result = run(`
        UPDATE expenditures 
        SET description = ?, category = ?, amount = ?, payment_mode = ?, 
            date = ?, receipt_number = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        description,
        category,
        parseFloat(amount),
        payment_mode || 'cash',
        date,
        receipt_number || null,
        notes || null,
        id
      ]);

      if (result.changes === 0) {
        return { success: false, message: 'Expenditure not found' };
      }

      return { success: true, message: 'Expenditure updated successfully' };
    } catch (error) {
      console.error('Update expenditure error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('expenditure:delete', async (event, id) => {
    try {
      if (!id) {
        return { success: false, message: 'Expenditure ID is required' };
      }

      const result = run('DELETE FROM expenditures WHERE id = ?', [id]);

      if (result.changes === 0) {
        return { success: false, message: 'Expenditure not found' };
      }

      return { success: true, message: 'Expenditure deleted successfully' };
    } catch (error) {
      console.error('Delete expenditure error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('expenditure:get', async (event, id) => {
    try {
      if (!id) {
        return { success: false, message: 'Expenditure ID is required' };
      }

      const expenditure = get(`
        SELECT 
          e.*,
          u.full_name as created_by_name
        FROM expenditures e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = ?
      `, [id]);

      if (!expenditure) {
        return { success: false, message: 'Expenditure not found' };
      }

      return { success: true, data: expenditure };
    } catch (error) {
      console.error('Get expenditure error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('expenditure:stats', async (event, { dateFrom, dateTo } = {}) => {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (dateFrom) {
        whereClause += ' AND DATE(date) >= DATE(?)';
        params.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND DATE(date) <= DATE(?)';
        params.push(dateTo);
      }

      // Get total expenditure for the period
      const totalResult = get(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as total_count
        FROM expenditures 
        ${whereClause}
      `, params);

      // Get expenditures by category
      const categoryStats = query(`
        SELECT 
          category,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as count
        FROM expenditures 
        ${whereClause}
        GROUP BY category
        ORDER BY total_amount DESC
      `, params);

      // Get expenditures by payment mode
      const paymentModeStats = query(`
        SELECT 
          payment_mode,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as count
        FROM expenditures 
        ${whereClause}
        GROUP BY payment_mode
        ORDER BY total_amount DESC
      `, params);

      return {
        success: true,
        data: {
          total: totalResult,
          byCategory: categoryStats,
          byPaymentMode: paymentModeStats
        }
      };
    } catch (error) {
      console.error('Expenditure stats error:', error);
      return { success: false, message: error.message };
    }
  });

  // ===================
  // APP MANAGEMENT
  // ===================
  // BIOMETRIC OPERATIONS
  // ===================
  
  ipcMain.handle('biometric:get-status', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const status = biometricBridge.getStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('Biometric status check error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:start-scanning', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.startScanning();
      return result;
    } catch (error) {
      console.error('Start biometric scanning error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:stop-scanning', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.stopScanning();
      return result;
    } catch (error) {
      console.error('Stop biometric scanning error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:enroll-fingerprint', async (event, memberId) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.enrollFingerprint(memberId);
      return result;
    } catch (error) {
      console.error('Enroll fingerprint error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:delete-fingerprint', async (event, memberId) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.deleteFingerprint(memberId);
      return result;
    } catch (error) {
      console.error('Delete fingerprint error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:get-device-info', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.getDeviceInfo();
      return result;
    } catch (error) {
      console.error('Get device info error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:test-connection', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.testConnection();
      return result;
    } catch (error) {
      console.error('Test biometric connection error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:get-connection-status', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const status = biometricBridge.getConnectionStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('Get biometric connection status error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:get-users', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.getUsers();
      return result;
    } catch (error) {
      console.error('Get biometric users error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:get-all-attendance', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.getAllAttendance();
      return result;
    } catch (error) {
      console.error('Get all attendance error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:clear-logs', async (event) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.clearAttendanceLogs();
      return result;
    } catch (error) {
      console.error('Clear attendance logs error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:set-user', async (event, { userId, name, cardNumber, password, role }) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.setUser(userId, name, cardNumber, password, role);
      return result;
    } catch (error) {
      console.error('Set user error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('biometric:delete-user', async (event, userId) => {
    try {
      const { getBiometricBridge } = require('./main');
      const biometricBridge = getBiometricBridge();
      if (!biometricBridge) {
        return { success: false, message: 'Biometric bridge not initialized' };
      }
      
      const result = await biometricBridge.deleteUser(userId);
      return result;
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: error.message };
    }
  });

  // ===================
  // APP MANAGEMENT
  // ===================
  
  ipcMain.handle('app:restart', async (event) => {
    try {
      const { app } = require('electron');
      app.relaunch();
      app.exit();
      return { success: true };
    } catch (error) {
      console.error('App restart error:', error);
      return { success: false, message: error.message };
    }
  });
};
