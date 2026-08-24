# PocketPal — Backend

API REST de PocketPal: finanzas personales y gestión de préstamos personales.

**Estado actual:** Fase 10 (Calidad) completada. `GET /dashboard` consolidado (balance personal, mes en curso, cartera completa, cobros de hoy, metas) reutilizando las derivaciones de dominio. **Fase 10 (Calidad/Refinamiento) es la siguiente.**

- Stack oficial: `docs/technical/ARCHITECTURE.md` §4–6
- Contrato de API objetivo: `docs/technical/API.md`
- Plan de ejecución: `docs/development/DEVELOPMENT_PLAN.md`

---

## Stack implementado

| Tecnología | Versión instalada | Uso |
|------------|-------------------|-----|
| Python | 3.12 | Runtime |
| FastAPI | 0.141.x | Framework HTTP |
| SQLAlchemy | 2.x | ORM (`DeclarativeBase`, estilo 2.0) |
| Alembic | 1.19.x | Migraciones |
| psycopg 3 (binary) | 3.3.x | Driver PostgreSQL (`postgresql+psycopg://`) |
| Pydantic Settings | 2.x | Configuración por variables de entorno |
| argon2-cffi | 25.x | Hash de contraseñas Argon2id (SECURITY.md §6) |
| PyJWT | 2.13.x | Tokens JWT access/refresh |
| pytest + httpx | latest | Tests HTTP y de configuración |

Las versiones exactas están fijadas en `requirements.txt` (generado con `pip freeze`).

---

## Estructura del proyecto

```text
backend/
├── alembic.ini
├── migrations/              # Entorno Alembic
│   ├── env.py               # Inyecta DATABASE_URL desde app settings; metadata desde app.db.base
│   └── versions/            # 0001_baseline → create_users_table → finance tables
├── requirements.txt         # Dependencias fijadas
└── app/
    ├── main.py              # create_app(): FastAPI + routers + handlers de error + docs según entorno
    ├── api/routes/
    │   ├── health.py        # GET /api/v1/health y GET /api/v1/health/db
    │   ├── auth.py          # register / login / refresh / logout / me
    │   ├── categories.py    # list / create / patch / deactivate
    │   ├── transactions.py  # list paginado+filtros / get / create / patch / cancel
    │   ├── finance.py       # GET /finance/summary (balance con regla de fechas futuras)
    │   └── goals.py         # goals CRUD-lite + contributions + reverse
    ├── core/
    │   ├── config.py        # Settings (pydantic-settings) + validación de JWT_SECRET
    │   ├── security.py      # Argon2id hash/verify + emisión/decodificación JWT (claims sub/type)
    │   ├── dependencies.py  # get_current_user (Bearer → access token → usuario activo)
    │   └── errors.py        # AppError + envelope {"error":{code,message,details}} (API.md §64)
    ├── db/
    │   ├── base.py          # DeclarativeBase compartido por todos los modelos
    │   └── session.py       # engine + SessionLocal (autoflush=False) + dependencia get_db()
    ├── models/
    │   ├── user.py          # users: UUID PK, email único, password_hash, currency, timezone
    │   ├── category.py      # categories + transactions (CHECK constraints, NUMERIC(19,4))
    │   └── goal.py          # financial_goals + goal_contributions
    ├── schemas/
    │   ├── auth.py          # Register/Login/Refresh requests + TokenPair/User responses
    │   ├── common.py        # PaginatedResponse + format_money() (serialización "12345.00")
    │   └── finance.py       # DTOs y validaciones de finanzas (Decimal entrada → string salida)
    ├── services/
    │   ├── auth_service.py  # Registro (+seed de categorías atómico), login, refresh
    │   └── finance_service.py  # Reglas de negocio de finanzas (FINANCIAL_RULES.md)
    ├── repositories/
    │   ├── user_repository.py
    │   ├── finance_repository.py  # Consultas user-scoped + filtros + sum_amounts()
    │   └── goal_repository.py     # current_amount derivado = SUM(aportes activos)
    ├── calculators/         # (vacío) motor financiero aislado — Fase 5
    └── __init__.py
tests/
├── conftest.py              # BD dedicada pocketpal_test + migraciones automáticas + truncate por test
├── test_config.py           # settings y validación de secretos
├── test_health.py           # endpoints de salud
├── test_auth_api.py         # autenticación (registro, login, tokens, expiración)
└── test_finance_api.py      # 21 tests de finanzas (categorías, transacciones, balance, metas)
```

La correspondencia de cada capa con su responsabilidad está definida en `docs/technical/ARCHITECTURE.md` §7–16.

