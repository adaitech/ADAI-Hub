// Proxy HTTPS + HTTP/2 (com gzip) na frente do `next start`, para o Lighthouse medir o site
// como ele é servido em produção. O `next start` local fala HTTP/1.1: o Lantern (throttling
// simulado) então simula a fila de 6 conexões com RTT de 150 ms e infla o LCP mobile em ~1 s.
//
// Uso (da raiz do repo, com `cd next && yarn build && yarn start` no ar):
//   openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj "/CN=localhost" \
//     -keyout documents/lighthouse/k.pem -out documents/lighthouse/c.pem
//   node .claude/skills/lighthouse-performance-mcp/h2-proxy.mjs 3443 http://localhost:3000 documents/lighthouse
//   npx lighthouse https://localhost:3443/ ... --chrome-flags="--headless=new --ignore-certificate-errors ..."
// (no Git Bash, escrever -subj "//CN=localhost").
import http2 from 'node:http2';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const [porta = '3443', origem = 'http://localhost:3000', pastaCertificado = 'documents/lighthouse'] = process.argv.slice(2);

// Cabeçalhos de pedido repassados ao Next (navegação e RSC).
const PEDIDO = ['accept', 'user-agent', 'rsc', 'next-router-state-tree', 'next-url', 'next-router-prefetch', 'purpose'];
// Cabeçalhos de conexão (proibidos em HTTP/2) e os que o proxy recalcula.
const DESCARTAR = ['connection', 'keep-alive', 'transfer-encoding', 'content-encoding', 'content-length', 'strict-transport-security'];
const COMPRIMIVEL = /text|javascript|json|css|svg|x-component/;

const servidor = http2.createSecureServer({
  key: readFileSync(join(pastaCertificado, 'k.pem')),
  cert: readFileSync(join(pastaCertificado, 'c.pem')),
});

servidor.on('stream', async (stream, cabecalhos) => {
  try {
    const pedido = Object.fromEntries(PEDIDO.filter((k) => cabecalhos[k]).map((k) => [k, cabecalhos[k]]));
    const resposta = await fetch(origem + cabecalhos[':path'], { headers: pedido, redirect: 'manual' });
    const saida = { ':status': resposta.status };
    resposta.headers.forEach((valor, nome) => {
      if (!DESCARTAR.includes(nome)) saida[nome] = valor;
    });
    let corpo = Buffer.from(await resposta.arrayBuffer());
    if (COMPRIMIVEL.test(resposta.headers.get('content-type') ?? '') && /gzip/.test(cabecalhos['accept-encoding'] ?? '')) {
      corpo = gzipSync(corpo);
      saida['content-encoding'] = 'gzip';
    }
    stream.respond(saida);
    stream.end(corpo);
  } catch (erro) {
    if (!stream.headersSent) stream.respond({ ':status': 502 });
    stream.end(String(erro));
  }
});

servidor.listen(Number(porta), () => console.log(`HTTP/2 em https://localhost:${porta} → ${origem}`));
