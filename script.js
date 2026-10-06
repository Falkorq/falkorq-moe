/* ==========================================================================
   FALKORQ - REDESIGN (дизайн-система serophito)
   Интро-сборка имени, preloader, звёздный canvas, reveal по скроллу,
   glass-навигация, копирование с заливкой, stats.fm recent track,
   счётчик дней Yuna, ротация цитат, московские часы.
   ========================================================================== */

const SITE_CONFIG = {
  baseTitle: "falkor",
  hiddenTitle: "come back.",
  moscowTimeZone: "Europe/Moscow",
  yunaSince: "2025-06-01T00:00:00+03:00",
  statsFm: {
    username: "falkorq",
    profileUrl: "https://stats.fm/user/falkorq",
    pollMs: 300000,
  },
  currently: {
    watching: "Serial Experiments Lain",
    reading: "Independent translation work",
    listening: "Loading recent track",
  },
  footerQuotes: [
    { text: "No matter where you go, everyone's connected.", source: "Serial Experiments Lain" },
    { text: "The universe has a beginning, but no end.", source: "Steins;Gate" },
    { text: "Humans are so interesting.", source: "Death Note" },
    { text: "Present day. Present time.", source: "Serial Experiments Lain" },
  ],
  quotes: [
    { text: "No matter where you go, everyone's connected.", source: "Serial Experiments Lain" },
    { text: "The universe has a beginning, but no end.", source: "Steins;Gate" },
    { text: "Humans are so interesting.", source: "Death Note" },
  ],
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const elements = {
  body: document.body,
  preloader: document.getElementById("preloader"),
  heroName: document.getElementById("heroName"),
  navClock: document.getElementById("nav-clock"),
  npTrackName: document.getElementById("np-track-name"),
  scrollIndicator: document.querySelector(".scroll-indicator-wrapper"),
  yunaDays: document.getElementById("yuna-days"),
  nowPlayingTrack: document.getElementById("now-playing-track"),
  nowPlayingArtist: document.getElementById("now-playing-artist"),
  nowPlayingSource: document.getElementById("now-playing-source"),
  nowPlayingLink: document.getElementById("now-playing-link"),
  nowPlayingCover: document.getElementById("now-playing-cover"),
  nowPlayingCoverFallback: document.getElementById("now-playing-cover-fallback"),
  currentWatching: document.getElementById("current-watching"),
  currentReading: document.getElementById("current-reading"),
  currentListening: document.getElementById("current-listening"),
  quoteText: document.getElementById("quote-text"),
  quoteSource: document.getElementById("quote-source"),
  pageQuoteText: document.getElementById("page-quote-text"),
  pageQuoteSource: document.getElementById("page-quote-source"),
  flashToast: document.getElementById("flash-toast"),
};

const navSectionNodes = [...document.querySelectorAll("[data-nav]")];
const navLinkNodes = [...document.querySelectorAll(".nav-links .nav-link")];
const dockLinkNodes = [...document.querySelectorAll(".mobile-dock button")];

/* ==========================================================================
   1. PRELOADER + ИНТРО-СБОРКА ИМЕНИ
   ========================================================================== */

function splitHeroName() {
  const node = elements.heroName;
  if (!node || prefersReducedMotion) return;
  const text = node.textContent.trim();
  const frag = document.createDocumentFragment();
  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "hl";
    span.textContent = char;
    span.style.setProperty("--i", index);
    frag.appendChild(span);
  });
  node.textContent = "";
  node.appendChild(frag);
  node.classList.add("lettered");
}

function setupIntro() {
  splitHeroName();

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.setTimeout(() => {
      if (elements.preloader) elements.preloader.classList.add("fade");
      window.setTimeout(() => {
        elements.body.classList.remove("intro");
        if (elements.preloader) elements.preloader.style.display = "none";
      }, prefersReducedMotion ? 350 : 900);
    }, 260);
  };

  if (window.loadFired) {
    finish();
  } else {
    window.addEventListener("load", finish, { once: true });
  }
  // failsafe: даже если 'load' завис - мир проявляется
  window.setTimeout(finish, prefersReducedMotion ? 1200 : 5000);
  // второй failsafe (в <head>): через 15с .intro снимается в любом случае
}
window.loadFired = false;
window.addEventListener("load", () => { window.loadFired = true; }, { once: true });

