# Diagrama de Secuencia: SSO Keycloak — Redirección entre App A y App B

Flujo de autenticación con Keycloak y redirección silenciosa entre dos clientes
(`bnp-portal` y `app-b-client`) registrados en el mismo realm **`bnp-realm`**,
usando `id_token_hint` con `prompt=none` para evitar una segunda pantalla de login.

---

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'actorBkg': '#1d4ed8', 'actorBorder': '#1e3a8a', 'actorTextColor': '#ffffff', 'actorLineColor': '#1f2937', 'signalColor': '#0f172a', 'signalTextColor': '#0f172a', 'labelBoxBkgColor': '#dbeafe', 'labelBoxBorderColor': '#1d4ed8', 'labelTextColor': '#1e1b4b', 'noteBkgColor': '#fef3c7', 'noteBorderColor': '#d97706', 'noteTextColor': '#1c1917', 'loopTextColor': '#1e1b4b', 'activationBkgColor': '#bfdbfe', 'activationBorderColor': '#1d4ed8', 'sequenceNumberColor': '#ffffff'}}}%%
sequenceDiagram
    actor U as Usuario
    participant A as App A<br/>(bnp-portal)
    participant KC as Keycloak<br/>(bnp-realm)
    participant B as App B<br/>(app-b-client)

    %% ── Autenticación inicial en App A ───────────────────────────────────────
    rect rgb(191, 219, 254)
        note over U,A: Autenticación inicial — App A
        U->>A: Abre localhost:4000
        A->>KC: keycloak.init()<br/>onLoad: 'check-sso'<br/>(silent SSO iframe)
        KC-->>A: Sin sesión activa
        A->>KC: keycloak.login()<br/>redirect_uri = localhost:4000/callback
        KC-->>U: Muestra formulario de login
        U->>KC: Ingresa credenciales
        KC->>KC: Valida credenciales<br/>Crea sesión SSO del usuario
        KC-->>A: Redirect → ?code=XYZ
        A->>KC: POST /token<br/>code=XYZ + code_verifier (PKCE)
        KC-->>A: access_token + id_token<br/>+ refresh_token
        A->>A: Guarda en sessionStorage<br/>kc_token | kc_refresh_token
        A-->>U: Renderiza home con cards
    end

    %% ── Redirección a App B al hacer click ───────────────────────────────────
    rect rgb(253, 230, 138)
        note over U,KC: Click en botón — Redirección a App B
        U->>A: Click en botón de la card
        A->>A: AppRedirectService.redirectTo()<br/>AppBBaseUrl, app-b-client, targetPath
        A->>KC: keycloak.updateToken(30)<br/>POST /token (refresh_token)
        KC-->>A: Nuevo access_token + id_token
        A->>A: Extrae idToken del estado keycloak-js
        A->>A: Construye URL /authorize<br/>client_id=app-b-client<br/>redirect_uri=app-b/auth/callback<br/>response_type=code<br/>scope=openid profile<br/>prompt=none<br/>id_token_hint=[idToken]<br/>state=[targetPath]
        A->>KC: window.location.href<br/>GET /realms/bnp-realm/protocol/openid-connect/auth<br/>(prompt=none, id_token_hint)
    end

    %% ── Validación Keycloak y emisión de código para App B ───────────────────
    rect rgb(167, 243, 208)
        note over KC,B: Validación SSO y emisión de código para App B
        KC->>KC: Valida id_token_hint<br/>Busca sesión SSO activa del usuario
        alt Sesión SSO válida
            KC->>KC: Genera ?code=ABC para app-b-client (PKCE)
            KC-->>B: Redirect → app-b/auth/callback<br/>?code=ABC + state=targetPath
        else Sin sesión activa
            KC-->>U: Retorna error login_required
        end
    end

    %% ── Autenticación en App B ───────────────────────────────────────────────
    rect rgb(221, 214, 254)
        note over B,U: Autenticación en App B
        B->>B: AuthCallbackComponent<br/>lee ?code=ABC y state=targetPath
        B->>KC: POST /token<br/>code=ABC + code_verifier (PKCE)<br/>client_id=app-b-client
        KC-->>B: access_token + id_token<br/>propios de app-b-client
        B->>B: history.replaceState()<br/>Limpia ?code de la URL
        B->>B: router.navigateByUrl(targetPath)
        B-->>U: Usuario autenticado en App B<br/>con nuevo access_token
    end
```

---

## Referencias

- [SSO_REDIRECT.md](SSO_REDIRECT.md) — Guía de implementación paso a paso con código
- [SSO_REDIRECT_FLOW.md](SSO_REDIRECT_FLOW.md) — Diagrama de flujo (flowchart) del mismo proceso
- [src/environments/environment.ts](src/environments/environment.ts) — Configuración del realm y cliente
- [src/app/app.config.ts](src/app/app.config.ts) — Inicialización de Keycloak con `onLoad: 'check-sso'`
- [src/shared/guards/auth.guard.ts](src/shared/guards/auth.guard.ts) — Guard que protege rutas de App A
