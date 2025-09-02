import 'dotenv/config';
const express = require('express');
const cors = require('cors');
const { getChannel } = require('./rabbit');

const app = express();
app.use(cors());
app.use(express.json());

const NAME = process.env.YOUR_NAME || 'candidate';
const IN_QUEUE = `fila.notificacao.entrada.${NAME}`;
const OUT_QUEUE = `fila.notificacao.status.${NAME}`;
const statusMap = new Map<string, string>();

interface NotificacaoRequestBody {
  mensagemId: string;
  conteudoMensagem: string;
}

// Boot RabbitMQ Consumer
(async () => {
  const ch = await getChannel();
  await ch.assertQueue(IN_QUEUE, { durable: false });
  await ch.assertQueue(OUT_QUEUE, { durable: false });

  type Message = { content: { toString: () => string } };

  await ch.consume(IN_QUEUE, async (msg: Message | null) => {
    if (!msg) return;
    const { mensagemId, conteudoMensagem } = JSON.parse(msg.content.toString());

    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

    const roll = Math.floor(Math.random() * 10) + 1;
    const status = roll <= 2 ? 'FALHA_PROCESSAMENTO' : 'PROCESSADO_SUCESSO';

    statusMap.set(mensagemId, status);
    ch.sendToQueue(OUT_QUEUE, Buffer.from(JSON.stringify({ mensagemId, status })));
    ch.ack(msg);
  });
})();


app.post(
  '/api/notificar',
  async (
    req: { body: NotificacaoRequestBody },
    res: { status: (code: number) => { json: (b: any) => any } }
  ) => {
    const { mensagemId, conteudoMensagem } = req.body || {};
    if (!mensagemId || typeof conteudoMensagem !== 'string' || !conteudoMensagem.trim()) {
      return res.status(400).json({ error: 'mensagem vazia ou inválida' });
    }

    const ch = await getChannel();
    await ch.assertQueue(IN_QUEUE, { durable: false });
    ch.sendToQueue(IN_QUEUE, Buffer.from(JSON.stringify({ mensagemId, conteudoMensagem })));

    return res.status(202).json({ mensagemId });
  }
);

app.get(
  '/api/notificacao/status/:id',
  (req: { params: { id: string } }, res: { json: (b: any) => void }) => {
    const status = statusMap.get(req.params.id) || 'AGUARDANDO_PROCESSAMENTO';
    res.json({ mensagemId: req.params.id, status });
  }
);

const port = Number(process.env.APP_PORT || 3000);
app.listen(port, () => console.log(`Backend listening on :${port}`));