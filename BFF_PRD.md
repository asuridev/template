# PRD — Backend for Frontend (BFF) · Portal Multi-Partner BNP

**Versión:** 1.0  
**Fecha:** 17 de mayo de 2026  
**Estado:** Draft  

---

## 1. Contexto y propósito

El portal BNP es una aplicación Angular multi-partner (white-label) donde cada partner tiene su propia identidad visual, configuración de negocio y textos personalizados. Actualmente la configuración de cada partner está hardcodeada en archivos TypeScript del frontend, lo que requiere recompilar y redesplegar la aplicación ante cualquier cambio.

El BFF (Backend for Frontend) centraliza la gestión de configuraciones de partners, expone los endpoints que el frontend Angular consume, y provee una API segura que el módulo de administración utiliza para crear y mantener partners.

---

## 2. Objetivos

- Eliminar la dependencia de configuraciones hardcodeadas en el frontend.
- Proveer un endpoint de solo lectura para que Angular cargue la configuración del partner al arrancar.
- Exponer una API protegida para que administradores creen, editen y eliminen partners.
- Gestionar el almacenamiento de assets binarios (logos, favicons).
- Registrar un historial de auditoría de todos los cambios de configuración.
- Ser el único origen de verdad sobre qué partners existen y están activos.

---

## 3. Alcance

### Dentro del alcance
- API REST para gestión de partners (CRUD).
- Endpoint público de lectura de configuración por `partnerId`.
- Upload y servicio de assets binarios (logos, favicons).
- Validación y verificación de tokens JWT emitidos por Keycloak.
- Control de acceso basado en roles (RBAC) para operaciones de escritura.
- Historial de auditoría de cambios de configuración.
- Cache en memoria para lecturas frecuentes.
- Verificación de existencia de realm en Keycloak.

### Fuera del alcance
- Autenticación de usuarios finales del portal (responsabilidad de Keycloak).
- Lógica de negocio de los módulos del portal (pagos, documentos, etc.).
- Gestión de usuarios y roles dentro de Keycloak.
- Internacionalización del BFF.
- **Modo oscuro (dark mode):** la aplicación soporta únicamente modo claro (light mode). No se persiste ni se expone ninguna configuración de tema oscuro.

---

## 4. Usuarios y roles

| Actor | Descripción | Permisos |
|---|---|---|
| **Frontend Angular** | Consume la configuración del partner al navegar | Solo lectura — sin autenticación requerida en GET público |
| **Administrador de partners** | Gestiona la configuración de partners | CRUD completo — requiere rol `partner-admin` en Keycloak |
| **Sistema** | Keycloak valida tokens, MinIO/filesystem almacena assets | N/A |

---

## 5. Arquitectura técnica

### Stack

| Capa | Tecnología |
|---|---|
| Framework | NestJS (Node.js) |
| Puerto | 3000 |
| Base de datos (dev) | SQLite con columna JSON |
| Base de datos (prod) | PostgreSQL con columna JSONB |
| ORM | TypeORM |
| Cache | Memoria del proceso (dev / instancia única) / Redis (multi-instancia) |
| Storage de assets (dev) | Filesystem local (`/uploads`) |
| Storage de assets (prod) | MinIO / AWS S3 (API compatible S3) |
| Autenticación | Keycloak — validación JWT |
| Validación de payloads | class-validator + class-transformer |

### Diagrama de componentes

```
Angular App
    │
    ├── GET /api/partners/:partnerId  ──────────────────────────────►  BFF
    │                                                                    │
    └── POST/PUT/DELETE /api/partners  (JWT partner-admin) ──────────►  │
         POST /api/partners/assets     (JWT partner-admin) ──────────►  │
                                                                         │
                                                              ┌──────────┼──────────┐
                                                              │          │          │
                                                           Keycloak  DB (SQLite/  Storage
                                                           (validar   PostgreSQL) (filesystem/
                                                            JWT)                   MinIO/S3)
```

---

## 6. Modelo de datos

### 6.1 Tabla `partners`

