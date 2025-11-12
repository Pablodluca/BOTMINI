const { Firestore } = require('@google-cloud/firestore');

// Inicializa el cliente de Firestore.
// Al igual que en el servidor, buscará las credenciales automáticamente.
const db = new Firestore();

async function main() {
  try {
    console.log('Inicializando conexión con Firestore...');

    // Seleccionamos la colección 'usuarios' (o cualquier otra que quieras probar)
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.get();

    console.log('✅ Conexión exitosa a Firestore.');
    console.log('Usuarios en la DB:');
    snapshot.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
  } catch (err) {
    console.error('Error de conexión:', err);
  }
}

main();