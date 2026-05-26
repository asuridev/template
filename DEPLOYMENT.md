# Guía de Despliegue

Esta aplicación es un **monolito Angular SSR + Express BFF** que sirve el frontend y la API REST desde un único proceso Node.js.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev:start` | **Desarrollo — primera vez.** Compila una vez y activa modo watch. |
| `npm run dev` | **Desarrollo — reinicios.** Requiere que `dist/` ya exista. |
| `npm run build:ssr` | Compilación de producción. |
| `npm run serve:ssr` | Inicia el servidor compilado. |

---

## Desarrollo local

### Primera vez (sin `dist/`)

```bash
npm run dev:start
```

Esto ejecuta secuencialmente:
1. `ng build --configuration development` — compilación inicial completa
2. `ng build --watch` — reconstruye al detectar cambios en `src/`
3. `node --watch dist/template/server/server.mjs` — reinicia el servidor cuando el build actualiza `dist/`

La aplicación queda disponible en **http://localhost:4000**

### Reinicios posteriores (cuando `dist/` ya existe)

```bash
npm run dev
```

### Variables de entorno en desarrollo

Crear o editar el archivo `.env` en la raíz:

```env
PORT=4000
DB_PATH=./data/partners.db
STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_URL=http://localhost:4000/uploads
KEYCLOAK_URL=https://auth.midominio.com
KEYCLOAK_ADMIN_REALM=master
CORS_ALLOWED_ORIGINS=http://localhost:4000
```

---

## Producción

### Requisitos

- Node.js 22+
- Los directorios `data/` y `uploads/` deben existir y tener permisos de escritura
- Variables de entorno configuradas (ver sección Variables)

### Compilar

```bash
npm run build:ssr
```

Genera `dist/template/` con:
- `dist/template/browser/` — assets estáticos del frontend
- `dist/template/server/server.mjs` — servidor Express + Angular SSR

### Iniciar manualmente

```bash
node dist/template/server/server.mjs
```

---

## Producción con PM2 (recomendado)

[PM2](https://pm2.keymetrics.io) es un gestor de procesos para Node.js que mantiene el servidor activo, lo reinicia ante fallos y gestiona logs.

### Instalación

```bash
npm install -g pm2
```

### Archivo de configuración `ecosystem.config.cjs`

Crear en la raíz del proyecto:

```js
module.exports = {
  apps: [
    {
      name: 'bnp-template',
      script: './dist/template/server/server.mjs',
      instances: 1,          // SQLite solo soporta un escritor
      exec_mode: 'fork',
      node_args: '--experimental-vm-modules',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        DB_PATH: './data/partners.db',
        STORAGE_LOCAL_PATH: './uploads',
        STORAGE_PUBLIC_URL: 'https://midominio.com/uploads',
        KEYCLOAK_URL: 'https://auth.midominio.com',
        KEYCLOAK_ADMIN_REALM: 'master',
        CORS_ALLOWED_ORIGINS: 'https://midominio.com',
      },
    },
  ],
};
```

> **Importante:** `instances: 1` con `exec_mode: 'fork'` es obligatorio. SQLite no soporta múltiples escritores concurrentes. No usar `cluster` mode.

### Comandos PM2

```bash
# Iniciar
pm2 start ecosystem.config.cjs --env production

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs bnp-template

# Reiniciar tras un redeploy
pm2 restart bnp-template

# Detener
pm2 stop bnp-template

# Configurar arranque automático con el sistema operativo
pm2 startup
pm2 save
```

### Flujo completo de redeploy con PM2

```bash
# 1. Obtener los últimos cambios
git pull

# 2. Instalar dependencias si cambiaron
npm ci --legacy-peer-deps

# 3. Compilar para producción
npm run build:ssr

# 4. Reiniciar el servidor (cero downtime si hay ≥2 instancias, recarga directa con 1)
pm2 restart bnp-template
```

---

## Producción con Docker

### `Dockerfile`

```dockerfile
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build:ssr

FROM node:22-slim AS runtime
WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Crear directorios con permisos correctos
RUN mkdir -p data uploads && chown -R node:node data uploads

USER node

EXPOSE 4000
CMD ["node", "dist/template/server/server.mjs"]
```

### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "4000:4000"
    volumes:
      - ./data:/app/data        # persistir SQLite
      - ./uploads:/app/uploads  # persistir archivos subidos
    environment:
      NODE_ENV: production
      PORT: 4000
      DB_PATH: ./data/partners.db
      STORAGE_LOCAL_PATH: ./uploads
      STORAGE_PUBLIC_URL: https://midominio.com/uploads
      KEYCLOAK_URL: https://auth.midominio.com
      KEYCLOAK_ADMIN_REALM: master
      CORS_ALLOWED_ORIGINS: https://midominio.com
```

> **Crítico:** Los volúmenes `./data` y `./uploads` deben montarse para que los datos persistan entre deployments. Sin ellos, la base de datos se pierde al recrear el contenedor.

```bash
# Iniciar
docker compose up -d

# Ver logs
docker compose logs -f app

# Redeploy
docker compose build && docker compose up -d
```

---

## Variables de entorno en producción

| Variable | Requerida | Descripción | Ejemplo |
|---|---|---|---|
| `PORT` | No (default: 4000) | Puerto del servidor | `4000` |
| `DB_PATH` | No (default: `./data/partners.db`) | Ruta al archivo SQLite | `./data/partners.db` |
| `STORAGE_LOCAL_PATH` | No (default: `./uploads`) | Directorio de archivos subidos | `./uploads` |
| `STORAGE_PUBLIC_URL` | Sí | URL pública base para assets | `https://midominio.com/uploads` |
| `KEYCLOAK_URL` | Sí (para auth) | URL base de Keycloak | `https://auth.midominio.com` |
| `KEYCLOAK_ADMIN_REALM` | Sí (para auth) | Realm de Keycloak | `master` |
| `CORS_ALLOWED_ORIGINS` | Sí | Orígenes permitidos (separados por coma) | `https://midominio.com` |

---

## Nginx como reverse proxy (recomendado)

En producción es recomendable poner Nginx delante del servidor Node para manejar SSL, compresión y caché de assets estáticos.

```nginx
server {
    listen 443 ssl;
    server_name midominio.com;

    ssl_certificate     /etc/ssl/certs/midominio.crt;
    ssl_certificate_key /etc/ssl/private/midominio.key;

    # Caché de assets estáticos del browser bundle
    location /assets/ {
        proxy_pass http://localhost:4000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Todo lo demás (API + SSR) al servidor Node
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Backup de base de datos (Litestream)

Ver [LITESTREAM.md](./LITESTREAM.md) para la configuración de replicación continua del archivo SQLite a un bucket cloud (S3/GCS/Azure).

---

## Checklist pre-producción

- [ ] `.env` configurado con todas las variables requeridas
- [ ] Directorios `data/` y `uploads/` creados con permisos de escritura
- [ ] `npm run build:ssr` ejecutado sin errores
- [ ] `CORS_ALLOWED_ORIGINS` apunta solo al dominio de producción
- [ ] `STORAGE_PUBLIC_URL` apunta a la URL pública real
- [ ] Backup del `partners.db` configurado (Litestream o cron)
- [ ] PM2 o Docker configurado para reinicio automático
- [ ] Nginx configurado con SSL