```sql
CREATE TABLE partners (
  id           VARCHAR(100) PRIMARY KEY,  -- slug único: 'cardif-banco-occidente'
  is_active    BOOLEAN      NOT NULL DEFAULT false,
  config       JSON/JSONB   NOT NULL,     -- objeto PartnerConfig completo
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_by   VARCHAR(255)               -- sub/email del JWT de Keycloak
);
```

### 6.2 Tabla `partner_config_history`

```sql
CREATE TABLE partner_config_history (
  id           SERIAL       PRIMARY KEY,
  partner_id   VARCHAR(100) NOT NULL REFERENCES partners(id),
  config       JSON/JSONB   NOT NULL,     -- snapshot de la config en ese momento
  changed_at   TIMESTAMPTZ  DEFAULT NOW(),
  changed_by   VARCHAR(255),
  change_type  VARCHAR(10)  NOT NULL      -- 'CREATE' | 'UPDATE' | 'DELETE'
);
```

### 6.3 Estructura del objeto `PartnerConfig`

```typescript
interface PartnerConfig {
  id:       string;
  isActive: boolean;

  branding: {
    brandName:       string;
    tagline?:        string;
    logoHeader:      string;   // logo del encabezado — sobre fondo claro o de color primario
    logoFooter:      string;   // logo del pie de página — variante adaptada al fondo del footer en modo claro
    logoIconUrl?:    string;   // variante cuadrada para avatares o favicons grandes
    faviconUrl:      string;
    supportEmail?:   string;
    supportPhone?:   string;
    websiteUrl?:     string;
  };

  theme: {
    colors: {
      primary:         string;
      primaryDark?:    string;
      primaryLight?:   string;
      secondary:       string;
      secondaryDark?:  string;
      secondaryLight?: string;
      accent:          string;
      background:      string;
      surface:         string;
      error:           string;
      success:         string;
      warning:         string;
      info:            string;
      textPrimary:     string;
      textSecondary:   string;
      textDisabled:    string;
      border:          string;
    };
    typography: {
      fontFamily:          string;
      fontFamilyHeading?:  string;
      fontSizeBase?:       string;
      fontWeightNormal?:   number;
      fontWeightBold?:     number;
      lineHeightBase?:     string;
    };
    shape: {
      borderRadius?:   string;
      borderRadiusLg?: string;
    };
    // Nota: solo se soporta modo claro (light mode).
    // No existe configuración de tema oscuro.
  };

  params: {
    locale:       string;
    currency?:    string;
    dateFormat?:  string;
    defaultRoute?:string;
    socialLinks?: {
      twitter?:   string;
      facebook?:  string;
      instagram?: string;
      linkedin?:  string;
    };
    // ─── URLs de navegación ───────────────────────────────────
    urls: {
      privacyPolicy?: string;    // enlace a política de privacidad
      terms?:         string;    // enlace a términos y condiciones
      website?:       string;    // sitio web corporativo del partner
      // URLs de redirección de cada card del home, indexadas
      // por posición y alineadas con texts.home.cards[]
      homeCards:      string[];  // ej: ['/polizas', '/proteccion', '/progreso']
    };
  };

  auth: {
    keycloakRealm:    string;
    keycloakClientId: string;
  };

  texts: {
    common: {
      loadingMessage:    string;
      errorMessage:      string;
      backButtonLabel:   string;
      saveButtonLabel:   string;
      cancelButtonLabel: string;
      confirmButtonLabel:string;
    };
    home: {
      // Título principal de la pantalla
      pageTitle: string;         // ej: "¿Qué quieres hacer hoy?"
      // Lista configurable de cards — cantidad libre, mínimo 1
      cards: Array<{
        badge:       string;     // etiqueta del chip superior  ej: "Tu progreso"
        title:       string;     // título de la card           ej: "Activar protección tradicional"
        buttonLabel: string;     // texto del botón             ej: "Ver ahora"
        // La URL de redirección de cada card se configura en
        // params.urls.homeCards[] usando el mismo índice
      }>;
    };
    auth: {
      loginTitle:    string;
      loginSubtitle: string;
      logoutConfirm: string;
      sessionExpired:string;
    };
    errors: {
      notFoundTitle:    string;
      notFoundMessage:  string;
      forbiddenTitle:   string;
      forbiddenMessage: string;
    };
    footer: {
      copyrightText: string;
      tagline:       string;
    };
  };
}
```

