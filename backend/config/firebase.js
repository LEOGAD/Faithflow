const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let db;
let isLocal = false;

// Local DB fallback path
const LOCAL_DB_PATH = path.join(__dirname, '../local_db.json');

// Helper to initialize local DB if needed
const initLocalDb = () => {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({
      users: [],
      income: [],
      expenses: [],
      attendance: [],
      members: []
    }, null, 2));
  }
  isLocal = true;
  console.log('--- RESILIENT ENGINE: Using Local File Database ---');
};

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Handle JSON string directly (e.g. from Vercel Env Vars)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase initialized with SERVICE_ACCOUNT_JSON.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    // Handle local file path
    const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase initialized with service account path.');
  } else {
    // If no service account, check if we are in a cloud environment
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      db = admin.firestore();
      console.log('Firebase initialized with Cloud Credentials.');
    } else {
      // FALLBACK TO LOCAL JSON ENGINE
      initLocalDb();
    }
  }
} catch (error) {
  console.error('Firebase failed, falling back to Local DB:', error.message);
  initLocalDb();
}

// Resilient DB Wrapper to handle both Firestore and Local JSON
const dbWrapper = {
  collection: (name) => {
    if (!isLocal) {
      const col = db.collection(name);
      return {
        add: (data) => col.add(data),
        get: () => col.get(),
        doc: (id) => col.doc(id),
        where: (field, op, val) => col.where(field, op, val),
        orderBy: (field, dir) => col.orderBy(field, dir)
      };
    } else {
      // Mock Firestore API using local JSON
      const safeName = name.replace(/\//g, '_');
      const ensureCollection = (store) => {
        if (!store[safeName]) store[safeName] = [];
      };
      return {
        add: async (data) => {
          const raw = fs.readFileSync(LOCAL_DB_PATH);
          const store = JSON.parse(raw);
          ensureCollection(store);
          const id = Math.random().toString(36).substr(2, 9);
          const newItem = { id, ...data };
          store[safeName].push(newItem);
          fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2));
          return { id };
        },
        get: async () => {
          const raw = fs.readFileSync(LOCAL_DB_PATH);
          const store = JSON.parse(raw);
          ensureCollection(store);
          const docs = store[safeName].map(item => ({
            id: item.id,
            data: () => {
                let parsedDate;
                if (item.date) {
                    if (item.date._seconds) {
                        parsedDate = { toDate: () => new Date(item.date._seconds * 1000) };
                    } else {
                        parsedDate = { toDate: () => new Date(item.date) };
                    }
                }
                return { ...item, date: parsedDate };
            }
          }));
          return { docs, empty: docs.length === 0 };
        },
        doc: (id) => {
          if (!id) id = Math.random().toString(36).substr(2, 9);
          return {
            id,
            get: async () => {
            const raw = fs.readFileSync(LOCAL_DB_PATH);
            const store = JSON.parse(raw);
            ensureCollection(store);
            const item = store[safeName].find(i => i.id === id || i.id === id); // id match
            if (item) {
                return { exists: true, id: item.id, data: () => item };
            }
            return { exists: false };
          },
          set: async (data, options) => {
            const raw = fs.readFileSync(LOCAL_DB_PATH);
            const store = JSON.parse(raw);
            ensureCollection(store);
            const idx = store[safeName].findIndex(i => i.id === id);
            if (idx !== -1) {
              if (options && options.merge) {
                  store[safeName][idx] = { ...store[safeName][idx], ...data };
              } else {
                  store[safeName][idx] = { id, ...data };
              }
            } else {
              store[safeName].push({ id, ...data });
            }
            fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2));
          },
          update: async (data) => {
            const raw = fs.readFileSync(LOCAL_DB_PATH);
            const store = JSON.parse(raw);
            ensureCollection(store);
            const idx = store[safeName].findIndex(i => i.id === id);
            if (idx !== -1) {
              store[safeName][idx] = { ...store[safeName][idx], ...data };
              fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2));
            } else {
              throw new Error("Document not found");
            }
          },
          delete: async () => {
            const raw = fs.readFileSync(LOCAL_DB_PATH);
            const store = JSON.parse(raw);
            ensureCollection(store);
            store[safeName] = store[safeName].filter(i => i.id !== id);
            fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2));
          }
        };
        },
        where: (field, op, val) => ({
          get: async () => {
            const raw = fs.readFileSync(LOCAL_DB_PATH);
            const store = JSON.parse(raw);
            ensureCollection(store);
            let filtered = store[safeName].filter(item => {
                if (op === '==') return item[field] === val;
                return true;
            });
            const docs = filtered.map(item => ({
              id: item.id,
              data: () => ({ ...item, date: item.date ? { toDate: () => new Date(item.date) } : undefined })
            }));
            return { docs, empty: docs.length === 0 };
          }
        }),
        orderBy: (field, dir) => ({
           get: async () => {
                const raw = fs.readFileSync(LOCAL_DB_PATH);
                const store = JSON.parse(raw);
                ensureCollection(store);
                const docs = store[safeName].map(item => ({
                  id: item.id,
                  data: () => ({ ...item, date: item.date ? { toDate: () => new Date(item.date) } : undefined })
                }));
                return { docs, empty: docs.length === 0 };
           }
        })
      };
    }
  }
};

module.exports = { admin, db: dbWrapper, isLocal };
