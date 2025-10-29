// Professional Receipt Template for Library Management System
// This file contains helper functions and the receipt PDF generation template

const fs = require('fs');
const path = require('path');

class ReceiptTemplate {
  // Helper function to convert number to words (Indian numbering system)
  static convertToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero Rupees Only';
    
    const numStr = Math.floor(num).toString();
    const len = numStr.length;
    
    let words = '';
    
    // Lakhs
    if (len > 5) {
      const lakhs = parseInt(numStr.substring(0, len - 5));
      words += this.convertToWordsHelper(lakhs, ones, tens, teens) + ' Lakh ';
    }
    
    // Thousands
    if (len > 3) {
      const thousands = parseInt(numStr.substring(Math.max(0, len - 5), len - 3));
      if (thousands > 0) {
        words += this.convertToWordsHelper(thousands, ones, tens, teens) + ' Thousand ';
      }
    }
    
    // Hundreds
    const hundreds = parseInt(numStr.substring(Math.max(0, len - 3)));
    words += this.convertToWordsHelper(hundreds, ones, tens, teens);
    
    return words.trim() + ' Rupees Only';
  }
  
  static convertToWordsHelper(num, ones, tens, teens) {
    let str = '';
    
    if (num > 99) {
      str += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num > 19) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      str += teens[num - 10] + ' ';
      return str;
    }
    
    if (num > 0) {
      str += ones[num] + ' ';
    }
    
    return str;
  }

  // Generate professional receipt PDF definition
  static generateReceiptDefinition(payment, settingsObj) {
    // Convert logo to base64
    // Priority: database logo > business-logo.png > logo.png > icon.png
    let logoImage = null;
    
    // First, check if logo is in database settings (uploaded via Settings page)
    if (settingsObj['general.logo']) {
      logoImage = settingsObj['general.logo'];
      console.log('Using logo from database settings');
    } else {
      // Fallback to file-based logos
      const logoPaths = [
        path.join(__dirname, '../assets/business-logo.png'),
        path.join(__dirname, '../assets/logo.png'),
        path.join(__dirname, '../assets/icon.png')
      ];
      
      for (const logoPath of logoPaths) {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoImage = `data:image/png;base64,${logoBuffer.toString('base64')}`;
          console.log(`Using logo from file: ${logoPath}`);
          break;
        }
      }
    }

    // Convert amount to words
    const amountInWords = this.convertToWords(payment.amount);
    
    // Format dates
    const receiptDate = payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }) : 'N/A';

    return {
      pageSize: 'A4',
      pageMargins: [50, 50, 50, 80],
      content: [
        // Logo and Header Section
        {
          columns: [
            logoImage ? {
              image: logoImage,
              width: 60,
              height: 60,
              alignment: 'left'
            } : { width: 60, text: '' },
            {
              width: '*',
              stack: [
                { text: settingsObj['general.libraryName'] || 'LIBRARY MANAGEMENT SYSTEM', style: 'companyName', alignment: 'center' },
                { text: settingsObj['general.address'] || '', style: 'companyAddress', alignment: 'center', margin: [0, 5, 0, 3] },
                { 
                  text: [
                    { text: settingsObj['general.phone'] ? 'Phone: ' + settingsObj['general.phone'] : '' },
                    { text: settingsObj['general.email'] && settingsObj['general.phone'] ? ' | ' : '' },
                    { text: settingsObj['general.email'] ? 'Email: ' + settingsObj['general.email'] : '' }
                  ],
                  style: 'companyContact',
                  alignment: 'center'
                }
              ]
            },
            { width: 60, text: '' }
          ],
          margin: [0, 0, 0, 15]
        },

        // Horizontal Line
        {
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#2563eb' }
          ],
          margin: [0, 0, 0, 15]
        },

        // Receipt Title and Info
        {
          columns: [
            { text: 'PAYMENT RECEIPT', style: 'receiptTitle', alignment: 'left' },
            {
              stack: [
                { text: `Receipt No: ${payment.receipt_number || 'N/A'}`, style: 'receiptInfo', alignment: 'right' },
                { text: `Date: ${receiptDate}`, style: 'receiptInfo', alignment: 'right', margin: [0, 3, 0, 0] }
              ]
            }
          ],
          margin: [0, 0, 0, 25]
        },

        // Bill To Section
        {
          stack: [
            { text: 'BILL TO:', style: 'sectionHeader', margin: [0, 0, 0, 10] },
            {
              table: {
                widths: ['*', '*'],
                body: [
                  [
                    { 
                      stack: [
                        { text: 'Name:', style: 'label' },
                        { text: payment.member_name || 'N/A', style: 'value', margin: [0, 3, 0, 8] }
                      ],
                      border: [false, false, false, false]
                    },
                    { 
                      stack: [
                        { text: 'Seat No:', style: 'label' },
                        { text: payment.member_seat_no || 'N/A', style: 'value', margin: [0, 3, 0, 8] }
                      ],
                      border: [false, false, false, false]
                    }
                  ],
                  [
                    { 
                      stack: [
                        { text: 'Email:', style: 'label' },
                        { text: payment.member_email || 'N/A', style: 'value', margin: [0, 3, 0, 8] }
                      ],
                      border: [false, false, false, false]
                    },
                    { 
                      stack: [
                        { text: 'Phone:', style: 'label' },
                        { text: payment.member_phone || 'N/A', style: 'value', margin: [0, 3, 0, 8] }
                      ],
                      border: [false, false, false, false]
                    }
                  ],
                  [
                    { 
                      stack: [
                        { text: 'Address:', style: 'label' },
                        { text: payment.member_address || 'N/A', style: 'value', margin: [0, 3, 0, 0] }
                      ],
                      border: [false, false, false, false],
                      colSpan: 2
                    },
                    {}
                  ]
                ]
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 20]
            }
          ]
        },

        // Payment Details Table
        {
          table: {
            headerRows: 1,
            widths: ['*', 100, 80, 100],
            body: [
              [
                { text: 'Description', style: 'tableHeader' },
                { text: 'Plan', style: 'tableHeader', alignment: 'center' },
                { text: 'Mode', style: 'tableHeader', alignment: 'center' },
                { text: 'Amount', style: 'tableHeader', alignment: 'right' }
              ],
              [
                { 
                  text: payment.note || 'Membership Fee',
                  style: 'tableCell'
                },
                { 
                  text: payment.plan_name || 'N/A',
                  style: 'tableCell',
                  alignment: 'center'
                },
                { 
                  text: payment.mode ? payment.mode.toUpperCase() : 'CASH',
                  style: 'tableCell',
                  alignment: 'center'
                },
                { 
                  text: `₹ ${payment.amount.toFixed(2)}`,
                  style: 'tableCell',
                  alignment: 'right'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
            },
            vLineWidth: function (i, node) {
              return 0;
            },
            hLineColor: function (i, node) {
              return (i === 0 || i === 1 || i === node.table.body.length) ? '#2563eb' : '#e5e7eb';
            },
            paddingLeft: function(i) { return 10; },
            paddingRight: function(i) { return 10; },
            paddingTop: function(i) { return 8; },
            paddingBottom: function(i) { return 8; }
          },
          margin: [0, 0, 0, 0]
        },

        // Total Section
        {
          table: {
            widths: ['*', 100],
            body: [
              [
                { 
                  text: 'TOTAL AMOUNT',
                  style: 'totalLabel',
                  border: [false, true, false, false],
                  borderColor: ['#2563eb', '#2563eb', '#2563eb', '#2563eb']
                },
                { 
                  text: `₹ ${payment.amount.toFixed(2)}`,
                  style: 'totalAmount',
                  alignment: 'right',
                  border: [false, true, false, false],
                  borderColor: ['#2563eb', '#2563eb', '#2563eb', '#2563eb']
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i) { return (i === 0) ? 2 : 0; },
            hLineColor: function (i) { return '#2563eb'; },
            paddingLeft: function(i) { return 10; },
            paddingRight: function(i) { return 10; },
            paddingTop: function(i) { return 10; },
            paddingBottom: function(i) { return 10; }
          },
          margin: [0, 0, 0, 15]
        },

        // Amount in Words
        {
          text: [
            { text: 'Amount in Words: ', style: 'label' },
            { text: amountInWords, style: 'amountWords' }
          ],
          margin: [0, 0, 0, 40]
        },

        // Footer Section
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Terms & Conditions:', style: 'footerHeader', margin: [0, 0, 0, 5] },
                { text: '• This is a computer-generated receipt', style: 'footerText' },
                { text: '• Please keep this receipt for future reference', style: 'footerText' },
                { text: '• No refund will be entertained', style: 'footerText' }
              ]
            },
            {
              width: 150,
              stack: [
                { text: 'Authorized Signature', style: 'signatureText', alignment: 'center', margin: [0, 0, 0, 30] },
                {
                  canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: '#000' }
                  ]
                },
                { text: settingsObj['general.libraryName'] || 'Library', style: 'signatureName', alignment: 'center', margin: [0, 5, 0, 0] }
              ]
            }
          ]
        }
      ],
      
      styles: {
        companyName: {
          fontSize: 18,
          bold: true,
          color: '#1e40af'
        },
        companyAddress: {
          fontSize: 10,
          color: '#6b7280'
        },
        companyContact: {
          fontSize: 9,
          color: '#6b7280'
        },
        receiptTitle: {
          fontSize: 22,
          bold: true,
          color: '#1e40af'
        },
        receiptInfo: {
          fontSize: 10,
          color: '#374151'
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: '#1e40af'
        },
        label: {
          fontSize: 9,
          color: '#6b7280',
          bold: true
        },
        value: {
          fontSize: 10,
          color: '#111827'
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
          color: '#ffffff',
          fillColor: '#2563eb'
        },
        tableCell: {
          fontSize: 10,
          color: '#374151'
        },
        totalLabel: {
          fontSize: 12,
          bold: true,
          color: '#111827'
        },
        totalAmount: {
          fontSize: 14,
          bold: true,
          color: '#1e40af'
        },
        amountWords: {
          fontSize: 10,
          italics: true,
          color: '#374151'
        },
        footerHeader: {
          fontSize: 9,
          bold: true,
          color: '#111827'
        },
        footerText: {
          fontSize: 8,
          color: '#6b7280',
          margin: [0, 2, 0, 0]
        },
        signatureText: {
          fontSize: 9,
          color: '#6b7280'
        },
        signatureName: {
          fontSize: 10,
          bold: true,
          color: '#111827'
        }
      }
    };
  }
}

module.exports = ReceiptTemplate;