/* ==========================================================================
   2. ЗВЁЗДНЫЙ CANVAS (ЧБ фон: мерцающие звёзды + медленный дрейф)
   ========================================================================== */

function setupCosmos() {
  const canvas = document.getElementById("cosmos-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let stars = [];
  let width = 0;
  let height = 0;

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(140, Math.floor((width * height) / 16000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.4 + Math.random() * 1.1,
      base: 0.10 + Math.random() * 0.38,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    for (const s of stars) {
      ctx.globalAlpha = s.base;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  resize();

  // Спокойное звёздное поле сохраняет фон без постоянного движения.
  draw();
  window.addEventListener("resize", () => {
    resize();
    draw();
  });
}

/* ==========================================================================
   5. НАВИГАЦИЯ: data-scroll, активная секция, индикатор скролла
   ========================================================================== */

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  history.replaceState(null, "", `#${id}`);
}

function setupScrollTriggers() {
  document.querySelectorAll("[data-scroll]").forEach((node) => {
    const id = node.getAttribute("data-scroll");
    node.addEventListener("click", () => scrollToSection(id));
    if (node.getAttribute("role") === "button") {
      node.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          scrollToSection(id);
        }
      });
    }
  });
}

function setupScrollIndicator() {
  const indicator = elements.scrollIndicator;
  if (!indicator) return;
  const update = () => indicator.classList.toggle("is-hidden", window.scrollY > 40);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function setupActiveSectionTracking() {
  let frame = 0;
  const update = () => {
    frame = 0;
    const mid = window.innerHeight / 2;
    let activeId = "hero";
    let best = Number.POSITIVE_INFINITY;
    for (const section of navSectionNodes) {
      const rect = section.getBoundingClientRect();
      if (rect.top > mid || rect.bottom < mid) continue;
      const distance = Math.abs(rect.top + rect.height / 2 - mid);
      if (distance < best) {
        best = distance;
        activeId = section.getAttribute("data-nav");
      }
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      activeId = navSectionNodes[navSectionNodes.length - 1]?.getAttribute("data-nav") || activeId;
    }
    navLinkNodes.forEach((l) => l.classList.toggle("active", l.getAttribute("data-scroll") === activeId));
    dockLinkNodes.forEach((l) => l.classList.toggle("active", l.getAttribute("data-scroll") === activeId));
  };
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}

/* ==========================================================================
   6. КЛИКАБЕЛЬНЫЕ КАРТОЧКИ (data-link)
   ========================================================================== */

function setupLinkCards() {
  document.querySelectorAll(".clickable-card[data-link]").forEach((card) => {
    const open = () => {
      window.open(card.getAttribute("data-link"), "_blank", "noreferrer");
    };
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "link");
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open();
    });
  });
  // кнопка внутри карточки: открывает сама, не плодя двойное окно
  document.querySelectorAll("div.card-action-btn[data-link]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.open(btn.getAttribute("data-link"), "_blank", "noreferrer");
    });
  });
}

/* ==========================================================================
   7. КОПИРОВАНИЕ: строки с заливкой + toast
   ========================================================================== */

let toastTimer;
function showToast(message) {
  if (!elements.flashToast) return;
  window.clearTimeout(toastTimer);
  elements.flashToast.textContent = message;
  elements.flashToast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.flashToast.classList.remove("is-visible"), 1200);
}

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    done(true);
  } catch {
    done(false);
  }
  ta.remove();
}

function copyText(value, done) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(() => done(true)).catch(() => fallbackCopy(value, done));
  } else {
    fallbackCopy(value, done);
  }
}

