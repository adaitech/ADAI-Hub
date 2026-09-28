# Lighthouse — referência CLI (ADAI Hub)

Rodar da **raiz do repositório**, com o servidor de produção local no ar (`cd next && yarn build && yarn start`). Saídas em `documents/lighthouse/` (ignorado pelo Git).

```bash
mkdir -p documents/lighthouse
```

## Mobile (padrão)

```bash
npx lighthouse http://localhost:3000 --only-categories=performance \
  --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate \
  --output=json --output-path=./documents/lighthouse/home-mobile.json \
  --chrome-flags="--headless=new --no-sandbox --disable-extensions --disable-gpu"
```

## Desktop

```bash
npx lighthouse http://localhost:3000 --only-categories=performance --preset=desktop \
  --output=json --output-path=./documents/lighthouse/home-desktop.json \
  --chrome-flags="--headless=new --no-sandbox --disable-extensions --disable-gpu"
```

## Categorias extras (quando pedidas)

```bash
npx lighthouse http://localhost:3000 \
  --only-categories=accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile \
  --output=json --output-path=./documents/lighthouse/home-extras.json \
  --chrome-flags="--headless=new --no-sandbox --disable-extensions --disable-gpu"
```

## Outras rotas

Trocar a URL (ex.: `http://localhost:3000/componentes/hero/preview?variante=completo` para isolar um componente) e usar um `--output-path` próprio para não sobrescrever a Home.

## Extrair métricas e oportunidades do JSON

```bash
node -e '
const r = require(process.argv[1]);
const a = r.audits;
const m = (k) => a[k]?.displayValue;
console.log(JSON.stringify({
  score: Math.round(r.categories.performance.score * 100),
  FCP: m("first-contentful-paint"), LCP: m("largest-contentful-paint"),
  TBT: m("total-blocking-time"), CLS: m("cumulative-layout-shift"),
  lcpElement: a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet,
  oportunidades: Object.values(a)
    .filter((x) => x.details?.type === "opportunity" && x.numericValue > 0)
    .sort((x, y) => y.numericValue - x.numericValue).slice(0, 5)
    .map((x) => ({ id: x.id, titulo: x.title, economiaMs: Math.round(x.numericValue) })),
}, null, 2));
' ./documents/lighthouse/home-mobile.json
```

## Mediana (3 runs)

```bash
for i in 1 2 3; do
  npx lighthouse http://localhost:3000 --only-categories=performance \
    --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate \
    --output=json --output-path=./documents/lighthouse/run-$i.json \
    --chrome-flags="--headless=new --no-sandbox --disable-extensions --disable-gpu" --quiet
done
node -e 'const s=[1,2,3].map(i=>Math.round(require(`./documents/lighthouse/run-${i}.json`).categories.performance.score*100)).sort((a,b)=>a-b);console.log({runs:s,mediana:s[1]})'
```

## Visualizar

Abrir o JSON no [Lighthouse Report Viewer](https://googlechrome.github.io/lighthouse/viewer/).
