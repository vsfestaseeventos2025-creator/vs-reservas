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
mongoose.connect('mongodb+srv://vsadmin:Vs%40123456@cluster0.fucm0jm.mongodb.net/vsreservas?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ Conectado ao MongoDB Atlas!'))
  .catch((err) => console.error('❌ Erro ao conectar ao MongoDB:', err));

// 🔹 Definição do modelo
const reservaSchema = new mongoose.Schema({
  data: { type: String, required: true, unique: true },
  status: { type: String, default: "pre-reserva" }, // "confirmado" ou "pre-reserva"
  cliente: { type: String, default: "" },
  notas: { type: String, default: "" },
}, { timestamps: true });

const Reserva = mongoose.model("Reserva", reservaSchema);

// ==========================
// 🔹 Rotas da API
// ==========================

// Listar todas as reservas
app.get("/api/reservas", async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ data: 1 });
    res.json(reservas);
  } catch (err) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
});

// Criar nova reserva (pré-reserva)
app.post("/api/reservas", async (req, res) => {
  try {
    const { data, status, cliente, notas } = req.body;
    if (!data) return res.status(400).json({ error: "Data é obrigatória" });

    const existente = await Reserva.findOne({ data });
    if (existente) {
      return res.json({ ok: true, reserva: existente }); // já existe, não cria novamente
    }

    const nova = await Reserva.create({ data, status, cliente, notas });
    res.json({ ok: true, reserva: nova });
  } catch (err) {
    console.error("Erro ao criar reserva:", err);
    res.status(500).json({ error: "Erro ao criar reserva" });
  }
});

// Atualizar status (confirmar / pré-reservar)
app.put("/api/reservas/:data", async (req, res) => {
  try {
    const dataParam = req.params.data;
    const { status, cliente, notas } = req.body;

    let reserva = await Reserva.findOne({ data: dataParam });
    if (!reserva) {
      reserva = new Reserva({ data: dataParam, status: status || "pre-reserva", cliente, notas });
    } else {
      if (status) reserva.status = status;
      if (cliente) reserva.cliente = cliente;
      if (notas) reserva.notas = notas;
    }

    await reserva.save();
    res.json({ ok: true, reserva });
  } catch (err) {
    console.error("Erro ao atualizar reserva:", err);
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
});

// Deletar reserva
app.delete("/api/reservas/:data", async (req, res) => {
  try {
    await Reserva.deleteOne({ data: req.params.data });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao deletar reserva:", err);
    res.status(500).json({ error: "Erro ao deletar reserva" });
  }
});

// ==========================
// 🔹 Rotas de Páginas
// ==========================
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================
// 🔹 Servidor
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