---

## Puesta en marcha

Requisitos: Python 3.12+, PostgreSQL accesible (ver `docker compose up -d db` en la raíz).

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload     # http://localhost:8000
```

> Nota sobre el puerto 5433: el `docker-compose.yml` de la raíz publica PostgreSQL en **5433** porque 5432 puede estar ocupado por un PostgreSQL del sistema. Si tu entorno usa otro puerto, ajusta `POSTGRES_PORT` (raíz) y `DATABASE_URL` (backend).

---

## Endpoints implementados

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/v1/health` | No | `200 {"status":"ok"}` |
| GET | `/api/v1/health/db` | No | `200 {"status":"ok","database":"ok"}` (ejecuta `SELECT 1`) |
| POST | `/api/v1/auth/register` | No | `201 {user, access_token, refresh_token, token_type}` · `409 EMAIL_ALREADY_REGISTERED` |
| POST | `/api/v1/auth/login` | No | `200 {user, access_token, refresh_token, token_type}` · `401 INVALID_CREDENTIALS` |
| POST | `/api/v1/auth/refresh` | No | Body `{refresh_token}` → `200 {access_token, token_type}` · `401 INVALID_REFRESH_TOKEN` |
| POST | `/api/v1/auth/logout` | — | `204` (JWT stateless: la invalidación es local en el cliente) |
| GET | `/api/v1/auth/me` | Sí | `200 {id, email, full_name, created_at}` · `401 NOT_AUTHENTICATED / INVALID_TOKEN` |
| GET | `/api/v1/categories` | Sí | Filtros `type`, `is_active` · lista propia del usuario |
| POST | `/api/v1/categories` | Sí | `201` · `409 CATEGORY_ALREADY_EXISTS` (case-insensitive, solo activas) |
| PATCH | `/api/v1/categories/{id}` | Sí | Renombrar · `404` si no es propia · `409` duplicado |
| POST | `/api/v1/categories/{id}/deactivate` | Sí | Soft-off (historial intacto) · `409` si ya inactiva |
| GET | `/api/v1/transactions` | Sí | `type, category_id, start_date, end_date, status, page, page_size` (paginado §55) |
| POST | `/api/v1/transactions` | Sí | `201` monto string `>0` · `422` tipo≠categoría · `404/409` categoría ajena/inactiva |
| GET/PATCH | `/api/v1/transactions/{id}` | Sí | Detalle / edición parcial · `409` si CANCELLED |
| POST | `/api/v1/transactions/{id}/cancel` | Sí | Cancelación (sin borrado físico) · `409` doble cancelación |
| GET | `/api/v1/finance/summary` | Sí | `{currency, total_income, total_expenses, balance}` · fechas futuras excluidas por defecto |
| GET/POST | `/api/v1/goals` | Sí | Lista con progreso (cap 100%) / creación |
| GET/PATCH | `/api/v1/goals/{id}` | Sí | Detalle con `current_amount` derivado de aportes activos |
| POST | `/api/v1/goals/{id}/cancel` | Sí | Cancelación · `409` doble |
| GET/POST | `/api/v1/goals/{id}/contributions` | Sí | Historial / nuevo aporte (`201`; marca COMPLETED al alcanzar target) |
| POST | `/api/v1/goals/{id}/contributions/{id}/reverse` | Sí | Reversa (mantiene registro; puede volver la meta a ACTIVE) |
| GET | `/api/v1/clients` | Sí | `search, status, page, page_size` · búsqueda por nombre/documento/teléfono |
| POST | `/api/v1/clients` | Sí | `201` · email normalizado; solo nombre obligatorio |
| GET/PATCH | `/api/v1/clients/{id}` | Sí | Detalle / edición parcial |
| POST | `/api/v1/clients/{id}/deactivate` | Sí | Soft-off · `409 CLIENT_ALREADY_INACTIVE` |
| GET | `/api/v1/clients/{id}/summary` | Sí | Métricas contractuales a 0 hasta Fase 6 (no hay préstamos aún) |
| GET/POST | `/api/v1/clients/{id}/references` | Sí | Historial / creación de referencias |
| PATCH | `/api/v1/clients/{id}/references/{ref_id}` | Sí | Edición parcial |
| POST | `/api/v1/clients/{id}/references/{ref_id}/deactivate` | Sí | Soft-off · `409 REFERENCE_ALREADY_INACTIVE` |
| POST | `/api/v1/loans` | Sí | `201` préstamo+schedule atómicos · valida compatibilidad frecuencia/período (`422`) · `404` cliente ajeno |
| GET | `/api/v1/loans` | Sí | `status, client_id, start_date, end_date, page, page_size` |
| GET | `/api/v1/loans/{id}` | Sí | Detalle con métricas derivadas y estado vivo (OVERDUE/PAID calculados por backend) |
| GET | `/api/v1/loans/{id}/schedule` | Sí | Cuotas con estado/días de mora usando la zona horaria del usuario |
| POST | `/api/v1/loans/{id}/cancel` | Sí | Cancelación preservando historial · `409 LOAN_ALREADY_CANCELLED` |
| POST | `/api/v1/loans/{id}/payments` | Sí | Operación atómica: mora elegible al vuelo → asignación LF→I→P (motor) → cuotas/préstamo/ingresos/auditoría. Header `Idempotency-Key`: replay devuelve el pago original sin duplicar |
| GET | `/api/v1/loans/{id}/payments` | Sí | Historial cronológico; reversas permanecen visibles |
| GET | `/api/v1/loans/{id}/payments/{pid}` | Sí | Detalle con breakdown autoritativo `{late_fee, interest, principal, credit}` |
| POST | `/api/v1/loans/{id}/payments/{pid}/reverse` | Sí | Reversa desde asignaciones almacenadas (§44) + cancelación de ingresos vinculados · requiere `reason` |
| GET | `/api/v1/collections/today` | Sí | Cuotas que vencen HOY + vencidas pendientes; resumen `expected/collected/pending/overdue`; fecha por zona horaria del usuario |
| GET | `/api/v1/collections?filter=` | Sí | TODAY/WEEK/MONTH/OVERDUE/UPCOMING/ALL (+client_id/loan_id); orden por urgencia; mora proyectada read-only |
| GET | `/api/v1/dashboard` | Sí | Read-model consolidado: balance/mes, cartera completa, cobros de hoy y metas con progreso |

