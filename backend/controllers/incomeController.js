const { db, admin } = require('../config/firebase');

exports.createIncome = async (req, res) => {
  try {
    const { amount, category, service_id, date } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    if (!category) return res.status(400).json({ error: 'Category is required' });
    
    const docRef = await db.collection(`churches/${req.user.churchId}/income`).add({
      amount: Number(amount),
      category,
      service_id: service_id || null,
      date: date ? admin.firestore.Timestamp.fromDate(new Date(date)) : admin.firestore.Timestamp.now(),
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id, message: 'Income recorded successfully' });
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listIncome = async (req, res) => {
  try {
    const snapshot = await db.collection(`churches/${req.user.churchId}/income`).orderBy('date', 'desc').get();
    const income = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate() }));
    res.status(200).json(income);
  } catch (error) {
    console.error('Error listing income:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, service_id, date } = req.body;
    
    const updateData = {};
    if (amount) updateData.amount = Number(amount);
    if (category) updateData.category = category;
    if (service_id) updateData.service_id = service_id;
    if (date) updateData.date = admin.firestore.Timestamp.fromDate(new Date(date));
    
    await db.collection(`churches/${req.user.churchId}/income`).doc(id).update(updateData);
    res.status(200).json({ message: 'Income updated successfully' });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(`churches/${req.user.churchId}/income`).doc(id).delete();
    res.status(200).json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
