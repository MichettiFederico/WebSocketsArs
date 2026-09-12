/* ============================================================
   APP.JS — wiring de eventos e inicialización.
   Debe ser el ÚLTIMO script cargado: para entonces ya existen
   todas las funciones y datos definidos en los módulos anteriores.
   ============================================================ */

/* ---------- Ejecución ---------- */
document.getElementById("searchInput").addEventListener("input", e=>{ searchTerm = e.target.value; renderTable(); });
document.querySelectorAll(".filter-chip").forEach(chip=>{
  chip.addEventListener("click", ()=>{
    document.querySelectorAll(".filter-chip").forEach(c=>c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    renderTable();
  });
});
dom.btnExecute.addEventListener("click", iniciarRebalanceo);
document.getElementById("btnReset").addEventListener("click", resetSim);
document.getElementById("btnAddOrder").addEventListener("click", openOrderModal);
document.getElementById("btnGenerateFromModel").addEventListener("click", generateOrdersFromModel);
document.getElementById("selectAllCheckbox").addEventListener("change", e=>toggleSelectAll(e.target.checked));

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
dom.modalOverlay.addEventListener("click", e=>{ if(e.target===dom.modalOverlay) closeModal(); });

document.getElementById("orderModalClose").addEventListener("click", ()=>dom.orderModalOverlay.classList.remove("show"));
document.getElementById("orderCancelBtn").addEventListener("click", ()=>dom.orderModalOverlay.classList.remove("show"));
dom.orderModalOverlay.addEventListener("click", e=>{ if(e.target===dom.orderModalOverlay) dom.orderModalOverlay.classList.remove("show"); });
document.getElementById("orderForm").addEventListener("submit", submitOrderForm);
[dom.ofSymbol, dom.ofQty].forEach(el => el.addEventListener("input", updateOrderCompute));

/* ---------- Comitentes ---------- */
document.getElementById("btnAddClient").addEventListener("click", openClientModal);
document.getElementById("clientModalClose").addEventListener("click", ()=>dom.clientModalOverlay.classList.remove("show"));
document.getElementById("clientCancelBtn").addEventListener("click", ()=>dom.clientModalOverlay.classList.remove("show"));
dom.clientModalOverlay.addEventListener("click", e=>{ if(e.target===dom.clientModalOverlay) dom.clientModalOverlay.classList.remove("show"); });
document.getElementById("clientForm").addEventListener("submit", submitClientForm);

/* ---------- Carteras modelo ---------- */
document.getElementById("btnAddModel").addEventListener("click", openModelModal);
document.getElementById("modelModalClose").addEventListener("click", ()=>dom.modelModalOverlay.classList.remove("show"));
document.getElementById("modelCancelBtn").addEventListener("click", ()=>dom.modelModalOverlay.classList.remove("show"));
dom.modelModalOverlay.addEventListener("click", e=>{ if(e.target===dom.modelModalOverlay) dom.modelModalOverlay.classList.remove("show"); });
document.getElementById("modelForm").addEventListener("submit", submitModelForm);
document.getElementById("mfAddRow").addEventListener("click", ()=>addAllocRow(SYMBOLS[0].ticker, ""));

/* ---------- Configuración ---------- */
document.getElementById("btnSaveConfig").addEventListener("click", saveSettings);

/* ---------- Global: cerrar modales con Escape ---------- */
document.addEventListener("keydown", e=>{
  if(e.key==="Escape"){
    closeModal();
    dom.orderModalOverlay.classList.remove("show");
    dom.clientModalOverlay.classList.remove("show");
    dom.modelModalOverlay.classList.remove("show");
  }
});

/* ---------- Inicialización ---------- */
dom.ofSymbol.innerHTML = SYMBOLS.map(s=>`<option value="${s.ticker}">${s.ticker} — ${s.name}</option>`).join("");
renderTable();
updateProgress();
renderClients();
renderConnections();
renderDashboard();
updateOrderCompute();

/* ============================================================
   COMITENTES
   ============================================================ */

function renderClients(){
  const body = document.getElementById("clientsTable");
  if(clients.length===0){
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="emoji">◎</div><p>Todavía no hay comitentes cargados. Agregá el primero para empezar a armar lotes.</p></div></td></tr>`;
  } else {
    body.innerHTML = clients.map(c=>`
      <tr>
        <td><div class="client-name">${c.name}</div><div class="client-id">${c.id}</div></td>
        <td><span class="badge-broker">${c.broker}</span></td>
        <td><span class="badge-risk ${c.risk}">${c.risk.charAt(0).toUpperCase()+c.risk.slice(1)}</span></td>
        <td class="amount">${fmtMoney(c.portfolio)}</td>
        <td class="amount">${fmtMoney(c.liquidez)}</td>
        <td style="color:var(--text-muted);">${c.last}</td>
        <td><button class="row-remove" title="Quitar comitente" onclick="removeClient('${c.id}')">✕</button></td>
      </tr>
    `).join("");
  }
  document.getElementById("statTotalClients").textContent = clients.length;
  document.getElementById("statBrokers").textContent = new Set(clients.map(c=>c.broker)).size;
  document.getElementById("statPortfolio").textContent = fmtMoney(clients.reduce((s,c)=>s+c.portfolio,0));
  document.getElementById("navClientCount").textContent = clients.length ? clients.length : "";
  populateClientSelect();
}

function removeClient(id){
  clients = clients.filter(c=>c.id!==id);
  renderClients();
  renderTable();
  if(typeof renderDashboard==="function") renderDashboard();
  pushLog(`Comitente ${id} removido de la base`);
}

function populateClientSelect(){
  dom.ofClient.innerHTML = clients.map(c=>`<option value="${c.id}">${c.name} — ${c.broker}</option>`).join("") || `<option value="">Sin comitentes cargados</option>`;
}

function openClientModal(){
  document.getElementById("clientFormError").classList.remove("show");
  document.getElementById("clientForm").reset();
  dom.clientModalOverlay.classList.add("show");
}

function submitClientForm(e){
  e.preventDefault();
  const name = document.getElementById("cfName").value.trim();
  const broker = document.getElementById("cfBroker").value;
  const risk = document.getElementById("cfRisk").value;
  const portfolio = parseFloat(document.getElementById("cfPortfolio").value);
  const liquidez = parseFloat(document.getElementById("cfLiquidez").value) || 0;
  if(!name || !broker || !risk || !portfolio || portfolio<=0){
    document.getElementById("clientFormError").classList.add("show");
    return;
  }
  const client = { id:"#"+(nextClientNum++), name, broker, risk, portfolio, liquidez, last:"recién agregado" };
  clients.push(client);
  dom.clientModalOverlay.classList.remove("show");
  renderClients();
  if(typeof renderDashboard==="function") renderDashboard();
  pushLog(`Comitente ${client.name} (${client.id}) agregado — ${broker}, perfil ${risk}`);
  mostrarToast(`Comitente ${client.name} agregado`, "ok");
}

/* ============================================================
   CONEXIONES ALyCs
   ============================================================ */

function renderConnections(){
  const grid = document.getElementById("connGrid");
  grid.innerHTML = connections.map(c=>`
    <div class="conn-card">
      <div class="conn-card-head">
        <div>
          <div class="conn-name">${c.name}</div>
          <div class="conn-type">${c.type}</div>
        </div>
        <label class="switch">
          <input type="checkbox" ${c.online?'checked':''} onchange="toggleConnection('${c.id}')">
          <span class="slider"></span>
        </label>
      </div>
      <div class="conn-status-line"><span class="dot ${c.online?'':'off'}"></span>${c.online ? 'Conectado' : 'Desconectado'}</div>
      <div class="conn-actions"><button class="btn btn-ghost btn-sm" onclick="testConnection('${c.id}')">Probar conexión</button></div>
    </div>
  `).join("");
  renderHeaderConnStatus();
}

function toggleConnection(id){
  const c = connections.find(x=>x.id===id);
  c.online = !c.online;
  renderConnections();
  pushLog(`${c.name}: conexión ${c.online ? 'restablecida' : 'desactivada'} manualmente`);
  mostrarToast(`${c.name} ${c.online ? 'conectado' : 'desconectado'}`, c.online ? "ok" : "warn");
}

function testConnection(id){
  const c = connections.find(x=>x.id===id);
  pushLog(`Probando conexión con ${c.name} (${c.type})...`);
  mostrarToast(`Ping a ${c.name} exitoso — ${Math.round(Math.random()*80+40)} ms`, "ok");
}

function renderHeaderConnStatus(){
  const el = document.getElementById("headerConnStatus");
  el.innerHTML = connections.map(c=>`<span><span class="dot ${c.online?'':'off'}"></span>${c.name}</span>`).join("");
}

/* ============================================================
   DASHBOARD GLOBAL
   ============================================================ */

function renderDashboard(){
  const totalPortfolio = clients.reduce((s,c)=>s+c.portfolio,0);
  document.getElementById("dashPortfolio").textContent = fmtMoney(totalPortfolio);
  document.getElementById("dashPortfolioSub").textContent = `${clients.length} comitente${clients.length===1?'':'s'} activo${clients.length===1?'':'s'}`;
}

/* ============================================================
   DATOS BASE Y ESTADO COMPARTIDO
   Reemplazar por llamadas a la API real cuando exista backend.
   ============================================================ */

const SYMBOLS = [
  { ticker:"AL30",  name:"Bonar 2030 (Ley Arg.)", price:660,   color:"#4c8dff" },
  { ticker:"GD30",  name:"Global 2030 (Ley NY)",  price:672,   color:"#22c58b" },
  { ticker:"AE38",  name:"Bonar 2038",            price:590,   color:"#8b5cf6" },
  { ticker:"T2X4",  name:"Bote Dual 2024",        price:1175,  color:"#f5a524" },
  { ticker:"S31O4", name:"LECAP Oct-24",          price:1100,  color:"#22c58b" },
  { ticker:"S16D4", name:"LECAP Dic-24",          price:1082,  color:"#4c8dff" },
  { ticker:"TX26",  name:"Bonte CER 2026",        price:1310,  color:"#f2495c" },
  { ticker:"YPFD",  name:"YPF S.A.",              price:22400, color:"#f5a524" }
];
const symbolMap = Object.fromEntries(SYMBOLS.map(s=>[s.ticker,s]));

let clients = [
  { id:"#10492", name:"Pérez, J. C.", broker:"PPI", risk:"conservador", portfolio:18400000, liquidez:1250000, last:"hace 6 min" },
  { id:"#88210", name:"Inversora Sur SA", broker:"BALANZ", risk:"moderado", portfolio:61200000, liquidez:15400000, last:"hace 6 min" },
  { id:"#45912", name:"Gómez, M.", broker:"IOL", risk:"conservador", portfolio:5100000, liquidez:420000, last:"hace 6 min" },
  { id:"#12093", name:"Fund. Pampa", broker:"PPI", risk:"agresivo", portfolio:92700000, liquidez:8900000, last:"hace 6 min" }
];
let nextClientNum = 20000;

let orders = [
  { id:1, clientId:"#10492", broker:"PPI",    action:"COMPRAR", ticker:"AL30",  qty:1800,  amount:1188000,  desvio:-18, state:"pending", error:false, selected:true, origin:"auto" },
  { id:2, clientId:"#88210", broker:"BALANZ", action:"VENDER",  ticker:"T2X4",  qty:12000, amount:14100000, desvio:12,  state:"pending", error:false, selected:true, origin:"auto" },
  { id:3, clientId:"#45912", broker:"IOL",    action:"COMPRAR", ticker:"S31O4", qty:350,   amount:385000,   desvio:-22, state:"pending", error:false, selected:true, origin:"auto" },
  { id:4, clientId:"#12093", broker:"PPI",    action:"COMPRAR", ticker:"AL30",  qty:10500, amount:6930000,  desvio:-8,  state:"pending", error:false, selected:true, origin:"auto" }
];
let nextOrderId = 5;

let models = [
  { id:1, name:"Conservadora ARS (Soberanos + LECAPs)", allocations:[{ticker:"AL30",pct:40},{ticker:"S31O4",pct:35},{ticker:"T2X4",pct:25}] },
  { id:2, name:"Moderada crecimiento corporativo", allocations:[{ticker:"GD30",pct:45},{ticker:"AL30",pct:30},{ticker:"YPFD",pct:25}] },
  { id:3, name:"Cobertura inflación (CER)", allocations:[{ticker:"TX26",pct:60},{ticker:"S16D4",pct:40}] }
];
let nextModelId = 4;
let activeModelId = 1;

let connections = [
  { id:"PPI", name:"PPI", type:"REST API", online:true },
  { id:"BALANZ", name:"Balanz", type:"REST API", online:true },
  { id:"IOL", name:"IOL", type:"REST API", online:true },
  { id:"COCOS", name:"Cocos Capital", type:"FIX 4.4", online:false }
];

/* Estado transversal usado por varios módulos */
let running = false;
let activeFilter = "todas";
let searchTerm = "";

/* ============================================================
   REFERENCIAS DOM
   Se cargan una sola vez y se comparten entre módulos vía "dom".
   Este script debe incluirse DESPUÉS del HTML y ANTES de los
   módulos de cada sección (execution.js, clients.js, etc).
   ============================================================ */

const dom = {
  btnExecute: document.getElementById("btnExecute"),
  ordersTable: document.getElementById("ordersTable"),
  selectAll: document.getElementById("selectAllCheckbox"),
  logBody: document.getElementById("logBody"),
  logCount: document.getElementById("logCount"),
  toast: document.getElementById("toast"),

  modalOverlay: document.getElementById("modalOverlay"),
  orderModalOverlay: document.getElementById("orderModalOverlay"),
  clientModalOverlay: document.getElementById("clientModalOverlay"),
  modelModalOverlay: document.getElementById("modelModalOverlay"),

  ofClient: document.getElementById("ofClient"),
  ofSymbol: document.getElementById("ofSymbol"),
  ofAction: document.getElementById("ofAction"),
  ofQty: document.getElementById("ofQty"),
  ofComputed: document.getElementById("ofComputed"),
  ofPriceHint: document.getElementById("ofPriceHint"),

  mfAllocRows: document.getElementById("mfAllocRows"),
  mfTotal: document.getElementById("mfTotal")
};

/* ============================================================
   EJECUCIÓN DE REBALANCEO
   ============================================================ */

function statusMarkup(o){
  if(o.state==="pending") return `<span class="status status-pending"><span class="pulse-dot"></span>Esperando ejecución</span>`;
  if(o.state==="api") return `<span class="status status-api"><span class="spinner"></span>API: enviando orden</span>`;
  if(o.state==="ws") return `<span class="status status-ws-partial"><span class="spinner"></span>WS: en mercado</span>`;
  if(o.state==="done") return `<span class="status status-done">✓ Ejecutada 100%</span>`;
  if(o.state==="error") return `<span class="status status-error">✕ Rechazada por ALyC<button class="retry-link" onclick="event.stopPropagation(); retryOrder(${o.id})">Reintentar</button></span>`;
  return "";
}

function deviationMarkup(d){
  if(d===undefined || d===null) return `<span class="deviation flat">—</span>`;
  const cls = d<0 ? "neg" : (d>0 ? "pos" : "flat");
  const sign = d>0 ? "+" : "";
  return `<span class="deviation ${cls}">${sign}${d}%</span>`;
}

function renderTable(){
  const filtered = orders.filter(o=>{
    const c = clientById(o.clientId);
    const matchesFilter = activeFilter==="todas" || o.action===activeFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || (c && c.name.toLowerCase().includes(q)) || o.ticker.toLowerCase().includes(q) || o.broker.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  if(orders.length===0){
    dom.ordersTable.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="emoji">◌</div><p>Todavía no armaste ningún lote. Agregá una orden manual o generá el lote desde una cartera modelo.</p></div></td></tr>`;
  } else if(filtered.length===0){
    dom.ordersTable.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="emoji">◌</div><p>No hay órdenes que coincidan con la búsqueda.</p></div></td></tr>`;
  } else {
    dom.ordersTable.innerHTML = filtered.map(o=>{
      const c = clientById(o.clientId) || { name:"Comitente eliminado", id:o.clientId, liquidez:0 };
      const removable = o.state==="pending";
      const checkDisabled = o.state!=="pending" ? "disabled" : "";
      return `
      <tr id="row-${o.id}">
        <td><input type="checkbox" class="row-check" ${o.selected?'checked':''} ${checkDisabled} onclick="event.stopPropagation(); toggleOrderSelection(${o.id})"></td>
        <td class="clickable" onclick="openModal(${o.id})"><div class="client-name">${c.name}</div><div class="client-id">${c.id}</div></td>
        <td><span class="badge-broker">${o.broker}</span></td>
        <td class="amount">${fmtMoney(c.liquidez||0)}</td>
        <td>${deviationMarkup(o.desvio)}</td>
        <td><span class="${o.action==='COMPRAR' ? 'tag-buy':'tag-sell'}">${o.action}</span> ${o.qty.toLocaleString('es-AR')} ${o.ticker}</td>
        <td class="amount">${fmtMoney(o.amount)}</td>
        <td id="status-${o.id}">${statusMarkup(o)}</td>
        <td>${removable ? `<button class="row-remove" title="Quitar del lote" onclick="event.stopPropagation(); removeOrder(${o.id})">✕</button>` : ""}</td>
      </tr>`;
    }).join("");
  }
  updateExecutionMetrics();
  updateSelectAllState();
}

function toggleOrderSelection(orderId){
  const o = orders.find(x=>x.id===orderId);
  if(!o || o.state!=="pending") return;
  o.selected = !o.selected;
  updateExecutionMetrics();
  updateSelectAllState();
}

function toggleSelectAll(checked){
  orders.forEach(o=>{ if(o.state==="pending") o.selected = checked; });
  renderTable();
}

function updateSelectAllState(){
  const selectable = orders.filter(o=>o.state==="pending");
  const allSelected = selectable.length>0 && selectable.every(o=>o.selected);
  if(dom.selectAll) dom.selectAll.checked = allSelected;
}

function updateExecutionMetrics(){
  const selectedOrders = orders.filter(o=>o.selected);
  const totalAmount = selectedOrders.reduce((sum,o)=>sum+o.amount,0);
  const uniqueClients = new Set(selectedOrders.map(o=>o.clientId)).size;
  document.getElementById("metricAum").textContent = fmtMoney(totalAmount);
  document.getElementById("metricAumSub").textContent = `sobre ${uniqueClients} comitente${uniqueClients===1?'':'s'} seleccionado${uniqueClients===1?'':'s'}`;
  document.getElementById("metricOrders").textContent = `${selectedOrders.length} / ${orders.length}`;
  if(!running) dom.btnExecute.disabled = orders.filter(o=>o.selected && o.state!=="done").length===0;
}

function updateProgress(){
  const done = orders.filter(o=>o.state==="done").length;
  const total = orders.length || 1;
  const pct = Math.round((done/total)*100);
  document.getElementById("progressFill").style.width = pct+"%";
  document.getElementById("progressCount").textContent = `${done} / ${orders.length} ejecutadas`;
}

async function iniciarRebalanceo(){
  const toRun = orders.filter(o=>o.selected && o.state!=="done").map(o=>o.id);
  if(running || toRun.length===0) return;
  running = true;
  dom.btnExecute.disabled = true;
  dom.btnExecute.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><span class="spinner"></span> Procesando API...</span>`;
  pushLog(`Iniciando envío en lote vía REST API (${toRun.length} órdenes seleccionadas)...`);

  await Promise.all(toRun.map(id => simularCicloDeVidaOrden(id)));

  const errores = orders.filter(o=>o.selected && o.state==="error").length;
  running = false;
  if(errores>0){
    dom.btnExecute.disabled = false;
    dom.btnExecute.innerHTML = `⚡ Reintentar ${errores} pendiente${errores===1?'':'s'}`;
    mostrarToast(`⚠ ${errores} orden(es) rechazada(s) — revisá y reintentá`, "warn");
  } else {
    dom.btnExecute.innerHTML = "✓ Órdenes completadas";
    updateExecutionMetrics();
    mostrarToast("✓ Rebalanceo ejecutado con éxito", "ok");
  }
}

function simularCicloDeVidaOrden(orderId){
  return new Promise(resolve=>{
    const order = orders.find(o=>o.id===orderId);
    if(!order || order.state==="done"){ resolve(); return; }
    const c = clientById(order.clientId);
    const clientName = c ? c.name : order.clientId;

    setTimeout(()=>{
      order.state = "api";
      renderTable();
      pushLog(`API: orden #${order.id} (${clientName}) enviada a ${order.broker}`);

      setTimeout(()=>{
        const shouldFail = !order.error && Math.random() < 0.12;
        if(shouldFail){
          order.state = "error";
          order.error = true;
          renderTable();
          pushLog(`WS: orden #${order.id} rechazada por ${order.broker} — fondos insuficientes`);
          resolve();
          return;
        }
        order.state = "ws";
        renderTable();
        pushLog(`WS: orden #${order.id} en mercado, operando`);

        setTimeout(()=>{
          order.state = "done";
          renderTable();
          updateProgress();
          pushLog(`WS: orden #${order.id} ejecutada 100% — ${order.qty.toLocaleString('es-AR')} ${order.ticker}`);
          resolve();
        }, Math.random()*2500 + 1200);
      }, Math.random()*1300 + 900);
    }, Math.random()*700 + 200);
  });
}

function retryOrder(orderId){
  const order = orders.find(o=>o.id===orderId);
  order.state = "pending";
  order.selected = true;
  renderTable();
  pushLog(`Reintentando orden #${order.id} manualmente...`);
  dom.btnExecute.disabled = true;
  dom.btnExecute.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><span class="spinner"></span> Reintentando...</span>`;
  simularCicloDeVidaOrden(orderId).then(()=>{
    const stillFailing = orders.some(o=>o.state==="error");
    dom.btnExecute.disabled = !stillFailing;
    dom.btnExecute.innerHTML = stillFailing ? "⚡ Reintentar pendientes" : "✓ Órdenes completadas";
    updateExecutionMetrics();
    if(!stillFailing) mostrarToast("✓ Rebalanceo ejecutado con éxito", "ok");
  });
}

function removeOrder(orderId){
  orders = orders.filter(o=>o.id!==orderId);
  renderTable();
  updateProgress();
  pushLog(`Orden #${orderId} quitada del lote`);
}

function resetSim(){
  orders.forEach(o => { o.state = "pending"; o.error = false; o.selected = true; });
  running = false;
  dom.btnExecute.disabled = orders.length===0;
  dom.btnExecute.innerHTML = "⚡ Ejecutar seleccionadas";
  dom.logBody.innerHTML = "";
  dom.logCount.textContent = "";
  renderTable();
  updateProgress();
  pushLog("Simulación reiniciada — todas las órdenes vuelven a estado pendiente.");
}

/* ---------- Modal de detalle de orden ---------- */
function openModal(orderId){
  const o = orders.find(x=>x.id===orderId);
  const c = clientById(o.clientId) || { name:"Comitente eliminado", id:o.clientId };
  document.getElementById("modalTitle").textContent = `Orden #${o.id} — ${o.ticker}`;
  document.getElementById("modalSub").textContent = `${c.name} · ${c.id}`;
  document.getElementById("modalBody").innerHTML = `
    <div class="modal-row"><span>ALyC</span><span>${o.broker}</span></div>
    <div class="modal-row"><span>Acción</span><span class="${o.action==='COMPRAR'?'tag-buy':'tag-sell'}">${o.action}</span></div>
    <div class="modal-row"><span>Nominales</span><span>${o.qty.toLocaleString('es-AR')} ${o.ticker}</span></div>
    <div class="modal-row"><span>Monto</span><span>${fmtMoney(o.amount)}</span></div>
    <div class="modal-row"><span>Desvío vs. modelo</span><span>${o.desvio!==undefined ? (o.desvio>0?'+':'')+o.desvio+'%' : '—'}</span></div>
    <div class="modal-row"><span>Estado</span><span>${statusMarkup(o)}</span></div>
  `;
  const cancelBtn = document.getElementById("modalCancelBtn");
  cancelBtn.style.display = (o.state==="done") ? "none" : "block";
  cancelBtn.onclick = ()=>{ cancelOrder(o.id); closeModal(); };
  dom.modalOverlay.classList.add("show");
}
function closeModal(){ dom.modalOverlay.classList.remove("show"); }

function cancelOrder(orderId){
  const o = orders.find(x=>x.id===orderId);
  if(!o || o.state==="done") return;
  o.state = "error";
  o.error = true;
  renderTable();
  pushLog(`Orden #${o.id} cancelada manualmente por el usuario`);
  mostrarToast("Orden cancelada", "warn");
}

/* ---------- Modal de nueva orden manual ---------- */
function updateOrderCompute(){
  const sym = symbolMap[dom.ofSymbol.value];
  const qty = parseFloat(dom.ofQty.value) || 0;
  const amount = sym ? sym.price * qty : 0;
  dom.ofPriceHint.textContent = sym ? `Precio de referencia: ${fmtMoney(sym.price)} por nominal` : "Precio de referencia: —";
  dom.ofComputed.textContent = fmtMoney(amount);
}

function openOrderModal(){
  if(clients.length===0){
    switchView("comitentes");
    mostrarToast("Agregá un comitente antes de crear órdenes", "warn");
    return;
  }
  populateClientSelect();
  updateOrderCompute();
  document.getElementById("orderFormError").classList.remove("show");
  dom.orderModalOverlay.classList.add("show");
}

function submitOrderForm(e){
  e.preventDefault();
  const clientId = dom.ofClient.value;
  const sym = symbolMap[dom.ofSymbol.value];
  const qty = parseInt(dom.ofQty.value, 10);
  const c = clientById(clientId);
  if(!c || !sym || !qty || qty<=0){
    document.getElementById("orderFormError").classList.add("show");
    return;
  }
  const order = { id: nextOrderId++, clientId: c.id, broker: c.broker, action: dom.ofAction.value, ticker: sym.ticker, qty, amount: sym.price*qty, desvio:undefined, state:"pending", error:false, selected:true, origin:"manual" };
  orders.push(order);
  dom.orderModalOverlay.classList.remove("show");
  renderTable();
  updateProgress();
  pushLog(`Orden #${order.id} agregada al lote — ${order.action} ${qty.toLocaleString('es-AR')} ${sym.ticker} para ${c.name}`);
  dom.ofQty.value = "";
  updateOrderCompute();
}

/* ---------- Generación automática desde la cartera modelo activa ---------- */
function generateOrdersFromModel(){
  const model = modelById(activeModelId);
  if(!model || clients.length===0){
    mostrarToast("Necesitás una cartera modelo activa y al menos un comitente", "warn");
    return;
  }
  // Se quitan las órdenes auto-generadas pendientes previas; se conservan las manuales y las ya ejecutadas.
  orders = orders.filter(o => !(o.origin==="auto" && o.state==="pending"));

  let generated = 0;
  clients.forEach(c=>{
    const alloc = model.allocations[Math.floor(Math.random()*model.allocations.length)];
    const sym = symbolMap[alloc.ticker];
    if(!sym) return;
    const desvio = Math.round((Math.random()*36 - 18)); // entre -18% y +18%
    if(Math.abs(desvio) < 4) return; // ya está balanceado, no genera orden
    const action = desvio < 0 ? "COMPRAR" : "VENDER";
    const montoObjetivo = Math.abs(desvio)/100 * c.portfolio * 0.15;
    const qty = Math.max(1, Math.round(montoObjetivo / sym.price));
    orders.push({
      id: nextOrderId++, clientId: c.id, broker: c.broker, action, ticker: sym.ticker,
      qty, amount: qty*sym.price, desvio, state:"pending", error:false, selected:true, origin:"auto"
    });
    generated++;
  });

  renderTable();
  updateProgress();
  pushLog(`Se generaron ${generated} orden(es) sugeridas a partir de "${model.name}"`);
  mostrarToast(`${generated} orden(es) generadas desde la cartera modelo`, "ok");
}

/* ============================================================
   CARTERAS MODELO
   ============================================================ */

function renderModels(){
  const grid = document.getElementById("modelGrid");
  const active = modelById(activeModelId);
  document.getElementById("activeModelLabel").textContent = active ? active.name : "—";
  if(models.length===0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="emoji">◆</div><p>Todavía no armaste ninguna cartera modelo.</p></div>`;
    return;
  }
  grid.innerHTML = models.map(m=>{
    const total = m.allocations.reduce((s,a)=>s+a.pct,0) || 1;
    const bars = m.allocations.map(a=>{
      const sym = symbolMap[a.ticker];
      return `<div class="alloc-seg" style="width:${(a.pct/total*100)}%; background:${sym ? sym.color : '#4d6182'};"></div>`;
    }).join("");
    const legend = m.allocations.map(a=>{
      const sym = symbolMap[a.ticker];
      return `<span><span class="legend-dot" style="background:${sym ? sym.color : '#4d6182'};"></span>${a.ticker} (${a.pct}%)</span>`;
    }).join("");
    return `
      <div class="model-card ${m.id===activeModelId ? 'selected':''}" onclick="setActiveModel(${m.id})" tabindex="0" onkeydown="if(event.key==='Enter') setActiveModel(${m.id})">
        <div class="model-card-head">
          <div class="model-name">${m.name}</div>
          ${m.id===activeModelId ? '<span class="model-badge">Activa</span>' : ''}
        </div>
        <div class="alloc-bar">${bars}</div>
        <div class="alloc-legend">${legend}</div>
      </div>
    `;
  }).join("");
}

function setActiveModel(id){
  activeModelId = id;
  renderModels();
  mostrarToast(`Cartera modelo "${modelById(id).name}" activada`, "ok");
}

let allocRowCount = 0;
function addAllocRow(ticker, pct){
  allocRowCount++;
  const rowId = "alloc-"+allocRowCount;
  const row = document.createElement("div");
  row.className = "alloc-row-input";
  row.id = rowId;
  row.innerHTML = `
    <select class="alloc-symbol">${SYMBOLS.map(s=>`<option value="${s.ticker}" ${s.ticker===ticker?'selected':''}>${s.ticker} — ${s.name}</option>`).join("")}</select>
    <input type="number" class="alloc-pct" min="0" max="100" step="1" placeholder="%" value="${pct||''}">
    <button type="button" class="row-remove" onclick="document.getElementById('${rowId}').remove(); updateAllocTotal();">✕</button>
  `;
  dom.mfAllocRows.appendChild(row);
  row.querySelector(".alloc-pct").addEventListener("input", updateAllocTotal);
  updateAllocTotal();
}

function updateAllocTotal(){
  const pcts = Array.from(document.querySelectorAll(".alloc-pct")).map(i=>parseFloat(i.value)||0);
  const total = pcts.reduce((s,p)=>s+p,0);
  dom.mfTotal.textContent = `Total asignado: ${total}%`;
  dom.mfTotal.classList.toggle("warn", total!==100 && total!==0);
}

function openModelModal(){
  document.getElementById("modelFormError").classList.remove("show");
  document.getElementById("modelForm").reset();
  dom.mfAllocRows.innerHTML = "";
  allocRowCount = 0;
  addAllocRow(SYMBOLS[0].ticker, "");
  updateAllocTotal();
  dom.modelModalOverlay.classList.add("show");
}

function submitModelForm(e){
  e.preventDefault();
  const name = document.getElementById("mfName").value.trim();
  const rows = Array.from(document.querySelectorAll(".alloc-row-input"));
  const allocations = rows.map(r=>({
    ticker: r.querySelector(".alloc-symbol").value,
    pct: parseFloat(r.querySelector(".alloc-pct").value) || 0
  })).filter(a=>a.pct>0);

  if(!name || allocations.length===0){
    document.getElementById("modelFormError").classList.add("show");
    return;
  }
  const model = { id: nextModelId++, name, allocations };
  models.push(model);
  dom.modelModalOverlay.classList.remove("show");
  renderModels();
  pushLog(`Cartera modelo "${name}" creada con ${allocations.length} instrumento${allocations.length===1?'':'s'}`);
  mostrarToast(`Cartera modelo "${name}" creada`, "ok");
}

/* ============================================================
   NAVEGACIÓN ENTRE VISTAS
   ============================================================ */

function switchView(name){
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active", n.dataset.view===name));
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active", v.id==="view-"+name));
  if(name==="comitentes") renderClients();
  if(name==="modelos") renderModels();
  if(name==="conexiones") renderConnections();
  if(name==="dashboard") renderDashboard();
}

document.querySelectorAll(".nav-item").forEach(item=>{
  item.addEventListener("click", ()=> switchView(item.dataset.view));
  item.addEventListener("keydown", e=>{ if(e.key==="Enter") switchView(item.dataset.view); });
});

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

function saveSettings(){
  // Simulación: en producción, esto haría un PATCH /api/account/settings
  mostrarToast("Configuración guardada", "ok");
  pushLog("Configuración de la cuenta actualizada");
}

/* ============================================================
   UTILIDADES COMPARTIDAS
   ============================================================ */

const fmtMoney = n => "$ " + Math.round(n).toLocaleString("es-AR");
const nowTime = () => new Date().toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
const clientById = id => clients.find(c=>c.id===id);
const modelById = id => models.find(m=>m.id===id);

function pushLog(text){
  const row = document.createElement("div");
  row.className = "log-row";
  row.innerHTML = `<span class="log-time">${nowTime()}</span><span>${text}</span>`;
  dom.logBody.prepend(row);
  dom.logCount.textContent = dom.logBody.children.length + " eventos";
}

function mostrarToast(text, type){
  const toast = dom.toast;
  toast.textContent = text;
  toast.style.background = type==="warn" ? "var(--amber)" : "var(--accent)";
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 4200);
}
