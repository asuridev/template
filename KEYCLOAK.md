# Keycloak Instance — Referencia rápida

La instancia `Keycloak` se inyecta en cualquier servicio, componente, guard o interceptor:

```typescript
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';

const keycloak = inject(Keycloak);
```

---

## Propiedades principales

| Propiedad | Tipo | Descripción |
|---|---|---|
| `token` | `string \| undefined` | Access token JWT crudo (se envía al backend en el header `Authorization`) |
| `tokenParsed` | `object \| undefined` | Access token decodificado como objeto (claims del usuario) |
| `idToken` | `string \| undefined` | ID token JWT crudo (identidad del usuario) |
| `idTokenParsed` | `object \| undefined` | ID token decodificado |
| `refreshToken` | `string \| undefined` | Refresh token (usado para renovar el access token) |
| `authenticated` | `boolean \| undefined` | `true` si el usuario tiene sesión activa |
| `subject` | `string \| undefined` | ID único del usuario en Keycloak (`sub` del JWT) |

---

## Métodos principales

| Método | Descripción |
|---|---|
| `login(options?)` | Redirige a la pantalla de login de Keycloak |
| `logout(options?)` | Cierra la sesión y redirige |
| `updateToken(minValidity)` | Refresca el token si expira en menos de `minValidity` segundos. Retorna `Promise<boolean>` |
| `hasRealmRole(role)` | `true` si el usuario tiene el rol a nivel de realm |
| `hasResourceRole(role, resource?)` | `true` si el usuario tiene el rol en el cliente especificado |
| `loadUserInfo()` | Carga información adicional del usuario desde el endpoint `/userinfo`. Retorna `Promise` |

---

## Claims disponibles en `tokenParsed`

```typescript
const payload = keycloak.tokenParsed;
```

| Claim | Tipo | Descripción |
|---|---|---|
| `sub` | `string` | ID único del usuario |
| `preferred_username` | `string` | Nombre de usuario |
| `email` | `string` | Email |
| `given_name` | `string` | Nombre |
| `family_name` | `string` | Apellido |
| `name` | `string` | Nombre completo |
| `email_verified` | `boolean` | Si el email fue verificado |
| `realm_access.roles` | `string[]` | Roles asignados a nivel de realm |
| `resource_access.[clientId].roles` | `string[]` | Roles asignados al cliente específico |
| `exp` | `number` | Timestamp de expiración (epoch segundos) |
| `iat` | `number` | Timestamp de emisión |
| `iss` | `string` | URL del realm emisor |
| `aud` | `string \| string[]` | Audiencia del token |

> Los claims disponibles dependen de los **mappers** configurados en el cliente dentro de la consola de administración de Keycloak.

---

## Ejemplos de uso

```typescript
const keycloak = inject(Keycloak);

// Datos del usuario
const username = keycloak.tokenParsed?.['preferred_username'];
const email    = keycloak.tokenParsed?.['email'];
const nombre   = keycloak.tokenParsed?.['given_name'];

// Roles
const rolesRealm   = keycloak.tokenParsed?.['realm_access']?.roles as string[];
const rolesCliente = keycloak.tokenParsed?.['resource_access']?.['bnp-portal']?.roles as string[];

// Helpers de roles
const esAdmin         = keycloak.hasRealmRole('admin');
const puedeVerPolizas = keycloak.hasResourceRole('ver-polizas', 'bnp-portal');

// Sesión
const estaAutenticado = keycloak.authenticated;
const userId          = keycloak.subject;

// Acciones
keycloak.login({ redirectUri: window.location.href });
keycloak.logout({ redirectUri: window.location.origin });

// Renovar token si expira en menos de 30 segundos
keycloak.updateToken(30).then((renovado) => {
  if (renovado) console.log('Token renovado:', keycloak.token);
});
```

---

## Restricción: contexto de inyección

`inject(Keycloak)` solo puede llamarse dentro de un **contexto de inyección activo**:

```typescript
// ✅ Válido — campo de clase, constructor, guard, interceptor
private keycloak = inject(Keycloak);

// ❌ Inválido — dentro de callbacks asincrónicos sueltos
setTimeout(() => {
  const keycloak = inject(Keycloak); // Error en runtime
}, 1000);

// ✅ Solución — inyectar a nivel de clase y usar via this
private keycloak = inject(Keycloak);
hacerAlgo() {
  setTimeout(() => console.log(this.keycloak.token), 1000);
}
```
