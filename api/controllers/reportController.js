const { db, admin } = require('../config/firebase');
const pdfService = require('../services/pdfService');

const getReportData = async (startDate, endDate, churchId, reportType = 'full') => {
  if (!churchId) throw new Error('Unauthorized');
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  let totalIncome = 0;
  const incomeByCategory = {};
  const incomeByService = {};
  let totalExpenses = 0;
  const attendanceByService = {};
  
  const detailedIncome = [];
  const detailedExpenses = [];
  const detailedAttendance = [];

  // Helper to check if a category matches offering/tithe
  const isMatch = (str, target) => str && target && str.toLowerCase().includes(target.toLowerCase());

  const parseDate = (d) => {
    if (!d) return 0;
    if (d.toDate) return d.toDate().getTime();
    if (d._seconds) return d._seconds * 1000;
    return new Date(d).getTime();
  };

  // Fetch Income if needed
  if (['full', 'financial', 'offering', 'tithe', 'monthly', 'weekly'].includes(reportType)) {
    const incomeSnap = await db.collection(`churches/${churchId}/income`).get();
    incomeSnap.docs.forEach(doc => {
      const data = doc.data();
      const docTime = parseDate(data.date);
      if (docTime >= startTimestamp && docTime <= endTimestamp) {
        // Filter logic
        if (reportType === 'offering' && !isMatch(data.category, 'offering')) return;
        if (reportType === 'tithe' && !isMatch(data.category, 'tithe')) return;

        totalIncome += data.amount;
        if (data.category) {
          incomeByCategory[data.category] = (incomeByCategory[data.category] || 0) + data.amount;
        }
        if (data.service_id) {
          incomeByService[data.service_id] = (incomeByService[data.service_id] || 0) + data.amount;
        }
        detailedIncome.push({
          date: new Date(docTime).toLocaleDateString(),
          timestamp: docTime,
          category: data.category || 'Uncategorized',
          amount: data.amount,
          id: doc.id
        });
      }
    });
    // Sort by timestamp
    detailedIncome.sort((a,b) => a.timestamp - b.timestamp);
  }

  // Fetch Expenses if needed
  if (['full', 'financial', 'monthly', 'weekly'].includes(reportType)) {
    const expenseSnap = await db.collection(`churches/${churchId}/expenses`).get();
    expenseSnap.docs.forEach(doc => {
      const data = doc.data();
      const docTime = parseDate(data.date);
      if (docTime >= startTimestamp && docTime <= endTimestamp) {
        totalExpenses += data.amount;
        detailedExpenses.push({
          date: new Date(docTime).toLocaleDateString(),
          timestamp: docTime,
          category: data.category || 'General',
          description: data.description || '',
          amount: data.amount,
          id: doc.id
        });
      }
    });
    detailedExpenses.sort((a,b) => a.timestamp - b.timestamp);
  }

  // Fetch Attendance if needed
  if (['full', 'attendance', 'monthly', 'weekly'].includes(reportType)) {
    const attendanceSnap = await db.collection(`churches/${churchId}/attendance`).get();
    attendanceSnap.docs.forEach(doc => {
      const data = doc.data();
      const docTime = parseDate(data.date);
      if (docTime >= startTimestamp && docTime <= endTimestamp) {
        if (data.service_name) {
          attendanceByService[data.service_name] = (attendanceByService[data.service_name] || 0) + data.count;
          detailedAttendance.push({
            date: new Date(docTime).toLocaleDateString(),
            timestamp: docTime,
            service: data.service_name,
            adults: data.adults || 0,
            children: data.children || 0,
            guests: data.guests || 0,
            count: data.count,
            id: doc.id
          });
        }
      }
    });
    detailedAttendance.sort((a,b) => a.timestamp - b.timestamp);
  }

  // Fetch church profile from settings
  let churchProfile = { currency: 'USD' };
  try {
    const settingsSnap = await db.collection(`churches/${churchId}/settings`).doc('config').get();
    if (settingsSnap.exists) {
      churchProfile = settingsSnap.data().church_profile || churchProfile;
    }
  } catch(e) {
    console.error("Failed to fetch church profile:", e);
  }

  const balance = totalIncome - totalExpenses;

  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    reportType,
    currency: churchProfile.currency || 'USD',
    churchProfile,
    financials: {
      totalIncome,
      totalExpenses,
      balance,
      tithe: totalIncome * 0.10, // 10% calculated tithe if not specific
      incomeByCategory,
      incomeByService
    },
    attendance: attendanceByService,
    details: {
        income: detailedIncome,
        expenses: detailedExpenses,
        attendance: detailedAttendance
    }
  };
};

