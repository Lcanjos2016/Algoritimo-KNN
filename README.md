# CineMatch

App de recomendação de filmes usando KNN colaborativo baseado em avaliações de usuários.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: Supabase
- Algoritmo: KNN por usuários semelhantes usando avaliações de 0 a 5

## Como rodar

Backend:

```bash
cd Backend
npm install
npm run dev
```

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

Copie `Backend/.env.example` para `Backend/.env` quando for conectar o Supabase.

Sem Supabase configurado, o backend roda com dados de demonstração. Use:

- Email: `demo@cinematch.com`
- Senha: `123456`

## Requisitos atendidos

- RF01/RF02: cadastro e login por Supabase Auth ou modo demo local.
- RF03: perfil retornado em `GET /api/me`.
- RF04/RN01: favoritos em `POST /api/favorites`, com limite de 5.
- RF05/RN02: avaliações de 0 a 5 em `PUT /api/ratings/:movieId`.
- RF06/RN03: avaliação atualizada por `upsert`, uma por usuário e filme.
- RF07: `GET /api/movies` retorna `ratingCount`.
- RF08/RF09/RF10/RN04/RN05: `GET /api/recommendations` usa KNN colaborativo, remove filmes já avaliados e cai para populares quando faltam dados.

## Supabase

Execute o SQL em [Backend/supabase/schema.sql](Backend/supabase/schema.sql) no editor SQL do Supabase.

## TMDB

O CineMatch tambem pode buscar filmes no The Movie Database.

1. Crie uma conta no TMDB.
2. No painel da sua conta, va em API e gere o **API Read Access Token**.
3. Adicione no `Backend/.env`:

```env
TMDB_READ_ACCESS_TOKEN=cole_o_token_aqui
```

Depois reinicie o backend. A busca aparece no frontend como **Buscar no TMDB**.

## Deploy no Vercel

O projeto tem `vercel.json`, `api/index.js` e `package.json` na raiz para publicar frontend e API juntos.

No painel do Vercel, configure as variaveis de ambiente:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
TMDB_READ_ACCESS_TOKEN=...
```

No deploy, o frontend chama a API pelo mesmo dominio usando `/api`.
