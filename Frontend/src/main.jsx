import React from "react";
import ReactDOM from "react-dom/client";
import {
  Film,
  Heart,
  Loader2,
  LogOut,
  Plus,
  Search,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import "./styles.css";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3335";
const ratingLabels = ["muito ruim", "ruim", "regular", "bom", "muito bom", "excelente"];

function useSession() {
  const [session, setSession] = React.useState(() => {
    const stored = localStorage.getItem("cinematch-session");
    return stored ? JSON.parse(stored) : null;
  });

  function saveSession(nextSession) {
    setSession(nextSession);
    localStorage.setItem("cinematch-session", JSON.stringify(nextSession));
  }

  function clearSession() {
    setSession(null);
    localStorage.removeItem("cinematch-session");
  }

  return { session, saveSession, clearSession };
}

async function apiFetch(path, options = {}, token) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro na requisicao.");
  }

  return data;
}

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = React.useState("login");
  const [form, setForm] = React.useState({
    name: "",
    email: "demo@cinematch.com",
    password: "123456",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;
      const session = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!session.token) {
        setError(
          "Conta criada. Confirme seu email no Supabase antes de entrar, ou desative a confirmacao de email no painel.",
        );
        setMode("login");
        return;
      }

      onAuthenticated(session);
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-hero">
        <span className="brand">
          <Film size={20} />
          CineMatch
        </span>
        <h1>Recomendações de filmes com KNN</h1>
        <p>
          Avalie filmes, salve favoritos e descubra sugestões baseadas em
          usuários com gostos parecidos!
        </p>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <div className="mode-switch">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            Cadastro
          </button>
        </div>

        {mode === "register" && (
          <label>
            Nome
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Seu nome"
              value={form.name}
            />
          </label>
        )}

        <label>
          Email
          <input
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="voce@email.com"
            type="email"
            value={form.email}
          />
        </label>

        <label>
          Senha
          <input
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Minimo 6 caracteres"
            type="password"
            value={form.password}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary-action full" disabled={loading} type="submit">
          {loading && <Loader2 className="spin" size={18} />}
          {mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>
    </section>
  );
}

function Stars({ value = null, onRate }) {
  return (
    <div className="stars" title={value === null ? "Sem avaliacao" : ratingLabels[value]}>
      {[0, 1, 2, 3, 4, 5].map((rating) => (
        <button
          aria-label={`Avaliar como ${rating}: ${ratingLabels[rating]}`}
          className={value === rating ? "chosen" : ""}
          key={rating}
          onClick={() => onRate(rating)}
          type="button"
        >
          {rating === 0 ? "0" : <Star fill={value >= rating ? "currentColor" : "none"} size={17} />}
        </button>
      ))}
    </div>
  );
}

function MovieCard({
  favorite,
  movie,
  onFavorite,
  onRate,
  rating,
  recommendationScore,
}) {
  return (
    <article className="movie-card">
      <img src={movie.image} alt={`Poster de ${movie.title}`} />
      <div className="movie-info">
        <div>
          <h3>{movie.title}</h3>
          <p>{movie.year} | {movie.genre}</p>
        </div>
        <p className="description">{movie.description}</p>
        <div className="movie-meta">
          <span>{movie.ratingCount || 0} avaliações</span>
          {recommendationScore && <strong>{recommendationScore}/5</strong>}
        </div>
        {onRate && <Stars onRate={onRate} value={rating ?? null} />}
      </div>
      {onFavorite && (
        <button
          aria-label={favorite ? "Remover favorito" : "Adicionar favorito"}
          className={`icon-action ${favorite ? "favorite" : ""}`}
          onClick={onFavorite}
          type="button"
        >
          <Heart fill={favorite ? "currentColor" : "none"} size={18} />
        </button>
      )}
    </article>
  );
}

