# Litestream — Replicación continua de SQLite a Cloud Storage

## ¿Qué es Litestream?

[Litestream](https://litestream.io) es una herramienta que replica de forma continua un archivo SQLite a un bucket de almacenamiento en la nube (S3, GCS, Azure Blob, etc.) usando el mecanismo WAL (Write-Ahead Log). El archivo `.db` sigue viviendo **localmente** en el servidor, lo que mantiene la latencia de SQLite en microsegundos, pero cada escritura queda respaldada en la nube en tiempo casi real.

---

## Arquitectura

```
┌─────────────────────────────────┐
│  Node.js / Angular SSR Server   │
│                                 │
│  better-sqlite3 ──► partners.db │◄── lectura/escritura local
│                          │      │
│                    Litestream   │
│                    (sidecar)    │
└──────────────────────┬──────────┘
                       │ WAL stream (casi tiempo real)
                       ▼
               ┌───────────────┐
               │  Cloud Bucket │  (S3 / GCS / Azure)
               │  partners.db  │
               └───────────────┘
```

Litestream corre como proceso secundario junto al servidor. Monitorea el WAL de SQLite y sube los cambios al bucket de forma incremental.

---

## Instalación

### Linux / macOS
```bash
# Debian/Ubuntu
wget https://github.com/benbjohnson/litestream/releases/latest/download/litestream-v0.3.13-linux-amd64.deb
dpkg -i litestream-v0.3.13-linux-amd64.deb

# macOS
brew install litestream
```

### Windows
Descargar el binario desde https://github.com/benbjohnson/litestream/releases y agregar al PATH.

### Docker (recomendado para producción)
```dockerfile
FROM litestream/litestream:latest AS litestream
FROM node:22-slim

COPY --from=litestream /usr/local/bin/litestream /usr/local/bin/litestream

WORKDIR /app
COPY dist/template ./dist/template
COPY litestream.yml ./litestream.yml

# Script de inicio: restaura el DB si no existe, luego corre ambos procesos
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
```

---

## Configuración

### `litestream.yml` (en la raíz del proyecto)

```yaml
dbs:
  - path: ./data/partners.db
    replicas:
      - type: s3
        bucket: mi-bucket-nombre
        path: backups/partners.db
        region: us-east-1
        # Las credenciales se leen de variables de entorno:
        # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

#### Para Google Cloud Storage
```yaml
replicas:
  - type: gcs
    bucket: mi-bucket-gcs
    path: backups/partners.db
```

#### Para Azure Blob Storage
```yaml
replicas:
  - type: abs
    account-name: miCuentaStorage
    account-key: ${AZURE_STORAGE_KEY}
    bucket: mi-contenedor
    path: backups/partners.db
```

---

## Scripts de arranque

### `entrypoint.sh` (Docker)

```bash
#!/bin/sh
set -e

DB_PATH="./data/partners.db"

# Restaurar el DB desde el bucket si no existe localmente
if [ ! -f "$DB_PATH" ]; then
  echo "[Litestream] Restaurando DB desde replica..."
  litestream restore -config litestream.yml "$DB_PATH" || echo "[Litestream] No hay replica previa, iniciando vacío."
fi

# Iniciar replicación en segundo plano + servidor Node
exec litestream replicate -config litestream.yml -exec "node dist/template/server/server.mjs"
```

El flag `-exec` hace que Litestream gestione el ciclo de vida del servidor: si el proceso Node muere, Litestream también termina (ideal para supervisores como systemd o Docker).

---

## Variables de entorno necesarias

Agregar al `.env`:

```env
# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# GCS (alternativa): autenticación vía Application Default Credentials
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Azure Blob (alternativa)
# AZURE_STORAGE_ACCOUNT=miCuenta
# AZURE_STORAGE_KEY=miClave
```

---

## Comandos útiles

```bash
# Verificar que la réplica está funcionando
litestream replicas -config litestream.yml

# Restaurar manualmente a un directorio
litestream restore -config litestream.yml -o ./data/restore/partners.db

# Restaurar a un punto en el tiempo (PITR)
litestream restore -config litestream.yml -timestamp "2026-05-26T12:00:00Z" ./data/partners.db

# Ver estadísticas de replicación
litestream snapshots -config litestream.yml
```

---

## Limitaciones

| Aspecto | Detalle |
|---|---|
| **Multi-instancia** | No soportado. Solo un proceso puede escribir en el `.db` a la vez. Para múltiples réplicas del servidor, todos deben apuntar al mismo proceso o usar una DB gestionada. |
| **Latencia de restauración** | En un cold start, restaurar el `.db` completo puede tardar segundos o minutos según el tamaño. |
| **No es una base de datos distribuida** | Litestream es solo backup/DR, no sincronización en tiempo real entre múltiples nodos. |

---

## Recomendación para este proyecto

Dado que este template está diseñado para **single deployment con pocos usuarios**, la configuración recomendada es:

1. El servidor corre en **un único contenedor/VM**.
2. Litestream replica el `partners.db` a S3/GCS como backup continuo.
3. Ante un redeploy, el `entrypoint.sh` restaura automáticamente el estado más reciente.

Esto da **cero pérdida de datos** ante reinicios o redeployments sin necesidad de una base de datos externa gestionada.
