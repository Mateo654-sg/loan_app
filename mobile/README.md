# PocketPal — App móvil

Aplicación móvil de PocketPal: finanzas personales y préstamos personales.

**Estado actual:** Fase 10 completada. Dark mode completo de contenido, accesibilidad base y skeletons; seguridad del backend endurecida. Solo falta la Fase 11: checklist de release.

- Arquitectura móvil oficial: `docs/technical/ARCHITECTURE.md` §25–30
- Experiencia de usuario objetivo: `docs/design/UI_UX.md`
- Plan de ejecución: `docs/development/DEVELOPMENT_PLAN.md`

---

## Stack implementado

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React Native | 0.86.x | Runtime UI |
| Expo (SDK) | 57 | Plataforma y tooling |
| TypeScript | 6.x (`strict`) | Tipado estático |
| Expo Router | 57.x | Navegación basada en archivos (`app/`) |
| TanStack Query | 5.x | Estado de servidor (queries/mutaciones) |
| Zustand | 5.x | Estado local de aplicación (sesión de autenticación) |
| React Hook Form + Zod | 7.x / 4.x (+ `@hookform/resolvers`) | Formularios y validación de esquemas |
| expo-secure-store | 57.x | Persistencia segura de tokens (SECURITY.md §10) |

Versiones exactas en `mobile/package.json`.

---

## Estructura del proyecto

Corresponde a la estructura definida en `ARCHITECTURE.md` §25:

```text
mobile/
├── app/
│   ├── _layout.tsx         # Raíz: hidratación de sesión, QueryClient, tema,
│   │                       # navegación protegida con Stack.Protected
│   ├── (auth)/
│   │   ├── _layout.tsx     # Stack del grupo no autenticado
│   │   ├── login.tsx       # Formulario login (RHF + Zod)
│   │   └── register.tsx    # Formulario registro (RHF + Zod)
│   └── (app)/
│       ├── _layout.tsx     # Tabs: Inicio · Finanzas · Préstamos · Clientes
│       ├── index.tsx       # Inicio: perfil + estado de conexión + logout
│       ├── finance/
│       │   ├── _layout.tsx         # Stack de la sección Finanzas
│       │   ├── index.tsx           # Resumen (balance/ingresos/gastos) + lista paginada
│       │   │                       # con filtro tipo, cancelación y "Load more"
│       │   ├── new-transaction.tsx # Formulario ingreso/gasto (RHF+Zod, selector categoría)
│       │   ├── categories.tsx      # Crear/desactivar categorías por tipo
│       │   └── goals.tsx           # Metas: crear, progreso, aportes
│       ├── loans/
│       │   ├── _layout.tsx         # Stack de la sección Préstamos
│       │   ├── index.tsx           # Lista + acceso a Cobros del día
│       │   ├── collections.tsx     # Resumen esperado/recaudado/pendiente/mora,
│       │   │                       # filtros y acción Collect → detalle préstamo
│       │   ├── new.tsx             # Formulario: cliente, monto, tasa, tipo,
│       │   │                       # frecuencia (período derivado), cuotas,
│       │   │                       # fechas y mora opcional
│       │   └── [id].tsx            # Detalle: estado, desglose principal/interés/
│       │                           # mora/total y tarjetas de cuotas con estados
│       └── clients/
│           ├── _layout.tsx         # Stack de la sección Clientes
│           ├── index.tsx           # Lista con búsqueda (nombre/doc/teléfono),
│           │                       # paginación infinita y empty state accionable
│           ├── new.tsx             # Formulario de creación (RHF+Zod)
│           └── [id].tsx            # Detalle: resumen financiero, contacto,
│                                   # referencias (+añadir) y desactivación
├── components/
│   ├── form-input.tsx      # Input etiquetado con error/hint inline (DESIGN_SYSTEM §31–33)
│   └── status-card.tsx     # Tarjeta label + estado (solo presentación)
├── constants/
│   └── tokens.ts           # Spacing y Radius (independientes del tema)
├── theme/
│   └── palette.ts          # Paletas semánticas light/dark (DESIGN_SYSTEM §66)
├── features/
│   ├── auth/schemas.ts     # Esquemas Zod de login/registro
│   ├── finance/
│   │   ├── types.ts        # DTOs (amounts como string — nunca float)
│   │   ├── api.ts          # Funciones fetch por recurso
│   │   ├── queries.ts      # useQuery/useInfiniteQuery + mutaciones con invalidación (API.md §88)
│   │   └── schemas.ts      # Esquemas Zod de formularios financieros
│   ├── dashboard/
│   │   ├── types.ts        # DTOs del read-model consolidado
│   │   └── queries.ts      # useDashboard (refetch on focus)
│   ├── collections/
│   │   ├── types.ts        # DTOs de ítems/resumen de cobros
│   │   ├── api.ts          # getTodayCollections / getCollections(filter)
│   │   └── queries.ts      # useTodayCollections / useCollections
│   └── loans/
│       ├── types.ts        # DTOs de préstamo/cuotas/pagos/asignación
│       ├── api.ts          # + registerPayment (con Idempotency-Key), payments, reverse
│       ├── queries.ts      # + usePayments/useRegisterPayment/useReversePayment
│       └── schemas.ts      # Formulario con período derivado de la frecuencia
├── services/
│   ├── api/
│   │   ├── client.ts       # fetch wrapper: base URL, bearer, ApiError{status,code},
│   │   │                   # refresh single-flight ante 401 + reintento único
│   │   └── health.ts       # getHealth / getDatabaseHealth
│   └── auth/
│       ├── session-storage.ts # Persistencia de tokens en SecureStore
│       └── auth-service.ts    # register/login/hydrate/me/logout (orquesta API+store)
├── hooks/
│   ├── use-api-health.ts   # useQuery del endpoint /health
│   └── use-palette.ts      # Paleta según esquema del sistema
├── stores/
│   └── auth-store.ts       # Estado de sesión (Zustand): user + tokens + hydrated
├── types/
│   └── api.ts              # DTOs compartidos de autenticación/errores
├── utils/
│   ├── money.ts            # Formato COP para presentación (sin lógica financiera)
│   └── uuid.ts             # randomUUID seguro para claves de idempotencia
├── app.json
├── tsconfig.json           # strict, alias "@/*"
└── package.json
```

