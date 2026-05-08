const { db, admin } = require('../config/firebase');

exports.createAttendance = async (req, res) => {
  try {
    const { service_id, service_name, date, count } = req.body;
    
    if (count === undefined || count < 0) return res.status(400).json({ error: 'Valid count is required' });
    if (!service_name) return res.status(400).json({ error: 'Service name is required' });
    
    const docRef = await db.collection(`churches/${req.user.churchId}/attendance`).add({
      service_id: service_id || null,
      service_name,
      count: Number(count),
      date: date ? admin.firestore.Timestamp.fromDate(new Date(date)) : admin.firestore.Timestamp.now(),
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id, message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listAttendance = async (req, res) => {
  try {
    const snapshot = await db.collection(`churches/${req.user.churchId}/attendance`).orderBy('date', 'desc').get();
    const attendance = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate() }));
    res.status(200).json(attendance);
  } catch (error) {
    console.error('Error listing attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { service_id, service_name, count, date } = req.body;
    
    const updateData = {};
    if (service_id) updateData.service_id = service_id;
    if (service_name) updateData.service_name = service_name;
    if (count !== undefined) updateData.count = Number(count);
    if (date) updateData.date = admin.firestore.Timestamp.fromDate(new Date(date));
    
    await db.collection(`churches/${req.user.churchId}/attendance`).doc(id).update(updateData);
    res.status(200).json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(`churches/${req.user.churchId}/attendance`).doc(id).delete();
    res.status(200).json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
