# Especificação de Sistema Web — Acompanhamento Corporal em Tempo Real

## 1. Objetivo do Sistema
Criar uma aplicação web rápida, responsiva (mobile-first e desktop) para registrar e acompanhar em tempo real o peso corporal e as medidas corporais, usando uma planilha do Google Sheets como banco de dados e contando com um assistente integrado via API do Gemini para análises sob demanda dentro do próprio site.

## 2. Hospedagem e Infraestrutura (Cloudflare)
* **Hospedagem:** Cloudflare Pages (ou Cloudflare Workers) vinculado ao domínio personalizado do usuário.
* **Camada de Backend / API:** Cloudflare Workers / Pages Functions para manter chaves de API em segurança (nunca expor chaves secretas no frontend), intermediar leitura/escrita no Google Sheets e encaminhar requisições de análise ao Gemini.
* **Variáveis de Ambiente (Secrets no Cloudflare):**
  * `SPREADSHEET_ID=1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U`
  * Credenciais de acesso ao Google Sheets (Service Account ou endpoint Apps Script)
  * `GEMINI_API_KEY` (chave da API do Gemini usada no backend/Worker)

## 3. Fonte de Dados (Google Sheets)
* **Nome da Planilha:** `Acompanhamento Corporal - Peso e Medidas 2026`
* **ID da Planilha:** `1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U`
* **URL:** `https://docs.google.com/spreadsheets/d/1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U/edit`
* **Abas esperadas:**
  * `Registro de Peso` (`Data`, `Dia da Semana`, `Horário / Contexto`, `Peso (kg)`, `Variação vs Anterior (kg)`, `Variação vs Inicial (kg)`, `IMC`, `Observações`)
  * `Medidas Corporais` (`Data`, `Pescoço (cm)`, `Ombro (cm)`, `Tórax (cm)`, `Cintura (cm)`, `Abdômen (cm)`, `Quadril (cm)`, `Braço Dir (cm)`, `Braço Esq (cm)`, `Antebraço Dir (cm)`, `Antebraço Esq (cm)`, `Coxa Dir (cm)`, `Coxa Esq (cm)`, `Panturrilha Dir (cm)`, `Panturrilha Esq (cm)`, `Observações`)

## 4. Funcionalidades Principais
1. **Lançamento Rápido de Peso (Tempo Real):**
   * Campos: Data (`DD/MM/AAAA`, padrão hoje), Dia da Semana, Horário / Contexto (ex.: *Jejum matinal*, *Pós-treino / Almoço*), Peso (kg, ex.: `113,250`), Observações.
   * Cálculo automático de IMC (altura padrão configurável, ex.: `1,80 m`), variação vs. anterior e variação vs. inicial.
   * Gravação direta na aba `Registro de Peso` via backend Cloudflare.
2. **Lançamento Rápido de Medidas Corporais:**
   * Campos para circunferências (Abdômen, Cintura, Quadril, Pescoço, Ombro, Tórax, Braços, Antebraços, Coxas, Panturrilhas) e Observações (ex.: registrar instrumento como *Trena* vs. *Fita métrica* e método de respiração).
   * Gravação direta na aba `Medidas Corporais` via backend Cloudflare.
3. **Dashboard de Acompanhamento:**
   * Cards de resumo (`PESO INICIAL`, `PESO ATUAL`, `VARIAÇÃO TOTAL`, `IMC ATUAL`, última medida abdominal).
   * Gráficos de evolução temporal de peso e medidas.
   * Histórico filtrável dos lançamentos puxados da planilha.
4. **Assistente de Análise Integrado (Gemini API):**
   * Painel de chat / botão "Pedir Análise" dentro do próprio site.
   * Ao solicitar uma análise ou enviar uma pergunta, o frontend envia a mensagem do usuário junto com um resumo estruturado dos registros recentes da planilha (`Registro de Peso` e `Medidas Corporais`, incluindo contexto de medição e altura de referência) para um endpoint no Cloudflare Worker.
   * O Worker chama a API do Gemini e devolve a resposta formatada diretamente no chat do site (ex.: interpretar oscilações de peso pós-treino, comparar medições preliminares com trena vs. fita métrica, sugerir próximos focos de acompanhamento).

## 5. Instruções para o Antigravity
* Estruture o projeto compatível com deploy direto no Cloudflare Pages / Workers (ex.: Vite + React/TypeScript com Pages Functions, ou frontend estático + Worker).
* Preserve os dados já existentes na planilha `Acompanhamento Corporal - Peso e Medidas 2026` (`113,250 kg` em `16/11/2026` no horário do almoço após a academia; IMC `34,95` com `1,80 m`; medida preliminar de abdômen de `127 cm` com trena na altura do umbigo expirando até ficar sem fôlego).
* Garanta que novos registros façam `append` nas abas correspondentes respeitando o padrão brasileiro (`DD/MM/AAAA` e vírgula decimal) sem sobrescrever cabeçalhos ou dados anteriores.
* Crie um `.env.example` e um `README.md` explicando como configurar as variáveis no Cloudflare e como conectar a API do Gemini e a planilha.