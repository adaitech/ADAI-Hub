# Segurança — entrega 2: padrão de cabeçalhos HTTP, CSP e CORS

> Método: superpowers (`.agents/rules/Metodo-Superpowers.md`) · Caminho: *architectural* (parte 2 de 4 do tema segurança; adianta o CORS e os cabeçalhos do Strapi da entrega 3)
> Branch: `feat/seguranca-cabecalhos-csp-cors` (a partir de `fix/seguranca-atualizacoes`) · Data: 2026-10-03
> Fontes: [MDN — guias práticos de segurança](https://developer.mozilla.org/pt-BR/docs/Web/Security/Practical_implementation_guides) (CSP, CORS, HSTS, clickjacking, MIME, Referrer, CORP) · [#LocalizaLabs — Cabeçalhos de Segurança](https://medium.com/localizalabs/cabe%C3%A7alhos-de-seguran%C3%A7a-2d75407083f5) (separação Web App × Web API, segurança por padrão) · guia de CSP do Next 16 (`next/node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`)

## 1. Objetivo

Um **padrão único de cabeçalhos** para o site (Next) e para o CMS (Strapi), testado e documentado:

1. **CSP estrita com nonce** no site (sem `unsafe-inline` em script), com relatório de violação.
2. Cabeçalhos de transporte, clickjacking, MIME, Referrer, Permissions e isolamento de origem em toda resposta.
3. **CORS fechado por padrão**: o site não libera nenhuma origem; o Strapi só libera as origens da lista.
4. Testes que falham se alguém afrouxar o padrão.

## 2. Diagnóstico (2026-10-03)

| App | Achado | Gravidade |
| --- | --- | --- |
| Strapi | CORS padrão (`origin: '*'` + `credentials: true`) **devolve a origem de quem pediu** com `Access-Control-Allow-Credentials: true` — qualquer site lê respostas da API com cookies do visitante | Alta |
| Strapi | `X-Powered-By: Strapi <strapi.io>` (anuncia a tecnologia) | Baixa |
| Next | **Nenhum** cabeçalho de segurança; `X-Powered-By: Next.js` | Alta (sem CSP, sem anti-clickjacking, sem HSTS) |

## 3. Abordagem

**CSP com nonce via `proxy.ts`** (a convenção do Next 16 que substitui o `middleware.ts`), como já previa o README de segurança. A cada requisição de página o proxy gera um nonce aleatório, monta a CSP e a passa ao Next, que aplica o nonce nos próprios scripts. Cabeçalhos que não mudam por requisição ficam em `next.config.ts → headers()` (valem também para `_next/static`, imagens e rotas de API).

Toda a política mora em **um módulo puro** (`next/src/lib/seguranca/cabecalhos.ts`), sem dependências do Next, usado pelo proxy e pelo `next.config.ts` e testado isoladamente.

Alternativas descartadas:
- *CSP sem nonce com `'unsafe-inline'`* — anula a proteção contra XSS (MDN: evitar).
- *CSP por hash/SRI experimental do Next* — experimental, e o script do GTM é gerado por ambiente.

**Custo aceito:** nonce exige renderização dinâmica de todas as páginas (o HTML não pode mais ser estático/ISR). Os dados do Strapi, YouTube e inChurch continuam no cache de dados do Next (`fetch` com `revalidate`/tags), então o custo é só a renderização por requisição. Conferir o Lighthouse mobile (≥ 80) antes do PR.

## 4. Padrão do site (Next)

### 4.1 CSP (páginas — `proxy.ts`)

| Diretiva | Valor | Por quê |
| --- | --- | --- |
| `default-src` | `'self'` | Tudo fechado, só abre o necessário |
| `script-src` | `'self' 'nonce-…' 'strict-dynamic' https://www.googletagmanager.com` (+ `'unsafe-eval'` só em dev) | Nonce + `strict-dynamic`: o GTM (carregado pelo script com nonce) pode carregar o GA4. O host fica como reserva para navegador sem CSP3 |
| `style-src` | `'self' 'nonce-…'` (dev: `'self' 'unsafe-inline'`, o recarregamento injeta `<style>`) | Folha de estilo só do site |
| `style-src-attr` | `'unsafe-inline'` | Atributo `style=""` do `next/image` e da vitrine. Injeção de estilo não executa código |
| `img-src` | `'self' data: blob:` + Strapi + `i.ytimg.com` + `storage.googleapis.com` + Google Analytics | Imagens otimizadas saem de `/_next/image` (`'self'`); os hosts cobrem uso direto |
| `font-src` | `'self'` | `next/font` hospeda as fontes |
| `connect-src` | `'self'` + Google Analytics/GTM | Envio do GA4 após o aceite |
| `frame-src` | `'self' https://www.youtube-nocookie.com` | Player do YouTube e iframes da vitrine |
| `frame-ancestors` | `'self'` + origem do Strapi | Anti-clickjacking; o Strapi mostra o site no painel de pré-visualização |
| `object-src` | `'none'` | MDN |
| `base-uri` | `'none'` | MDN (o site não usa `<base>`) |
| `form-action` | `'self'` | MDN |
| `upgrade-insecure-requests` | só com site em `https://` | Em `http://localhost` quebraria os recursos locais |
| `report-uri` / `report-to` | `/api/csp-report` / `csp` (+ `Reporting-Endpoints`) | Os dois, para cobrir todos os navegadores (MDN) |

`CSP_SOMENTE_RELATORIO=true` troca o cabeçalho por `Content-Security-Policy-Report-Only` (implantação gradual recomendada pela MDN: primeiro observar, depois bloquear).

### 4.2 Cabeçalhos fixos (toda resposta — `next.config.ts`)

| Cabeçalho | Valor | Fonte / motivo |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` — **só com site em https** | MDN. Sem `preload` (compromisso com o domínio inteiro: decisão do responsável) |
| `X-Content-Type-Options` | `nosniff` | MDN / artigo |
| `X-Frame-Options` | `SAMEORIGIN` (fora no modo só-relatório) | Reserva para navegador antigo; os atuais seguem o `frame-ancestors` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | O artigo sugere `no-referrer`, mas o player do YouTube **exige** o referrer (erro 153 sem ele) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), midi=(), display-capture=(), browsing-topics=()` | Desliga o que o site não usa; mantém autoplay/fullscreen/encrypted-media para o YouTube |
| `Cross-Origin-Resource-Policy` | `same-origin` | MDN (CORP) |
| `X-Permitted-Cross-Domain-Policies` | `none` | Artigo |
| `X-XSS-Protection` | `0` | O artigo usa `1; mode=block`, mas a MDN/OWASP o dão como obsoleto e fonte de vazamento; `0` desliga o filtro antigo |
| `X-Robots-Tag` | `noindex, nofollow` **fora da produção** (`SITE_INDEXAVEL` ≠ `true`) | Artigo; complementa o `robots.txt` (que não impede indexar URL linkada) |
| `X-Powered-By` | removido (`poweredByHeader: false`) | Não anunciar a tecnologia |

Rotas `/api/*` (padrão *Web API* do artigo): `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`.

`Cross-Origin-Opener-Policy: same-origin` nas páginas (proxy); com `?gtm_debug=` na URL vira `unsafe-none`, senão o modo de visualização do GTM (Tag Assistant) não conecta.

### 4.3 CORS do site

**Nenhuma** resposta do site manda `Access-Control-Allow-Origin` (MDN: só API pensada para outras origens). As três rotas de API não precisam: `/api/preview` é navegação, `/api/revalidate` é chamada servidor→servidor (webhook) e `/api/csp-report` é da mesma origem.

### 4.4 Não adotados do artigo (e por quê)

| Item | Motivo |
| --- | --- |
| `Clear-Site-Data: *` em toda resposta | Apagaria o consentimento de cookies e o cache a cada página; serve só para "sair da conta" |
| `Cross-Origin-Embedder-Policy: require-corp` | Bloquearia o player do YouTube e o GA4 (não mandam CORP) |
| `X-Download-Options` | Só Internet Explorer 8 |

## 5. Padrão do CMS (Strapi)

- `strapi::cors`: `origin` = `CORS_ORIGINS` (lista separada por vírgula) ou, sem ela, `CLIENT_URL`; `credentials: false` (ninguém de outra origem usa cookie do Strapi); métodos `GET, HEAD, OPTIONS` (o site só lê; o painel é da mesma origem e não depende de CORS); `maxAge: 600`.
- `strapi::poweredBy` sai da lista.
- `strapi::security` (helmet): mantém a CSP padrão do Strapi (já estrita para o painel) e troca `Referrer-Policy` para `strict-origin-when-cross-origin`.
- Middleware `global::permissions-policy`: mesmo `Permissions-Policy` do site.

## 6. Testes (TDD)

- `lib/seguranca/cabecalhos.test.ts`: diretivas da CSP (nonce, sem `unsafe-inline` em script, `unsafe-eval` só em dev, `frame-ancestors` com Strapi, https condicional), cabeçalhos fixos, HSTS/XFO/X-Robots condicionais, nonce aleatório.
- `proxy.test.ts`: CSP no request (para o Next aplicar o nonce) e na resposta, `x-nonce`, COOP com e sem `gtm_debug`, modo só-relatório.
- `app/api/csp-report/route.test.ts`: aceita os dois formatos de relatório, ignora corpo inválido/grande, nunca registra query string, responde 204.
- `__tests__/caracteristicas/cabecalhos-seguranca.test.ts`: `next.config.ts` aplica o padrão a toda rota; nenhuma resposta do site libera CORS; Strapi sem `poweredBy`, sem `origin: '*'` e com `credentials: false`.
- `GoogleTagManager` / `gtm`: script com o nonce da requisição; GTM repassa o nonce às tags.

## 7. Verificação com evidência

`yarn quality`, `yarn build`, `yarn smoke`; `curl -I` no site e no Strapi (cabeçalhos presentes, CORS recusando origem estranha); site no navegador **sem violação de CSP no console** (Home, vídeo do YouTube, aviso de cookies + GTM, vitrine, pré-visualização no painel do Strapi).