---

## 7. API REST

### 7.1 Endpoints de configuración (consumidos por Angular)

#### `GET /api/partners/:partnerId`

Retorna la configuración completa de un partner activo.

| Atributo | Valor |
|---|---|
| Autenticación | No requerida |
| Autorización | N/A |
| Cache | Sí — en memoria, TTL configurable |

**Respuestas:**

```
200 OK          → PartnerConfig
404 Not Found   → { message: "Partner 'x' not found" }
```

**Comportamiento:**
- Si el partner existe pero `isActive = false`, retorna `404`.
- El resultado se almacena en cache tras la primera consulta.
- La cache se invalida cuando el partner es modificado.

---

### 7.2 Endpoints de administración (requieren rol `partner-admin`)

#### `GET /api/partners`

Lista todos los partners (activos e inactivos).

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |

**Respuestas:**

```
200 OK   → PartnerConfig[]
401      → Token inválido o ausente
403      → Sin rol partner-admin
```

---

#### `POST /api/partners`

Crea un nuevo partner. Recibe en un único request `multipart/form-data` los campos de branding, los archivos de logos y, opcionalmente, el archivo JSON con el resto de la configuración (tema, textos, parámetros, autenticación). Si el archivo JSON no se adjunta, el BFF aplica la configuración por defecto.

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |
| Content-Type | `multipart/form-data` |

**Campos de formulario (text fields):**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | string | Sí | Slug único del partner. Patrón `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `brandName` | string | Sí | Nombre de marca visible |
| `tagline` | string | No | Eslogan |
| `supportEmail` | string | No | Email de soporte |
| `supportPhone` | string | No | Teléfono de soporte |
| `websiteUrl` | string | No | Sitio web corporativo |
| `urls` | JSON string | No | Ver detalle abajo |

> **Detalle del campo `urls`**
>
> Como `multipart/form-data` no permite objetos anidados, este campo se envía como un **string JSON serializado**. Contiene todas las URLs de navegación del partner:
>
> ```json
> {
>   "privacyPolicy": "https://www.cardif.com.co/privacidad",
>   "terms":         "https://www.cardif.com.co/terminos",
>   "website":       "https://www.cardif.com.co",
>   "homeCards": [
>     "/cardif-banco-occidente/polizas",
>     "/cardif-banco-occidente/proteccion-modular",
>     "/cardif-banco-occidente/mi-progreso"
>   ]
> }
> ```
>
> - `privacyPolicy` / `terms` / `website`: URLs externas o rutas absolutas para los enlaces del footer y legales.
> - `homeCards`: array de rutas de redirección para cada card del home. El elemento `[0]` corresponde a la primera card definida en `texts.home.cards[0]`, el `[1]` a la segunda, y así sucesivamente. Si una card no tiene URL, se puede enviar `null` en esa posición.

**Archivos (file fields):**

| Campo | Tipo | Requerido | Restricciones |
|---|---|---|---|
| `logoHeader` | SVG, PNG, WebP | Sí | Máx 500 KB. SVG sanitizado |
| `logoFooter` | SVG, PNG, WebP | Sí | Máx 500 KB. SVG sanitizado |
| `logoIcon` | SVG, PNG | No | Máx 200 KB |
| `favicon` | ICO, PNG | Sí | Máx 50 KB |
| `configJson` | JSON | No | Archivo `.json` con `theme`, `texts`, `params`, `auth`. Máx 100 KB. Si se omite, se aplica la configuración por defecto |

**Estructura del `configJson` (descargable desde `GET /api/partners/config-template`):**

```json
{
  "theme": { "colors": {}, "typography": {}, "shape": {} },
  "texts": { "common": {}, "home": {}, "auth": {}, "errors": {}, "footer": {} },
  "params": { "locale": "es-CO", "currency": "COP" },
  "auth":   { "keycloakRealm": "", "keycloakClientId": "" }
}
```

**Respuestas:**

```
201 Created     → PartnerConfig completo (con URLs de logos resueltas)
400 Bad Request → Validación fallida { errors: [...] }
400 Bad Request → configJson malformado o no cumple el esquema
401             → Token inválido o ausente
403             → Sin rol partner-admin
409 Conflict    → El ID del partner ya existe
```

**Comportamiento:**
- El BFF sube los archivos de logos al storage antes de persistir la config.
- Si `configJson` está ausente, fusiona los campos del formulario con la configuración por defecto del BFF.
- Si `configJson` está presente, lo valida contra el esquema completo antes de persistir.
- Genera entrada en `partner_config_history` con `change_type = 'CREATE'`.
- Registra el `sub` del JWT como `updated_by`.
- Invalida cache tras la creación.
- Registra el `sub` del JWT como `updated_by`.
- Invalida cache tras la creación.

---

#### `PUT /api/partners/:partnerId`

Actualiza la configuración de un partner existente. Acepta la misma estructura `multipart/form-data` que `POST /api/partners`; todos los campos son opcionales — solo se reemplazan los que se envíан.

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |
| Content-Type | `multipart/form-data` |

**Campos:** misma estructura que `POST /api/partners`, todos opcionales.

> Si se adjunta `configJson`, reemplaza **completamente** la sección de tema/textos/parámetros/auth almacenada. Si no se adjunta, esas secciones permanecen sin cambios.

**Respuestas:**

```
200 OK          → PartnerConfig actualizado
400 Bad Request → Validación fallida o configJson malformado
401             → Token inválido o ausente
403             → Sin rol partner-admin
404 Not Found   → Partner no encontrado
```

**Comportamiento:**
- Guarda snapshot de la config anterior en `partner_config_history` antes de actualizar.
- Invalida cache del partner modificado.

---

#### `PATCH /api/partners/:partnerId/status`

Activa o desactiva un partner sin modificar su configuración.

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |

**Body:**

```json
{ "isActive": true }
```

**Respuestas:**

```
200 OK   → { id, isActive }
401/403/404
```

---

#### `DELETE /api/partners/:partnerId`

Desactiva un partner (soft delete — no elimina el registro ni el historial).

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |

**Respuestas:**

```
200 OK   → { message: "Partner desactivado" }
401/403/404
```

**Comportamiento:**
- Establece `is_active = false`.
- Registra entrada en historial con `change_type = 'DELETE'`.
- Invalida cache.
- No elimina físicamente el registro ni los assets.

---

#### `GET /api/partners/:partnerId/history`

Retorna el historial de cambios de configuración de un partner.

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |

**Respuestas:**

```
200 OK   → PartnerConfigHistory[]
  {
    id:         number,
    partnerId:  string,
    config:     PartnerConfig,
    changedAt:  string (ISO 8601),
    changedBy:  string,
    changeType: 'CREATE' | 'UPDATE' | 'DELETE'
  }
