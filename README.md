[README.md](https://github.com/user-attachments/files/32151080/README.md)
# Rebalancia.io — Plataforma de Rebalanceo Masivo de Carteras (WealthTech B2B)

Prototipo funcional (front-end, sin backend) de una plataforma tipo Orion/Addepar pensada
para asesores financieros independientes (idóneos CNV), Agentes de Negociación y Family
Offices en Argentina.

## El problema

Los asesores gestionan cientos de cuentas de clientes ("comitentes"). Cuando cambia la
recomendación de inversión, hoy tienen que entrar a la plataforma de cada ALyC y ejecutar
las operaciones cuenta por cuenta, a mano.

## La solución

Definir una **cartera modelo** (asignación objetivo por instrumento) y, con un clic,
generar y enviar en lote las órdenes de compra/venta necesarias para acercar a cada
comitente a esa cartera, según su perfil de riesgo y liquidez disponible — simulando el
envío vía API/FIX a las principales ALyCs (PPI, Balanz, IOL, Cocos Capital) y el
seguimiento del estado de cada orden en tiempo real vía WebSockets.

## Modelo de negocio

Suscripción mensual a asesores, AN y Family Offices, por volumen de AUM gestionado o por
cuenta. Ver el detalle simulado en el menú **Configuración → Plan de suscripción**.

## Menús / módulos

| Menú | Qué hace |
|---|---|
| **Dashboard Global** | Métricas de actividad de los últimos 7 días, volumen por ALyC, últimos eventos |
| **Carteras modelo** | Crear carteras con asignación objetivo por instrumento (%) y activar la que se usa para rebalancear |
| **Ejecución de rebalanceo** | Genera órdenes sugeridas a partir de la cartera modelo activa, permite agregar órdenes manuales, seleccionar cuáles enviar y ejecutarlas en lote con estado en vivo (API → mercado → ejecutada), incluyendo rechazos simulados y reintento |
| **Comitentes** | Alta, baja y listado de cuentas gestionadas (ALyC, perfil de riesgo, cartera, liquidez disponible) |
| **Conexiones ALyCs** | Estado de la integración con cada agente (API REST / FIX), conectar/desconectar y probar la conexión |
| **Configuración** | Perfil del asesor, alertas y plan de suscripción |

## Cómo correrlo

No requiere backend ni build. Es un sitio estático:

```bash
# Opción 1: abrir directo
open index.html          # macOS
start index.html         # Windows

# Opción 2: servirlo localmente (recomendado, evita problemas de rutas relativas)
npx serve .
# o
python3 -m http.server 8000
```

## Cómo subirlo a GitHub

```bash
git init
git add .
git commit -m "Prototipo Rebalancia.io"
git branch -M main
git remote add origin <URL_DE_TU_REPO>
git push -u origin main
```

Al ser estático, también se puede publicar directo con **GitHub Pages**
(Settings → Pages → Deploy from branch → main → /root).

## Estructura del proyecto

```
rebalancia-io/
├── index.html          # Estructura de las 6 vistas y los modales
├── css/
│   └── styles.css      # Todos los estilos (tema oscuro, componentes, responsive)
├── js/
│   ├── data.js         # Datos simulados y estado compartido (reemplazar por API real)
│   ├── dom.js           # Referencias centralizadas al DOM
│   ├── utils.js         # Helpers: formato de moneda, logs, toasts
│   ├── execution.js      # Lógica de la vista "Ejecución de rebalanceo"
│   ├── clients.js        # Lógica de la vista "Comitentes"
│   ├── models.js          # Lógica de la vista "Carteras modelo"
│   ├── connections.js      # Lógica de la vista "Conexiones ALyCs"
│   ├── dashboard.js         # Lógica de la vista "Dashboard Global"
│   ├── settings.js           # Lógica de la vista "Configuración"
│   ├── nav.js                 # Navegación entre vistas
│   └── app.js                  # Wiring de eventos e inicialización (último script en cargar)
└── README.md
```

## Próximos pasos sugeridos (para pasar de prototipo a producto)

- Reemplazar `js/data.js` por llamadas a una API real (los comitentes, órdenes y carteras
  modelo hoy viven en memoria del navegador y se pierden al refrescar).
- Conexión real vía API/FIX a cada ALyC en vez de la simulación de estados en
  `execution.js`.
- Autenticación y multi-usuario (hoy el "asesor" está hardcodeado).
- Cálculo real de desvío por comitente: hoy se genera con un número aleatorio; en
  producción se compara la tenencia real (vía API de la ALyC) contra la cartera modelo.
- Persistencia de historial de lotes ejecutados para el Dashboard Global.
