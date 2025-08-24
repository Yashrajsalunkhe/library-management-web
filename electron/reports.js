const ExcelJS = require('exceljs');
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');
const { query } = require('./db');

class ReportsService {
  constructor() {
    // Define fonts for PDF generation
    this.fonts = {
      Roboto: {
        normal: path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../assets/fonts/Roboto-Medium.ttf'),
        italics: path.join(__dirname, '../assets/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../assets/fonts/Roboto-MediumItalic.ttf')
      }
    };
    
    // Fallback to system fonts if custom fonts not available
    if (!fs.existsSync(this.fonts.Roboto.normal)) {
      this.fonts = {
        Helvetica: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };
    }
  }

  // Generate attendance report (Excel)
  async generateAttendanceReportExcel(dateFrom, dateTo, outputPath) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Attendance Report');

      // Set column headers
      worksheet.columns = [
        { header: 'Member Name', key: 'member_name', width: 20 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Visit Count', key: 'visit_count', width: 12 },
        { header: 'First Visit', key: 'first_visit', width: 20 },
        { header: 'Last Visit', key: 'last_visit', width: 20 }
      ];

      // Style the header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE1F5FE' }
      };

      // Get attendance data
      const attendanceData = query(`
        SELECT 
          m.name as member_name,
          m.phone,
          COUNT(a.id) as visit_count,
          MIN(a.check_in) as first_visit,
          MAX(a.check_in) as last_visit
        FROM members m
        LEFT JOIN attendance a ON m.id = a.member_id 
          AND DATE(a.check_in) BETWEEN ? AND ?
        WHERE m.status = "active"
        GROUP BY m.id, m.name, m.phone
        ORDER BY visit_count DESC, m.name
      `, [dateFrom, dateTo]);

      // Add data rows
      attendanceData.forEach(row => {
        worksheet.addRow({
          member_name: row.member_name,
          phone: row.phone || 'N/A',
          visit_count: row.visit_count,
          first_visit: row.first_visit ? new Date(row.first_visit).toLocaleString() : 'N/A',
          last_visit: row.last_visit ? new Date(row.last_visit).toLocaleString() : 'N/A'
        });
      });

      // Add summary row
      const totalVisits = attendanceData.reduce((sum, row) => sum + row.visit_count, 0);
      worksheet.addRow({});
      const summaryRow = worksheet.addRow({
        member_name: 'TOTAL',
        visit_count: totalVisits
      });
      summaryRow.font = { bold: true };

      // Add borders
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

