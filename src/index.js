const express = require('express');
const path = require('path'); // Módulo nativo de Node para manejar rutas de archivos
const { db, auth } = require('./config'); // Importar la instancia de la base de datos y de auth
const { generateResponse } = require('./gemini-service'); // Importar el servicio de Gemini

const app = express();
// El puerto será proporcionado por el entorno en la nube (como Cloud Run) o será 3000 si se ejecuta localmente.
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware para parsear JSON
app.use(express.json());

// --- MIDDLEWARE DE AUTENTICACIÓN ---
async function verifyAuthToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).send('Acceso no autorizado: Token no proporcionado.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken; // Añade la información del usuario decodificada a la petición
    next();
  } catch (error) {
    console.error('Error verificando el token: - index.js:31', error);
    res.status(403).send('Acceso no autorizado: Token inválido.');
  }
}

// --- RUTAS ---
// Raíz
app.get('/', (req, res) => {
  res.send('Bot de ventas multitienda activo ✅');
});

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/register', async (req, res) => {
  const { email, password, nombreTienda } = req.body;
  try {
    const userRecord = await auth.createUser({ email, password });
    // Ahora creamos la tienda en Firestore, usando el UID del usuario como ID del documento.
    await db.collection('tiendas').doc(userRecord.uid).set({ nombre: nombreTienda, owner: userRecord.uid });
    res.status(201).json({ message: 'Tienda registrada exitosamente.', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: 'Error al registrar la tienda: ' + error.message });
  }
});

// --- API para el Chatbot con Gemini ---
app.post('/chat/:tiendaId', async (req, res) => {
  const { tiendaId } = req.params;
  try {
    // 1. Obtener los datos de la tienda específica desde Firestore.
    const tiendaDoc = await db.collection('tiendas').doc(tiendaId).get();
    if (!tiendaDoc.exists) {
      return res.status(404).json({ error: 'Tienda no encontrada.' });
    }
    const tiendaData = tiendaDoc.data();

    // 2. Construir el prompt de sistema DINÁMICO con los datos de la tienda.
    const systemPrompt = `
      Eres el asistente de ventas de la tienda "${tiendaData.nombre}".
      Descripción del negocio: ${tiendaData.descripcion}.
      Horario: ${tiendaData.horario}.
      Dirección: ${tiendaData.direccion}.
      Tu objetivo es responder preguntas de los clientes y ayudarles a comprar.
    `;

    // 3. Cargar la base de conocimiento aprendida (si existe).
    const knowledgeSnapshot = await db.collection('tiendas').doc(tiendaId).collection('conocimiento').get();
    let knowledgeBase = "";
    knowledgeSnapshot.forEach(doc => {
      const data = doc.data();
      knowledgeBase += `Pregunta: ${data.pregunta}\nRespuesta: ${data.respuesta}\n\n`;
    });

    const userMessage = req.body.prompt || "";

    // 4. Llamar a Gemini con todo el contexto.
    const respuesta = await generateResponse(systemPrompt, knowledgeBase, userMessage);

    // 5. Implementar la lógica de aprendizaje.
    if (respuesta.trim() === 'NO_SE') {
      // El bot no sabe la respuesta.
      // Guardar la pregunta para que el dueño la responda.
      await db.collection('tiendas').doc(tiendaId).collection('preguntas_sin_respuesta').add({
        pregunta: userMessage,
        fecha: new Date()
      });

      // Aquí enviarías una notificación al dueño de la tienda.

      res.json({ respuesta: "Mmm, esa es una buena pregunta. Déjame consultarlo con el personal de la tienda y te responderé en breve." });

    } else {
      // El bot supo responder.
      res.json({ respuesta });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API para Productos (Ruta Protegida) ---
// Solo un usuario autenticado puede añadir productos a SU PROPIA tienda.
app.post('/productos', verifyAuthToken, async (req, res) => {
  const { uid } = req.user; // Obtenemos el UID del token verificado
  const productoData = req.body;

  try {
    // Guardamos el producto en la subcolección de la tienda del usuario autenticado.
    const docRef = await db.collection('tiendas').doc(uid).collection('productos').add(productoData);
    res.json({ status: 'ok', id: docRef.id, data: productoData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta para obtener los productos de una tienda específica (puede ser pública o protegida)
app.get('/tiendas/:tiendaId/productos', async (req, res) => {
  const { tiendaId } = req.params;
  try {
    const snapshot = await db.collection('tiendas').doc(tiendaId).collection('productos').get();
    const productos = [];
    snapshot.forEach(doc => {
      productos.push({ id: doc.id, ...doc.data() });
    });
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RUTA PARA LA PÁGINA PÚBLICA DE LA TIENDA ---
app.get('/tienda/:tiendaId', (req, res) => {
  // Simplemente sirve el archivo HTML. La lógica para cargar datos está en el frontend.
  res.sendFile(path.join(__dirname, '..', 'public', 'tienda.html'));
});

// --- ARRANQUE DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT} - index.js:148`);
});
