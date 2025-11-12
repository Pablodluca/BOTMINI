# 1. Usa una imagen oficial de Node.js como base.
# Usamos la versión 18, que es estable y recomendada.
FROM node:18-slim

# 2. Establece el directorio de trabajo dentro del contenedor.
WORKDIR /usr/src/app

# 3. Copia los archivos de dependencias.
COPY package*.json ./

# 4. Instala las dependencias de producción.
RUN npm install --only=production

# 5. Copia el resto del código de tu aplicación.
COPY . .

# 6. Expone el puerto en el que se ejecuta tu aplicación.
EXPOSE 3000

# 7. El comando para iniciar tu aplicación cuando el contenedor arranque.
CMD [ "node", "src/index.js" ]