Regla oficial: esta app **no calcula valores financieros autoritativos**; muestra lo que devuelve la API (`ARCHITECTURE.md` §46.1). El formato de moneda es el único "cálculo" permitido en UI (`DESIGN_SYSTEM.md` §20).

---

## Flujo de autenticación implementado

```text
Arranque → hydrateSession() lee SecureStore
   ├─ hay access token → estado autenticado → grupo (app)
   └─ no hay tokens   → grupo (auth): login / register

Login/Register OK → store en memoria + SecureStore
Request autenticado → Authorization: Bearer <access>
401 recibido        → refresh single-flight → reintento único
   ├─ refresh OK    → nuevo access persistido y request reintentado
   └─ refresh falla → clearSession → vuelta al grupo (auth)

Logout → POST /auth/logout (ignora fallos de red) → clearSession + borrado seguro
```

Decisiones explícitas:

- **JWT stateless**: el backend v1.0 no revoca refresh tokens server-side; la sesión termina al descartar tokens localmente (documentado también en `backend/README.md`).
- La pantalla muestra el perfil desde `/auth/me` vía TanStack Query; el store solo es caché de arranque.
- Los formularios validan con Zod **antes** de llamar a la API; los errores del backend (ej. `EMAIL_ALREADY_REGISTERED`) se muestran en texto claro.

---

## Puesta en marcha

Requisitos: Node.js 20+ y npm. El backend debe estar corriendo en `http://localhost:8000` (ver README raíz o `backend/README.md`).

```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

Abrir con `a` (emulador Android), `i` (simulador iOS), `w` (web) o escaneando el QR con Expo Go.

### Configurar `EXPO_PUBLIC_API_BASE_URL` según dónde ejecutes la app

La app lee la URL del backend desde la variable de entorno `EXPO_PUBLIC_API_BASE_URL` (archivo `mobile/.env`). El valor correcto **depende de la plataforma**:

| Entorno de ejecución | Valor |
|----------------------|-------|
| Simulador iOS o navegador web (misma máquina que el backend) | `http://localhost:8000/api/v1` |
| Emulador Android | `http://10.0.2.2:8000/api/v1` (alias del loopback del host) |
| Dispositivo físico vía Expo Go | `http://<IP-LAN-de-tu-PC>:8000/api/v1` (misma red Wi‑Fi) |

Tras cambiar `.env`, reinicia `expo start` con caché limpia: `npx expo start --clear`.

---

## Pantallas implementadas

### Login (`app/(auth)/login.tsx`) y Registro (`app/(auth)/register.tsx`)

- Formularios React Hook Form + Zod: validación inline por campo (email válido, contraseña ≥ 8).
- Botón con estado de carga (`ActivityIndicator`, deshabilitado durante el envío) — sin envíos duplicados.
- Errores del servidor mostrados en texto claro (credenciales inválidas, email ya registrado, red no disponible).
- Navegación cruzada login ↔ registro; tras éxito se entra a `/` (grupo protegido).

### Finanzas (`app/(app)/finance/`)

- **Resumen**: tarjetas Balance / Ingresos / Gastos desde `GET /finance/summary` (backend authoritative; fechas futuras excluidas por defecto).
- **Lista de transacciones**: paginada con *Load more* (`useInfiniteQuery`), filtro Todos/Ingresos/Gastos, montos con signo y color semántico, cancelación con confirmación (Alert) — la cancelación es soft (el registro permanece en el backend).
- **Nueva transacción**: selector Ingreso/Gasto que recarga categorías activas del tipo correspondiente, monto decimal validado por Zod (máx. 2 decimales, > 0), fecha YYYY-MM-DD (por defecto hoy), método de pago opcional. Botón deshabilitado durante el envío.
- **Categorías**: crear por tipo + desactivar con confirmación (las históricas se conservan).
- **Metas**: crear con monto objetivo y fecha opcional, barra de progreso (cap 100% según backend), aporte rápido con fecha de hoy; el estado ACTIVE/COMPLETED lo decide el backend.

