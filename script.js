// Global Variables
const moviesContainer = document.querySelector(".container");
const searchBox = document.getElementById("searchBox");
const genreFilter = document.getElementById("genreFilter");

let currentPage = 1;
let totalPages = 1;
let lastQuery = "";

// Theme Toggle
const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-theme");
  themeToggle.textContent = "☀️";
} else {
  themeToggle.textContent = "🌙";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");

  if (document.body.classList.contains("light-theme")) {
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "light");
  } else {
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "dark");
  }
});

// Clear Movies
function clearMovies() {
  moviesContainer.innerHTML = "";
}

// Create Movie Card
function createMovieCard(item) {
  const card = document.createElement("div");
  card.classList.add("card");

  const title = item.title || item.name;
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  card.innerHTML = `
        <img src="${poster}" alt="${title}">
        <h3 class="title">${title}</h3>
        <p>⭐ ${item.vote_average}</p>
    `;

  card.addEventListener("click", () => showMovieDetails(item));

  return card;
}

// Render Movies
function renderMovies(movies) {
  clearMovies();
  if (!movies.length) {
    moviesContainer.innerHTML = "<p>No movies found.</p>";
    return;
  }
  movies.forEach((movie) => {
    moviesContainer.appendChild(createMovieCard(movie));
  });
}

// API Functions
const API_KEY = "04cb983ab81f52a3780c1c2e2d3e05fa"; // <-- paste your TMDB key here

async function fetchFromTMDB({ query = "", page = 1 } = {}) {
  try {
    let url;
    if (query) {
      const movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`;
      const tvUrl = `https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}`;

      const [movieResp, tvResp] = await Promise.all([fetch(movieUrl), fetch(tvUrl)]);
      const movieData = await movieResp.json();
      const tvData = await tvResp.json();

      const combinedResults = [...(movieData.results || []), ...(tvData.results || [])].sort(
        (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
      );

      return {
        results: combinedResults,
        totalPages: Math.max(movieData.total_pages || 1, tvData.total_pages || 1),
      };
    } else {
      const url = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`;
      const response = await fetch(url);
      const data = await response.json();
      return {
        results: data.results || [],
        totalPages: data.total_pages || 1,
      };
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
    return { results: [], totalPages: 1 };
  }
}

async function fetchPopularMovies(page = 1) {
  currentPage = page;
  const data = await fetchFromTMDB({ page });
  totalPages = data.totalPages || 1;
  renderMovies(filterByGenre(data.results));
  document.getElementById("currentPage").textContent = currentPage;
}

async function searchMovies(query, page = 1) {
  lastQuery = query;
  currentPage = page;
  const data = await fetchFromTMDB({ query, page });
  totalPages = data.totalPages || 1;
  renderMovies(filterByGenre(data.results));
  document.getElementById("currentPage").textContent = currentPage;
}

// Handle Search Input
function handleSearchInput(event) {
  const query = event.target.value.trim();
  if (query === "") fetchPopularMovies();
  else searchMovies(query);
}

// Filter Function
let selectedGenre = "all";
function filterByGenre(items) {
  if (selectedGenre === "all") return items;
  return items.filter(
    (item) => item.genre_ids && item.genre_ids.includes(parseInt(selectedGenre))
  );
}

genreFilter.addEventListener("change", (event) => {
  selectedGenre = event.target.value;
  const query = searchBox.value.trim();
  if (query === "") fetchPopularMovies();
  else searchMovies(query);
});

// Movie Details Modal
const modal = document.getElementById("movieModal");
const closeModalBtn = document.getElementById("closeModal");

function showMovieDetails(movie) {
  document.getElementById("modalTitle").textContent = movie.title || movie.name || "Untitled";
  document.getElementById("modalOverview").textContent = movie.overview || "No overview available.";
  document.getElementById("modalRelease").textContent = movie.release_date || movie.first_air_date || "N/A";
  document.getElementById("modalRuntime").textContent = movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]) || "N/A";
  document.getElementById("modalRating").textContent = movie.vote_average ?? "N/A";
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeMovieModal() {
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

closeModalBtn.addEventListener("click", closeMovieModal);
window.addEventListener("click", (e) => {
  if (e.target === modal) closeMovieModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.style.display === "flex") closeMovieModal();
});

// Pagination
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    const query = searchBox.value.trim();
    if (query === "") fetchPopularMovies(currentPage - 1);
    else searchMovies(query, currentPage - 1);
  }
});
document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage < totalPages) {
    const query = searchBox.value.trim();
    if (query === "") fetchPopularMovies(currentPage + 1);
    else searchMovies(query, currentPage + 1);
  }
});

// Scroll to Top
const scrollBtn = document.getElementById("scrollTopBtn");
window.addEventListener("scroll", () => {
  scrollBtn.style.display = window.scrollY > 300 ? "flex" : "none";
});
scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  searchBox.addEventListener("input", handleSearchInput);
  fetchPopularMovies();
});