function setupCopyables() {
  document.querySelectorAll(".direct-item.copyable[data-copy], .link-row.copyable[data-copy]").forEach((item) => {
    let busy = false;
    const handle = () => {
      if (busy) return;
      busy = true;
      copyText(item.getAttribute("data-copy"), (ok) => {
        if (ok) {
          item.classList.add("copied"); // белая заливка + «Copied» по центру
          window.setTimeout(() => {
            item.classList.remove("copied"); // заливка плавно убирается
            busy = false;
          }, 1400);
        } else {
          showToast("copy failed");
          busy = false;
        }
      });
    };
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.addEventListener("click", handle);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handle();
      }
    });
  });
}

/* ==========================================================================
   8. RECENT TRACK - stats.fm
   ========================================================================== */

function setNowPlayingCover(imageUrl) {
  if (!elements.nowPlayingCover || !elements.nowPlayingCoverFallback) return;
  if (imageUrl) {
    elements.nowPlayingCover.src = imageUrl;
    elements.nowPlayingCover.hidden = false;
    elements.nowPlayingCoverFallback.hidden = true;
  } else {
    elements.nowPlayingCover.hidden = true;
    elements.nowPlayingCover.removeAttribute("src");
    elements.nowPlayingCoverFallback.hidden = false;
  }
}

const RECENT_TRACK_CACHE_KEY = "falkorq-recent-track-v1";

function formatPlayedAt(endTime) {
  const date = new Date(endTime);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function showRecentTrack(track, cached = false) {
  if (elements.nowPlayingTrack) elements.nowPlayingTrack.textContent = track.title;
  if (elements.nowPlayingArtist) elements.nowPlayingArtist.textContent = track.artist;
  const playedAt = formatPlayedAt(track.endTime);
  if (elements.nowPlayingSource) {
    elements.nowPlayingSource.textContent =
      `${cached ? "Saved from stats.fm" : "stats.fm"}${playedAt ? ` · ${playedAt}` : ""}`;
  }
  if (elements.nowPlayingLink) elements.nowPlayingLink.href = track.url;
  if (elements.currentListening) elements.currentListening.textContent = `${track.artist} · ${track.title}`;
  if (elements.npTrackName) elements.npTrackName.textContent = `♪ ${track.title}`;
  elements.npTrackName?.setAttribute("data-link", track.url);
  setNowPlayingCover(track.image);
}

function showRecentTrackUnavailable() {
  if (elements.nowPlayingTrack) elements.nowPlayingTrack.textContent = "recent track unavailable";
  if (elements.nowPlayingArtist) elements.nowPlayingArtist.textContent = "Check stats.fm";
  if (elements.nowPlayingSource) elements.nowPlayingSource.textContent = "Couldn't load listening data.";
  if (elements.nowPlayingLink) elements.nowPlayingLink.href = SITE_CONFIG.statsFm.profileUrl;
  if (elements.currentListening) elements.currentListening.textContent = "Listening data unavailable";
  if (elements.npTrackName) elements.npTrackName.textContent = "♪ recent track";
  elements.npTrackName?.setAttribute("data-link", SITE_CONFIG.statsFm.profileUrl);
  setNowPlayingCover("");
}

function readCachedRecentTrack() {
  try {
    const track = JSON.parse(window.localStorage.getItem(RECENT_TRACK_CACHE_KEY));
    return track?.title && track?.artist && track?.url ? track : null;
  } catch {
    return null;
  }
}

async function loadNowPlaying() {
  try {
    const { username, profileUrl } = SITE_CONFIG.statsFm;
    const url = `https://api.stats.fm/api/v1/users/${encodeURIComponent(username)}/streams/recent`;
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`stats.fm HTTP ${response.status}`);
    const payload = await response.json();
    const latest = payload?.items?.[0];
    const title = latest?.track?.name;
    const artist = latest?.track?.artists?.map((item) => item.name).filter(Boolean).join(", ");
    if (!title || !artist) throw new Error("No recent stats.fm track.");
    const spotifyId = latest.track.externalIds?.spotify?.find((id) => /^[a-zA-Z0-9]{22}$/.test(id));
    const track = {
      title,
      artist,
      image: latest.track.albums?.[0]?.image || "",
      url: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : profileUrl,
      endTime: latest.endTime || "",
    };
    showRecentTrack(track);
    try {
      window.localStorage.setItem(RECENT_TRACK_CACHE_KEY, JSON.stringify(track));
    } catch {
      // Private browsing can disable local storage.
    }
  } catch {
    const cached = readCachedRecentTrack();
    if (cached) showRecentTrack(cached, true);
    else showRecentTrackUnavailable();
  }
}

