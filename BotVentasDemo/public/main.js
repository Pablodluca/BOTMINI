let localId = '';
let archivos = [];

async function login() {
    const nombre = document.getElementById('nombre').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, password })
    });
    if(res.status !== 200) return alert('Usuario o contraseña incorrecta');
    const data = await res.json();
    localId = data.id;
    archivos = data.archivos;
    document.getElementById('login').style.display = 'none';
    document.getElementById('panel').style.display = 'block';
    mostrarArchivos();
}

function mostrarArchivos() {
    const list = document.getElementById('archivosList');
    list.innerHTML = '';
    archivos.forEach((a, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${a.tipo}: <a href="${a.url}" target="_blank">${a.nombreArchivo}</a> 
                        <button onclick="eliminarArchivo(${index})">Eliminar</button>`;
        list.appendChild(li);
    });
}

async function subirArchivo() {
    const input = document.getElementById('archivoInput');
    const tipo = document.getElementById('tipo').value;
    if(!input.files.length) return alert('Selecciona un archivo');
    const file = input.files[0];
    if(tipo === 'video' && file.size > 5*1024*1024) return alert('Video demasiado grande');
    const form = new FormData();
    form.append('archivo', file);
    form.append('tipo', tipo);
    const res = await fetch(`/upload/${localId}`, { method: 'POST', body: form });
    const data = await res.json();
    archivos.push(data.archivo);
    mostrarArchivos();
}

async function eliminarArchivo(index) {
    await fetch(`/archivo/${localId}/${index}`, { method: 'DELETE' });
    archivos.splice(index, 1);
    mostrarArchivos();
}
