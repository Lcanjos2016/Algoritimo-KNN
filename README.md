# CineMatch

App de recomendacao de filmes usando KNN colaborativo baseado em avaliacoes de usuarios.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Banco: Supabase
- Algoritmo: KNN por usuarios semelhantes usando avaliacoes de 0 a 5

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

Sem Supabase configurado, o backend roda com dados de demonstracao. Use:

- Email: `demo@cinematch.com`
- Senha: `123456`

## Requisitos atendidos

- RF01/RF02: cadastro e login por Supabase Auth ou modo demo local.
- RF03: perfil retornado em `GET /api/me`.
- RF04/RN01: favoritos em `POST /api/favorites`, com limite de 5.
- RF05/RN02: avaliacoes de 0 a 5 em `PUT /api/ratings/:movieId`.
- RF06/RN03: avaliacao atualizada por `upsert`, uma por usuario e filme.
- RF07: `GET /api/movies` retorna `ratingCount`.
- RF08/RF09/RF10/RN04/RN05: `GET /api/recommendations` usa KNN colaborativo, remove filmes ja avaliados e cai para populares quando faltam dados.

## Supabase

Execute o SQL em [Backend/supabase/schema.sql](Backend/supabase/schema.sql) no editor SQL do Supabase.
