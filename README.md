# 🏋️‍♂️ Acompanhamento Corporal em Tempo Real (2026)

Aplicação web moderna, rápida e responsiva (mobile-first e desktop) para registro e acompanhamento de peso e medidas corporais em tempo real, utilizando o **Google Sheets** como banco de dados e um **assistente integrado via API do Gemini** para análises inteligentes.

---

## 🌟 Funcionalidades

1. **Lançamento Rápido de Peso:**
   * Data brasileira (`DD/MM/AAAA`) e dia da semana automático.
   * Seleção de contexto (*Jejum matinal*, *Pós-treino / Almoço*, etc.).
   * Cálculo em tempo real de **IMC** (altura padrão 1,80 m), variação vs. pesagem anterior e variação vs. peso inicial.
   * Gravação direta na aba `Registro de Peso` no formato brasileiro (`113,250 kg`, vírgula decimal).

2. **Lançamento Rápido de Medidas Corporais:**
   * Circunferências completas (Abdômen no umbigo, Cintura, Quadril, Tórax, Pescoço, Braços, Antebraços, Coxas e Panturrilhas).
   * Contexto do instrumento (*Fita métrica flexível* vs. *Trena metálica*) e respiração (*Normal* vs. *Expiração forçada*).
   * Gravação direta na aba `Medidas Corporais`.

3. **Dashboard e Gráficos Interativos:**
   * Cards de resumo: Peso Atual, Variação Total, IMC Atual com classificação, Peso Inicial e Último Abdômen.
   * Gráficos temporais de evolução de peso e medidas principais.
   * Tabela de histórico completa com pesquisa, filtros e exportação CSV.

4. **Assistente de Análise com Inteligência Artificial (Gemini):**
   * Painel de chat integrado no site.
   * Envia o contexto biométrico recente (pesagens, medidas e referências) ao modelo Gemini.
   * Análises sobre oscilações pós-treino (retenção hídrica, glicogênio), diferença entre trena e fita métrica e sugestão de rotina.

---

## 📊 Planilha de Dados (Google Sheets)

* **Nome:** `Acompanhamento Corporal - Peso e Medidas 2026`
* **ID:** `1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U`
* **URL:** [Abrir Planilha](https://docs.google.com/spreadsheets/d/1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U/edit)

### Dados de Partida Preservados:
* **Peso Inicial:** `113,250 kg` em `16/11/2026` (Almoço / pós-academia, IMC `34,95` com `1,80 m`).
* **Medida Preliminar:** Abdômen de `127 cm` (altura do umbigo, expirando até ficar sem fôlego).

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
* Node.js 18+ instalado.

### 2. Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev
```

Abra no navegador em `http://localhost:3000`.

O sistema conta com fallback offline e armazenamento local, permitindo que você visualize o dashboard, insira dados e teste todas as funcionalidades imediatamente.

---

## ☁️ Deploy no Cloudflare Pages

O projeto foi estruturado com **Cloudflare Pages Functions** na pasta `functions/api/`, permitindo que o frontend e o backend rodem na mesma infraestrutura sem custo e com alta performance.

### Passo a Passo no Cloudflare:

1. Suba o repositório para o GitHub ou GitLab.
2. No painel da **Cloudflare**:
   * Vá em **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   * Selecione o repositório `MonitoramentoCorporal`.
3. Configure os parâmetros de build:
   * **Framework preset:** `Vite`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
4. Em **Settings > Environment variables (Secrets)**, configure:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `SPREADSHEET_ID` | ID da Planilha Google Sheets | `1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U` |
| `GEMINI_API_KEY` | Chave de API do Google Gemini | `AIzaSy...` |
| `GOOGLE_SCRIPT_URL` | *(Recomendado)* URL Web App do Apps Script | `https://script.google.com/macros/s/.../exec` |

> Alternativamente, se preferir usar Service Account ao invés do Apps Script, configure `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_PRIVATE_KEY`.

---

## 🔌 Conectando o Google Sheets (Método Rápido em 2 Minutos)

Para conectar o Cloudflare à planilha sem complicação de chaves do Google Cloud:

1. Abra a planilha no Google Sheets.
2. No menu superior, clique em **Extensões** > **Apps Script**.
3. Apague o código padrão e cole o conteúdo de [`google-apps-script/Code.js`](google-apps-script/Code.js).
4. Clique em **Implantar** (Deploy) > **Nova implantação** (New deployment).
5. Escolha o tipo **Aplicativo da Web** (Web app):
   * **Executar como:** Eu (*seu e-mail*)
   * **Quem tem acesso:** Qualquer pessoa (*Anyone*)
6. Clique em **Implantar**, autorize o acesso e copie a URL gerada (`https://script.google.com/macros/s/.../exec`).
7. Cole essa URL no secret `GOOGLE_SCRIPT_URL` do Cloudflare ou diretamente no botão de **Configurações** da própria aplicação web!

Pronto! Todo registro feito no site será inserido diretamente nas abas da sua planilha.

---

## 🤖 Como Obter a Chave do Gemini (GEMINI_API_KEY)

1. Acesse o [Google AI Studio](https://aistudio.google.com/).
2. Clique em **Get API key** e crie uma nova chave.
3. Copie a chave e adicione no Cloudflare Pages em `Settings > Environment variables > GEMINI_API_KEY` ou na tela de Configurações do site.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
* **Backend:** Cloudflare Pages Functions (Edge Workers com WebCrypto).
* **Banco de Dados:** Google Sheets API / Google Apps Script.
* **IA:** Google Gemini 1.5 Flash API.
# Monitoramento-Corporal
