# Gartic (MVP)

Jogo web de desenho e adivinhação em **português**, inspirado no Gartic, para jogar com amigos. Multiplayer em tempo real via **Supabase Realtime**, canvas HTML e **Next.js** (deploy na Vercel).

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Realtime)
- HTML Canvas (traços normalizados 0–1)

## Funcionalidades (MVP)

- Tela inicial (nome, criar sala, entrar por código)
- Lobby com lista de jogadores e host
- Partida com rodadas (uma por jogador)
- Desenhista recebe a palavra **somente via API**
- Canvas com cores, tamanho, borracha e limpar
- Sincronização de traços via tabela `drawing_strokes` + Realtime
- Chat / palpites com validação no servidor
- Pontuação configurável em `lib/scoring.ts`
- Timer sincronizado por `round_started_at`
- Placar final

## Tabelas extras (além de `rooms` e `players`)

Foram adicionadas por necessidade técnica:

| Tabela | Motivo |
|--------|--------|
| `room_secrets` | Guardar a palavra sem expor no Realtime de `rooms` |
| `drawing_strokes` | Traços validados no servidor e broadcast por INSERT |
| `chat_messages` | Palpites, acertos e mensagens de sistema |

View `rooms_public`: estado da sala **sem** palavra secreta.

## Pré-requisitos

- Node.js 20+
- Projeto no [Supabase](https://supabase.com)

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. No **SQL Editor**, execute o arquivo `supabase/migrations/001_initial.sql`.
3. Em **Project Settings → API**, copie URL e chaves.
4. Confirme que **Realtime** está habilitado para as tabelas (o script tenta adicionar à publication `supabase_realtime`).

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

- **Anon key**: apenas no cliente (Realtime + leituras permitidas por RLS).
- **Service role**: somente no servidor (API routes); **nunca** commite ou exponha no frontend.

## Executar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Testar multiplayer

1. Abra 2–3 abas anônimas ou perfis diferentes.
2. Aba 1: crie sala com um nome.
3. Abas 2 e 3: entre com o código e outros nomes.
4. Host clica **INICIAR PARTIDA**.
5. Verifique desenho, chat, acertos, pontos, troca de desenhista, timer e fim da partida.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as três variáveis de ambiente (incluindo `SUPABASE_SERVICE_ROLE_KEY` como **Server** / secreta).
3. Deploy.

## Estrutura principal

```
app/                 # Rotas (início, sala/[codigo], APIs)
components/          # Canvas, sala, jogo
hooks/               # useRoom, useGame, useDrawing
lib/                 # Supabase, regras, pontuação, servidor
types/               # Tipos TypeScript
data/words.json      # Lista de palavras
supabase/migrations/ # SQL inicial
```

## Segurança (resumo)

- Palpites e palavra validados nas **API routes** com service role.
- Palavra em `room_secrets` (sem SELECT para anon).
- Desenho e palpite: checagem de `drawer_id` no servidor.
- RLS: leitura aberta para Realtime em ambiente controlado; **escritas** feitas pelo backend.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |

## Licença

Uso pessoal / projeto de estudo.
