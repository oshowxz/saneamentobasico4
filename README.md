# Saneamento Sinop (versão 2)

Site escolar sobre esgoto, água e lixo em Sinop (MT): números do município com fonte e mapa da rede de esgoto por bairro.

## O que mudou em relação à versão anterior

- **Sem percentuais inventados.** Os percentuais de água, esgoto e lixo por bairro eram fictícios e foram removidos. O mapa agora mostra a situação real da rede de esgoto nos 55 bairros da planilha: em operação, implantada (ligação não confirmada) ou em obras, com anel para quem também tem obras em 2026.
- **Sem pontos de mapa chutados.** Os marcadores antigos eram posições ilustrativas, por isso caíam no lugar errado. Agora um bairro só aparece no mapa se tiver posição vinda de uma fonte; os outros ficam na lista com a etiqueta "sem posição".
- **Dados dentro do site.** Os dados ficam em `js/dados.js`, gerado da planilha. Não depende mais de ler CSV, então funciona até abrindo o `index.html` com dois cliques.
- **Página nova:** a régua de esgoto (três fontes, três números, mais as metas), panorama por tema, contas de metas com a conta mostrada, cuidados ao comparar números, e downloads em CSV.

## Como publicar

1. Copie o conteúdo desta pasta para o repositório do GitHub Pages, substituindo `index.html`, `css/`, `js/` e `favicon.svg`.
2. As pastas `originais/`, `assets/` e `dados/*.csv` antigas não são mais usadas. Pode apagar.
3. Faça o commit.

## Como colocar os bairros no lugar certo (faça uma vez)

O mapa começa sem posições verificadas. Para preencher:

1. Abra o site publicado e vá até o mapa. Ele consulta o OpenStreetMap (Overpass) sozinho e posiciona os bairros que encontrar pelo nome.
2. Clique em **Procurar posições** para tentar os que faltam, um por segundo. Pode levar alguns minutos.
3. Confira cada ponto. Ligue **Ajustar posições** e arraste os que estiverem errados. Para um bairro sem posição, clique nele na lista e use **Marcar no mapa**.
4. Clique em **Baixar coordenadas** e substitua `js/coordenadas.js` do projeto pelo arquivo baixado. Faça o commit.

Depois disso o site abre com as posições conferidas, sem consultar nenhum serviço.

Posições vindas do OpenStreetMap são automáticas e podem errar. O mapa avisa isso enquanto houver alguma.

## Como atualizar os dados

Edite `dados/Saneamento_Sinop_dados_ORIGINAL.xlsx` e rode, na raiz do projeto:

```
pip install openpyxl
python scripts/gerar_dados.py
```

Isso reescreve `js/dados.js`. O script para com erro se, em algum bairro, o número de fontes, datas e links não bater.

Se a planilha receber percentuais reais por bairro (colunas `agua_pct`, `esgoto_pct`, `lixo_pct`, com `pct_ano` e `pct_fonte`), eles aparecem no painel do bairro com a fonte.

## Estrutura

```
index.html
favicon.svg
css/style.css
js/dados.js          gerado da planilha
js/coordenadas.js    posições verificadas (começa vazio)
js/geo.js            localização de bairros (sem pontos inventados)
js/app.js            página e mapa
scripts/gerar_dados.py
dados/Saneamento_Sinop_dados_ORIGINAL.xlsx
```

## Ressalvas

- Os indicadores municipais foram preservados da planilha. Não foram conferidos de novo um a um; os links de cada linha levam à fonte.
- Só 55 dos 323 bairros legalizados aparecem, porque são os que as fontes citam. Bairro fora do mapa quer dizer sem informação, não sem rede.
- Seis bairros vêm de uma notícia de 2025 e estão como "rede implantada" até a conclusão ser confirmada.