      // Save the file
      await workbook.xlsx.writeFile(outputPath);
      return { success: true, path: outputPath, recordCount: attendanceData.length };
    } catch (error) {
      console.error('Error generating attendance Excel report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate payments report (Excel)
  async generatePaymentsReportExcel(dateFrom, dateTo, outputPath) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payments Report');

      // Set column headers
      worksheet.columns = [
        { header: 'Date', key: 'payment_date', width: 15 },
        { header: 'Member Name', key: 'member_name', width: 20 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Mode', key: 'mode', width: 12 },
        { header: 'Plan', key: 'plan_name', width: 15 },
        { header: 'Receipt #', key: 'receipt_number', width: 15 },
        { header: 'Note', key: 'note', width: 25 }
      ];

      // Style the header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F5E8' }
      };

      // Get payments data
      const paymentsData = query(`
        SELECT 
          DATE(p.paid_at) as payment_date,
          m.name as member_name,
          p.amount,
          p.mode,
          mp.name as plan_name,
          p.receipt_number,
          p.note
        FROM payments p
        JOIN members m ON p.member_id = m.id
        LEFT JOIN membership_plans mp ON p.plan_id = mp.id
        WHERE DATE(p.paid_at) BETWEEN ? AND ?
        ORDER BY p.paid_at DESC
      `, [dateFrom, dateTo]);

      // Add data rows
      let totalAmount = 0;
      paymentsData.forEach(row => {
        totalAmount += row.amount;
        worksheet.addRow({
          payment_date: row.payment_date,
          member_name: row.member_name,
          amount: row.amount,
          mode: row.mode,
          plan_name: row.plan_name || 'N/A',
          receipt_number: row.receipt_number,
          note: row.note || ''
        });
      });

      // Format amount column as currency
      worksheet.getColumn('amount').numFmt = '₹#,##0.00';

      // Add summary row
      worksheet.addRow({});
      const summaryRow = worksheet.addRow({
        member_name: 'TOTAL',
        amount: totalAmount
      });
      summaryRow.font = { bold: true };
      summaryRow.getCell('amount').numFmt = '₹#,##0.00';

      // Add borders
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

      // Save the file
      await workbook.xlsx.writeFile(outputPath);
      return { success: true, path: outputPath, recordCount: paymentsData.length, totalAmount };
    } catch (error) {
      console.error('Error generating payments Excel report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate members report (Excel)
  async generateMembersReportExcel(outputPath) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Members Report');

      // Set column headers
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Plan', key: 'plan_name', width: 15 },
        { header: 'Join Date', key: 'join_date', width: 12 },
        { header: 'End Date', key: 'end_date', width: 12 },
        { header: 'Status', key: 'status', width: 12 }
      ];

      // Style the header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFCE4EC' }
      };

      // Get members data
      const membersData = query(`
        SELECT 
          m.id,
          m.name,
          m.email,
          m.phone,
          mp.name as plan_name,
          m.join_date,
          m.end_date,
          m.status
        FROM members m
        LEFT JOIN membership_plans mp ON m.plan_id = mp.id
        ORDER BY m.created_at DESC
      `);

      // Add data rows
      membersData.forEach(row => {
        const addedRow = worksheet.addRow({
          id: row.id,
          name: row.name,
          email: row.email || 'N/A',
          phone: row.phone || 'N/A',
          plan_name: row.plan_name || 'N/A',
          join_date: row.join_date,
          end_date: row.end_date,
          status: row.status
        });

        // Color code status
        const statusCell = addedRow.getCell('status');
        switch (row.status) {
          case 'active':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
            break;
          case 'expired':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
            break;
          case 'suspended':
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
            break;
        }
      });

      // Add borders
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

      // Save the file
      await workbook.xlsx.writeFile(outputPath);
      return { success: true, path: outputPath, recordCount: membersData.length };
    } catch (error) {
      console.error('Error generating members Excel report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate payment receipt (PDF)
  async generatePaymentReceiptPdf(paymentId, outputPath) {
    try {
      // Get payment details with all member information
      const payment = query(`
        SELECT 
          p.*,
          m.name as member_name,
          m.email as member_email,
          m.phone as member_phone,
          m.city as member_city,
          m.address as member_address,
          m.seat_no as member_seat_no,
          m.birth_date as member_birth_date,
          mp.name as plan_name,
          mp.duration_days
        FROM payments p
        JOIN members m ON p.member_id = m.id
        LEFT JOIN membership_plans mp ON p.plan_id = mp.id
        WHERE p.id = ?
      `, [paymentId])[0];

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      // Get library settings - fresh from database each time
      const settings = query('SELECT key, value FROM settings');
      const settingsObj = {};
      settings.forEach(s => settingsObj[s.key] = s.value);
      
      // Debug log to verify settings are being loaded
      console.log('Current library settings:', {
        'general.libraryName': settingsObj['general.libraryName'],
        'general.address': settingsObj['general.address'],
        'general.phone': settingsObj['general.phone']
      });

      const printer = new PdfPrinter(this.fonts);
      const fontFamily = Object.keys(this.fonts)[0];

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
          {
            table: {
              widths: ['*'],
              body: [
                [
                  {
                    stack: [
                      // Header Section
                      { text: 'CASH MEMO', style: 'title', alignment: 'center', margin: [0, 15, 0, 5] },
                      { text: settingsObj['general.libraryName'] || 'Library Management System', style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 10] },
                      
                      // Contact Info Section
                      { 
                        text: [
                          { text: settingsObj['general.phone'] ? `Mob. ${settingsObj['general.phone']}` : '', style: 'contact' },
                          { text: settingsObj['general.address'] ? '\n' + settingsObj['general.address'] : '', style: 'contact' },
                          { text: settingsObj['general.email'] ? '\nEmail: ' + settingsObj['general.email'] : '', style: 'contact' }
                        ].filter(item => item.text), // Remove empty text items
                        alignment: 'center',
                        margin: [0, 0, 0, 20]
                      },
                      
                      // Member Details Section with proper spacing
                      {
                        table: {
                          widths: [80, '*'],
                          body: [
                            [
                              { text: 'To:', style: 'fieldLabel', border: [false, false, false, false] },
                              { text: payment.member_name || 'Member Name', style: 'fieldValue', border: [false, false, false, true] }
                            ]
                          ]
                        },
                        layout: {
                          hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                          vLineWidth: function (i, node) { return 0; },
                          hLineColor: function (i, node) { return '#ccc'; },
                          paddingLeft: function(i, node) { return 0; },
                          paddingRight: function(i, node) { return 0; },
                          paddingTop: function(i, node) { return 3; },
                          paddingBottom: function(i, node) { return 8; }
                        },
                        margin: [0, 0, 0, 8]
                      },
                      
                      {
                        table: {
                          widths: [80, '*'],
                          body: [
                            [
                              { text: 'Email:', style: 'fieldLabel', border: [false, false, false, false] },
                              { text: payment.member_email || 'Email Address', style: 'fieldValue', border: [false, false, false, true] }
                            ]
                          ]
                        },
                        layout: {
                          hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                          vLineWidth: function (i, node) { return 0; },
                          hLineColor: function (i, node) { return '#ccc'; },
                          paddingLeft: function(i, node) { return 0; },
                          paddingRight: function(i, node) { return 0; },
                          paddingTop: function(i, node) { return 3; },
                          paddingBottom: function(i, node) { return 8; }
                        },
                        margin: [0, 0, 0, 8]
                      },

                      {
                        columns: [
                          {
                            width: '*',
                            table: {
                              widths: [80, '*'],
                              body: [
                                [
                                  { text: 'Mobile:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: payment.member_phone || 'Mobile Number', style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          },
                          { width: 20, text: '' },
                          {
                            width: '*',
                            table: {
                              widths: [60, '*'],
                              body: [
                                [
                                  { text: 'City:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: payment.member_city || 'City', style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          }
                        ],
                        margin: [0, 0, 0, 8]
                      },

                      {
                        table: {
                          widths: [80, '*'],
                          body: [
                            [
                              { text: 'Address:', style: 'fieldLabel', border: [false, false, false, false] },
                              { text: payment.member_address || 'Address', style: 'fieldValue', border: [false, false, false, true] }
                            ]
                          ]
                        },
                        layout: {
                          hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                          vLineWidth: function (i, node) { return 0; },
                          hLineColor: function (i, node) { return '#ccc'; },
                          paddingLeft: function(i, node) { return 0; },
                          paddingRight: function(i, node) { return 0; },
                          paddingTop: function(i, node) { return 3; },
                          paddingBottom: function(i, node) { return 8; }
                        },
                        margin: [0, 0, 0, 15]
                      },

                      {
                        columns: [
                          {
                            width: '*',
                            table: {
                              widths: [80, '*'],
                              body: [
                                [
                                  { text: 'Date:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-GB') : 'dd - mm - yyyy', style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          },
                          { width: 20, text: '' },
                          {
                            width: '*',
                            table: {
                              widths: [60, '*'],
                              body: [
                                [
                                  { text: 'Month:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: payment.plan_name || 'Month', style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          }
                        ],
                        margin: [0, 0, 0, 15]
                      },

                      // Payment Details Section
                      {
                        columns: [
                          {
                            width: '*',
                            table: {
                              widths: [100, 80],
                              body: [
                                [
                                  { text: 'Membership Fee:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: `₹ ${payment.amount.toFixed(2)}`, style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          },
                          { width: 20, text: '' },
                          {
                            width: '*',
                            table: {
                              widths: [60, 80],
                              body: [
                                [
                                  { text: 'Seat No.:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: payment.member_seat_no || 'Seat Number', style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          }
                        ],
                        margin: [0, 0, 0, 15]
                      },

                      {
                        columns: [
                          {
                            width: '*',
                            table: {
                              widths: [60, '*'],
                              body: [
                                [
                                  { text: 'Other:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: payment.note || 'Other Charges', style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          },
                          { width: 20, text: '' },
                          {
                            width: '*',
                            table: {
                              widths: [90, '*'],
                              body: [
                                [
                                  { text: 'Payment Mode:', style: 'fieldLabel', border: [false, false, false, false] },
                                  { text: payment.mode ? payment.mode.toUpperCase() : 'Cash / UPI / Card', style: 'fieldValue', border: [false, false, false, true] }
                                ]
                              ]
                            },
                            layout: {
                              hLineWidth: function (i, node) { return (i === 1) ? 0.5 : 0; },
                              vLineWidth: function (i, node) { return 0; },
                              hLineColor: function (i, node) { return '#ccc'; },
                              paddingLeft: function(i, node) { return 0; },
                              paddingRight: function(i, node) { return 0; },
                              paddingTop: function(i, node) { return 3; },
                              paddingBottom: function(i, node) { return 8; }
                            }
                          }
                        ],
                        margin: [0, 0, 0, 25]
                      },

                      // Amount in words
                      {
                        columns: [
                          { width: 100, text: 'Amount in Words:', style: 'fieldLabel' },
                          { text: '______________________________', style: 'underline' }
                        ],
                        margin: [0, 0, 0, 30]
                      },

                      // Signature
                      {
                        columns: [
                          { width: '*', text: '' },
                          { width: 150, text: (settingsObj['general.libraryName'] || 'Library') + ' Authority', style: 'signature', alignment: 'right' }
                        ],
                        margin: [0, 0, 0, 25]
                      }
                    ],
                    margin: [20, 10, 20, 15]
                  }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 1.5,
              vLineWidth: () => 1.5,
              hLineColor: () => '#000',
              vLineColor: () => '#000',
            }
          }
        ],
        
        styles: {
          title: {
            fontSize: 24,
            bold: true,
            color: '#000'
          },
          subtitle: {
            fontSize: 16,
            bold: true,
            color: '#000'
          },
          contact: {
            fontSize: 11,
            color: '#000'
          },
          fieldLabel: {
            fontSize: 12,
            bold: true,
            color: '#000'
          },
          fieldValue: {
            fontSize: 12,
            color: '#666'
          },
          underline: {
            fontSize: 12,
            color: '#000'
          },
          signature: {
            fontSize: 11,
            color: '#000'
          }
        },
        
        defaultStyle: {
          font: fontFamily
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      pdfDoc.pipe(fs.createWriteStream(outputPath));
      pdfDoc.end();

      return new Promise((resolve) => {
        pdfDoc.on('end', () => {
          resolve({ success: true, path: outputPath });
        });
      });
    } catch (error) {
      console.error('Error generating payment receipt PDF:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate summary report (PDF)
  async generateSummaryReportPdf(dateFrom, dateTo, outputPath) {
    try {
      // Get summary data
      const attendanceStats = query(`
        SELECT COUNT(*) as total_visits, COUNT(DISTINCT member_id) as unique_visitors
        FROM attendance 
        WHERE DATE(check_in) BETWEEN ? AND ?
      `, [dateFrom, dateTo])[0];

      const paymentStats = query(`
        SELECT COUNT(*) as total_transactions, COALESCE(SUM(amount), 0) as total_amount
        FROM payments 
        WHERE DATE(paid_at) BETWEEN ? AND ?
      `, [dateFrom, dateTo])[0];

      const memberStats = query(`
        SELECT 
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_members,
          COUNT(*) as total_members
        FROM members
      `)[0];

      const printer = new PdfPrinter(this.fonts);
      const fontFamily = Object.keys(this.fonts)[0];

      const docDefinition = {
        content: [
          { text: 'Library Management Summary Report', style: 'header' },
          { text: `Period: ${dateFrom} to ${dateTo}`, style: 'subheader' },
          { text: '\n' },

          // Statistics cards
          {
            columns: [
              {
                width: '50%',
                table: {
                  body: [
                    [{ text: 'Attendance Statistics', style: 'cardHeader', colSpan: 2 }, {}],
                    ['Total Visits', attendanceStats.total_visits.toString()],
                    ['Unique Visitors', attendanceStats.unique_visitors.toString()]
                  ]
                }
              },
              {
                width: '50%',
                table: {
                  body: [
                    [{ text: 'Payment Statistics', style: 'cardHeader', colSpan: 2 }, {}],
                    ['Total Transactions', paymentStats.total_transactions.toString()],
                    ['Total Amount', `₹${paymentStats.total_amount.toFixed(2)}`]
                  ]
                }
              }
            ]
          },

          { text: '\n' },

          {
            table: {
              body: [
                [{ text: 'Member Statistics', style: 'cardHeader', colSpan: 2 }, {}],
                ['Active Members', memberStats.active_members.toString()],
                ['Expired Members', memberStats.expired_members.toString()],
                ['Total Members', memberStats.total_members.toString()]
              ]
            }
          }
        ],

        styles: {
          header: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
            color: '#2E86AB'
          },
          subheader: {
            fontSize: 12,
            alignment: 'center',
            color: '#666666'
          },
          cardHeader: {
            fontSize: 12,
            bold: true,
            fillColor: '#E3F2FD'
          }
        },

        defaultStyle: {
          font: fontFamily
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      pdfDoc.pipe(fs.createWriteStream(outputPath));
      pdfDoc.end();

      return new Promise((resolve) => {
        pdfDoc.on('end', () => {
          resolve({ success: true, path: outputPath });
        });
      });
    } catch (error) {
      console.error('Error generating summary PDF report:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ReportsService;
