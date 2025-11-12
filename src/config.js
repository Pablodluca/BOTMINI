const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');
require('dotenv').config();

// Inicializa el SDK de Firebase Admin.
// Buscará las credenciales de la misma forma que Firestore (GOOGLE_APPLICATION_CREDENTIALS).
admin.initializeApp({
  projectId: process.env.GCP_PROJECT_ID,
});

// Inicializa el cliente de Firestore con configuración explícita
const db = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
});

const auth = admin.auth();

module.exports = { db, auth };