<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/535da04f-ac77-40a1-8dba-22e926544f87

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy com Docker (EasyPanel)

O projeto inclui um `Dockerfile` multi-stage (build do Vite + bundle do servidor com esbuild, seguido de uma imagem final enxuta só com dependências de produção).

No EasyPanel:

1. Crie um app do tipo **App** apontando para este repositório Git, com **Build Method: Dockerfile** (o arquivo `Dockerfile` na raiz já é detectado automaticamente).
2. Em **Environment Variables**, defina:
   - `GEMINI_API_KEY` — chave da API Gemini (sem ela, o endpoint `/api/ocr` roda em modo simulação).
   - `NODE_ENV=production` (o Dockerfile já define isso por padrão).
3. Em **Port**, configure `3000` (porta em que o servidor escuta; pode ser sobrescrita com a variável `PORT`).
4. Faça o deploy — o EasyPanel builda a imagem a partir do Dockerfile e expõe o domínio configurado via proxy.

Build e imagem local (opcional, para testar antes do deploy):
```
docker build -t malote-saude .
docker run -p 3000:3000 -e GEMINI_API_KEY=sua_chave malote-saude
```
