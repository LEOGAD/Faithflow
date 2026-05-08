const { db, admin } = require('../config/firebase');

exports.createMember = async (req, res) => {
  try {
    const { name, status, email, phone, joinDate } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const docRef = await db.collection('members').add({
      name,
      status: status || 'Visitor',
      email: email || '',
      phone: phone || '',
      joinDate: joinDate ? admin.firestore.Timestamp.fromDate(new Date(joinDate)) : admin.firestore.Timestamp.now(),
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id, message: 'Member recorded successfully' });
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listMembers = async (req, res) => {
  try {
    const snapshot = await db.collection('members').orderBy('name', 'asc').get();
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), joinDate: doc.data().joinDate?.toDate() }));
    res.status(200).json(members);
  } catch (error) {
    console.error('Error listing members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, email, phone, joinDate } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (joinDate) updateData.joinDate = admin.firestore.Timestamp.fromDate(new Date(joinDate));
    
    await db.collection('members').doc(id).update(updateData);
    res.status(200).json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('members').doc(id).delete();
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
