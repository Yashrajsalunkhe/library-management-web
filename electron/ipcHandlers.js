const { db, query, get, run, transaction } = require('./db');
const bcrypt = require('bcryptjs');
const { format, addDays, parseISO } = require('date-fns');
const fs = require('fs');
const path = require('path');
const ReportsService = require('./reports');

// Create a reports service instance to generate receipts/reports
const reports = new ReportsService();

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

  // ===================
  // MEMBERS MANAGEMENT
  // ===================
  
  ipcMain.handle('member:add', async (event, member) => {
    try {
      const result = transaction(() => {
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
          seatNo = nextSeat.toString();
        }
        
        // Handle case where no plan is assigned - use dummy dates that will be updated when plan is assigned
        const joinDate = member.joinDate || '1900-01-01';
        const endDate = member.endDate || '1900-01-01';
        
        const info = run(`
          INSERT INTO members (name, email, phone, birth_date, city, address, seat_no, plan_id, join_date, end_date, qr_code)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          member.name,
          member.email,
          member.phone,
          member.birthDate,
          member.city,
          member.address,
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
      const existingSeats = query('SELECT seat_no FROM members WHERE seat_no IS NOT NULL ORDER BY CAST(seat_no AS INTEGER)');
      const seatNumbers = existingSeats.map(s => parseInt(s.seat_no)).filter(n => !isNaN(n));
      
      let nextSeat = 1;
      for (let i = 0; i < seatNumbers.length; i++) {
        if (seatNumbers[i] !== nextSeat) {
          break;
        }
        nextSeat++;
      }
      
      return { success: true, data: nextSeat.toString() };
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
      
      const result = transaction(() => {
        // With CASCADE DELETE enabled, related records will be automatically deleted
        // But we'll keep manual deletion for safety and explicit control
        run('DELETE FROM notifications WHERE member_id = ?', [id]);
        run('DELETE FROM payments WHERE member_id = ?', [id]);
        run('DELETE FROM attendance WHERE member_id = ?', [id]);
        
        // Delete the member
        run('DELETE FROM members WHERE id = ?', [id]);
        
        return { success: true, message: 'Member permanently deleted successfully' };
      });
      
      return result;
    } catch (error) {
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
        const paymentInfo = run(`
          INSERT INTO payments (member_id, amount, mode, plan_id, note, receipt_number)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          memberId,
          plan.price,
          paymentDetails.mode,
          planId,
          paymentDetails.note || (isFirstPlan ? 'New membership plan' : 'Membership renewal'),
          `RCP-${Date.now()}`
        ]);

        return { 
          paymentId: paymentInfo.lastInsertRowid,
          newEndDate: format(newEndDate, 'yyyy-MM-dd'),
          joinDate: joinDate,
          isFirstPlan: isFirstPlan
        };
      });

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
      const plans = query('SELECT * FROM membership_plans ORDER BY duration_days');
      return { success: true, data: plans };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('plan:add', async (event, plan) => {
    try {
      const info = run(`
        INSERT INTO membership_plans (name, duration_days, price, description)
        VALUES (?, ?, ?, ?)
      `, [plan.name, plan.durationDays, plan.price, plan.description]);

      return { success: true, data: { id: info.lastInsertRowid } };
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
        JOIN members m ON p.member_id = m.id
        LEFT JOIN membership_plans mp ON p.plan_id = mp.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.memberId) {
        sql += ' AND p.member_id = ?';
        params.push(filters.memberId);
      }

      if (filters.search) {
        sql += ' AND (m.name LIKE ? OR m.email LIKE ? OR m.phone LIKE ? OR p.receipt_number LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
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
      
      const stats = {
        totalMembers: get('SELECT COUNT(*) as count FROM members WHERE status = ?', ['active'])?.count || 0,
        todayAttendance: get('SELECT COUNT(*) as count FROM attendance WHERE DATE(check_in) = ?', [today])?.count || 0,
        todayIncome: get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(paid_at) = ?', [today])?.total || 0,
        monthlyIncome: get('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime(\'%Y-%m\', paid_at) = ?', [thisMonth])?.total || 0,
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
      `, [dateFrom, dateTo]);

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
      `, [dateFrom, dateTo]);

      console.log('Found', payments.length, 'payment records');
      return { success: true, data: payments };
    } catch (error) {
      console.error('Error fetching payments report:', error);
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
      
      // Create exports directory if it doesn't exist
      const exportsDir = path.join(__dirname, '..', 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `${type}_report_${timestamp}.${format}`;
      const filepath = path.join(exportsDir, filename);

      if (format === 'xlsx') {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`);
        
        // Set workbook properties
        workbook.creator = 'Library Management System';
        workbook.created = new Date();
        
        switch (type) {
          case 'attendance':
            worksheet.columns = [
              { header: 'Date', key: 'date', width: 12 },
              { header: 'Member', key: 'member', width: 20 },
              { header: 'Check In', key: 'checkin', width: 15 },
              { header: 'Check Out', key: 'checkout', width: 15 },
              { header: 'Duration (hours)', key: 'duration', width: 15 },
              { header: 'Source', key: 'source', width: 12 }
            ];
            
            data.forEach(record => {
              const checkIn = record.check_in ? new Date(record.check_in) : null;
              const checkOut = record.check_out ? new Date(record.check_out) : null;
              const duration = checkIn && checkOut ? 
                Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 100)) / 10 : null;
              
              worksheet.addRow({
                date: checkIn ? checkIn.toISOString().slice(0, 10) : '',
                member: record.member_name,
                checkin: checkIn ? checkIn.toTimeString().slice(0, 8) : '',
                checkout: checkOut ? checkOut.toTimeString().slice(0, 8) : 'Active',
                duration: duration || '',
                source: record.source.charAt(0).toUpperCase() + record.source.slice(1)
              });
            });
            break;
            
          case 'payments':
            worksheet.columns = [
              { header: 'Date', key: 'date', width: 12 },
              { header: 'Receipt #', key: 'receipt', width: 15 },
              { header: 'Member', key: 'member', width: 20 },
              { header: 'Amount (₹)', key: 'amount', width: 12 },
              { header: 'Mode', key: 'mode', width: 12 },
              { header: 'Plan', key: 'plan', width: 15 },
              { header: 'Note', key: 'note', width: 25 }
            ];
            
            data.forEach(payment => {
              worksheet.addRow({
                date: new Date(payment.paid_at).toISOString().slice(0, 10),
                receipt: payment.receipt_number || '',
                member: payment.member_name,
                amount: payment.amount,
                mode: payment.mode.charAt(0).toUpperCase() + payment.mode.slice(1),
                plan: payment.plan_name || '',
                note: payment.note || ''
              });
            });
            break;
            
          case 'members':
            worksheet.columns = [
              { header: 'Name', key: 'name', width: 20 },
              { header: 'Email', key: 'email', width: 25 },
              { header: 'Phone', key: 'phone', width: 15 },
              { header: 'Plan', key: 'plan', width: 15 },
              { header: 'Join Date', key: 'joinDate', width: 12 },
              { header: 'End Date', key: 'endDate', width: 12 },
              { header: 'Status', key: 'status', width: 10 }
            ];
            
            data.forEach(member => {
              worksheet.addRow({
                name: member.name,
                email: member.email || '',
                phone: member.phone || '',
                plan: member.plan_name || '',
                joinDate: new Date(member.join_date).toISOString().slice(0, 10),
                endDate: new Date(member.end_date).toISOString().slice(0, 10),
                status: member.status.charAt(0).toUpperCase() + member.status.slice(1)
              });
            });
            break;
        }
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6F3FF' }
        };
        
        // Add borders to all cells
        worksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
        
        await workbook.xlsx.writeFile(filepath);
        
      } else if (format === 'csv') {
        let csvContent = '';
        
        switch (type) {
          case 'attendance':
            csvContent = 'Date,Member,Check In,Check Out,Duration,Source\n';
            data.forEach(record => {
              const checkIn = record.check_in ? new Date(record.check_in) : null;
              const checkOut = record.check_out ? new Date(record.check_out) : null;
              const duration = checkIn && checkOut ? 
                Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 100)) / 10 : '';
              
              csvContent += `"${checkIn ? checkIn.toISOString().slice(0, 10) : ''}","${record.member_name}","${checkIn ? checkIn.toTimeString().slice(0, 8) : ''}","${checkOut ? checkOut.toTimeString().slice(0, 8) : 'Active'}","${duration ? duration + 'h' : ''}","${record.source}"\n`;
            });
            break;
            
          case 'payments':
            csvContent = 'Date,Receipt #,Member,Amount,Mode,Plan,Note\n';
            data.forEach(payment => {
              csvContent += `"${new Date(payment.paid_at).toISOString().slice(0, 10)}","${payment.receipt_number || ''}","${payment.member_name}","${payment.amount}","${payment.mode}","${payment.plan_name || ''}","${payment.note || ''}"\n`;
            });
            break;
            
          case 'members':
            csvContent = 'Name,Email,Phone,Plan,Join Date,End Date,Status\n';
            data.forEach(member => {
              csvContent += `"${member.name}","${member.email || ''}","${member.phone || ''}","${member.plan_name || ''}","${new Date(member.join_date).toISOString().slice(0, 10)}","${new Date(member.end_date).toISOString().slice(0, 10)}","${member.status}"\n`;
            });
            break;
        }
        
        fs.writeFileSync(filepath, csvContent, 'utf8');
      }

      // Open the exports folder
      shell.showItemInFolder(filepath);
      
      return { success: true, message: `Report exported to ${filename}`, filepath };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, message: error.message };
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
        
        // Parse JSON values or use string values
        try {
          settingsObj[category][key] = JSON.parse(setting.value);
        } catch {
          settingsObj[category][key] = setting.value;
        }
      });
      
      return { success: true, settings: settingsObj };
    } catch (error) {
      console.error('Get settings error:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('settings:saveSettings', async (event, settings) => {
    try {
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

  // ===================
  // BACKUP MANAGEMENT
  // ===================
  
  ipcMain.handle('backup:createBackup', async (event) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const { shell } = require('electron');
      
      const backupDir = path.join(__dirname, '..', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const backupFile = path.join(backupDir, `library-backup-${timestamp}.db`);
      const dbFile = path.join(__dirname, 'library.db');
      
      // Copy database file
      fs.copyFileSync(dbFile, backupFile);
      
      return { success: true, message: 'Backup created successfully', filepath: backupFile };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, message: error.message };
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
        
        // Copy backup file to database location
        fs.copyFileSync(backupFile, dbFile);
        
        return { success: true, message: 'Backup restored successfully' };
      }
      
      return { success: false, message: 'No backup file selected' };
    } catch (error) {
      console.error('Restore backup error:', error);
      return { success: false, message: error.message };
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
};
