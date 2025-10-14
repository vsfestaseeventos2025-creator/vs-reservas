// === admin.js ===

// Função para carregar todas as reservas
async function carregarReservas() {
  try {
    const res = await fetch("/api/reservas");
    const reservas = await res.json();

    const tbody = document.querySelector("#tabelaReservas tbody");
    tbody.innerHTML = "";

    if (reservas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:0.6;">Nenhuma reserva encontrada.</td></tr>`;
      return;
    }

    reservas.forEach((r) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${r.data}</td>
        <td><input type="text" value="${r.cliente || ""}" data-field="cliente" data-data="${r.data}" /></td>
        <td>
          <select data-data="${r.data}" data-field="status">
            <option value="pré-reserva" ${r.status === "pré-reserva" ? "selected" : ""}>Pré-reserva</option>
            <option value="confirmado" ${r.status === "confirmado" ? "selected" : ""}>Confirmado</option>
            <option value="cancelado" ${r.status === "cancelado" ? "selected" : ""}>Cancelado</option>
          </select>
        </td>
        <td><input type="text" value="${r.notas || ""}" data-field="notas" data-data="${r.data}" /></td>
        <td>
          <button class="salvar" data-data="${r.data}">💾 Salvar</button>
          <button class="excluir" data-data="${r.data}">🗑 Excluir</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    adicionarEventos();
  } catch (err) {
    console.error("Erro ao carregar reservas:", err);
    alert("Erro ao carregar reservas");
  }
}

// Adiciona eventos aos botões após carregar tabela
function adicionarEventos() {
  document.querySelectorAll(".salvar").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const data = e.target.dataset.data;
      const linha = e.target.closest("tr");

      const cliente = linha.querySelector('input[data-field="cliente"]').value.trim();
      const notas = linha.querySelector('input[data-field="notas"]').value.trim();
      const status = linha.querySelector('select[data-field="status"]').value;

      try {
        const res = await fetch(`/api/reservas/${encodeURIComponent(data)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cliente, notas, status }),
        });

        const resultado = await res.json();

        if (resultado.ok) {
          alert("✅ Reserva atualizada com sucesso!");
        } else {
          alert("Erro ao atualizar: " + (resultado.error || "desconhecido"));
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar reserva");
      }
    })
  );

  document.querySelectorAll(".excluir").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const data = e.target.dataset.data;
      if (!confirm(`Tem certeza que deseja excluir a reserva do dia ${data}?`)) return;

      try {
        const res = await fetch(`/api/reservas/${encodeURIComponent(data)}`, {
          method: "DELETE",
        });
        const resultado = await res.json();

        if (resultado.ok) {
          alert("Reserva excluída com sucesso!");
          carregarReservas();
        } else {
          alert("Erro ao excluir: " + (resultado.error || "desconhecido"));
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir reserva");
      }
    })
  );
}

// Inicializa
document.addEventListener("DOMContentLoaded", carregarReservas);