```

---

### 7.3 Endpoints de assets

#### `POST /api/partners/assets`

Sube un archivo de asset (logo, favicon) y retorna su URL pública.

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |
| Content-Type | `multipart/form-data` |

**Query params:**

| Param | Tipo | Requerido | Valores válidos |
|---|---|---|---|
| `partnerId` | string | Sí | ID del partner |
| `type` | string | Sí | `logoHeader`, `logoFooter`, `logoIcon`, `favicon` |

**Form field:** `file` — archivo binario.

**Validaciones:**

| Restricción | Valor |
|---|---|
| Tipos permitidos | `image/svg+xml`, `image/png`, `image/webp`, `image/x-icon` |
| Tamaño máximo (logo) | 500 KB |
| Tamaño máximo (favicon) | 50 KB |
| Sanitización SVG | Obligatoria — se eliminan scripts incrustados |

**Respuestas:**

```
201 Created     → { url: "http://storage/partners/cardif/logo.svg" }
400 Bad Request → Tipo o tamaño inválido
401/403
```

**Comportamiento:**
- Si ya existe un archivo del mismo tipo para el mismo partner, lo reemplaza.
- La URL retornada es la que el admin ingresa en los campos `logoHeader`, `logoFooter` o `logoIcon` del formulario de configuración.

---

### 7.4 Endpoints de utilidad

#### `GET /api/partners/config-template`

Retorna el archivo JSON con la configuración por defecto que el administrador puede descargar, personalizar y subir como `configJson` al crear o editar un partner.

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |

**Respuesta:**
```
200 OK   → archivo default-config.json (application/json)
         con todos los campos de theme, texts, params y auth
         rellenos con los valores por defecto del sistema
