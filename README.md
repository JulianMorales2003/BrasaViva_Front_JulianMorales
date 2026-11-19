# LA BRASA VIVA · Frontend

Interfaz web del restaurante **La Brasa Viva** (parrilla y cortes a la brasa). Consume la API REST del
backend y muestra a cada rol (cliente, mesero, parrillero y administrador) solo lo que puede hacer.

| | |
|---|---|
| **Estudiante** | Julian Felipe Morales Zambrano |
| **Curso** | Desarrollo y Operaciones de Software (DOSW) · 2026-2 · Escuela Colombiana de Ingeniería Julio Garavito |
| **Repositorio Back** | [Bitacora_Corte2_JulianMorales](https://github.com/JulianMorales2003/Bitacora_Corte2_JulianMorales) |

![Menú público](docs/capturas/01-menu-publico.png)

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| React 18 | Componentes y estado de la interfaz |
| Vite 5 | Servidor de desarrollo y build de producción |
| React Router 6 | Rutas y protección de rutas por rol |
| Fetch API | Llamadas HTTP a la API con `Authorization: Bearer <JWT>` |
| CSS propio | Diseño responsive (escritorio y móvil), sin librerías de UI |
| @fontsource | Fuentes empaquetadas localmente (Inter y Fraunces) |

---

## Ejecución

### 1. Levantar el backend

En el repositorio del back:

```bash
docker compose up -d postgres    # base de datos
mvn spring-boot:run              # API en http://localhost:8080
```

El backend ya permite por CORS el origen `http://localhost:3000` (variable `CORS_ORIGENES`) y crea
los usuarios de ejemplo, la carta y las mesas la primera vez que arranca.

### 2. Levantar el frontend

```bash
npm install
cp .env.example .env     # opcional: cambia VITE_API_URL si la API no está en localhost:8080
npm run dev              # http://localhost:3000
```

Build de producción:

```bash
npm run build            # genera dist/
npm run preview          # sirve dist/ en http://localhost:3000
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:8080` |

> Si la API se despliega en otra URL (por ejemplo en Azure), hay que poner esa URL en `VITE_API_URL`
> y agregar el dominio del front en `CORS_ORIGENES` del backend.

### Usuarios de ejemplo

Contraseña de todos: `Brasa2026`. En la pantalla de login hay un botón por rol que llena los datos.

| Rol | Email | Pantalla inicial |
|---|---|---|
| ADMIN | `admin@brasaviva.com` | Reportes |
| MESERO | `mesero@brasaviva.com` | Salón y cuentas |
| PARRILLERO | `parrillero@brasaviva.com` | Cocina |
| CLIENTE | `cliente@brasaviva.com` | Hacer pedido |

---

## Estructura del proyecto

```
src/
├── api/
│   ├── client.js          # fetch + JWT + manejo de errores de la API (ErrorResponse)
│   └── services.js        # un servicio por controlador del backend
├── context/
│   └── AuthContext.jsx    # sesión: login, logout, rol, expiración del token (401)
├── components/
│   ├── Layout.jsx         # barra de navegación según el rol
│   ├── ProtectedRoute.jsx # protege rutas por rol (403 si no corresponde)
│   └── ui.jsx             # avisos, chips de estado, hooks useApi / useAccion
├── pages/                 # una página por funcionalidad (ver tabla siguiente)
├── utils/format.js        # formato de pesos (COP), fechas, categorías y estados
├── App.jsx                # rutas
├── main.jsx
└── styles.css
```

---

## Funcionalidades

Cada pantalla usa los mismos permisos de `SecurityConfig` del backend: la navegación solo muestra
las secciones del rol, las rutas están protegidas y, si aun así la API responde 401 o 403, el front
lo muestra y cierra la sesión cuando el token expira.

| Pantalla | Ruta | Roles | Endpoints que consume |
|---|---|---|---|
| Menú | `/` | Público | `GET /menu?categoria=` |
| Registro / Login | `/registro`, `/login` | Público | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Hacer pedido | `/pedido` | Cliente, mesero | `POST /pedidos`, `POST /pedidos/{id}/items`, `GET /pedidos/{id}` |
| Reservas | `/reservas` | Cliente, mesero, admin | `GET/POST /reservas`, `PUT /reservas/{id}`, `DELETE /reservas/{id}` |
| Salón y cuentas | `/salon` | Mesero, admin | `GET/POST /mesas`, `POST /cuentas`, `GET /cuentas/mesa/{id}`, `GET /pedidos/mesa/{id}`, `POST /cuentas/{id}/pago` |
| Pedidos | `/pedidos` | Mesero, admin | `GET /pedidos?estado=`, `PATCH /pedidos/{id}/estado`, `DELETE /pedidos/{id}` |
| Cocina | `/cocina` | Parrillero (admin solo ve) | `GET /pedidos/cocina`, `GET /pedidos?estado=LISTO`, `PATCH /pedidos/{id}/estado` |
| Carta | `/carta` | Mesero (ver), parrillero, admin | `GET /platos`, `PATCH /platos/{id}/disponible`, `POST/PUT/DELETE /platos` |
| Parqueadero | `/parqueadero` | Mesero, admin | `GET /parqueadero/disponibilidad`, `GET /parqueadero/activos`, `POST /parqueadero/entrada`, `POST /parqueadero/salida/{placa}` |
| Reportes | `/reportes` | Admin | `GET /reportes/resumen`, `GET /reportes/platos-populares`, `GET /reportes/ingresos` |
| Usuarios | `/usuarios` | Admin | `GET /usuarios`, `POST /usuarios` |

### Reglas de negocio que se ven en la interfaz

- **Cortes con término (RN-P01):** al agregar un corte al pedido aparece el selector de término (Azul, Tres cuartos, Bien asado).
- **Cuenta abierta (RN-03):** no se puede pedir para una mesa sin cuenta abierta; el mesero la abre desde *Salón*.
- **Pedido modificable solo en RECIBIDO (RN-01):** el cliente puede agregar platos a su pedido mientras no haya entrado a la parrilla.
- **Plato agotado (RN-02):** cuando el parrillero lo marca agotado, desaparece del menú del cliente.
- **Flujo del pedido:** Recibido → En preparación → Listo (parrillero) → Entregado (mesero). Cancelar solo en Recibido.
- **Cobro:** la API exige que todos los pedidos estén entregados y que el monto cubra el total; el front muestra el cambio.
- **Reservas:** bloqueo de 2 horas por mesa y comensales según la capacidad de la mesa.
- **Errores:** todos los mensajes de la API (400, 401, 403, 404, 409, 422 y 429) se muestran tal como los devuelve el backend, con el detalle de validación cuando lo hay.

---

## Demostración de la plataforma

Recorrido completo de un servicio en el restaurante, de la reserva al cobro.

### 1. Cliente: registro, pedido y reservas

El cliente se registra (la contraseña se valida igual que en el back) y entra directo a pedir.

![Registro](docs/capturas/02-registro.png)

Arma el pedido desde la carta: el corte pide término y cada plato admite observaciones.

![Carrito del cliente](docs/capturas/06-pedido-cliente-carrito.png)

Después de confirmar, sigue el estado de su pedido y puede agregarle platos mientras siga en *Recibido*.

![Seguimiento del pedido](docs/capturas/07-pedido-cliente-seguimiento.png)

Si la mesa no tiene cuenta abierta, la API rechaza el pedido (422) y el front muestra el motivo.

![Error de regla de negocio](docs/capturas/05-error-regla-negocio.png)

Reservas: crear, reprogramar y cancelar. Una reserva que se cruza con otra en la misma mesa devuelve 409.

![Reservas](docs/capturas/08-reservas-cliente.png)

### 2. Mesero: salón y cuentas

El mesero ve el estado de cada mesa y abre la cuenta.

![Salón del mesero](docs/capturas/04-salon-mesero.png)

### 3. Parrillero: cocina y carta

Tablero de cocina en orden de llegada, con término y observaciones a la vista. Se actualiza solo cada pocos segundos.

![Cocina con pedidos recibidos](docs/capturas/09-cocina-recibidos.png)

![Flujo en cocina](docs/capturas/10-cocina-flujo.png)

El parrillero marca un plato como agotado y este deja de aparecer en el menú del cliente.

![Carta del parrillero](docs/capturas/11-carta-parrillero.png)

### 4. Mesero: entrega, cobro y parqueadero

Los pedidos listos aparecen resaltados para entregarlos.

![Pedidos del mesero](docs/capturas/12-pedidos-mesero.png)

Detalle de la cuenta con sus pedidos. Si el monto no alcanza, la API responde 422.

![Cuenta de la mesa](docs/capturas/13-cuenta-mesa.png)

Pago registrado: la cuenta se cierra, la mesa queda libre y se muestra el cambio.

![Pago y cambio](docs/capturas/14-pago-cambio.png)

Parqueadero: cupos, entrada por placa y salida con el cobro por hora o fracción.

![Parqueadero](docs/capturas/15-parqueadero.png)

### 5. Administrador: reportes, usuarios y carta

Resumen del día, platos más vendidos e ingresos por categoría en un rango de fechas.

![Reportes](docs/capturas/16-reportes-admin.png)

Creación de usuarios con rol (meseros, parrilleros, otros administradores).

![Usuarios](docs/capturas/17-usuarios-admin.png)

CRUD completo de la carta.

![Carta del administrador](docs/capturas/18-carta-admin.png)

### 6. Seguridad y diseño responsive

Credenciales inválidas (401) y vista en celular.

![Login con error](docs/capturas/03-login-error.png)

<img src="docs/capturas/19-movil-menu.png" alt="Vista móvil" width="320" />
