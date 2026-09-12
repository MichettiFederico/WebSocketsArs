// 1. NAVEGACIÓN ENTRE SECCIONES
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    item.classList.add("active");
    document.getElementById("view-" + item.dataset.view).classList.add("active");
  });
});

// 2. RENDERIZAR CONEXIONES ALYCS
function renderAlycs() {
  const grid = document.getElementById("alycGrid");
  const headerStatus = document.getElementById("header-conn-status");
  grid.innerHTML = alycs.map(a => `
    <div class="alyc-card">
      <div style="display:flex; justify-content:space-between;">
        <strong>${a.name}</strong>
        <span style="color:${a.connected ? 'var(--accent)' : 'var(--red)'}">${a.connected ? '✓ Conectado' : '✕ Desconectado'}</span>
      </div>
      <p style="color:var(--text-muted); font-size:12px;">${a.desc}</p>
      <button class="btn ${a.connected ? 'btn-ghost' : 'btn-primary'} btn-sm" onclick="${a.connected ? `disconnectAlyc('${a.name}')` : `openApiModal('${a.name}')`}">${a.connected ? 'Desvincular' : 'Conectar API Key'}</button>
    </div>
  `).join("");
  headerStatus.innerHTML = alycs.map(a => `<span><span class="dot ${a.connected ? 'on' : 'off'}"></span>${a.name}</span>`).join("");
}

// 3. RENDERIZAR COMITENTES
function renderClients() {
  const tbody = document.getElementById("clientsTable");
  tbody.innerHTML = clients.map(c => `
    <tr><td><b>${c.name}</b></td><td>${c.id}</td><td>${c.broker}</td><td>${c.risk}</td><td>$ ${c.portfolio.toLocaleString('es-AR')}</td></tr>
  `).join("");
}

// 4. RENDERIZAR ÓRDENES Y EJECUCIÓN
function renderOrders() {
  const tbody = document.getElementById("ordersTable");
  tbody.innerHTML = orders.map(o => {
    let statusText = o.state === 'pending' ? '<span style="color:gray;">Esperando...</span>' : 
                     o.state === 'done' ? '<span style="color:var(--accent);">✓ Ejecutada</span>' : '<span style="color:var(--blue);">En mercado...</span>';
    return `<tr><td>${o.clientName}</td><td>${o.broker}</td><td>${o.action} ${o.qty} ${o.ticker}</td><td>$ ${o.amount.toLocaleString('es-AR')}</td><td>${statusText}</td></tr>`;
  }).join("");
  
  let done = orders.filter(o => o.state === "done").length;
  document.getElementById("progressFill").style.width = (done / orders.length * 100) + "%";
  document.getElementById("progressCount").innerText = `${done} / ${orders.length} ejecutadas`;
}

// 5. SIMULACIÓN DE REBALANCEO
document.getElementById("btnExecute").addEventListener("click", () => {
  orders.forEach((o, index) => {
    if(o.state === 'done') return;
    o.state = 'processing';
    renderOrders();
    setTimeout(() => { o.state = 'done'; renderOrders(); showToast("Órdenes procesadas con éxito"); }, 1500 * (index + 1));
  });
});
document.getElementById("btnReset").addEventListener("click", () => {
  orders.forEach(o => o.state = 'pending');
  renderOrders();
});

// 6. MODALES Y TOASTS
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// Modal ALyC
const apiModal = document.getElementById("apiModalOverlay");
function openApiModal(name) { document.getElementById("apiBrokerName").value = name; apiModal.classList.add("show"); }
document.getElementById("apiCancelBtn").onclick = () => apiModal.classList.remove("show");
document.getElementById("apiForm").onsubmit = (e) => {
  e.preventDefault();
  let name = document.getElementById("apiBrokerName").value;
  alycs.find(a => a.name === name).connected = true;
  apiModal.classList.remove("show"); renderAlycs(); showToast("Broker conectado");
};

// Modal Cliente
const clientModal = document.getElementById("clientModalOverlay");
document.getElementById("btnAddClient").onclick = () => clientModal.classList.add("show");
document.getElementById("clientCancelBtn").onclick = () => clientModal.classList.remove("show");
document.getElementById("clientForm").onsubmit = (e) => {
  e.preventDefault();
  clients.push({
    id: "#" + (nextClientNum++),
    name: document.getElementById("cfName").value,
    broker: document.getElementById("cfBroker").value,
    risk: "Conservador",
    portfolio: parseFloat(document.getElementById("cfPortfolio").value)
  });
  clientModal.classList.remove("show"); renderClients(); showToast("Comitente agregado");
};

// Inicializar al cargar la página
renderAlycs();
renderClients();
renderOrders();
