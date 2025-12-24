const API_KEY = "api_key=f491f6040ae30446807e51cc255e1d15";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";
const IMG_SMALL = "https://image.tmdb.org/t/p/w342"; // Optimized for mobile
const BACKDROP = "https://image.tmdb.org/t/p/original";

const main = document.getElementById("main");
const heroBg = document.getElementById("heroBg");
const heroTitle = document.getElementById("hero-title");
const heroOverview = document.getElementById("hero-overview");
const heroRating = document.getElementById("hero-rating");
const heroYear = document.getElementById("hero-year");
const heroVideo = document.getElementById("heroVideo");
const hero = document.getElementById("hero");
const searchInput = document.getElementById("search");
const keyboardHelp = document.getElementById("keyboardHelp");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const playTrailerBtn = document.getElementById("playTrailer");
const heroInfoBtn = document.getElementById("heroInfo");

const sidebar = document.getElementById("sidebar");
document.getElementById("menuBtn").onclick = () => sidebar.classList.toggle("active");

let page = 1;
let loading = false;
let endpoint = `${BASE}/trending/movie/day?${API_KEY}`;
let currentSection = "Trending";

let heroMovies = [];
let heroIndex = 0;
let carouselTimer = null;
let heroLocked = false;
let hoverTimer = null;
let currentHeroMovie = null;


function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Image lazy loading with Intersection Observer
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src;
      
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    }
  });
}, {
  rootMargin: '50px'
});





/* Hero and hero carousel */
function startCarousel() {
  stopCarousel();
  carouselTimer = setInterval(() => {
    if (heroLocked) return;
    heroIndex = (heroIndex + 1) % heroMovies.length;
    setHero(heroMovies[heroIndex], false);
  }, 6000);
}

function stopCarousel() {
  clearInterval(carouselTimer);
}

function setHero(movie, lock = false) {
  heroLocked = lock;
  currentHeroMovie = movie;

  heroVideo.style.opacity = "0";
  heroVideo.style.pointerEvents = "none";
  heroVideo.innerHTML = "";


  const backdropUrl = window.innerWidth < 768 
    ? `${IMG}${movie.backdrop_path}` 
    : `${BACKDROP}${movie.backdrop_path}`;
  
  heroBg.style.backgroundImage = `url(${backdropUrl})`;
  heroTitle.textContent = movie.title || movie.name;
  heroOverview.textContent = movie.overview || "";
  heroRating.textContent = `⭐ ${movie.vote_average?.toFixed(1) || "N/A"}`;
  heroYear.textContent = (movie.release_date || movie.first_air_date || "").split("-")[0];
}

fetch(`${BASE}/trending/movie/week?${API_KEY}`)
  .then(r => r.json())
  .then(d => {
    heroMovies = d.results.slice(0, 6);
    setHero(heroMovies[0]);
    startCarousel();
  });


hero.addEventListener("mouseenter", () => {
  // Only enable hover preview on desktop
  if (window.innerWidth < 768) return;
  
  hoverTimer = setTimeout(async () => {
    heroLocked = true;
    stopCarousel();

    if (!currentHeroMovie) return;

    const mediaType = currentHeroMovie.media_type || 
                      (currentHeroMovie.title ? 'movie' : 'tv');
    const mediaId = currentHeroMovie.id;

    try {
      const res = await fetch(`${BASE}/${mediaType}/${mediaId}/videos?${API_KEY}`);
      const data = await res.json();
      const t = data.results.find(v => v.type === "Trailer");
      if (!t) return;

      heroVideo.innerHTML = `
        <iframe src="https://www.youtube.com/embed/${t.key}?autoplay=1&mute=1"
        allow="autoplay"></iframe>`;

      heroVideo.style.opacity = "1";
      heroVideo.style.pointerEvents = "auto";
    } catch (error) {
      console.error("Error loading trailer:", error);
    }
  }, 2000);
});

hero.addEventListener("mouseleave", () => {
  if (window.innerWidth < 768) return;
  
  clearTimeout(hoverTimer);
  heroLocked = false;

  heroVideo.style.opacity = "0";
  heroVideo.style.pointerEvents = "none";
  heroVideo.innerHTML = "";

  startCarousel();
});

function showSkeletons(count = 20) {
  main.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    skeleton.innerHTML = `
      <div class="skeleton-poster"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text"></div>
    `;
    main.appendChild(skeleton);
  }
}

