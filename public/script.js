// public/script.js
const WHATSAPP_NUMBER = "559492425617"; // seu número

let datasSelecionadas = [];

document.addEventListener("DOMContentLoaded", () => {
  const anoAtual = new Date().getFullYear();
  const select = document.getElementById("selectAno");

  [anoAtual, anoAtual + 1].forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    select.appendChild(opt);
  });

  select.value = anoAtual;
  select.addEventListener("change", () => gerarCalendario(parseInt(select.value, 10)));

  document.getElementById("ano").textContent = `${anoAtual} e ${anoAtual + 1}`;
  gerarCalendario(anoAtual);
});

async function gerarCalendario(ano) {
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  const reservas = await fetch("/api/reservas").then(r => r.json()).catch(() => []);
  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";

  meses.forEach((mesNome, i) => {
    const primeiro = new Date(ano, i, 1).getDay();
    const ultimo = new Date(ano, i + 1, 0).getDate();

    const div = document.createElement("div");
    div.className = "mes";
    div.innerHTML = `<h3>${mesNome} ${ano}</h3>`;

    const tabela = document.createElement("table");
    tabela.className = "tabela-calendario";
    tabela.innerHTML = `<thead><tr>
      <th>D</th><th>S</th><th>T</th><th>Q</th><th>Q</th><th>S</th><th>S</th>
    </tr></thead>`;

    const tbody = document.createElement("tbody");
    let tr = document.createElement("tr");

    for (let b = 0; b < primeiro; b++) tr.appendChild(document.createElement("td"));

    for (let d = 1; d <= ultimo; d++) {
      if (tr.children.length === 7) {
        tbody.appendChild(tr);
        tr = document.createElement("tr");
      }

      const td = document.createElement("td");
      td.textContent = d;
      td.classList.add("dia");

      const dataStr = `${String(d).padStart(2,"0")}/${String(i+1).padStart(2,"0")}/${ano}`;

      // 🔹 Corrige formato das datas vindas do banco (YYYY-MM-DD → DD/MM/YYYY)
      const reserva = reservas.find(r => {
        if (!r.data) return false;
        const [yyyy, mm, dd] = r.data.includes("-") ? r.data.split("-") : r.data.split("/");
        const dataFormatada = `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
        return dataFormatada === dataStr;
      });

      if (reserva) {
        if (reserva.status === "confirmado") td.classList.add("reservado");
        else if (reserva.status === "pre-reserva") td.classList.add("pre-reserva");
        td.title = `${reserva.cliente || ""}${reserva.notas ? " — " + reserva.notas : ""}`.trim();
      } else {
        td.classList.add("livre");
        td.addEventListener("click", (e) => selecionarData(e, dataStr));
      }

      tr.appendChild(td);
    }

    while (tr.children.length < 7) tr.appendChild(document.createElement("td"));
    tbody.appendChild(tr);
    tabela.appendChild(tbody);
    div.appendChild(tabela);
    grid.appendChild(div);
  });
}

// ==========================
// Seleção múltipla de datas
// ==========================
function selecionarData(e, dataStr) {
  const td = e.target;

  // Alternar seleção
  if (td.classList.contains("selecionado")) {
    td.classList.remove("selecionado");
    datasSelecionadas = datasSelecionadas.filter(d => d !== dataStr);
  } else {
    td.classList.add("selecionado");
    datasSelecionadas.push(dataStr);
  }
}

// ==========================
// Confirmar várias reservas
// ==========================
async function confirmarVariasReservas() {
  if (datasSelecionadas.length === 0) {
    alert("Selecione pelo menos uma data antes de fazer a pré-reserva.");
    return;
  }

  const cliente = prompt("Digite seu nome para concluir a pré-reserva:");
  if (!cliente) return;

  const mensagem = `Olá! Gostaria de fazer pré-reserva para as datas: ${datasSelecionadas.join(", ")}. Meu nome: ${cliente}`;
  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");

  // Salva todas no servidor
  for (const dataStr of datasSelecionadas) {
    try {
      await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataStr, status: "pre-reserva", cliente, notas: "" })
      });
    } catch (e) {
      console.error("Erro ao salvar data", dataStr, e);
    }
  }

  alert("Pré-reservas registradas!");
  datasSelecionadas = [];
  gerarCalendario(parseInt(document.getElementById("selectAno").value, 10));
}

// ==========================
// Botão fixo do HTML
// ==========================
const botaoFixo = document.getElementById("btnReserva");
if (botaoFixo) {
  botaoFixo.addEventListener("click", confirmarVariasReservas);
}

// ===== Modal de Informações =====
const modal = document.getElementById("modalInfo");
const btnInfo = document.getElementById("btnInfo");
const spanFechar = document.querySelector(".fechar");

if (btnInfo && modal && spanFechar) {
  btnInfo.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  spanFechar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}
