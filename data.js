// Base de datos de ALyCs
let alycs = [
  { name: "PPI", connected: true, desc: "Portfolio Personal Inversiones. Conexión institucional." },
  { name: "Balanz", connected: true, desc: "API Retail y Agentes. Ejecución rápida." },
  { name: "IOL", connected: false, desc: "InvertirOnline. Requiere Token OAuth2." }
];

// Base de datos de Clientes
let clients = [
  { id: "#10492", name: "Pérez, J. C.", broker: "PPI", risk: "Conservador", portfolio: 18400000 },
  { id: "#88210", name: "Inversora Sur SA", broker: "Balanz", risk: "Moderado", portfolio: 61200000 }
];
let nextClientNum = 20000;

// Base de datos de Órdenes a ejecutar
let orders = [
  { id: 1, clientName: "Pérez, J. C.", broker: "PPI", action: "COMPRAR", ticker: "AL30", qty: 1800, amount: 1188000, state: "pending" },
  { id: 2, clientName: "Inversora Sur SA", broker: "Balanz", action: "VENDER", ticker: "T2X4", qty: 12000, amount: 14100000, state: "pending" }
];