```

---

#### `GET /api/auth/verify-realm`

Verifica que un realm de Keycloak existe y es alcanzable.

| Atributo | Valor |
|---|---|
| Autenticación | JWT Bearer |
| Autorización | Rol `partner-admin` |

**Query params:**

| Param | Tipo | Requerido |
|---|---|---|
| `realm` | string | Sí |
| `clientId` | string | No |

**Respuestas:**

```
200 OK   → { valid: true,  realm: "cardif-realm" }
200 OK   → { valid: false, reason: "Realm no encontrado" }
401/403
```

---

#### `GET /api/health`

Health check del servicio.

| Atributo | Valor |
|---|---|
| Autenticación | No requerida |

**Respuesta:**

```json
{
  "status": "ok",
  "db":      "ok",
  "storage": "ok",
  "uptime":  12345
}
```

---

## 8. Seguridad

### 8.1 Autenticación

- Todos los endpoints de escritura y administración requieren un JWT válido emitido por Keycloak.
- El BFF valida la firma del token usando la clave pública del realm configurado.
- El token se transmite en el header `Authorization: Bearer <token>`.
- Tokens expirados o con firma inválida reciben `401 Unauthorized`.

### 8.2 Autorización

- El rol `partner-admin` debe estar presente en el token (realm role).
- Ausencia del rol en endpoints protegidos retorna `403 Forbidden`.
- El endpoint `GET /api/partners/:partnerId` es público — no requiere token.

### 8.3 Validación de entradas

- Todos los payloads JSON son validados con `class-validator` antes de procesarse.
- Los archivos subidos son validados por tipo MIME real (no solo extensión) y tamaño.
- Los archivos SVG son sanitizados para eliminar scripts, event handlers y referencias externas antes de almacenarse.
- Los IDs de partners aceptan únicamente el patrón `^[a-z0-9]+(-[a-z0-9]+)*$` (slug seguro).

### 8.4 CORS

- En desarrollo: permite `http://localhost:4200`.
- En producción: lista blanca de orígenes configurada por variable de entorno.

### 8.5 Rate limiting

- `GET /api/partners/:partnerId`: 100 requests/minuto por IP.
- Endpoints de upload: 20 requests/minuto por usuario autenticado.
- Endpoints de escritura CRUD: 60 requests/minuto por usuario autenticado.

---

## 9. Cache

### 9.1 Estrategia

| Endpoint | Cache | TTL | Invalidación |
|---|---|---|---|
| `GET /api/partners/:partnerId` | Sí | 5 minutos | Al modificar el partner |
| `GET /api/partners` | Sí | 2 minutos | Al modificar cualquier partner |
| Endpoints de escritura | No | — | — |

### 9.2 Implementación

- **Instancia única / desarrollo:** Cache en memoria del proceso (`Map<string, PartnerConfig>`).
- **Multi-instancia / producción:** Redis con `SET EX`.
- La clave de cache para un partner es `partners:{partnerId}`.
- La clave para el listado completo es `partners:all`.

---

## 10. Storage de assets

### 10.1 Estructura de directorios

```
{storage_root}/
  partners/
    {partnerId}/
      logoHeader.{ext}
      logoFooter.{ext}
      logoIcon.{ext}
      favicon.{ext}
```

### 10.2 Acceso

- Los assets son de acceso público (lectura sin autenticación).
- En desarrollo, el BFF sirve el directorio `/uploads` como estático en la ruta `/uploads`.
- En producción, MinIO o S3 exponen los archivos con ACL `public-read`.

### 10.3 Migración dev → prod

El `StorageService` implementa una interfaz común. El cambio de filesystem local a MinIO/S3 solo requiere cambiar las variables de entorno — el código del controlador y del servicio de partners no cambia.

```
STORAGE_PROVIDER = 'local'  →  filesystem del BFF
STORAGE_PROVIDER = 's3'     →  MinIO / AWS S3
```

---

## 11. Auditoría