Tras cada mutación financiera se invalidan las queries afectadas (`API.md` §88): resumen, transacciones, categorías, metas.

### Clientes (`app/(app)/clients/`)

- **Lista**: búsqueda por nombre/documento/teléfono (se envía al backend al confirmar), paginación infinita, badge de estado y empty state con acción directa.
- **Nuevo cliente**: solo nombre obligatorio (UX de spec §25); email normalizado y validado con Zod.
- **Detalle**: resumen financiero desde `/clients/{id}/summary` (métricas en cero hasta Fase 6 — nunca se calculan en el cliente), información de contacto, referencias activas con formulario para añadir, y desactivación con diálogo de confirmación.

### Préstamos (`app/(app)/loans/`)

- **Lista**: chips de estado (ACTIVE/OVERDUE/PAID/CANCELLED/All), saldo pendiente por préstamo, paginación y FAB.
- **Nuevo préstamo**: selector de cliente activo, monto, tasa %, tipo de amortización, frecuencia — el **período de interés se deriva automáticamente** según la regla v1.0 del backend (no se permiten combinaciones inválidas desde la UI), número de cuotas, fechas y mora opcional (tipo, valor, días de gracia).
- **Detalle**: badge de estado del backend, desglose de saldo (capital/interés/mora/total — nunca una cifra opaca, UI_UX §36) y tarjetas de cada cuota con número, fecha, restante y estado coloreado. Cancelación con confirmación; el registro histórico permanece.

Estados requeridos aún no aplicables: se implementan junto con cada feature según `docs/development/TESTING.md` §40.

---

## Comandos

```bash
npx expo start            # servidor de desarrollo
npm run android           # abre emulador Android
npm run ios               # abre simulador iOS
npm run web               # abre en navegador
npx tsc --noEmit          # typecheck (debe pasar sin errores)
```

---

## Convenciones

1. **Tokens antes que colores sueltos**: todo valor visual va en `constants/tokens.ts`; los tokens completos light/dark llegan en Fase 10 (`DESIGN_SYSTEM.md`).
2. **Sin lógica financiera en la app**: los cálculos los hace el backend; aquí solo transporte (`services/api/client.ts`), presentación y validaciones de UX.
3. **Estado de servidor con TanStack Query**; Zustand solo para estado de sesión/interfaz, nunca duplicando datos del servidor (`ARCHITECTURE.md` §29).
4. **TypeScript estricto**: prohibido `any` salvo razón documentada (`AI_DEVELOPMENT_RULES.md` §17).
5. **Tokens de sesión solo en SecureStore**, nunca en logs ni en almacenamiento sin protección (SECURITY.md §10).
6. **Montos como string** de punta a punta: el backend serializa `"85000.00"`; la app no los convierte a float ni recalcula nada.

### Inicio protegido (`app/(app)/index.tsx`)

Saludo personalizado + fecha financiera. Tarjetas: **balance personal** (con +/- del mes), cartera (Total receivable, Overdue, Capital lent, Interest collected), tarjeta enlazada a Cobros del día, mini-progreso de metas (máx. 3) y acciones rápidas. Refresca al enfocar la pestaña; enlace Log out provisional hasta que exista Ajustes.

### Cobros (`app/(app)/loans/collections.tsx`)

Accesible desde Préstamos ("Today's collections →"). Resumen en 4 tarjetas (Expected/Collected/Pending/Overdue), chips de filtro oficiales y tarjetas por cuota con cliente, días vencidos, mora proyectada y botón **Collect** que abre el préstamo para registrar el pago.

### Dark mode (Fase 10)

Todas las pantallas consumen `usePalette()` → `makeStyles(palette)`; los fondos, bordes, textos y acentos semánticos cambian con el tema del sistema (los componentes de navegación ya lo hacían vía ThemeProvider). Los chips cumplen el objetivo táctil mínimo de 44px (`DESIGN_SYSTEM` §62).

### Accesibilidad aplicada (Fase 10)

Inputs etiquetados para lectores de pantalla (`accessibilityLabel/Hint`) y acciones de solo-icono anunciadas ("Cancel transaction"). Dashboard usa skeleton boxes mientras carga.

## Pendiente (próxima fase)

Fase 11 — Release v1.0: checklist completo en ROADMAP §15 (seguridad, migraciones, financial engine, módulos móviles, documentación). Decisión registrada: `/reports/*` queda post-v1.0 — `/dashboard` cubre el alcance definido.
