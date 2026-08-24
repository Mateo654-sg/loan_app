# PocketPal

Aplicación móvil para la gestión de **finanzas personales** e **inversión privada de dinero (préstamos personales)**: ingresos, gastos, categorías, metas financieras, clientes, préstamos con intereses y amortización, pagos (totales/parciales), mora y recaudos.

PocketPal **no custodia, transfiere ni retiene dinero**: su propósito es registro, cálculo, monitoreo, organización y análisis financiero.

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| Especificación y reglas (`docs/`) | ✅ Completa |
| Fases 1–10 (Fundación → Calidad) | ✅ Implementadas y verificadas |
| Fase 11 — Release | ✅ **v1.0-rc lista** |

Plan de ejecución detallado por fases: [`docs/development/DEVELOPMENT_PLAN.md`](docs/development/DEVELOPMENT_PLAN.md).

> ⚠️ La aplicación permite registrarse, mantener sesión, gestionar **finanzas personales**, administrar **clientes** y crear/seguir **préstamos** con su cronograma generado por el motor validado (amortización fija/francesa, estados y mora calculados por el backend). Los **pagos** ya se registran con asignación oficial mora→interés→capital, mora automática al vuelo, idempotencia y reversas; el ingreso personal refleja solo interés+mora (sin doble conteo). La pantalla de **cobros del día** resume lo esperado/recaudado/pendiente/mora y permite cobrar en dos toques. Checklist de release ejecutado con evidencia en `docs/development/DEVELOPMENT_PLAN.md` §7.

---

## Estructura del repositorio

```text
PrestamosPocketPal/
├── backend/          # API REST — Python + FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL
├── mobile/           # App móvil — React Native + Expo + TypeScript + Expo Router
├── docs/             # Documentación oficial del producto (fuente de verdad)
├── docker-compose.yml# PostgreSQL local para desarrollo
└── .env.example      # Variables del contenedor de base de datos local
```

---

## Requisitos

- Docker (solo para la base de datos local)
- Python 3.12+
- Node.js 20+ y npm

---

## Inicio rápido

### 1. Base de datos (PostgreSQL 16)

```bash
docker compose up -d db
```

El contenedor se publica en el puerto **5433** (no en 5432) para no chocar con una instalación de PostgreSQL del sistema. Configurable vía `.env` en la raíz (ver `.env.example`).

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # valores por defecto para desarrollo local

alembic upgrade head        # aplicar migraciones
uvicorn app.main:app --reload
```

Verificación:

```bash
curl http://localhost:8000/api/v1/health       # {"status":"ok"}
curl http://localhost:8000/api/v1/health/db    # {"status":"ok","database":"ok"}
```

Documentación interactiva (solo fuera de producción): `http://localhost:8000/docs`

### 3. App móvil

```bash
cd mobile
npm install
cp .env.example .env         # ajustar según plataforma (ver mobile/README.md)
npx expo start
```

La primera pantalla verifica la conexión con el backend (`GET /api/v1/health`) con estados de carga, éxito y error.

---

## Puertos y variables de entorno

| Variable | Dónde | Valor por defecto (desarrollo) | Descripción |
|----------|-------|-------------------------------|-------------|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | raíz `.env` | `pocketpal` | Credenciales del contenedor local |
| `POSTGRES_PORT` | raíz `.env` | `5433` | Puerto host del contenedor |
| `APP_NAME` | `backend/.env` | `PocketPal API` | Título de la API |
| `ENVIRONMENT` | `backend/.env` | `development` | `production` deshabilita `/docs` |
| `DATABASE_URL` | `backend/.env` | `postgresql+psycopg://pocketpal:pocketpal@localhost:5433/pocketpal` | Cadena de conexión SQLAlchemy |
| `JWT_SECRET` | `backend/.env` | *(obligatorio, sin defecto)* | Secreto HMAC de los JWT; en producción ≥ 32 caracteres |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | `backend/.env` | `30` / `30` | Vida útil de los tokens |
| `EXPO_PUBLIC_API_BASE_URL` | `mobile/.env` | `http://localhost:8000/api/v1` | URL base del backend consumida por la app |

Los archivos `.env` **nunca** se versionan (regla oficial en `docs/technical/SECURITY.md` §35–38).

---

## Comandos útiles

```bash
# Backend
cd backend && source .venv/bin/activate
pytest                          # suite de tests
alembic revision -m "..."       # crear migración
alembic upgrade head            # aplicar migraciones

# Mobile
cd mobile
npx expo start                  # dev server
npx tsc --noEmit                # typecheck
```

---

## Reglas de oro del proyecto (resumen)

Definidas oficialmente en `docs/`; se aplican a todo cambio:

1. El backend es la única fuente de verdad financiera; la app solo muestra resultados.
2. Dinero siempre con aritmética decimal exacta (`Decimal` / `NUMERIC`). Nunca `float`.
3. Asignación de pagos: mora → interés → capital. Orden inmutable.
4. El historial financiero nunca se borra físicamente (reversas/cancelaciones).
5. Todo recurso pertenece a un usuario aislado, verificado en el servidor.
6. Cálculos financieros aislados en `backend/app/calculators/`, probados antes de construir UI.
7. Cambios de esquema solo vía migraciones Alembic.
8. Nada de secretos en el repositorio.

---

## Mapa de documentación

```text
docs/
├── PRODUCT_SPECIFICATION.md      # Especificación principal del producto
├── business/                     # Reglas financieras, de préstamos y de pagos
├── technical/                    # Arquitectura, base de datos, API y seguridad
├── design/                       # UI/UX y sistema de diseño
└── development/                  # Roadmap, plan de ejecución, testing y reglas de IA
```