Cada operación de escritura sobre un partner debe registrar en `partner_config_history`:

| Campo | Origen |
|---|---|
| `partner_id` | ID del partner modificado |
| `config` | Snapshot completo de la config **antes** del cambio (en UPDATE/DELETE) |
| `changed_by` | Claim `sub` o `email` del JWT del administrador |
| `change_type` | `CREATE`, `UPDATE`, o `DELETE` |
| `changed_at` | Timestamp del servidor al momento de la operación |

El historial es de solo lectura — no puede modificarse ni eliminarse desde la API.

---

## 12. Variables de entorno

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_TYPE=sqlite                        # 'sqlite' | 'postgres'
DB_PATH=./data/partners.db            # solo SQLite
DB_HOST=localhost                     # solo PostgreSQL
DB_PORT=5432
DB_NAME=bnp_partners
DB_USER=postgres
DB_PASSWORD=

# Cache
CACHE_PROVIDER=memory                 # 'memory' | 'redis'
REDIS_URL=redis://localhost:6379      # solo si CACHE_PROVIDER=redis
CACHE_TTL_PARTNER=300                 # segundos — config individual
CACHE_TTL_ALL=120                     # segundos — listado completo

# Storage de assets
STORAGE_PROVIDER=local                # 'local' | 's3'
STORAGE_LOCAL_PATH=./uploads          # solo si STORAGE_PROVIDER=local
STORAGE_PUBLIC_URL=http://localhost:3000/uploads
STORAGE_S3_ENDPOINT=http://localhost:9000
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ACCESS_KEY=
STORAGE_S3_SECRET_KEY=
STORAGE_S3_BUCKET=partner-assets

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_ADMIN_REALM=master           # realm desde donde se verifica la firma

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

---

## 13. Estructura de módulos NestJS

```
src/
  app.module.ts
  main.ts
  partners/
    dto/
      create-partner.dto.ts
      update-partner.dto.ts
      upload-asset.dto.ts
    entities/
      partner.entity.ts
      partner-config-history.entity.ts
    partners.controller.ts
    partners.service.ts
    partners.module.ts
  storage/
    storage.service.ts          ← interfaz común filesystem / S3
    local-storage.service.ts
    s3-storage.service.ts
    storage.module.ts
  cache/
    cache.service.ts
    cache.module.ts
  auth/
    auth.guard.ts               ← valida JWT Keycloak
    roles.decorator.ts
    keycloak-verify.service.ts  ← verifica realm
    auth.module.ts
  health/
    health.controller.ts
    health.module.ts
  config/
    app.config.ts               ← carga y valida variables de entorno
```

---

## 14. Criterios de aceptación

### Lectura de configuración

- [ ] `GET /api/partners/cardif-banco-occidente` retorna `200` con la config completa cuando el partner existe y está activo.
- [ ] `GET /api/partners/inexistente` retorna `404` con mensaje descriptivo.
- [ ] `GET /api/partners/partner-inactivo` retorna `404` aunque el partner exista en DB.
- [ ] La segunda consulta al mismo partner es atendida desde cache sin consultar la DB.

### Textos e cards del home

- [ ] `texts.home.pageTitle` se persiste y retorna correctamente en la config del partner.
- [ ] `texts.home.cards` acepta un array con uno o más elementos; cada elemento debe contener `badge`, `title` y `buttonLabel`.
- [ ] `params.urls.homeCards` acepta un array de strings; la longitud puede ser diferente a `texts.home.cards` (URLs opcionales por card).
- [ ] El BFF valida que `texts.home.cards` tenga al menos 1 elemento; un array vacío retorna `400`.
- [ ] Crear un partner con 3 cards en `texts.home.cards` y 3 URLs en `params.urls.homeCards` persiste y retorna ambos arrays completos.
- [ ] Actualizar solo el `buttonLabel` de una card usando `PUT /api/partners/:id` genera entrada en historial con el snapshot anterior.
- [ ] Un partner sin `params.urls.homeCards` configurado retorna el campo como array vacío `[]`, no como `null` ni `undefined`.

### Creación de partner

