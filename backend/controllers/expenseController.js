const { db, admin } = require('../config/firebase');

exports.createExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    if (!category) return res.status(400).json({ error: 'Category is required' });
    
    const docRef = await db.collection(`churches/${req.user.churchId}/expenses`).add({
      amount: Number(amount),
      category,
      description: description || '',
      date: date ? admin.firestore.Timestamp.fromDate(new Date(date)) : admin.firestore.Timestamp.now(),
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id, message: 'Expense recorded successfully' });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listExpenses = async (req, res) => {
  try {
    const snapshot = await db.collection(`churches/${req.user.churchId}/expenses`).orderBy('date', 'desc').get();
    const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate() }));
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error listing expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, date } = req.body;
    
    const updateData = {};
    if (amount) updateData.amount = Number(amount);
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (date) updateData.date = admin.firestore.Timestamp.fromDate(new Date(date));
    
    await db.collection(`churches/${req.user.churchId}/expenses`).doc(id).update(updateData);
    res.status(200).json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection(`churches/${req.user.churchId}/expenses`).doc(id).delete();
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
