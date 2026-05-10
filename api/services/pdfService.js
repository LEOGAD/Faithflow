const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

exports.generateReportPdf = async (reportData, title) => {
  const apiKey = process.env.PDFSHIFT_API_KEY;

  const type = reportData.reportType || 'full';
  const showFin = ['full', 'financial', 'offering', 'tithe', 'monthly', 'weekly'].includes(type);
  const showAtt = ['full', 'attendance', 'monthly', 'weekly'].includes(type);
  
  const currencyMap = {
    'USD': '$',
    'NGN': '₦',
    'EUR': '€',
    'GBP': '£',
    'GHS': '₵',
    'KES': 'KSh '
  };
  const sym = currencyMap[reportData.currency] || '$';

  // Extract Church Profile Data
  const cp = reportData.churchProfile || {};
  const churchName = cp.churchName || 'Faithworld International Church';
  const tagline = cp.tagline || 'Go · Redeem · Build — Establishing the Spirit of Faith';
  const phone = cp.phone || '08032724488';
  const email = cp.email || 'Megafaithwordfamily@gmail.com';
  const address = cp.address || 'Faithworld Avenue, off NTA Road, Ozuoba';
  const mandate = cp.mandate || '';
  const vision = cp.vision || '';
  let logoUrl = cp.logoUrl || '';

  // Ensure Logo URL is absolute
  if (logoUrl && logoUrl.startsWith('/')) {
      logoUrl = `http://localhost:5000${logoUrl}`;
  }

  // Determine Titles and Dates
  let headerTitle = 'Report';
  let periodText = '';
  const endDate = new Date(reportData.period.end);
  const startDate = new Date(reportData.period.start);

  if (type === 'monthly') {
      headerTitle = 'Monthly Report';
      periodText = `As at ${endDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  } else if (type === 'weekly') {
      headerTitle = 'Weekly Report';
      periodText = `As at ${endDate.toLocaleDateString()}`;
  } else {
      headerTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
      periodText = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  // Generate Mission/Vision HTML Block if available
  let missionHtml = '';
  if (mandate || vision) {
    missionHtml = `
      <div class="mission-band">
        ${mandate ? `
        <div class="mission-block">
          <div class="mission-label">The Mandate</div>
          <div class="mission-text">${mandate}</div>
        </div>
        ` : ''}
        ${(mandate && vision) ? `<div class="mission-divider"></div>` : ''}
        ${vision ? `
        <div class="mission-block">
          <div class="mission-label">Vision &amp; Mission</div>
          <div class="mission-text">${vision}</div>
        </div>
        ` : ''}
      </div>
    `;
  }

  // Generate Income Breakdown Table
  let incomeHtml = '';
  if (showFin && reportData.financials && Object.keys(reportData.financials.incomeByCategory).length > 0) {
    incomeHtml = `
      <div class="section">
        <div class="section-title">Income Breakdown</div>
        <table class="data-table">
          <thead>
            <tr><th>Category</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${Object.entries(reportData.financials.incomeByCategory).map(([cat, amt]) => `<tr><td>${cat}</td><td>${sym}${amt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Generate Attendance Breakdown Table
  let attHtml = '';
  if (showAtt && reportData.attendance && Object.keys(reportData.attendance).length > 0) {
    attHtml = `
      <div class="section">
        <div class="section-title">Attendance Summary by Service</div>
        <table class="data-table">
          <thead>
            <tr><th>Service</th><th>Total Count</th></tr>
          </thead>
          <tbody>
            ${Object.entries(reportData.attendance).map(([srv, count]) => `<tr><td>${srv}</td><td>${count}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // DEEP DETAILS - Accounting Ledgers
  let detailedIncomeHtml = '';
  if (showFin && reportData.details && reportData.details.income && reportData.details.income.length > 0) {
    detailedIncomeHtml = `
      <div class="section">
        <div class="section-title">Comprehensive Income Ledger</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.details.income.map(row => `
              <tr>
                <td>${row.date}</td>
                <td>${row.category}</td>
                <td style="text-align:right">${sym}${row.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  let detailedExpenseHtml = '';
  if (showFin && reportData.details && reportData.details.expenses && reportData.details.expenses.length > 0) {
    detailedExpenseHtml = `
      <div class="section">
        <div class="section-title">Comprehensive Expense Ledger</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.details.expenses.map(row => `
              <tr>
                <td>${row.date}</td>
                <td><span style="color:var(--gold); font-weight:700">${row.category}</span></td>
                <td>${row.description || '---'}</td>
                <td style="text-align:right">${sym}${row.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  let detailedAttendanceHtml = '';
  if (showAtt && reportData.details && reportData.details.attendance && reportData.details.attendance.length > 0) {
    detailedAttendanceHtml = `
      <div class="section">
        <div class="section-title">Detailed Attendance Log</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Service Name</th>
              <th style="text-align:right">Adults</th>
              <th style="text-align:right">Children</th>
              <th style="text-align:right">Guests</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.details.attendance.map(row => `
              <tr>
                <td>${row.date}</td>
                <td>${row.service}</td>
                <td style="text-align:right">${row.adults.toLocaleString()}</td>
                <td style="text-align:right">${row.children.toLocaleString()}</td>
                <td style="text-align:right">${row.guests.toLocaleString()}</td>
                <td style="text-align:right"><strong>${row.count.toLocaleString()}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Build the Final HTML Document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${churchName} — ${headerTitle}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      <style>
        :root {
          --gold:       #C9A84C;
          --gold-light: #E8C96A;
          --gold-pale:  #F5E9C6;
          --navy:       #0D1B3E;
          --navy-mid:   #1A2E5A;
          --white:      #FDFAF3;
          --ink:        #1C1C1C;
          --muted:      #6B6B6B;
          --rule:       rgba(201,168,76,0.35);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #EDE8DE; font-family: 'Lato', sans-serif; color: var(--ink); min-height: 100vh; padding: 40px 20px 60px; }
        
        .page { max-width: 860px; margin: 0 auto; background: var(--white); box-shadow: 0 8px 60px rgba(13,27,62,0.18); border-top: 6px solid var(--gold); }
        
        .letterhead { background: var(--navy); padding: 0; position: relative; overflow: hidden; }
        .letterhead::before {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(-45deg, transparent, transparent 18px, rgba(201,168,76,0.04) 18px, rgba(201,168,76,0.04) 36px);
        }
        .letterhead-inner { position: relative; z-index: 1; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 20px; padding: 32px 40px 26px; }
        
        .emblem { width: 80px; height: 80px; border: 2px solid var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; background: white; }
        .emblem img { width: 100%; height: 100%; object-fit: contain; }
        .emblem svg { width: 52px; height: 52px; }
        
        .church-identity { text-align: center; }
        .church-name { font-family: 'Cinzel', serif; font-weight: 900; font-size: clamp(17px, 3vw, 26px); letter-spacing: 0.12em; color: var(--gold-light); line-height: 1.15; text-transform: uppercase; }
        .church-tagline { font-family: 'Playfair Display', serif; font-style: italic; color: rgba(255,255,255,0.55); font-size: 11.5px; margin-top: 5px; letter-spacing: 0.04em; }
        .gold-rule { width: 60%; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); margin: 8px auto 0; }
        
        .contact-block { text-align: right; flex-shrink: 0; }
        .contact-block p { font-size: 10px; color: rgba(255,255,255,0.6); line-height: 1.75; letter-spacing: 0.02em; }
        .contact-block a { color: var(--gold-light); text-decoration: none; }
        
        .address-strip { background: var(--navy-mid); border-top: 1px solid rgba(201,168,76,0.25); padding: 8px 40px; font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 0.06em; text-transform: uppercase; text-align: center; }
        
        .mission-band { background: var(--gold-pale); border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 18px 40px; display: grid; grid-template-columns: 1fr 1px 1fr; gap: 24px; align-items: start; }
        .mission-divider { background: var(--gold); opacity: 0.4; align-self: stretch; }
        .mission-label { font-family: 'Cinzel', serif; font-size: 8px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 5px; }
        .mission-text { font-family: 'Playfair Display', serif; font-size: 11px; line-height: 1.65; color: var(--navy-mid); font-style: italic; }
        
        .report-header { padding: 28px 40px 20px; border-bottom: 1px solid var(--rule); display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .report-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; color: var(--navy); letter-spacing: 0.08em; text-transform: uppercase; }
        .report-period { font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); border: 1px solid var(--gold); padding: 4px 12px; white-space: nowrap; }
        
        .report-body { padding: 32px 40px 40px; }
        
        .section { margin-bottom: 36px; }
        .section-title { font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--navy); padding-bottom: 8px; border-bottom: 2px solid var(--gold); margin-bottom: 18px; display: flex; align-items: center; gap: 10px; }
        .section-title::after { content: ''; flex: 1; height: 1px; background: var(--rule); }
        
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 24px; }
        .stat-card { border: 1px solid var(--rule); padding: 16px 18px; position: relative; background: #FDFAF3; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--gold); }
        .stat-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
        .stat-value { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700; color: var(--navy); line-height: 1.2; word-break: break-word; }
        
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table thead tr { background: var(--navy); }
        .data-table thead th { font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-light); padding: 10px 14px; text-align: left; }
        .data-table tbody tr { border-bottom: 1px solid var(--rule); }
        .data-table tbody tr:nth-child(even) { background: rgba(201,168,76,0.05); }
        .data-table tbody td { padding: 10px 14px; color: var(--ink); line-height: 1.5; }
        
        .report-footer { background: var(--navy); padding: 16px 40px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .footer-text { font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 0.06em; }
        .footer-brand { font-family: 'Cinzel', serif; font-size: 10px; color: var(--gold); letter-spacing: 0.15em; }
        
        @media print {
          body { background: white; padding: 0; }
          .page { box-shadow: none; max-width: 100%; border: none; }
          .report-footer { position: fixed; bottom: 0; left: 0; right: 0; }
        }
      </style>
    </head>
    <body>
    <div class="page">

      <header class="letterhead">
        <div class="letterhead-inner">
          <div class="emblem">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo"/>` : `
            <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="23" y="6" width="6" height="40" rx="1" fill="#C9A84C"/>
              <rect x="10" y="17" width="32" height="6" rx="1" fill="#C9A84C"/>
              <circle cx="26" cy="26" r="24" stroke="#C9A84C" stroke-width="1.5" stroke-dasharray="4 3"/>
            </svg>`}
          </div>
          <div class="church-identity">
            <div class="church-name">${churchName}</div>
            <div class="gold-rule"></div>
            <div class="church-tagline">${tagline}</div>
          </div>
          <div class="contact-block">
            <p>📞 ${phone}</p>
            <p><a href="mailto:${email}">${email}</a></p>
          </div>
        </div>
        <div class="address-strip">${address}</div>
      </header>

      ${missionHtml}

      <div class="report-header">
        <span class="report-title">${headerTitle}</span>
        <span class="report-period">${periodText}</span>
      </div>

      <main class="report-body">
        
        ${showFin && reportData.financials ? `
        <div class="section">
          <div class="section-title">Financial Summary</div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-label">${type === 'offering' ? 'Total Offering' : type === 'tithe' ? 'Total Tithe' : 'Total Income'}</div>
              <div class="stat-value">${sym}${reportData.financials.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            ${['full', 'financial', 'monthly'].includes(type) ? `
            <div class="stat-card">
              <div class="stat-label">Total Expenses</div>
              <div class="stat-value">${sym}${reportData.financials.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Balance</div>
              <div class="stat-value">${sym}${reportData.financials.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Calculated Tithe (10%)</div>
              <div class="stat-value">${sym}${reportData.financials.tithe.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        ${incomeHtml}
        ${detailedIncomeHtml}
        ${detailedExpenseHtml}
        ${attHtml}
        ${detailedAttendanceHtml}

      </main>

      <footer class="report-footer">
        <span class="footer-text">Printed: ${new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' })} &nbsp;|&nbsp; For internal church use only</span>
        <span class="footer-brand">${churchName}</span>
        <span class="footer-text">Page 1 of 1</span>
      </footer>

    </div>
    </body>
    </html>
  `;

  // publicDir creation removed for serverless compatibility

  if (apiKey) {
    try {
      const response = await axios.post('https://api.pdfshift.io/v3/convert/pdf', {
        source: htmlContent,
        landscape: false,
        use_print: false,
        margin: "0px"
      }, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('api:' + apiKey).toString('base64'),
          'Content-type': 'application/json'
        },
        responseType: 'arraybuffer'
      });
      
      // Return as base64 data URL
      const base64 = Buffer.from(response.data).toString('base64');
      return `data:application/pdf;base64,${base64}`;
    } catch (error) {
      console.warn('PDFShift generation failed. Returning printable HTML.');
      const base64Html = Buffer.from(htmlContent + '<script>window.onload = () => window.print();</script>').toString('base64');
      return `data:text/html;base64,${base64Html}`;
    }
  } else {
    const base64Html = Buffer.from(htmlContent + '<script>window.onload = () => window.print();</script>').toString('base64');
    return `data:text/html;base64,${base64Html}`;
  }
};