exports.getAvailablePeriods = async (req, res) => {
  try {
    const churchId = req.user.churchId;
    const [inc, exp, att] = await Promise.all([
      db.collection(`churches/${churchId}/income`).get(),
      db.collection(`churches/${churchId}/expenses`).get(),
      db.collection(`churches/${churchId}/attendance`).get()
    ]);
    
    const parseDateObj = (d) => {
        if (!d) return null;
        if (d.toDate) return d.toDate();
        if (d._seconds) return new Date(d._seconds * 1000);
        return new Date(d);
    };

    const dates = [];
    [...inc.docs, ...exp.docs, ...att.docs].forEach(d => {
      const data = d.data();
      if (data.date) {
        const date = parseDateObj(data.date);
        if (date && !isNaN(date.getTime())) dates.push(date);
      }
    });
    
    if (dates.length === 0) return res.json({ years: [], months: [] });
    
    const years = [...new Set(dates.map(d => d.getFullYear()))].sort((a,b) => b - a);
    const months = [...new Set(dates.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`))].sort().reverse();
    
    res.json({ years, months });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.generateCustomReport = async (req, res) => {
  try {
    const { timeframe, periodValue, reportType } = req.body;
    let startDate, endDate;
    const now = new Date();
    
    if (timeframe === 'weekly') {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
    } else if (timeframe === 'monthly' && periodValue) {
      // periodValue: 'YYYY-MM'
      const [year, month] = periodValue.split('-');
      startDate = new Date(year, parseInt(month) - 1, 1);
      endDate = new Date(year, parseInt(month), 0, 23, 59, 59);
    } else if (timeframe === 'quarterly' && periodValue) {
      // periodValue: 'YYYY-QX'
      const [year, qStr] = periodValue.split('-Q');
      const q = parseInt(qStr);
      startDate = new Date(year, (q - 1) * 3, 1);
      endDate = new Date(year, q * 3, 0, 23, 59, 59);
    } else if (timeframe === 'yearly' && periodValue) {
      const year = parseInt(periodValue);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      // Default to this month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    // Ensure valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    const reportData = await getReportData(startDate, endDate, req.user.churchId, reportType);
    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const reportData = await getReportData(startDate, endDate, req.user.churchId);
    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const reportData = await getReportData(startDate, endDate, req.user.churchId);
    res.status(200).json(reportData);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.generatePdf = async (req, res) => {
  try {
    const { timeframe, periodValue, reportType } = req.body;
    const type = timeframe || 'monthly'; // fallback
    let startDate, endDate;
    const now = new Date();
    
    if (type === 'weekly') {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
    } else if (type === 'monthly' && periodValue) {
      const [year, month] = periodValue.split('-');
      startDate = new Date(year, parseInt(month) - 1, 1);
      endDate = new Date(year, parseInt(month), 0, 23, 59, 59);
    } else if (type === 'quarterly' && periodValue) {
      const [year, qStr] = periodValue.split('-Q');
      const q = parseInt(qStr);
      startDate = new Date(year, (q - 1) * 3, 1);
      endDate = new Date(year, q * 3, 0, 23, 59, 59);
    } else if (type === 'yearly' && periodValue) {
      const year = parseInt(periodValue);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Ensure valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const reportData = await getReportData(startDate, endDate, req.user.churchId, reportType);
    
    let typeName = 'Full Report';
    if(reportType === 'financial') typeName = 'Financial Report';
    if(reportType === 'attendance') typeName = 'Attendance Report';
    if(reportType === 'offering') typeName = 'Offering Report';
    if(reportType === 'tithe') typeName = 'Tithe Report';
    
    const title = `${typeName} - ${type.toUpperCase()}`;

    // Call PDF service to generate the document
    const pdfUrl = await pdfService.generateReportPdf(reportData, title);
    
    res.status(200).json({ 
      message: 'PDF generated successfully',
      url: pdfUrl 
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Internal server error while generating PDF' });
  }
};
