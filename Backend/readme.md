
# Backend CineMatch

API em Node.js/Express para cadastro, login, perfil, favoritos, avaliacoes e recomendacao de filmes com KNN colaborativo.

## Rotas

- `GET /health`: status da API
- `POST /api/auth/register`: cria usuario
- `POST /api/auth/login`: autentica usuario
- `GET /api/me`: retorna perfil, favoritos e avaliacoes
- `GET /api/movies`: lista os filmes disponiveis
- `POST /api/favorites`: adiciona favorito, respeitando o limite de 5
- `DELETE /api/favorites/:movieId`: remove favorito
- `PUT /api/ratings/:movieId`: cria ou atualiza avaliacao de 0 a 5
- `GET /api/recommendations`: retorna recomendacoes por KNN

Exemplo de corpo para avaliacao:

```json
{
  "rating": 5
}
```

## Supabase

Copie `.env.example` para `.env` e preencha:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Enquanto as variaveis nao estiverem configuradas, a API usa dados locais de exemplo.

Execute `supabase/schema.sql` no Supabase para criar as tabelas e regras.
