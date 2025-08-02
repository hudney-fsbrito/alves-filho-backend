const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10kb" })); // Evita requisições muito grandes

// Rate limiter (opcional para spam)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // máx. 5 envios por IP por minuto
  message: "Muitas requisições, tente novamente em breve.",
});
app.use("/api/enviar-email", limiter);

// Rota de teste
app.get("/", (req, res) => {
  res.send("✅ API de envio de e-mail está online.");
});

// Rota principal
app.post("/api/enviar-email", async (req, res) => {
  const { nome, email, celular, servico, texto } = req.body;

  if (!nome || !email || !celular || !servico || !texto) {
    return res.status(400).json({ success: false, message: "Preencha todos os campos." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "E-mail inválido." });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // ← este é o email que ENVIA (precisa da senha de app)
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${nome}" <${email}>`,
    to: process.env.EMAIL_USER, // ← esse é o nome e email do visitante do site
    subject: `Novo Contato de ${nome}`, // ← pode ser qualquer e-mail que deve RECEBER
    text: `
      Nome: ${nome}
      Email: ${email}
      Celular: ${celular}
      Serviço: ${servico}
      Mensagem: ${texto}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    res.status(500).json({ success: false, message: "Erro interno ao enviar e-mail." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
