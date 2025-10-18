const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Conexão com o MongoDB Atlas
mongoose.connect(
  "mongodb+srv://vsadmin:Vs%40123456@cluster0.fucm0jm.mongodb.net/vsreservas?retryWrites=true&w=majority&appName=Cluster0"
)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas!"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

// 🔹 Função utilitária para padronizar datas (sempre dd/mm/yyyy)
function normalizarData(dataStr) {
  if (!dataStr) return "";
  if (dataStr.includes("/")) return dataStr; // já está ok
  if (dataStr.includes("-")) {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr;
}

// 🔹 Definição do modelo
const reservaSchema = new mongoose.Schema(
  {
    data: { type: String, required: true, unique: true },
    status: { type: String, default: "pre-reserva" },
    cliente: { type: String, default: "" },
    notas: { type: String, default: "" },
  },
  { timestamps: true }
);

const Reserva = mongoose.model("Reserva", reservaSchema);

// 🔹 Rota: listar todas as reservas
app.get("/api/reservas", async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ data: 1 });
    const padronizadas = reservas.map((r) => ({
      ...r._doc,
      data: normalizarData(r.data),
    }));
    res.json(padronizadas);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
});

// 🔹 Rota: criar reserva
app.post("/api/reservas", async (req, res) => {
  try {
    let { data, status, cliente, notas } = req.body;
    if (!data) return res.status(400).json({ error: "Data é obrigatória" });

    data = normalizarData(data);

    const existe = await Reserva.findOne({ data });
    if (existe)
      return res.status(400).json({ error: "Essa data já está reservada." });

    const nova = await Reserva.create({ data, status, cliente, notas });
    res.json({ ok: true, reserva: nova });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar reserva" });
  }
});

// 🔹 Rota: atualizar reserva existente
app.put("/api/reservas/:data", async (req, res) => {
  try {
    const dataParam = normalizarData(req.params.data);
    const { status, notas, cliente } = req.body;

    const reserva = await Reserva.findOne({ data: dataParam });
    if (!reserva)
      return res.status(404).json({ error: "Reserva não encontrada" });

    if (status !== undefined) reserva.status = status;
    if (notas !== undefined) reserva.notas = notas;
    if (cliente !== undefined) reserva.cliente = cliente;

    await reserva.save();
    res.json({ ok: true, reserva });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
});

// 🔹 Rota: excluir reserva
app.delete("/api/reservas/:data", async (req, res) => {
  try {
    const dataParam = normalizarData(req.params.data);
    await Reserva.deleteOne({ data: dataParam });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar reserva" });
  }
});

// 🔹 Painel Admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// 🔹 Porta compatível com Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);