Comportamiento de pagos implementado:

- **Atomicidad total** en una transacción: payment + allocations + cuotas + estado de préstamo + transacción de ingreso + auditoría (`PAYMENT_RULES` §66).
- **Mora**: aplicada una sola vez por cuota al registrar el pago, usando días vencidos reales y gracia configurada; base = capital pendiente de la cuota; nunca compone.
- **Concurrencia**: `SELECT ... FOR UPDATE` ordenado sobre las cuotas — dos pagos simultáneos no pueden aplicar el mismo saldo dos veces (`DATABASE.md` §48). Nota: la protección es estructural; no se incluye test multihilo deliberadamente para evitar flakes de CI.
- **Idempotencia**: `UNIQUE(user_id, idempotency_key)`; un retry devuelve el pago existente (`API.md` §47).
- **Sobrepago**: el excedente se expone como `credit` explícito del pago (§27–28); jamás produce saldos negativos.
- **Ingresos personales**: una única transacción INCOME trazable (`source_type/source_id`) por interés + mora cobrados; la recuperación de capital NUNCA es ingreso (FINANCIAL_RULES §25–31). La reversa la marca CANCELLED.
- **Estados**: POSTED/REVERSED según `PAYMENT_RULES` §7 (el bosquejo ACTIVE/REVERSED de DATABASE.md §28 quedó documentado como diferencia resuelta a favor del documento de negocio).

Errores financieros implementados: `CATEGORY_TYPE_MISMATCH`, `CATEGORY_INACTIVE`, `CATEGORY_ALREADY_EXISTS`, `TRANSACTION_ALREADY_CANCELLED`, `GOAL_ALREADY_CANCELLED`, `CONTRIBUTION_ALREADY_REVERSED`, `INVALID_STATE`.

Comportamiento financiero clave (verificado por tests):

- **Dinero**: entrada `Decimal > 0` (máx. 2 decimales); salida **string** `"85000.00"` (`API.md` §60). Nunca float.
- **Balance** = ingresos válidos − gastos válidos; transacciones CANCELLED excluidas; fechas futuras excluidas por defecto e incluidas solo si se pide `end_date` explícito (FINANCIAL_RULES §9).
- **Metas**: `current_amount` nunca se almacena ni edita — siempre SUM de aportes ACTIVE; progreso mostrado con cap 100%; reversar aportes puede devolver COMPLETED → ACTIVE.
- **Aislamiento**: toda consulta filtra por `user_id`; recursos ajenos responden 404 sin revelar existencia.
- Al registrarse se siembran las 16 categorías por defecto en la misma transacción (DATABASE.md §55).

Comportamiento de seguridad implementado:

- Contraseñas con **Argon2id** (`$argon2id$...`); nunca en texto plano ni en respuestas.
- Login devuelve el **mismo error** para email inexistente y contraseña incorrecta (SECURITY.md §2.5).
- Email normalizado a minúsculas; duplicados detectados sin distinción de mayúsculas.
- JWT con claims `sub` (UUID), `type` (`access`/`refresh`), `iat`, `exp`; un refresh token **no** sirve como access token y viceversa.
- Todos los errores siguen el envelope oficial `{"error":{"code","message","details"}}`, incluidos los 422 de validación.

Endurecimiento aplicado (SECURITY.md):

- **Throttling** por IP con ventana deslizante en login/register/refresh → `429 RATE_LIMITED` + `Retry-After`. Implementación en-memoria válida para despliegue monoproceso; escalar horizontalmente exigirá almacén compartido (documentado).
- **Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`; HSTS solo en producción.
- **CORS restrictivo** por allow-list explícita (variable `CORS_ORIGINS`).
- **Auditoría completa** de operaciones financieras (§39): transacciones y aportes de metas ya generan eventos junto a préstamos/pagos.

En `ENVIRONMENT=production` además se deshabilitan `/docs`, `/redoc` y `/openapi.json`, y se exige `JWT_SECRET` ≥ 32 caracteres.

---

## Configuración

Leída por `app/core/config.py` desde el archivo `.env` (o variables de proceso):

| Variable | Obligatoria | Defecto | Descripción |
|----------|-------------|---------|-------------|
| `APP_NAME` | No | `PocketPal API` | Título en OpenAPI |
| `RATE_LIMIT_LOGIN_PER_MINUTE` / `_REGISTER_` / `_REFRESH_` | No | `10` / `5` / `30` | Throttling por IP (ventana 60 s, por endpoint) |
| `CORS_ORIGINS` | No | *(vacío)* | Orígenes permitidos separados por coma; vacío = sin acceso cross-origin de navegadores |
| `ENVIRONMENT` | No | `development` | `production` desactiva documentación y exige secreto fuerte |
| `API_V1_PREFIX` | No | `/api/v1` | Prefijo versionado de la API |
| `DATABASE_URL` | No | `postgresql+psycopg://pocketpal:pocketpal@localhost:5433/pocketpal` | Conexión SQLAlchemy/Alembic |
| `JWT_SECRET` | **Sí** | — | Secreto HMAC para firmar JWT. En producción ≥ 32 caracteres |
| `JWT_ALGORITHM` | No | `HS256` | Algoritmo JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Vida útil del access token |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `30` | Vida útil del refresh token |

`.env.example` contiene placeholders (sin valores). **Nunca commitear `.env` real.**

---

## Base de datos y migraciones

```bash
alembic upgrade head          # aplicar todas las migraciones pendientes
alembic downgrade -1          # revertir la última
alembic revision -m "mensaje" # generar migración vacía
alembic current               # revisión actual
```

- La URL de conexión se inyecta en `migrations/env.py` desde las settings de la app (no se escribe en `alembic.ini`).
- El `target_metadata` apunta a `app.db.base.Base.metadata`; los modelos nuevos deben importarse/exportarse desde `app/models/__init__.py` para que autogenerate los detecte.
- Regla oficial: ningún cambio de esquema fuera de Alembic (`docs/technical/DATABASE.md` §53).

Orden de creación de tablas previsto (Fase 2+): `docs/technical/DATABASE.md` §54.

---

## Tests

```bash
pytest -q
```

**111 tests pasando** (56 de API/integración + 45 unitarios del motor financiero puro). Los tests de API usan una base de datos dedicada `pocketpal_test` que se crea y migra automáticamente en la primera ejecución; cada test arranca con las tablas truncadas (aislación total).

Áreas cubiertas: salud, configuración/secretos, autenticación completa, clientes (CRUD, búsqueda por nombre/documento/teléfono, paginación, desactivación con conflicto en doble operación, resumen contractual, ciclo completo de referencias y aislamiento estricto usuario A vs B en 8 operaciones), categorías (seed de registro, filtros, duplicados case-insensitive, desactivación+recreación), transacciones (montos inválidos, decimales >2, tipo≠categoría, categoría ajena 404 sin leaks, categoría inactiva, cancelación y exclusión del listado, paginación/filtros de fecha, edición y aislamiento), balance (ingresos−gastos, canceladas fuera, fechas futuras fuera por defecto) y metas (ciclo completo, aportes, completado automático, reversa que restaura ACTIVE, validación y aislamiento).