function TmdbSearch({ onImport, token }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  async function searchMovies(event) {
    event.preventDefault();

    if (query.trim().length < 2) {
      setMessage("Digite pelo menos 2 caracteres.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await apiFetch(
        `/api/tmdb/search?query=${encodeURIComponent(query.trim())}`,
        {},
        token,
      );
      setResults(data);

      if (data.length === 0) {
        setMessage("Nenhum filme encontrado.");
      }
    } catch (caughtError) {
      setMessage(caughtError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="tmdb-search">
      <div className="section-heading">
        <h2>Buscar no TMDB</h2>
        <span>catalogo externo</span>
      </div>

      <form className="search-form" onSubmit={searchMovies}>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex: Batman, Avatar, Shrek"
          value={query}
        />
        <button className="primary-action" disabled={loading} type="submit">
          {loading ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
          Buscar
        </button>
      </form>

      {message && <p className="muted">{message}</p>}

      {results.length > 0 && (
        <div className="tmdb-results">
          {results.map((movie) => (
            <article className="tmdb-result" key={movie.tmdbId}>
              <img src={movie.image} alt={`Poster de ${movie.title}`} />
              <div>
                <h3>{movie.title}</h3>
                <p>{movie.year} | {movie.genre}</p>
              </div>
              <button
                aria-label={`Importar ${movie.title}`}
                className="icon-action"
                onClick={() => onImport(movie)}
                type="button"
              >
                <Plus size={18} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function App() {
  const { session, saveSession, clearSession } = useSession();
  const [movies, setMovies] = React.useState([]);
  const [profile, setProfile] = React.useState(null);
  const [favorites, setFavorites] = React.useState([]);
  const [ratings, setRatings] = React.useState([]);
  const [recommendations, setRecommendations] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const token = session?.token;

  async function loadDashboard() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [movieData, meData, recommendationData] = await Promise.all([
        apiFetch("/api/movies"),
        apiFetch("/api/me", {}, token),
        apiFetch("/api/recommendations?k=3&limit=5", {}, token),
      ]);

      setMovies(movieData);
      setProfile(meData.profile);
      setFavorites(meData.favorites);
      setRatings(meData.ratings);
      setRecommendations(recommendationData);
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadDashboard();
  }, [token]);

  async function toggleFavorite(movieId) {
    const isFavorite = favorites.some((favorite) => Number(favorite.movieId) === Number(movieId));

    try {
      const nextFavorites = await apiFetch(
        isFavorite ? `/api/favorites/${movieId}` : "/api/favorites",
        {
          method: isFavorite ? "DELETE" : "POST",
          body: isFavorite ? undefined : JSON.stringify({ movieId }),
        },
        token,
      );
      setFavorites(nextFavorites);
    } catch (caughtError) {
      setError(caughtError.message);
    }
  }

  async function rateMovie(movieId, rating) {
    try {
      const savedRating = await apiFetch(
        `/api/ratings/${movieId}`,
        {
          method: "PUT",
          body: JSON.stringify({ rating }),
        },
        token,
      );

      setRatings((currentRatings) => [
        ...currentRatings.filter((item) => Number(item.movieId) !== Number(movieId)),
        savedRating,
      ]);

      const [movieData, recommendationData] = await Promise.all([
        apiFetch("/api/movies"),
        apiFetch("/api/recommendations?k=3&limit=5", {}, token),
      ]);
      setMovies(movieData);
      setRecommendations(recommendationData);
    } catch (caughtError) {
      setError(caughtError.message);
    }
  }

  async function importTmdbMovie(movie) {
    try {
      await apiFetch(
        "/api/movies/import-tmdb",
        {
          method: "POST",
          body: JSON.stringify({ movie }),
        },
        token,
      );
      await loadDashboard();
    } catch (caughtError) {
      setError(caughtError.message);
    }
  }

  if (!session) {
    return <AuthPanel onAuthenticated={saveSession} />;
  }

  const ratingsByMovie = new Map(ratings.map((rating) => [Number(rating.movieId), rating.rating]));
  const favoriteMovieIds = new Set(favorites.map((favorite) => Number(favorite.movieId)));

  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand compact">
          <Film size={20} />
          CineMatch
        </span>
        <div className="profile-chip">
          <UserRound size={18} />
          <span>{profile?.name || session.user.name}</span>
          <button aria-label="Sair" className="icon-action" onClick={clearSession} type="button">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="hero dashboard-hero">
        <div>
          <h1>Seu perfil cinematográfico</h1>
          <p>
            Favoritos guardam suas preferências principais. As estrelas alimentam
            o KNN colaborativo para encontrar usuários semelhantes.
          </p>
        </div>
        <button className="primary-action" disabled={loading} onClick={loadDashboard} type="button">
          {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
          Atualizar
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="stats-row">
        <div>
          <strong>{favorites.length}/5</strong>
          <span>Favoritos</span>
        </div>
        <div>
          <strong>{ratings.length}</strong>
          <span>Avaliações feitas</span>
        </div>
        <div>
          <strong>{recommendations.length}</strong>
          <span>Recomendações</span>
        </div>
      </section>

      <section className="content-grid">
        <div>
          <TmdbSearch onImport={importTmdbMovie} token={token} />

          <div className="section-heading">
            <h2>Filmes</h2>
            <span>0 a 5 estrelas</span>
          </div>

          <div className="movie-grid">
            {movies.length === 0 ? (
              <div className="empty-state">
                <h3>Nenhum filme no catalogo</h3>
                <p>Busque filmes no TMDB e importe para comecar a avaliar.</p>
              </div>
            ) : (
              movies.map((movie) => (
                <MovieCard
                  favorite={favoriteMovieIds.has(Number(movie.id))}
                  key={movie.id}
                  movie={movie}
                  onFavorite={() => toggleFavorite(movie.id)}
                  onRate={(rating) => rateMovie(movie.id, rating)}
                  rating={ratingsByMovie.get(Number(movie.id))}
                />
              ))
            )}
          </div>
        </div>

        <aside>
          <div className="section-heading">
            <h2>Recomendações</h2>
            <span>KNN usuários</span>
          </div>

          <div className="panel">
            {recommendations.length === 0 ? (
              <p className="muted">
                Avalie pelo menos dois filmes para melhorar as recomendações.
              </p>
            ) : (
              <div className="recommendation-list">
                {recommendations.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    recommendationScore={movie.recommendationScore}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Favoritos</h3>
            {favorites.length === 0 ? (
              <p className="muted">Adicione ate 5 filmes favoritos.</p>
            ) : (
              <ul>
                {favorites.map((favorite) => {
                  const movie = movies.find((item) => Number(item.id) === Number(favorite.movieId));
                  return <li key={favorite.id}>{movie?.title || favorite.movieId}</li>;
                })}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
