# Diagrama de Flujo: SSO Keycloak — Redirección entre App A y App B

Flujo completo de autenticación con Keycloak y redirección silenciosa entre dos clientes
(`bnp-portal` y `app-b-client`) registrados en el mismo realm **`bnp-realm`**,
usando `id_token_hint` con `prompt=none` para evitar una segunda pantalla de login.

---

```mermaid
flowchart TD

    subgraph BROWSER["Browser / Usuario"]
        U1(["Usuario abre App A\nlocalhost:4000"])
        U2(["Click en botón de la card"])
        U3(["Ingresa credenciales"])
    end

    subgraph APPA["App A — bnp-portal  |  localhost:4000"]
        A1["keycloak.init()<br/>onLoad: 'check-sso'"]
        A2{"¿Sesión activa<br/>en Keycloak?"}
        A3["Intercambia ?code<br/>por access_token + id_token"]
        A4["Guarda tokens en sessionStorage<br/>kc_token  |  kc_refresh_token"]
        A5["Renderiza home con cards"]
        A6["AppRedirectService.redirectTo()"]
        A7["keycloak.updateToken(30)"]
        A8{"¿Token<br/>actualizable?"}
        A9["Extrae idToken<br/>del estado keycloak-js"]
        A10["Construye URL /authorize<br/>• client_id = app-b-client<br/>• redirect_uri = app-b/auth/callback<br/>• response_type = code<br/>• scope = openid profile<br/>• prompt = none<br/>• id_token_hint = &lt;idToken&gt;<br/>• state = &lt;targetPath&gt;"]
        A11["window.location.href<br/>→ Keycloak /authorize"]
    end

    subgraph KC["Keycloak — bnp-realm  |  localhost:8080"]
        K1["Muestra formulario de login"]
        K2["Valida credenciales<br/>Crea sesión SSO del usuario"]
        K3["Genera ?code para App A<br/>Redirect → bnp-portal/callback"]
        K4["Recibe petición /authorize<br/>con prompt=none"]
        K5["Valida id_token_hint<br/>Busca sesión activa del usuario"]
        K6{"¿Sesión SSO<br/>válida?"}
        K7["Genera nuevo ?code=ABC<br/>para app-b-client (PKCE)"]
        K8["Redirect → App B<br/>app-b/auth/callback?code=ABC&amp;state=targetPath"]
        K9["Retorna error<br/>login_required"]
    end

    subgraph APPB["App B — app-b-client"]
        B1["AuthCallbackComponent<br/>recibe ?code=ABC"]
        B2["keycloak-js intercambia ?code<br/>por tokens propios de App B"]
        B3["history.replaceState()<br/>Limpia la URL del código"]
        B4["router.navigateByUrl(targetPath)"]
        B5(["Usuario autenticado en App B<br/>con nuevo access_token"])
    end

    %% ── Flujo de autenticación inicial en App A ──────────────────────────────
    U1 --> A1
    A1 --> A2
    A2 -- No --> K1
    K1 --> U3
    U3 --> K2
    K2 --> K3
    K3 --> A3
    A3 --> A4
    A4 --> A5
    A2 -- Sí --> A5

    %% ── Flujo de redirección a App B ─────────────────────────────────────────
    A5 --> U2
    U2 --> A6
    A6 --> A7
    A7 --> A8
    A8 -- No --> K1
    A8 -- Sí --> A9
    A9 --> A10
    A10 --> A11
    A11 --> K4
    K4 --> K5
    K5 --> K6
    K6 -- No --> K9
    K9 --> K1
    K6 -- Sí --> K7
    K7 --> K8

    %% ── Callback y autenticación en App B ────────────────────────────────────
    K8 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5

    %% ── Estilos ──────────────────────────────────────────────────────────────
    classDef decision  fill:#fff3cd,stroke:#f0ad4e,color:#333
    classDef endpoint  fill:#d4edda,stroke:#28a745,color:#333
    classDef action    fill:#e8f4f8,stroke:#5bc0de,color:#333
    classDef error     fill:#f8d7da,stroke:#dc3545,color:#333

    class A2,A8,K6 decision
    class U1,U2,U3,B5 endpoint
    class K9 error
```

---

## Parámetros clave en la URL `/authorize`

| Parámetro | Valor | Propósito |
|---|---|---|
| `client_id` | `app-b-client` | Identifica al cliente destino en Keycloak |
| `redirect_uri` | `https://app-b.com/auth/callback` | Debe estar registrado como _Valid Redirect URI_ en App B |
| `response_type` | `code` | Authorization Code Flow con PKCE |
| `scope` | `openid profile` | Scopes solicitados para el nuevo token de App B |
| `prompt` | `none` | Prohíbe mostrar pantalla de login; falla con `login_required` si no hay sesión activa |
| `id_token_hint` | `<id_token de App A>` | Identifica al usuario autenticado; habilita SSO silencioso entre clientes del mismo realm |
| `state` | `<targetPath codificado>` | Preserva la ruta destino en App B para restaurarla tras el callback |

---

## Referencias

- [SSO_REDIRECT.md](SSO_REDIRECT.md) — Guía de implementación paso a paso con código
- [src/environments/environment.ts](src/environments/environment.ts) — Configuración del realm y cliente
- [src/app/app.config.ts](src/app/app.config.ts) — Inicialización de Keycloak con `onLoad: 'check-sso'`
- [src/shared/guards/auth.guard.ts](src/shared/guards/auth.guard.ts) — Guard que protege rutas de App A
