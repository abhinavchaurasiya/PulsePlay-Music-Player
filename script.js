const tracks = [
  {id:1,title:"Neon Horizon",artist:"Pulse Collective",genre:"Focus",duration:"4:12",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",cover:"c1"},
  {id:2,title:"Midnight Drive",artist:"Nova Lane",genre:"Chill",duration:"5:31",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",cover:"c2"},
  {id:3,title:"Golden Hour",artist:"The Skylines",genre:"Chill",duration:"4:46",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",cover:"c3"},
  {id:4,title:"Electric Pulse",artist:"Kinetic",genre:"Energy",duration:"5:18",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",cover:"c4"},
  {id:5,title:"Green Lights",artist:"Echo Bloom",genre:"Focus",duration:"4:09",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",cover:"c5"},
  {id:6,title:"Afterglow",artist:"Luna Echo",genre:"Energy",duration:"4:22",src:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",cover:"c6"}
];

const audio = document.querySelector("#audio");
const grid = document.querySelector("#trackGrid");
const empty = document.querySelector("#emptyState");
const search = document.querySelector("#searchInput");
const title = document.querySelector("#nowTitle");
const artist = document.querySelector("#nowArtist");
const playBtn = document.querySelector("#playBtn");
const seek = document.querySelector("#seekBar");
const currentTime = document.querySelector("#currentTime");
const duration = document.querySelector("#duration");
const volume = document.querySelector("#volumeBar");
const playerFav = document.querySelector("#playerFav");
const favCount = document.querySelector("#favCount");
const viewTitle = document.querySelector("#viewTitle");
const toast = document.querySelector("#toast");

let currentId = null;
let shuffle = false;
let repeat = false;
let view = "home";
let selectedPlaylist = null;
let favorites = JSON.parse(localStorage.getItem("pulseplay-favorites") || "[]");

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}
function saveFavorites() {
  localStorage.setItem("pulseplay-favorites", JSON.stringify(favorites));
  favCount.textContent = favorites.length;
}
function isFavorite(id) { return favorites.includes(id); }

function visibleTracks() {
  const query = search.value.trim().toLowerCase();
  let list = tracks.filter(t => !query || `${t.title} ${t.artist} ${t.genre}`.toLowerCase().includes(query));
  if (view === "favorites") list = list.filter(t => isFavorite(t.id));
  if (view === "queue") list = list.filter(t => t.id !== currentId);
  if (selectedPlaylist) list = list.filter(t => t.genre === selectedPlaylist);
  return list;
}

function renderTracks() {
  const list = visibleTracks();
  grid.innerHTML = "";
  empty.classList.toggle("hidden", list.length !== 0);
  list.forEach(track => {
    const card = document.createElement("article");
    card.className = "track-card";
    card.innerHTML = `
      <div class="cover ${track.cover}">
        <span class="cover-symbol">♫</span>
      </div>
      <div class="track-info">
        <div>
          <h3>${track.title}</h3>
          <p>${track.artist} · ${track.duration}</p>
        </div>
        <div class="track-actions">
          <button class="small-btn ${isFavorite(track.id) ? "active" : ""}" data-fav="${track.id}" aria-label="Favorite ${track.title}">${isFavorite(track.id) ? "♥" : "♡"}</button>
          <button class="play-card" data-play="${track.id}" aria-label="Play ${track.title}">▶</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}
grid.addEventListener("click", e => {
  const fav = e.target.closest("[data-fav]");
  const play = e.target.closest("[data-play]");
  if (fav) toggleFavorite(Number(fav.dataset.fav));
  if (play) loadTrack(Number(play.dataset.play), true);
});

function toggleFavorite(id) {
  favorites = isFavorite(id) ? favorites.filter(x => x !== id) : [...favorites, id];
  saveFavorites(); renderTracks(); updatePlayerFavorite();
}
function updatePlayerFavorite() {
  playerFav.classList.toggle("active", currentId !== null && isFavorite(currentId));
  playerFav.textContent = currentId !== null && isFavorite(currentId) ? "♥" : "♡";
}
playerFav.addEventListener("click", () => {
  if (currentId !== null) toggleFavorite(currentId);
});

function loadTrack(id, autoplay = false) {
  const track = tracks.find(t => t.id === id);
  if (!track) return;
  currentId = id;
  audio.src = track.src;
  audio.load();
  title.textContent = track.title;
  artist.textContent = track.artist;
  document.querySelector("#miniCover").className = `mini-cover ${track.cover}`;
  updatePlayerFavorite();
  if (autoplay) audio.play().catch(() => showToast("Press play to start audio."));
  renderTracks();
}
function currentIndex() { return tracks.findIndex(t => t.id === currentId); }
function nextTrack() {
  if (!tracks.length) return;
  if (shuffle) {
    const choices = tracks.filter(t => t.id !== currentId);
    loadTrack(choices[Math.floor(Math.random() * choices.length)]?.id ?? tracks[0].id, true);
    return;
  }
  let index = currentIndex() + 1;
  if (index >= tracks.length) index = 0;
  loadTrack(tracks[index].id, true);
}
function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  let index = currentIndex() - 1;
  if (index < 0) index = tracks.length - 1;
  loadTrack(tracks[index].id, true);
}

playBtn.addEventListener("click", () => {
  if (currentId === null) loadTrack(tracks[0].id, true);
  else if (audio.paused) audio.play().catch(() => showToast("Audio could not start. Check your internet connection."));
  else audio.pause();
});
document.querySelector("#nextBtn").addEventListener("click", nextTrack);
document.querySelector("#prevBtn").addEventListener("click", prevTrack);
document.querySelector("#shuffleBtn").addEventListener("click", e => {
  shuffle = !shuffle; e.currentTarget.classList.toggle("active", shuffle); showToast(shuffle ? "Shuffle on" : "Shuffle off");
});
document.querySelector("#repeatBtn").addEventListener("click", e => {
  repeat = !repeat; e.currentTarget.classList.toggle("active", repeat); showToast(repeat ? "Repeat on" : "Repeat off");
});
audio.addEventListener("play", () => playBtn.textContent = "Ⅱ");
audio.addEventListener("pause", () => playBtn.textContent = "▶");
audio.addEventListener("loadedmetadata", () => { duration.textContent = formatTime(audio.duration); });
audio.addEventListener("timeupdate", () => {
  currentTime.textContent = formatTime(audio.currentTime);
  seek.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
});
audio.addEventListener("ended", () => repeat ? (audio.currentTime = 0, audio.play()) : nextTrack());
audio.addEventListener("error", () => showToast("Audio source unavailable. Check your internet connection."));

seek.addEventListener("input", () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = (Number(seek.value) / 100) * audio.duration;
});
volume.addEventListener("input", () => audio.volume = Number(volume.value));
audio.volume = 0.8;

search.addEventListener("input", renderTracks);

document.querySelectorAll(".side-link").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".side-link").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    view = btn.dataset.view || "home";
    selectedPlaylist = btn.dataset.playlist || null;
    viewTitle.textContent = selectedPlaylist || (view === "favorites" ? "Your favorites" : view === "queue" ? "Up next" : "Featured tracks");
    renderTracks();
    document.querySelector("#sidebar").classList.remove("open");
  });
});

document.querySelector("#libraryBtn").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));

const themeBtn = document.querySelector("#themeBtn");
if (localStorage.getItem("pulseplay-theme") === "light") document.body.classList.add("light");
themeBtn.textContent = document.body.classList.contains("light") ? "☀" : "☾";
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
  const light = document.body.classList.contains("light");
  localStorage.setItem("pulseplay-theme", light ? "light" : "dark");
  themeBtn.textContent = light ? "☀" : "☾";
});

document.addEventListener("keydown", e => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (e.code === "Space") { e.preventDefault(); playBtn.click(); }
  if (e.code === "ArrowRight" && currentId !== null) audio.currentTime = Math.min((audio.currentTime || 0) + 5, audio.duration || Infinity);
  if (e.code === "ArrowLeft" && currentId !== null) audio.currentTime = Math.max((audio.currentTime || 0) - 5, 0);
  if (e.code === "ArrowUp") { e.preventDefault(); audio.volume = Math.min(audio.volume + .05, 1); volume.value = audio.volume; }
  if (e.code === "ArrowDown") { e.preventDefault(); audio.volume = Math.max(audio.volume - .05, 0); volume.value = audio.volume; }
  if (e.code === "KeyM") { audio.muted = !audio.muted; showToast(audio.muted ? "Muted" : "Unmuted"); }
});

saveFavorites();
renderTracks();