async function loadMovies(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    showSkeletons();
    page = 1;
  }

  try {
    const res = await fetch(`${endpoint}&page=${page}`);
    const data = await res.json();
    
    if (reset) {
      main.innerHTML = '';
    }
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((movie, index) => {
        setTimeout(() => createCard(movie), index * 30); // Staggered animation
      });
      page++;
    } else if (reset) {
      main.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; opacity: 0.6;">
          <p style="font-size: 1.2rem;">No results found</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading movies:", error);
    main.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <p style="font-size: 1.2rem; color: var(--accent-color);">Failed to load movies. Please try again.</p>
      </div>
    `;
  } finally {
    loading = false;
  }
}

function createCard(m) {
  if (!m.poster_path) return;

  const card = document.createElement("div");
  card.className = "movie";
  
  // Responsive image sizing
  const imgUrl = window.innerWidth < 768 ? IMG_SMALL : IMG;
  
  card.innerHTML = `
    <img data-src="${imgUrl}${m.poster_path}" alt="${m.title || m.name}">
    <div class="movie-info">${m.title || m.name}</div>
    <div class="movie-meta">⭐ ${m.vote_average?.toFixed(1)}</div>
    <div class="overview">${m.overview || "No overview available"}</div>
  `;

  const img = card.querySelector('img');
  imageObserver.observe(img);

  card.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setHero(m, true);
  };

  main.appendChild(card);
}
/* infinite scroll */
const handleScroll = debounce(() => {
  if (window.innerHeight + window.scrollY > document.body.offsetHeight - 1000) {
    loadMovies();
  }
}, 200);

window.addEventListener("scroll", handleScroll);

/* search */
const handleSearch = debounce((q) => {
  if (!q) {
    endpoint = `${BASE}/trending/movie/day?${API_KEY}`;
    loadMovies(true);
    return;
  }

  endpoint = `${BASE}/search/multi?query=${encodeURIComponent(q)}&${API_KEY}`;
  loadMovies(true);
}, 300);

searchInput.addEventListener("input", e => {
  const q = e.target.value.trim();
  handleSearch(q);
});

function scrollToMovies() {
  const yOffset = -80; // offset for fixed topbar
  const y = main.getBoundingClientRect().top + window.pageYOffset + yOffset;
  
  window.scrollTo({
    top: y,
    behavior: "smooth"
  });
}


document.querySelectorAll("[data-nav]").forEach(n => {
  n.onclick = () => {
    const t = n.dataset.nav;
    
    const sectionNames = {
      movie: "Movies",
      tv: "TV Shows",
      top: "Top Rated",
      trending: "Trending"
    };

    endpoint =
      t === "movie" ? `${BASE}/discover/movie?${API_KEY}` :
      t === "tv" ? `${BASE}/discover/tv?${API_KEY}` :
      t === "top" ? `${BASE}/discover/movie?sort_by=vote_average.desc&vote_count.gte=200&${API_KEY}` :
      `${BASE}/trending/movie/day?${API_KEY}`;

    searchInput.value = "";
    sidebar.classList.remove("active");
    loadMovies(true);
     scrollToMovies();
  };
});

/* keyboard shortcuts */
let helpVisible = false;

document.addEventListener('keydown', (e) => {
  // Ignore if typing in input
  if (e.target.tagName === 'INPUT') {
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchInput.blur();
      endpoint = `${BASE}/trending/movie/day?${API_KEY}`;
      loadMovies(true);
    }
    return;
  }

  switch(e.key) {
    case '/':
      e.preventDefault();
      searchInput.focus();
      break;
    
    case 'h':
    case 'H':
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    
    case '?':
      helpVisible = !helpVisible;
      keyboardHelp.classList.toggle('show', helpVisible);
      break;
    
    case 'Escape':
      if (helpVisible) {
        helpVisible = false;
        keyboardHelp.classList.remove('show');
      }
      break;
  }
});

// Hide keyboard help after 5 seconds
let helpTimeout;
keyboardHelp.addEventListener('mouseenter', () => {
  clearTimeout(helpTimeout);
});

keyboardHelp.addEventListener('mouseleave', () => {
  helpTimeout = setTimeout(() => {
    helpVisible = false;
    keyboardHelp.classList.remove('show');
  }, 5000);
});


window.addEventListener('resize', debounce(() => {
  // Reload hero image with appropriate size
  if (currentHeroMovie) {
    const backdropUrl = window.innerWidth < 768 
      ? `${IMG}${currentHeroMovie.backdrop_path}` 
      : `${BACKDROP}${currentHeroMovie.backdrop_path}`;
    heroBg.style.backgroundImage = `url(${backdropUrl})`;
  }
}, 250));


loadMovies();


if (window.innerWidth >= 768) {
  setTimeout(() => {
    keyboardHelp.classList.add('show');
    helpVisible = true;
    
    setTimeout(() => {
      keyboardHelp.classList.remove('show');
      helpVisible = false;
    }, 5000);
  }, 2000);
}

playTrailerBtn.addEventListener('click', async () => {
  if (!currentHeroMovie) return;

  const mediaType = currentHeroMovie.media_type || 
                    (currentHeroMovie.title ? 'movie' : 'tv');
  const mediaId = currentHeroMovie.id;

  try {
    const res = await fetch(`${BASE}/${mediaType}/${mediaId}/videos?${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === "Trailer") || data.results[0];
    
    if (!trailer) {
      modalBody.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <i class="fa-solid fa-video-slash" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;"></i>
          <p style="font-size: 1.2rem; opacity: 0.8;">No trailer available</p>
        </div>
      `;
      modal.classList.add('active');
      return;
    }

    modalBody.innerHTML = `
      <div class="modal-trailer">
        <iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1"
        allow="autoplay; fullscreen" allowfullscreen></iframe>
      </div>
      <div class="modal-header">
        <h2>${currentHeroMovie.title || currentHeroMovie.name}</h2>
      </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error("Error loading trailer:", error);
    modalBody.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <p style="font-size: 1.2rem; color: var(--accent-color);">Failed to load trailer</p>
      </div>
    `;
    modal.classList.add('active');
  }
});


heroInfoBtn.addEventListener('click', async () => {
  if (!currentHeroMovie) return;

  const mediaType = currentHeroMovie.media_type || 
                    (currentHeroMovie.title ? 'movie' : 'tv');
  const mediaId = currentHeroMovie.id;

  try {
    const res = await fetch(`${BASE}/${mediaType}/${mediaId}?${API_KEY}`);
    const details = await res.json();
    
    const genres = details.genres?.map(g => g.name).join(', ') || 'N/A';
    const runtime = details.runtime 
      ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` 
      : details.episode_run_time?.[0] 
      ? `${details.episode_run_time[0]}m per episode`
      : 'N/A';
    const releaseDate = details.release_date || details.first_air_date || 'N/A';
    const status = details.status || 'N/A';
    const budget = details.budget 
      ? `${(details.budget / 1000000).toFixed(1)}M` 
      : 'N/A';
    const revenue = details.revenue 
      ? `${(details.revenue / 1000000).toFixed(1)}M` 
      : 'N/A';
    
    modalBody.innerHTML = `
      <div class="modal-info">
        <div class="modal-header">
          <h2>${details.title || details.name}</h2>
          <div class="modal-meta">
            <span>⭐ ${details.vote_average?.toFixed(1)}</span>
            <span>${releaseDate.split('-')[0]}</span>
            <span>${runtime}</span>
            <span>${details.vote_count} votes</span>
          </div>
        </div>
        
        <div class="modal-overview">
          ${details.overview || 'No overview available'}
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Genres</div>
            <div class="info-value">${genres}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">${status}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Release Date</div>
            <div class="info-value">${releaseDate}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Rating</div>
            <div class="info-value">⭐ ${details.vote_average?.toFixed(1)} / 10</div>
          </div>
          
          ${mediaType === 'movie' ? `
            <div class="info-item">
              <div class="info-label">Budget</div>
              <div class="info-value">${budget}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Revenue</div>
              <div class="info-value">${revenue}</div>
            </div>
          ` : `
            <div class="info-item">
              <div class="info-label">Seasons</div>
              <div class="info-value">${details.number_of_seasons || 'N/A'}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Episodes</div>
              <div class="info-value">${details.number_of_episodes || 'N/A'}</div>
            </div>
          `}
        </div>
      </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error("Error loading details:", error);
  }
});


modalClose.addEventListener('click', () => {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  modalBody.innerHTML = '';
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    modalBody.innerHTML = '';
  }
});