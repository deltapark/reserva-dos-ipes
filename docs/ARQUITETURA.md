# Arquitetura

## Decisões
- Next.js com `output: 'export'` (Hostinger compartilhada, sem Node).
- Sem API routes: formulário faz POST direto no webhook do Make (`NEXT_PUBLIC_MAKE_WEBHOOK_URL`).
- Resiliência: o front sempre mostra sucesso pro lead; erros do CRM/Sheets são tratados dentro do Make (alerta Slack/e-mail).
- Fontes: Montserrat (texto e interface) + Fraunces (títulos, números grandes e frases de destaque), via next/font.
- Imagens: originais em `assets-originais/` (fora do Git) → `npm run images` gera webp em 640/1280/1920 px em `public/images/`, todas no quadro 1920x1071 para os pares dia/noite ficarem alinhados. `<img srcset>` escolhe o tamanho; versões noturnas e fotos do lightbox só baixam quando aparecem.

## Seções (ordem da copy)
1. Hero + formulário  2. Localização  3. Condomínio  4. Casas  5. Plantas  6. Lazer  7. Entorno (mapa sobre a foto aérea)  8. Condições  9. Manifesto (vídeo)  10. Fechamento/CTA  11. Rodapé

## Formulário (campos)
nome, whatsapp (máscara), email, objetivo (morar/investir), valor de entrada, parcela ideal.

## Lançamento
LP nova em `/` (06/10/2026); teaser antigo em `/teaser/` (noindex). Conferir `.htaccess` + SSL.

## Decisões de conteúdo (02/10/2026)
- Seção de casas: CTA = "Quero escolher minha casa!" → redireciona pro simulador (`content/site.json` → `simuladorUrl`).
- Localização: usa `public/images/localizacao/mapa-condominio.webp` (render CONDOMÍNIO/3). Endereço completo e link do Maps ficam `null` até o cliente passar.
- Pendências: WhatsApp, Instagram, endereço, ícone/favicon.

## Decisões de design (02/10/2026)
- Direção aprovada: "Dia e noite" (escolhida entre 3 protótipos). Hero com comparador dia/entardecer da portaria; botão Dia/Noite (`html[data-mode]`) troca paleta e fotos.
- Casas: acordeão por rua no padrão do acordeão do Harmoni (painéis escuros com título vertical, autoplay 4s pausando no hover) + lightbox com véu escuro e foto inteira.
- Header e rodapé no padrão dos componentes header-2 e footer-section do 21st.dev, reescritos sem shadcn/Radix (não havia necessidade das dependências).
- Sem bolinhas/pílulas coloridas para identificar ipê: o nome e a foto bastam (pedido do cliente).
- Logo: SVG original otimizado com svgo (600 KB → 80 KB), uma versão dourada e uma clara para o modo Noite.

## Plantas (19/10/2026)
- Seção `#plantas`, entre Casas e Lazer. Trabalha numa coluna de 1120px centrada (`.pl__col`), mais estreita que o resto da página: o desenho da planta só é legível até essa largura.
- A planta é a mesma nas 62 casas; o que muda é a implantação no lote. Por isso a lista nomeia pelo que se reconhece ("Quintal ao lado da casa") e deixa "Tipo 1" como rótulo pequeno. A lista troca o desenho no lugar, como a seção de Lazer, e o quadro adota a proporção de cada planta.
- Cada planta tem dois renders: com sol e sem. O botão Dia/Noite escolhe — Dia usa a versão com sol.
- A implantação fecha a seção no par invertido da seção Condomínio. Passar por uma rua acende os lotes dela sobre o mapa, na cor do ipê; na lista o destaque é só o traço escuro, porque a identificação por cor fora do mapa foi vetada pelo cliente.
- Conteúdo, medidas e as faixas de lotes (fração do quadro 1520x976) ficam em `content/plantas.json`. Para corrigir um destaque, ajuste `areas` ali.
- Imagens: `scripts/plantas.mjs` corta a tarja preta dos renders de `assets-originais/PLANTAS/` (fora do Git) e grava `public/images/plantas-web/<id>-{900,1500,2200}.webp`. Rodar só quando entrar planta nova; os `w`/`h` do JSON vêm do `plantas.json` que o script escreve ao lado das imagens.

## Entorno e manifesto (05/10/2026)
- Entorno substitui a antiga seção "Inspirado na beleza dos ipês". Mapa em tela cheia (100svh) com painel flutuante no canto (abas "Pontos próximos" e "Como chegar"); no celular (< 760px) vira a régua de pontos do protótipo B: cartões que deslizam acima da barra Consultor/Simular (parar num cartão já leva a câmera ao ponto), texto do ponto sobre a mata e "Como chegar" num botão fixo que abre o painel como gaveta. Medalhão do farol usa `public/brand/icone-arvore.webp` (gerado de `assets-originais/marca/icone`; o tronco é branco, por isso o fundo azul-noite). Pontos, contorno do lote e posições (pixels da foto 1920x1080) ficam em `content/entorno.json`; para mover um pin, ajuste `x`/`y` ali. Ponto com `destino: null` aparece sem link de rota.
- Rotas usam as coordenadas de `content/site.json` (`localizacao.lat/lng`).
- Manifesto: `site.json` → `manifestoYoutubeId`. O player (youtube-nocookie) só carrega depois do clique.
- Texto jurídico: `copy.json` → `juridico`, exibido nas Condições e no rodapé.