function startNowPlayingPolling() {
  const cached = readCachedRecentTrack();
  if (cached) showRecentTrack(cached, true);
  loadNowPlaying();
  window.setInterval(loadNowPlaying, SITE_CONFIG.statsFm.pollMs);
}

function setupNavTrackClick() {
  elements.npTrackName?.addEventListener("click", () => {
    const href = elements.npTrackName.getAttribute("data-link") || SITE_CONFIG.statsFm.profileUrl;
    window.open(href, "_blank", "noreferrer");
  });
}

/* ==========================================================================
   9. СЧЁТЧИК YUNA / CURRENTLY / ЦИТАТЫ / ЧАСЫ / TITLE
   ========================================================================== */

function updateYunaDays() {
  if (!elements.yunaDays) return;
  const since = new Date(SITE_CONFIG.yunaSince);
  const days = Math.max(0, Math.floor((Date.now() - since.getTime()) / 86400000));
  elements.yunaDays.textContent = String(days).padStart(3, "0");
}

function populateCurrently() {
  if (elements.currentWatching) elements.currentWatching.textContent = SITE_CONFIG.currently.watching;
  if (elements.currentReading) elements.currentReading.textContent = SITE_CONFIG.currently.reading;
  if (elements.currentListening) elements.currentListening.textContent = SITE_CONFIG.currently.listening;
}

function rotateQuote() {
  if (!elements.quoteText || !elements.quoteSource) return;
  const { quotes } = SITE_CONFIG;
  let current = 0;
  const apply = () => {
    const quote = quotes[current];
    elements.quoteText.textContent = quote.text;
    elements.quoteSource.textContent = quote.source;
    current = (current + 1) % quotes.length;
  };
  apply();
  window.setInterval(apply, 9000);
}

function renderFooterQuote() {
  if (!elements.pageQuoteText || !elements.pageQuoteSource) return;
  const quotes = SITE_CONFIG.footerQuotes;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  elements.pageQuoteText.textContent = quote.text;
  elements.pageQuoteSource.textContent = quote.source;
}

function startClock() {
  if (!elements.navClock) return;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: SITE_CONFIG.moscowTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const render = () => {
    elements.navClock.textContent = `MOW ${formatter.format(new Date())}`;
  };
  render();
  window.setInterval(render, 1000);
}

function updateTitleState() {
  document.title = document.hidden ? SITE_CONFIG.hiddenTitle : SITE_CONFIG.baseTitle;
}

/* ==========================================================================
   INIT
   ========================================================================== */

function init() {
  setupIntro();
  setupCosmos();
  setupScrollTriggers();
  setupScrollIndicator();
  setupActiveSectionTracking();
  setupLinkCards();
  setupCopyables();
  setupNavTrackClick();
  updateYunaDays();
  window.setInterval(updateYunaDays, 60000); // смена суток в 00:00 MOW - без перезагрузки
  populateCurrently();
  startNowPlayingPolling();
  rotateQuote();
  renderFooterQuote();
  startClock();
  updateTitleState();
  window.addEventListener("visibilitychange", () => {
    updateTitleState();
    if (document.visibilityState === "visible") updateYunaDays();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
