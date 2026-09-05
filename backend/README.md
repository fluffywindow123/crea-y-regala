# Publicaciones de Facebook · Crea y Regala

## Estado real

El frontend y el backend están implementados. **No hay conexión activa con Meta**: faltan una aplicación autorizada, un Page Access Token y el despliegue del backend. No hay posts de ejemplo en producción. Facebook oficial: https://www.facebook.com/profile.php?id=100092747371943. El ID proporcionado debe confirmarse como ID de Página accesible por la aplicación; si corresponde a un perfil personal, la Pages API no servirá para recuperar sus publicaciones.

GitHub Pages continúa alojando HTML/CSS/JS. No se debe volver a crear `.openai` ni colocar secretos en la web. `posts-config.js` contiene exclusivamente la URL pública del backend y la página oficial.

## Configuración de Meta (por el propietario)

1. En https://developers.facebook.com/apps/ registra una aplicación para este negocio y añade el producto/caso de uso de Facebook Login que Meta ofrezca para esta cuenta.
2. Confirma el acceso administrativo a la Página. Solicita los permisos y revisiones aplicables para leer publicaciones (`pages_read_engagement`) y contenido de usuarios/comentarios (`pages_read_user_content`); `pages_show_list` puede ser necesario durante la obtención del Page Access Token. La aprobación y disponibilidad deben verificarse en la consola de la aplicación. No se consideran concedidos por el código.
3. Selecciona una versión soportada de Graph API en la consola y ponla en `META_GRAPH_VERSION` (formato `vN.0`). Se exige una versión explícita para no asumir compatibilidad futura.
4. Configura la URI OAuth exacta `https://TU-API/api/auth/facebook/callback`. Completa los requisitos actuales de Meta sobre dominio, política de privacidad, eliminación de datos y modo público antes de habilitar Login para clientes reales.
5. Obtén un Page Access Token por el flujo oficial de Meta. Instálalo como secreto del backend, nunca en `posts-config.js`, un commit, un chat o un archivo del sitio.

Referencias oficiales para confirmar permisos y versión antes de activar:
- https://developers.facebook.com/docs/pages-api/posts/
- https://developers.facebook.com/docs/graph-api/reference/object/comments/
- https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/

La documentación oficial devolvió HTTP 429 durante esta implementación. Por ello las consultas requieren validación real con la versión y permisos de la app antes de declarar la integración operativa.

## Cloudflare Workers (implementación de referencia)

El módulo `core.mjs` usa Request/Response/Web Crypto y no depende de almacenamiento ni bibliotecas de proveedor. Usa Wrangler oficial desde la carpeta `backend`:

```sh
npx wrangler login
npx wrangler secret put META_PAGE_ACCESS_TOKEN
npx wrangler secret put META_APP_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

`SESSION_SECRET`: secreto aleatorio de al menos 32 bytes generado por un gestor de contraseñas. Configura primero `wrangler.jsonc`: `API_ORIGIN` debe ser el origen HTTPS final del Worker, `SITE_ORIGIN` debe ser exactamente `https://fluffywindow123.github.io` (sin la ruta del repositorio), `META_APP_ID`, `META_PAGE_ID` y la versión explícita. `FEATURED_POST_ID` opcional debe pertenecer a la página y tener el formato `PAGEID_POSTID`.

Después establece `API_BASE_URL` en `posts-config.js` con el origen del backend y publica solo los archivos estáticos. Para probar localmente usa `.dev.vars` ignorado por Git; nunca publiques ese archivo.

## Otros proveedores

- Vercel: adapta una función Node a `adapters/vercel.mjs`, conservando la importación de `core.mjs`; configura un rewrite que envíe `/api/:path*` a esa función. Usa Node 22+ y variables de entorno privadas.
- Netlify: registra `adapters/netlify.mjs` como función moderna Fetch y conserva `core.mjs` en el bundle. La ruta `/api/*` está en `config`.
- Supabase: usa `adapters/supabase.mjs` como entrada de Edge Function, incluye `core.mjs` y configura `API_BASE_URL` con el prefijo de la función. `API_ORIGIN` debe incluir ese mismo prefijo para generar el callback correcto. Las lecturas públicas requieren que el gateway deje llegar las peticiones sin JWT. OAuth y CORS se validan dentro del handler.

Estos adaptadores son preparativos; no se han desplegado ni probado en cada proveedor. El frontend usa el mismo contrato independientemente del alojamiento.

## API

- `GET /api/posts?after=CURSOR`: `{posts,featured,nextCursor}`. 9 publicaciones por página, principal destacada o la más reciente. Los cursores no contienen URLs ni tokens.
- `GET /api/posts/PAGEID_POSTID`: `{post}`.
- `GET /api/posts/PAGEID_POSTID/comments?after=CURSOR`: `{comments,total,nextCursor}`. 25 comentarios por página. Solo acepta IDs de la página configurada.
- `GET /api/session`: `{user,canComment,loginAvailable,commentMode}`.
- `POST /api/auth/facebook`: genera URL de Facebook Login y cookie de estado firmada. El frontend abre la ventana durante el gesto del usuario.
- `GET /api/auth/facebook/callback`: valida estado y cookie, intercambia el código exclusivamente en servidor y obtiene identidad. Devuelve cookie HttpOnly y mensaje a un origen fijo, **sin tokens de Meta**. Cierra la ventana y refresca sesión en el modal.
- `POST /api/posts/PAGEID_POSTID/comments`: devuelve `409 COMMENTING_UNAVAILABLE`. **Nunca publica como Página en nombre de un visitante.**

## Comentarios como usuario: alternativa explícita

`canComment` permanece en `false`. El Page Access Token no representa al visitante; no se usa para enviar sus comentarios. Hasta que Meta ofrezca y autorice expresamente una capacidad para ese usuario, el modal muestra «Comentar en Facebook». No hay comentarios locales ni confirmaciones ficticias.

El frontend admite el contrato futuro `{comment,total}` después de un POST exitoso, conserva el texto cuando falla y muestra los estados de envío. Para habilitarlo se requiere implementar y probar una autorización real de escritura como usuario, almacenamiento server-side del token, protección CSRF, validación del cuerpo, límites de uso e idempotencia; no basta cambiar `canComment` a `true`.

Las cookies propias de sesión son firmadas, HttpOnly, Secure, SameSite=None, expiran en una hora y solo contienen identidad mínima (no tokens). El estado OAuth dura diez minutos. Algunos navegadores bloquean cookies entre sitios: si no se conserva la sesión, el cliente mantiene la alternativa en Facebook. Un dominio propio compartido por web/API permite evitar esa limitación. No se persisten comentarios ni perfiles en una base de datos. Debe documentarse este tratamiento en la política de privacidad de la app real.

## Seguridad y comprobaciones

Nunca devuelvas respuestas crudas de Meta: pueden incluir errores o URLs de paginación con tokens. El backend normaliza campos, recorta la paginación a un cursor, aplica CORS al origen configurado y rechaza IDs ajenos. Mantiene timeout y errores genéricos. Añade límites de peticiones en el proveedor antes de abrirlo al público.

Ejecuta `node --test tests/facebook-api.test.mjs` desde la raíz. Pruebas usan respuestas ficticias aisladas; no se envían a producción. La verificación con Meta real requiere autorización del propietario y credenciales instaladas de forma privada.