Convenciones de nombres y niveles de testing previstos: `docs/development/TESTING.md`.

---

## Decisiones técnicas vigentes

1. **Driver síncrono** (`psycopg`) con SQLAlchemy 2.0 style. FastAPI ejecuta los handlers en threadpool. Se reevaluará async solo si existe una necesidad medida (regla anti-sobreingeniería, `AI_MASTER_PROMPT.md` §42).
2. **UUID como PK** para todas las entidades (`docs/technical/DATABASE.md` §6).
3. **Dinero**: cuando se implementen montos, será `Decimal` / `NUMERIC(19,4)`; prohibido float (`docs/business/FINANCIAL_RULES.md` §3). Aún no hay campos monetarios.
4. **Configuración centralizada** en `core/config.py`; nada hardcodeado.
5. **JWT stateless en v1.0**: logout = 204 + invalidación local del cliente; la revocación server-side de refresh tokens queda documentada como mejora futura (SECURITY.md §11).
6. **Errores de dominio vía `AppError`**: los servicios lanzan códigos tipados; el envelope HTTP se construye en un solo lugar (`core/errors.py`).
7. **`autoflush=False`**: los servicios hacen `flush()` explícito antes de consultas que dependen de cambios pendientes (p.ej. recalcular SUM tras cancelar un aporte) — bug detectado y cubierto por test de reversa.
8. **Commits en el servicio**: los repositorios solo `flush()`; el límite transaccional lo define el servicio (permite seed atómico usuario+categorías).

Comportamiento de préstamos implementado:

- **Schedule persistido = salida exacta del motor validado** (verificado por tests contra el ejemplo §61).
- **Regla v1.0 de compatibilidad**: la tasa se aplica una vez por cuota; combinaciones incompatible (p. ej. WEEKLY + MONTHLY) se rechazan con `422` en vez de inventar conversiones no documentadas (LOAN_RULES §16).
- **Métricas derivadas** desde cuotas persistidas: outstanding = Σ(due−paid); nunca editables.
- **Estado vivo**: OVERDUE si alguna cuota está vencida con saldo; PAID solo cuando todo está cubierto; CANCELLED únicamente por operación explícita + evento de auditoría.
- **Zona horaria del usuario** determina el "hoy" financiero para mora (FINANCIAL_RULES §33).

**Nota de migraciones:** la revisión `3a7c1f9d4b21` restaura de forma idempotente el índice único parcial de categorías (una revisión intermedia llegó a publicarse con un drop accidental del mismo). El índice está declarado también en el metadata del modelo para que futuros autogenerates no lo marquen como eliminable.

Comportamiento de cobros:

- **Read-only**: el endpoint nunca muta estado; la mora mostrada es proyección del calculador oficial y solo se vuelve autoritativa al registrar un pago contra esa cuota.
- **Clasificaciones** DUE_TODAY/OVERDUE/UPCOMING son etiquetas de presentación (`PAYMENT_RULES` §52); el estado autoritativo sigue siendo el de la cuota.
- **Expected** = montos programados del día; Pending = expected − collected (§50).

Comportamiento del dashboard:

- **Cero lógica nueva**: cada métrica reutiliza las mismas derivaciones que los endpoints de dominio (transacciones activas ≤ hoy para balance; Σ(due−paid) por componente excluyendo préstamos cancelados; clasificación oficial de cobros para expected/pending/overdue).
- El interés cobrado entra al balance personal vía los ingresos ya registrados por pagos — el dashboard no vuelve a contar nada.

## Producción

Requisitos por `ROADMAP` §15 y `SECURITY.md`:

```bash
ENVIRONMENT=production                      # deshabilita /docs, activa HSTS
JWT_SECRET=<>=32 chars, generado con secrets.token_urlsafe(48)>
DATABASE_URL=postgresql+psycopg://<user>:<pass>@<host>/<db>   # TLS según infra
CORS_ORIGINS=https://<dominios-permitidos>  # vacío = sin orígenes de navegador
```

- Ejecutar detrás de proxy TLS (nginx/ALB); HSTS se emite automáticamente.
- El rate limiter es en-memoria: válido para 1 instancia; escalar horizontalmente requiere almacén compartido.
- Migraciones: ejecutar `alembic upgrade head` en ventana controlada (nunca auto-migrar al arranque).
- `docker-compose.yml` es SOLO desarrollo local.

## Pendiente (próxima fase)

Ninguna para v1.0. Post-release candidatos registrados en DEVELOPMENT_PLAN §10c/§7.
