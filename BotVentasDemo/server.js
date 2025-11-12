require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.log(err));

const localSchema = new mongoose.Schema({
    nombre: String,
    password: String,
    archivos: [{ tipo: String, url: String, nombreArchivo: String }]
});
const Local = mongoose.model('Local', localSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/login', async (req, res) => {
    const { nombre, password } = req.body;
    const local = await Local.findOne({ nombre, password });
    if (!local) return res.status(401).json({ msg: 'Usuario o contraseña incorrecta' });
    res.json({ id: local._id, nombre: local.nombre, archivos: local.archivos });
});

app.post('/upload/:localId', upload.single('archivo'), async (req, res) => {
    const { localId } = req.params;
    const { tipo } = req.body;
    const url = `/uploads/${req.file.filename}`;
    const local = await Local.findById(localId);
    if (!local) return res.status(404).json({ msg: 'Local no encontrado' });
    local.archivos.push({ tipo, url, nombreArchivo: req.file.originalname });
    await local.save();
    res.json({ msg: 'Archivo subido', archivo: { tipo, url, nombreArchivo: req.file.originalname } });
});

app.delete('/archivo/:localId/:archivoIndex', async (req, res) => {
    const { localId, archivoIndex } = req.params;
    const local = await Local.findById(localId);
    if (!local) return res.status(404).json({ msg: 'Local no encontrado' });
    local.archivos.splice(archivoIndex, 1);
    await local.save();
    res.json({ msg: 'Archivo eliminado' });
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