- [ ] `POST /api/partners` con `multipart/form-data`, JWT válido y rol `partner-admin` crea el partner y retorna `201`.
- [ ] `POST /api/partners` sin `configJson` aplica la configuración por defecto del BFF y retorna `201`.
- [ ] `POST /api/partners` con `configJson` válido persiste exactamente los valores del archivo JSON.
- [ ] `POST /api/partners` con `configJson` malformado (JSON inválido) retorna `400`.
- [ ] `POST /api/partners` con `configJson` que no cumple el esquema (campo requerido faltante) retorna `400` con detalle de errores.
- [ ] `POST /api/partners` con ID ya existente retorna `409`.
- [ ] `POST /api/partners` sin JWT retorna `401`.
- [ ] `POST /api/partners` con JWT válido pero sin rol `partner-admin` retorna `403`.
- [ ] `POST /api/partners` sin `logoHeader` o sin `favicon` retorna `400`.
- [ ] `POST /api/partners` con logo que excede el tamaño máximo retorna `400`.
- [ ] La creación genera entrada en `partner_config_history` con `change_type = 'CREATE'`.
- [ ] `GET /api/partners/config-template` retorna un JSON descargable con todos los campos de tema, textos, parámetros y auth rellenos con valores por defecto.

### Actualización de partner

- [ ] `PUT /api/partners/:id` actualiza la config y guarda el snapshot anterior en historial.
- [ ] La cache del partner se invalida tras la actualización.

### Upload de assets

- [ ] `POST /api/partners/assets?partnerId=x&type=logo` con archivo SVG válido retorna `201` con URL accesible.
- [ ] Upload con tipo MIME no permitido retorna `400`.
- [ ] Upload con archivo mayor al límite retorna `400`.
- [ ] Un SVG con script incrustado es sanitizado antes de almacenarse.

### Auditoría

- [ ] `GET /api/partners/:id/history` retorna el historial ordenado por `changed_at` descendente.
- [ ] Cada registro incluye `changed_by` con el identificador del admin que realizó el cambio.

### Health

- [ ] `GET /api/health` retorna `200` con estado de DB y storage.
- [ ] Si la DB no es alcanzable, `GET /api/health` retorna `503`.

---

## 15. Consideraciones de despliegue

### Desarrollo local

```
docker-compose up
  services:
    - bff (Node.js)
    - sqlite (archivo local en /data)
    - keycloak (http://localhost:8080)
    - minio (opcional — puede usarse filesystem local)
```

### Producción

```
Contenedor BFF
  ├── Variables de entorno desde vault / secrets manager
  ├── DB_TYPE=postgres → PostgreSQL administrado (RDS, Cloud SQL, etc.)
  ├── CACHE_PROVIDER=redis → Redis administrado (ElastiCache, etc.)
  ├── STORAGE_PROVIDER=s3 → MinIO self-hosted o AWS S3
  └── Solo 1 réplica si usa SQLite; múltiples réplicas con PostgreSQL + Redis
```

### Consideración de escalado

| Componente | Instancia única | Multi-instancia |
|---|---|---|
| DB | SQLite | PostgreSQL |
| Cache | Memoria del proceso | Redis |
| Storage | Filesystem local | MinIO / S3 |

---

## 16. Dependencias del proyecto

### Fase inicial — filesystem local (SQLite)

```json
{
  "dependencies": {
    "@nestjs/common": "^10",
    "@nestjs/core": "^10",
    "@nestjs/typeorm": "^10",
    "@nestjs/config": "^3",
    "@nestjs/platform-express": "^10",
    "@nestjs/throttler": "^5",
    "typeorm": "^0.3",
    "better-sqlite3": "^9",
    "class-validator": "^0.14",
    "class-transformer": "^0.5",
    "multer": "^1",
    "isomorphic-dompurify": "^2",
    "jwks-rsa": "^3",
    "jsonwebtoken": "^9"
  }
}
```

### Dependencias adicionales al escalar (PostgreSQL + S3/MinIO)

| Dependencia | Cuándo agregarla |
|---|---|
| `pg` | Al migrar de SQLite a PostgreSQL |
| `@aws-sdk/client-s3` | Al migrar de filesystem local a MinIO / AWS S3 |
| `ioredis` | Al migrar el cache de memoria a Redis |
