
# Backend CineMatch

API em Node.js/Express para cadastro, login, perfil, favoritos, avaliações e recomendação de filmes com KNN colaborativo.

## Rotas

- `GET /health`: status da API
- `POST /api/auth/register`: cria usuário
- `POST /api/auth/login`: autentica usuário
- `GET /api/me`: retorna perfil, favoritos e avaliações
- `GET /api/movies`: lista os filmes disponíveis
- `POST /api/favorites`: adiciona favorito, respeitando o limite de 5
- `DELETE /api/favorites/:movieId`: remove favorito
- `PUT /api/ratings/:movieId`: cria ou atualiza avaliação de 0 a 5
- `GET /api/recommendations`: retorna recomendações por KNN

Exemplo de corpo para avaliação:

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

Enquanto as variáveis não estiverem configuradas, a API usa dados locais de exemplo.

Execute `supabase/schema.sql` no Supabase para criar as tabelas e regras.
