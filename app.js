// app.js

// 1. CONFIG: fill these with your project values
const SUPABASE_URL = "https://wdgiskawukblqgapkmig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KkcpYXwoOXi2XVv-UqIoiw_5G8q21CT";
const UPLOAD_COVER_FUNCTION_URL = "https://wdgiskawukblqgapkmig.supabase.co/functions/v1/upload-cover";
const DISCOGS_LOOKUP_FUNCTION_URL = "https://wdgiskawukblqgapkmig.supabase.co/functions/v1/discogs-lookup";
const RECOMMENDATIONS_FUNCTION_URL = "https://wdgiskawukblqgapkmig.supabase.co/functions/v1/get-recommendations";
const FEEDBACK_FUNCTION_URL = "https://wdgiskawukblqgapkmig.supabase.co/functions/v1/submit-feedback";

// ============================================================
// Starter Collection — curated records shown to new users
// ============================================================
// Cover art from Cover Art Archive via release-group MBIDs.
// Organised by genre so the grid feels balanced, not random.

const STARTER_RECORDS = [
  // Jazz
  { artist: "Miles Davis", album: "Kind of Blue", year: 1959, genre: "Jazz", cover: "https://coverartarchive.org/release-group/8e8a594f-2175-38c7-a871-abb68ec363e7/front-250" },
  { artist: "John Coltrane", album: "A Love Supreme", year: 1964, genre: "Jazz", cover: "https://coverartarchive.org/release-group/77cf47ba-58cd-3f3d-a5f9-79bf89860421/front-250" },
  { artist: "Dave Brubeck", album: "Time Out", year: 1959, genre: "Jazz", cover: "https://coverartarchive.org/release-group/f9b4e0d6-0c4e-3adb-a94a-c9e8e8f0b9f3/front-250" },
  { artist: "Art Blakey", album: "Moanin'", year: 1958, genre: "Jazz", cover: null },
  // Rock
  { artist: "Led Zeppelin", album: "Led Zeppelin IV", year: 1971, genre: "Rock", cover: "https://coverartarchive.org/release-group/2e61da88-39e9-3473-81d2-c964cb394952/front-250" },
  { artist: "Fleetwood Mac", album: "Rumours", year: 1977, genre: "Rock", cover: "https://coverartarchive.org/release-group/416bb5e5-c7d1-3977-8fd7-7c9daf6c2be6/front-250" },
  { artist: "The Beatles", album: "Abbey Road", year: 1969, genre: "Rock", cover: "https://coverartarchive.org/release-group/4162e65c-6a1b-3c5e-9b7b-d3e2c3b4e8f2/front-250" },
  { artist: "Pink Floyd", album: "The Dark Side of the Moon", year: 1973, genre: "Rock", cover: null },
  // Blues
  { artist: "Robert Johnson", album: "King of the Delta Blues Singers", year: 1961, genre: "Blues", cover: null },
  { artist: "Muddy Waters", album: "Hard Again", year: 1977, genre: "Blues", cover: null },
  // Soul / R&B
  { artist: "Marvin Gaye", album: "What's Going On", year: 1971, genre: "Soul", cover: "https://coverartarchive.org/release-group/d6f9c677-3c89-3a51-a924-d3e2a4b5c7f1/front-250" },
  { artist: "Stevie Wonder", album: "Songs in the Key of Life", year: 1976, genre: "Soul", cover: null },
  { artist: "Aretha Franklin", album: "I Never Loved a Man the Way I Love You", year: 1967, genre: "Soul", cover: null },
  // Classical
  { artist: "Glenn Gould", album: "Goldberg Variations", year: 1955, genre: "Classical", cover: null },
  // Electronic / Experimental
  { artist: "Kraftwerk", album: "Autobahn", year: 1974, genre: "Electronic", cover: null },
  { artist: "Brian Eno", album: "Ambient 1: Music for Airports", year: 1978, genre: "Ambient", cover: null },
  // Latin
  { artist: "João Gilberto", album: "Getz/Gilberto", year: 1964, genre: "Bossa Nova", cover: null },
  // Reggae
  { artist: "Bob Marley", album: "Catch a Fire", year: 1973, genre: "Reggae", cover: null },
  // Country / Folk
  { artist: "Johnny Cash", album: "At Folsom Prison", year: 1968, genre: "Country", cover: null },
  { artist: "Joni Mitchell", album: "Blue", year: 1971, genre: "Folk", cover: null },
];

async function renderStarterCollection() {
  const grid = document.getElementById("starterCollectionGrid");
  if (!grid) return;

  // Group by genre
  const byGenre = {};
  STARTER_RECORDS.forEach((r) => {
    if (!byGenre[r.genre]) byGenre[r.genre] = [];
    byGenre[r.genre].push(r);
  });

  STARTER_RECORDS.forEach((record) => {
    const card = document.createElement("div");
    card.className = "starter-card";

    const cover = document.createElement("div");
    cover.className = "starter-card-cover";

    if (record.cover) {
      const img = document.createElement("img");
      img.src = record.cover;
      img.alt = record.album;
      img.loading = "lazy";
      img.onerror = () => {
        img.remove();
        cover.innerHTML = '<i class="ti ti-vinyl" aria-hidden="true"></i>';
      };
      cover.appendChild(img);
    } else {
      cover.innerHTML = '<i class="ti ti-vinyl" aria-hidden="true"></i>';
    }

    const info = document.createElement("div");
    info.className = "starter-card-info";

    const albumEl = document.createElement("p");
    albumEl.className = "starter-card-album";
    albumEl.textContent = record.album;

    const artistEl = document.createElement("p");
    artistEl.className = "starter-card-artist";
    artistEl.textContent = record.artist;

    const genrePill = document.createElement("span");
    genrePill.className = "starter-card-genre";
    genrePill.textContent = record.genre;

    info.appendChild(albumEl);
    info.appendChild(artistEl);
    info.appendChild(genrePill);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "starter-card-btn";
    addBtn.innerHTML = '<i class="ti ti-heart" aria-hidden="true"></i>';
    addBtn.setAttribute("aria-label", `Add ${record.album} to wishlist`);
    addBtn.setAttribute("title", "Add to wishlist");

    addBtn.addEventListener("click", async () => {
      if (addBtn.dataset.added) return;
      addBtn.disabled = true;
      addBtn.innerHTML = '<i class="ti ti-loader" aria-hidden="true"></i>';
      try {
        const { error } = await supabaseClient.from("wishlist").insert({
          user_id: currentUser.id,
          artist: record.artist,
          album: record.album,
          year: record.year,
          cover_url: record.cover || null,
        });
        if (error) throw error;
        addBtn.dataset.added = "1";
        addBtn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i>';
        addBtn.classList.add("starter-card-btn-added");
        card.classList.add("starter-card-added");
        await loadData();
      } catch (err) {
        console.error(err);
        addBtn.disabled = false;
        addBtn.innerHTML = '<i class="ti ti-heart" aria-hidden="true"></i>';
      }
    });

    card.appendChild(cover);
    card.appendChild(info);
    card.appendChild(addBtn);
    grid.appendChild(card);
  });
}

// 2. Create Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. State
let allRecords = [];
let wishlist = [];
let genres = [];
let subgenres = [];
let currentPage = "home"; // "home" | "collection" | "wishlist"
let pendingWishlistCoverUrl = null;
let pendingWishlistDiscogsId = null;
let artistFilter = null;
let yearFilter = null; // { start, end }
let genreChart = null;
let artistChart = null;
let decadeChart = null;
let importRawRows = [];
let importParsedRows = [];

const IMPORT_COLUMN_ALIASES = {
  // Discogs CSV exports use: Catalog#, Artist, Title, Label, Format,
  // Rating, Released, release_id, CollectionFolder, Date Added, styles
  artist:      ["artist", "Artist"],
  album:       ["album", "title", "Title", "Release Title"],
  year:        ["year", "Year", "released", "Released", "year released"],
  label:       ["label", "Label", "record label"],
  genre:       ["genre", "Genre", "genres", "Genres"],
  subgenre:    ["subgenre", "subgenres", "style", "styles", "Styles", "Style"],
  description: ["description", "Description", "notes", "Notes", "comments", "Comments"],
  vinylGrade:  ["vinylgrade", "mediagrade", "vinyl", "Media Condition", "media condition"],
  sleeveGrade: ["sleevegrade", "jacketgrade", "covergrade", "sleeve", "Sleeve Condition", "sleeve condition"],
  quantity:    ["quantity", "qty", "Quantity"],
  catalogNum:  ["catalog#", "Catalog#", "catno", "CatNo", "catalog number"],
  releaseId:   ["release_id", "Release ID", "Discogs ID", "discogs_id"],
  folder:      ["CollectionFolder", "Folder", "folder"],
  dateAdded:   ["Date Added", "date_added", "added"],
};

const RATING_OPTIONS = [
  { value: "love", label: "Love" },
  { value: "like", label: "Like" },
  { value: "neutral", label: "Neutral" },
  { value: "dislike", label: "Dislike" },
];

// 4. Helpers
function setStatus(msg) {
  document.getElementById("statusMessage").textContent = msg;
}

function normalizeGenre(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (trimmed.toUpperCase() === "R&B" || trimmed.toUpperCase() === "RB") {
    return "R&B";
  }
  return trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseYearInput(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.trunc(n);
}

function genreNameById(id) {
  if (!id) return "";
  return genres.find((g) => g.id === id)?.name ?? "";
}

function subgenreNameById(id) {
  if (!id) return "";
  return subgenres.find((sg) => sg.id === id)?.name ?? "";
}

function normalizeHeader(h) {
  return String(h).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumnKey(rowKeys, aliasList) {
  for (const key of rowKeys) {
    if (aliasList.includes(normalizeHeader(key))) return key;
  }
  return null;
}

function parseYearFlexible(value) {
  if (value === null || value === undefined || value === "") {
    return { year: null, yearRaw: null };
  }
  if (typeof value === "number") {
    return { year: Math.trunc(value), yearRaw: String(value) };
  }
  const str = String(value).trim();
  if (!str) return { year: null, yearRaw: null };
  const match = str.match(/\b(\d{4})\b/);
  if (match) {
    return { year: parseInt(match[1], 10), yearRaw: str };
  }
  return { year: null, yearRaw: str };
}


function renderFilters() {
  const genreSelect = document.getElementById("genreFilter");
  const wishlistGenreSelect = document.getElementById("wishlistGenreFilter");

  // Collection genre filter
  genreSelect.length = 1;
  genres.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    genreSelect.appendChild(opt);
  });

  // Wishlist genre filter — same options, separate element
  if (wishlistGenreSelect) {
    wishlistGenreSelect.length = 1;
    genres.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name;
      wishlistGenreSelect.appendChild(opt);
    });
  }

  populateSubgenreFilterOptions();
  populateWishlistSubgenreOptions();

  // Populate datalists for the Add Record form
  const genreOptions = document.getElementById("genreOptions");
  const subgenreOptions = document.getElementById("subgenreOptions");
  genreOptions.innerHTML = "";
  subgenreOptions.innerHTML = "";

  genres.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.name;
    genreOptions.appendChild(opt);
  });

  populateSubgenreOptionsForGenre(null);
}

function populateWishlistSubgenreOptions() {
  const genreSelect = document.getElementById("wishlistGenreFilter");
  const subgenreSelect = document.getElementById("wishlistSubgenreFilter");
  if (!genreSelect || !subgenreSelect) return;

  const selectedGenreId = genreSelect.value ? Number(genreSelect.value) : null;
  const previousValue = subgenreSelect.value;

  subgenreSelect.length = 1;

  const relevant = selectedGenreId
    ? subgenres.filter((sg) => sg.genre_id === selectedGenreId)
    : subgenres;

  relevant.forEach((sg) => {
    const opt = document.createElement("option");
    opt.value = sg.id;
    opt.textContent = sg.name;
    subgenreSelect.appendChild(opt);
  });

  if (relevant.some((sg) => String(sg.id) === previousValue)) {
    subgenreSelect.value = previousValue;
  } else {
    subgenreSelect.value = "";
  }
}

function populateSubgenreOptionsForGenre(genreInputValue) {
  const subgenreOptions = document.getElementById("subgenreOptions");
  subgenreOptions.innerHTML = "";

  const matchedGenre = genreInputValue
    ? genres.find((g) => g.name.toLowerCase() === genreInputValue.trim().toLowerCase())
    : null;

  const relevant = matchedGenre
    ? subgenres.filter((sg) => sg.genre_id === matchedGenre.id)
    : subgenres;

  relevant.forEach((sg) => {
    const opt = document.createElement("option");
    opt.value = sg.name;
    subgenreOptions.appendChild(opt);
  });
}

function populateSubgenreFilterOptions() {
  const genreSelect = document.getElementById("genreFilter");
  const subgenreSelect = document.getElementById("subgenreFilter");

  const selectedGenreId = genreSelect.value ? Number(genreSelect.value) : null;
  const previousValue = subgenreSelect.value;

  subgenreSelect.length = 1;

  const relevant = selectedGenreId
    ? subgenres.filter((sg) => sg.genre_id === selectedGenreId)
    : subgenres;

  relevant.forEach((sg) => {
    const opt = document.createElement("option");
    opt.value = sg.id;
    opt.textContent = sg.name;
    subgenreSelect.appendChild(opt);
  });

  if (relevant.some((sg) => String(sg.id) === previousValue)) {
    subgenreSelect.value = previousValue;
  } else {
    subgenreSelect.value = "";
  }
}

function sortItems(items, sortValue, isWishlist) {
  const sorted = items.slice();

  const cmpText = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" });
  const cmpYear = (a, b) => {
    if (a.year === null || a.year === undefined) return 1;
    if (b.year === null || b.year === undefined) return -1;
    return a.year - b.year;
  };
  const cmpAdded = (a, b) => {
    if (isWishlist) {
      return new Date(a.added_at).getTime() - new Date(b.added_at).getTime();
    }
    return (a.id ?? 0) - (b.id ?? 0);
  };

  switch (sortValue) {
    case "artist-desc":
      sorted.sort((a, b) => cmpText(b.artist, a.artist) || cmpText(a.album, b.album));
      break;
    case "album-asc":
      sorted.sort((a, b) => cmpText(a.album, b.album) || cmpText(a.artist, b.artist));
      break;
    case "album-desc":
      sorted.sort((a, b) => cmpText(b.album, a.album) || cmpText(a.artist, b.artist));
      break;
    case "year-asc":
      sorted.sort((a, b) => cmpYear(a, b) || cmpText(a.artist, b.artist));
      break;
    case "year-desc":
      sorted.sort((a, b) => cmpYear(b, a) || cmpText(a.artist, b.artist));
      break;
    case "added-desc":
      sorted.sort((a, b) => cmpAdded(b, a));
      break;
    case "added-asc":
      sorted.sort((a, b) => cmpAdded(a, b));
      break;
    case "artist-asc":
    default:
      sorted.sort((a, b) => cmpText(a.artist, b.artist) || cmpText(a.album, b.album));
      break;
  }

  return sorted;
}

function getFilteredRecords() {
  const searchText = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const genreFilterVal = document.getElementById("genreFilter").value;
  const subgenreFilterVal = document.getElementById("subgenreFilter").value;
  const ratingFilterVal = document.getElementById("ratingFilter").value;

  let filtered = allRecords.slice();

  if (searchText) {
    filtered = filtered.filter((r) => {
      return (
        r.artist.toLowerCase().includes(searchText) ||
        r.album.toLowerCase().includes(searchText)
      );
    });
  }

  if (genreFilterVal) {
    filtered = filtered.filter((r) => r.genre_id === Number(genreFilterVal));
  }

  if (subgenreFilterVal) {
    filtered = filtered.filter(
      (r) => r.subgenre_id === Number(subgenreFilterVal)
    );
  }

  if (ratingFilterVal) {
    if (ratingFilterVal === "unrated") {
      filtered = filtered.filter((r) => !r.rating);
    } else {
      filtered = filtered.filter((r) => r.rating === ratingFilterVal);
    }
  }

  if (artistFilter) {
    filtered = filtered.filter((r) => r.artist === artistFilter);
    filtered.sort((a, b) => {
      if (a.year === null && b.year === null) return 0;
      if (a.year === null) return 1;
      if (b.year === null) return -1;
      return a.year - b.year;
    });
  }

  if (yearFilter) {
    filtered = filtered.filter(
      (r) => r.year && r.year >= yearFilter.start && r.year <= yearFilter.end
    );
  }

  if (!artistFilter) {
    const sortVal = document.getElementById("sortSelect").value;
    filtered = sortItems(filtered, sortVal, false);
  }

  return filtered;
}

function getFilteredWishlist() {
  const searchText = (document.getElementById("wishlistSearchInput")?.value || "").trim().toLowerCase();
  const genreFilterVal = document.getElementById("wishlistGenreFilter")?.value || "";
  const subgenreFilterVal = document.getElementById("wishlistSubgenreFilter")?.value || "";

  let filtered = wishlist.slice();

  if (searchText) {
    filtered = filtered.filter((w) => {
      return (
        w.artist.toLowerCase().includes(searchText) ||
        w.album.toLowerCase().includes(searchText)
      );
    });
  }

  if (genreFilterVal) {
    filtered = filtered.filter((w) => w.genre_id === Number(genreFilterVal));
  }

  if (subgenreFilterVal) {
    filtered = filtered.filter(
      (w) => w.subgenre_id === Number(subgenreFilterVal)
    );
  }

  // Wishlist sort is driven by its own dropdown.
  const sortVal = document.getElementById("wishlistSortSelect")?.value || "added-desc";
  filtered = sortItems(filtered, sortVal, true);

  return filtered;
}

function renderCards(filtered) {
  const grid = document.getElementById("cardGrid");
  grid.innerHTML = "";

  if (filtered.length === 0) {
    // If there are no records at all (not just filtered out), show a
    // prominent import CTA rather than a generic empty hint.
    if (allRecords.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "collection-empty-state";

      emptyState.innerHTML = `
        <div class="collection-empty-icon">
          <i class="ti ti-vinyl" aria-hidden="true"></i>
        </div>
        <h3 class="collection-empty-title">Your collection is waiting</h3>
        <p class="collection-empty-desc">Import your Discogs collection in seconds, or start adding records one by one.</p>
        <div class="collection-empty-actions">
          <button type="button" id="emptyStateImportBtn" class="btn-primary collection-empty-btn">
            <i class="ti ti-brand-discogs" aria-hidden="true"></i>
            Import from Discogs
          </button>
          <button type="button" id="emptyStateAddBtn" class="btn-secondary collection-empty-btn">
            <i class="ti ti-plus" aria-hidden="true"></i>
            Add a record
          </button>
        </div>
        <p class="collection-empty-hint">Already on Discogs? Export your collection as a CSV and import it here — it takes about 60 seconds.</p>
        <div class="starter-collection">
          <div class="starter-collection-header">
            <h4 class="starter-collection-title">Or seed your wishlist with some classics</h4>
            <p class="starter-collection-desc">Tap any album to add it to your wishlist — a great way to start building your taste profile.</p>
          </div>
          <div class="starter-collection-grid" id="starterCollectionGrid"></div>
        </div>
      `;

      setTimeout(() => {
        document.getElementById("emptyStateImportBtn")?.addEventListener("click", () => openImportModal());
        document.getElementById("emptyStateAddBtn")?.addEventListener("click", () => openAddRecordModal());
        renderStarterCollection();
      }, 0);

      grid.appendChild(emptyState);
    } else {
      const empty = document.createElement("p");
      empty.className = "field-hint";
      empty.textContent = "No records match your current filters.";
      grid.appendChild(empty);
    }
    return;
  }

  filtered.forEach((r) => {
    const card = document.createElement("div");
    card.className = "record-card";

    // Cover wrap (image or placeholder, with vinyl disc peeking behind)
    const coverWrap = document.createElement("div");
    coverWrap.className = "cover-wrap";

    const disc = document.createElement("div");
    disc.className = "vinyl-disc";
    coverWrap.appendChild(disc);

    if (r.cover_url) {
      const img = document.createElement("img");
      img.className = "cover-img";
      img.src = r.cover_url;
      img.alt = `${r.album} cover`;
      img.loading = "lazy";
      coverWrap.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "cover-img cover-placeholder";
      const placeholderImg = document.createElement("img");
      placeholderImg.src = "icon-512.png";
      placeholderImg.alt = "";
      placeholderImg.loading = "lazy";
      placeholder.appendChild(placeholderImg);
      coverWrap.appendChild(placeholder);
    }

    card.appendChild(coverWrap);

    // Favorite buttons (album + artist)
    const favWrap = document.createElement("div");
    favWrap.className = "favorite-controls";

    const albumFav = parseFavoriteFlags(r);

    const albumFavBtn = document.createElement("button");
    albumFavBtn.type = "button";
    albumFavBtn.className = "favorite-btn favorite-album-btn";
    albumFavBtn.innerHTML = '<i class="ti ti-star" aria-hidden="true"></i>';
    albumFavBtn.title = albumFav.isAlbumFavorite ? "Remove album from favorites" : "Favorite this album";
    albumFavBtn.setAttribute("aria-pressed", String(albumFav.isAlbumFavorite));
    albumFavBtn.classList.toggle("active", albumFav.isAlbumFavorite);
    albumFavBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite("favorite_albums", r.album, albumFavBtn, { cover_url: r.cover_url, artist: r.artist });
    });

    const artistFavBtn = document.createElement("button");
    artistFavBtn.type = "button";
    artistFavBtn.className = "favorite-btn favorite-artist-btn";
    artistFavBtn.innerHTML = '<i class="ti ti-user-star" aria-hidden="true"></i>';
    artistFavBtn.title = albumFav.isArtistFavorite
      ? `Remove ${r.artist} from favorite artists`
      : `Favorite ${r.artist}`;
    artistFavBtn.setAttribute("aria-pressed", String(albumFav.isArtistFavorite));
    artistFavBtn.classList.toggle("active", albumFav.isArtistFavorite);
    artistFavBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite("favorite_artists", r.artist, artistFavBtn);
    });

    favWrap.appendChild(albumFavBtn);
    favWrap.appendChild(artistFavBtn);
    coverWrap.appendChild(favWrap);

    // Info block
    const info = document.createElement("div");
    info.className = "record-info";

    const artistEl = document.createElement("div");
    artistEl.className = "record-artist";
    artistEl.textContent = r.artist;

    const albumEl = document.createElement("div");
    albumEl.className = "record-album";
    albumEl.textContent = r.album;

    const metaEl = document.createElement("div");
    metaEl.className = "record-meta";
    const metaParts = [];
    if (r.year) metaParts.push(r.year);
    if (r.genre_name) metaParts.push(r.genre_name);
    if (r.subgenre_name) metaParts.push(r.subgenre_name);
    metaEl.textContent = metaParts.join(" · ");

    info.appendChild(artistEl);
    info.appendChild(albumEl);
    if (metaParts.length) info.appendChild(metaEl);
    info.appendChild(buildRatingControls(r));

    card.appendChild(info);
    card.addEventListener("click", () => openRecordDetailModal(r.id));
    grid.appendChild(card);
  });
}

// ------------ Home ------------

let spotlightRecordId = null;

function buildCoverFigure(coverUrl, alt, wrapClassName) {
  const wrap = document.createElement("div");
  wrap.className = wrapClassName;

  if (coverUrl) {
    const img = document.createElement("img");
    img.src = coverUrl;
    img.alt = alt;
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    wrap.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "cover-placeholder";
    placeholder.style.width = "100%";
    placeholder.style.height = "100%";
    const placeholderImg = document.createElement("img");
    placeholderImg.src = "icon-512.png";
    placeholderImg.alt = "";
    placeholder.appendChild(placeholderImg);
    wrap.appendChild(placeholder);
  }

  return wrap;
}

function buildMiniCover(coverUrl, alt) {
  return buildCoverFigure(coverUrl, alt, "mini-cover-wrap");
}

function renderStats() {
  document.getElementById("statTotalRecords").textContent = allRecords.length;

  const genreNames = new Set(allRecords.map((r) => r.genre_name).filter(Boolean));
  document.getElementById("statTotalGenres").textContent = genreNames.size;

  const years = allRecords.map((r) => r.year).filter((y) => !!y);
  if (years.length > 0) {
    const minDecade = Math.floor(Math.min(...years) / 10) * 10;
    const maxDecade = Math.floor(Math.max(...years) / 10) * 10;
    if (minDecade === maxDecade) {
      document.getElementById("statDecadeSpan").textContent = `${minDecade}s`;
    } else {
      document.getElementById("statDecadeSpan").textContent = `${minDecade}s\u2013${maxDecade}s`;
    }
  } else {
    document.getElementById("statDecadeSpan").textContent = "\u2014";
  }

  document.getElementById("statWishlistCount").textContent = wishlist.length;
}

function getSpotlightPool() {
  const eligible = allRecords.filter((r) => r.rating !== "dislike");
  return eligible.length > 0 ? eligible : allRecords;
}

function formatAcquiredDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function buildSpotlightStoryPanel(record) {
  const panel = document.createElement("div");
  panel.className = "spotlight-story-panel";

  const hasStory =
    record.acquired_date || record.acquired_location || record.listening_notes || record.personal_story;

  const heading = document.createElement("div");
  heading.className = "spotlight-story-heading";
  heading.textContent = "Your Story";
  panel.appendChild(heading);

  if (!hasStory) {
    const empty = document.createElement("p");
    empty.className = "spotlight-story-empty";
    empty.textContent = "You haven't added a story for this one yet — when did you get it, and what does it mean to you?";
    panel.appendChild(empty);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-secondary";
    addBtn.textContent = "Add your story";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRecordDetailModal(record.id, "story");
    });
    panel.appendChild(addBtn);

    return panel;
  }

  const acquiredLine = [];
  const formattedDate = formatAcquiredDate(record.acquired_date);
  if (formattedDate) acquiredLine.push(formattedDate);
  if (record.acquired_location) acquiredLine.push(record.acquired_location);

  if (acquiredLine.length) {
    const acquiredEl = document.createElement("p");
    acquiredEl.className = "spotlight-story-acquired";
    acquiredEl.textContent = `Acquired ${acquiredLine.join(" — ")}`;
    panel.appendChild(acquiredEl);
  }

  if (record.personal_story) {
    const storyEl = document.createElement("p");
    storyEl.className = "spotlight-story-text";
    storyEl.textContent = record.personal_story;
    panel.appendChild(storyEl);
  }

  if (record.listening_notes) {
    const notesLabel = document.createElement("p");
    notesLabel.className = "spotlight-story-subheading";
    notesLabel.textContent = "Listening notes";
    panel.appendChild(notesLabel);

    const notesEl = document.createElement("p");
    notesEl.className = "spotlight-story-text";
    notesEl.textContent = record.listening_notes;
    panel.appendChild(notesEl);
  }

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn-secondary spotlight-story-edit-btn";
  editBtn.textContent = "Edit your story";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openRecordDetailModal(record.id, "story");
  });
  panel.appendChild(editBtn);

  return panel;
}

function renderSpotlight() {
  const content = document.getElementById("spotlightContent");
  const songWrap = document.getElementById("spotlightSongWrap");
  const wikiWrap = document.getElementById("spotlightWikiWrap");
  const artistWikiWrap = document.getElementById("spotlightArtistWikiWrap");
  const labelWikiWrap = document.getElementById("spotlightLabelWikiWrap");
  const descriptionWrap = document.getElementById("spotlightDescriptionWrap");
  const moreLikeThisWrap = document.getElementById("spotlightMoreLikeThisWrap");
  const moreLikeThisResults = document.getElementById("spotlightMoreLikeThisResults");
  content.innerHTML = "";
  songWrap.innerHTML = "";
  wikiWrap.innerHTML = "";
  artistWikiWrap.innerHTML = "";
  labelWikiWrap.innerHTML = "";
  descriptionWrap.innerHTML = "";
  moreLikeThisWrap.innerHTML = "";
  moreLikeThisResults.innerHTML = "";

  if (allRecords.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "Add some records to see a spotlight here.";
    content.appendChild(empty);
    return;
  }

  const pool = getSpotlightPool();

  if (spotlightRecordId === null || !pool.some((r) => r.id === spotlightRecordId)) {
    spotlightRecordId = pool[Math.floor(Math.random() * pool.length)].id;
  }

  const record = pool.find((r) => r.id === spotlightRecordId);

  const coverWrap = buildCoverFigure(record.cover_url, `${record.album} cover`, "spotlight-cover-wrap");

  const info = document.createElement("div");
  info.className = "spotlight-info";

  const artistEl = document.createElement("div");
  artistEl.className = "spotlight-artist";
  artistEl.textContent = record.artist;

  const albumEl = document.createElement("div");
  albumEl.className = "spotlight-album";
  albumEl.textContent = record.album;

  const metaEl = document.createElement("div");
  metaEl.className = "spotlight-meta";
  const metaParts = [];
  if (record.year) metaParts.push(record.year);
  if (record.genre_name) metaParts.push(record.genre_name);
  if (record.subgenre_name) metaParts.push(record.subgenre_name);
  metaEl.textContent = metaParts.join(" · ");

  info.appendChild(artistEl);
  info.appendChild(albumEl);
  if (metaParts.length) info.appendChild(metaEl);

  if (record.label) {
    const labelEl = document.createElement("div");
    labelEl.className = "spotlight-label";
    labelEl.textContent = `Label: ${record.label}`;
    info.appendChild(labelEl);
  }

  info.appendChild(buildRatingControls(record));

  const storyPanel = buildSpotlightStoryPanel(record);

  content.appendChild(coverWrap);
  content.appendChild(info);
  content.appendChild(storyPanel);
  content.style.cursor = "pointer";
  content.onclick = (e) => {
    if (e.target.closest("a, button")) return;
    openRecordDetailModal(record.id);
  };

  const findSongBtn = document.createElement("button");
  findSongBtn.type = "button";
  findSongBtn.className = "btn-secondary";
  findSongBtn.textContent = "Find a notable track";
  findSongBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    findSpotlightSong(record, songWrap, findSongBtn);
  });
  songWrap.appendChild(findSongBtn);

  const wikiBtn = document.createElement("button");
  wikiBtn.type = "button";
  wikiBtn.className = "btn-secondary";
  wikiBtn.textContent = "Grab description from Wikipedia";
  wikiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    grabSpotlightDescription(record, wikiWrap, wikiBtn);
  });
  wikiWrap.appendChild(wikiBtn);

  const artistWikiBtn = document.createElement("button");
  artistWikiBtn.type = "button";
  artistWikiBtn.className = "btn-secondary";
  artistWikiBtn.textContent = `Learn more about ${record.artist}`;
  artistWikiBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    findEntityWiki({
      query: `${record.artist} musician band`,
      wrap: artistWikiWrap,
      btn: artistWikiBtn,
      idleLabel: `Learn more about ${record.artist}`,
      primaryTerm: record.artist,
    });
  });
  artistWikiWrap.appendChild(artistWikiBtn);

  if (record.label) {
    const labelWikiBtn = document.createElement("button");
    labelWikiBtn.type = "button";
    labelWikiBtn.className = "btn-secondary";
    labelWikiBtn.textContent = `Learn more about ${record.label}`;
    labelWikiBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      findEntityWiki({
        query: `${record.label} record label`,
        wrap: labelWikiWrap,
        btn: labelWikiBtn,
        idleLabel: `Learn more about ${record.label}`,
        primaryTerm: record.label,
      });
    });
    labelWikiWrap.appendChild(labelWikiBtn);
  }

  const moreLikeThisBtn = document.createElement("button");
  moreLikeThisBtn.type = "button";
  moreLikeThisBtn.className = "btn-secondary";
  moreLikeThisBtn.textContent = "More like this";
  moreLikeThisBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    loadMoreLikeThis(record, moreLikeThisResults, moreLikeThisBtn);
  });
  moreLikeThisWrap.appendChild(moreLikeThisBtn);

  if (record.description) {
    descriptionWrap.appendChild(buildDescriptionDisplay(record.description));
  }
}

function buildDescriptionDisplay(description) {
  const descEl = document.createElement("div");
  descEl.className = "spotlight-description";

  const sourceLineMatch = description.match(/\n\nFull article: (.+) — (https?:\/\/\S+)\s*$/);

  if (!sourceLineMatch) {
    descEl.textContent = description;
    return descEl;
  }

  const mainText = description.slice(0, sourceLineMatch.index);
  const [, title, url] = sourceLineMatch;

  const textNode = document.createElement("span");
  textNode.textContent = mainText;
  descEl.appendChild(textNode);

  const sourcePara = document.createElement("p");
  sourcePara.className = "spotlight-description-source";

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = `Full article: ${title} ↗`;
  link.addEventListener("click", (e) => e.stopPropagation());

  sourcePara.appendChild(link);
  descEl.appendChild(sourcePara);

  return descEl;
}

async function fetchNotableSong(artist, album) {
  const response = await fetch(RECOMMENDATIONS_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ mode: "song", artist, album }),
  });

  const result = await response.json();
  console.log("Notable song lookup debug:", result);

  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }

  if (!result.song) {
    throw new Error("No song returned");
  }

  return result.song;
}

function buildSongLink(artist, song, className = "spotlight-song-link") {
  const link = document.createElement("a");
  link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${song} official`)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = className;
  link.textContent = `\u25B6 "${song}" on YouTube`;
  link.addEventListener("click", (e) => e.stopPropagation());
  return link;
}

async function findSpotlightSong(record, wrap, btn) {
  btn.disabled = true;
  btn.textContent = "Looking up...";

  try {
    const song = await fetchNotableSong(record.artist, record.album);
    wrap.innerHTML = "";
    wrap.appendChild(buildSongLink(record.artist, song));
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Find a notable track";
    const errEl = document.createElement("p");
    errEl.className = "spotlight-error";
    errEl.textContent = `Couldn't find a track suggestion (${err.message || err}).`;
    wrap.appendChild(errEl);
  }
}

function wikiTitleMatchScore(title, primaryTerm) {
  const normTitle = title.toLowerCase().replace(/\s*\(.*?\)\s*/g, " ").trim();
  const normTerm = (primaryTerm || "").toLowerCase().trim();
  if (!normTerm) return 0;
  if (normTitle === normTerm) return 2;
  if (normTitle.startsWith(normTerm) || normTerm.startsWith(normTitle)) return 1;
  return 0;
}

// Strips wiki markup/HTML the search API sometimes leaves in snippets
// (e.g. <span class="searchmatch">Taj</span>) so plain substring checks work.
function stripWikiSnippetMarkup(snippet) {
  return (snippet || "").replace(/<[^>]+>/g, "");
}

// True if the artist's name plausibly shows up in the result's title or
// search snippet - a cheap signal that this article is actually about (or
// at least mentions) the right person/group, not just a same-named subject.
function wikiResultMentionsArtist(result, artistName) {
  if (!artistName) return true; // nothing to check against
  const normArtist = artistName.toLowerCase().trim();
  if (!normArtist) return true;

  const haystack = `${result.title} ${stripWikiSnippetMarkup(result.snippet)}`.toLowerCase();
  return haystack.includes(normArtist);
}

async function wikiSearch(query, limit = 5) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=${limit}`;
  const searchResp = await fetch(searchUrl);
  if (!searchResp.ok) throw new Error(`Wikipedia search failed (${searchResp.status})`);
  const searchData = await searchResp.json();
  return searchData?.query?.search || [];
}

async function fetchWikipediaSummary(query, { maxChars = 6000, primaryTerm = null, artistName = null } = {}) {
  // Bias toward an exact title match first (helps when the plain-text query
  // would otherwise be dominated by a more "famous" same-artist result),
  // falling back to a normal relevance search if that comes up empty.
  let results = primaryTerm ? await wikiSearch(`intitle:"${primaryTerm}" ${query}`) : [];
  if (results.length === 0) {
    results = await wikiSearch(query);
  }

  if (results.length === 0) {
    throw new Error("No Wikipedia article found");
  }

  // When we know the artist, prefer candidates whose title/snippet actually
  // mentions them - this is what catches cases like an album called "Taj
  // Mahal" matching the historical monument's article instead of the
  // musician's. A title-only match score has no way to know those are
  // different subjects; checking for the artist's name does.
  let candidates = results;
  if (artistName) {
    const artistMatches = results.filter((r) => wikiResultMentionsArtist(r, artistName));
    if (artistMatches.length > 0) candidates = artistMatches;
  }

  let best = candidates[0];
  if (primaryTerm) {
    let bestScore = -1;
    for (const r of candidates) {
      const score = wikiTitleMatchScore(r.title, primaryTerm);
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }
  }

  const title = best.title;

  const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(title)}&format=json&origin=*`;
  const extractResp = await fetch(extractUrl);
  if (!extractResp.ok) throw new Error(`Wikipedia article fetch failed (${extractResp.status})`);
  const extractData = await extractResp.json();

  const pages = extractData?.query?.pages || {};
  const page = Object.values(pages)[0];
  let extract = page?.extract || "";

  if (!extract) {
    throw new Error("No article text available");
  }

  // Build a set of name variants to try: the full name, then progressively
  // stripped versions — "The Bill Evans Trio" → "Bill Evans Trio" → "Bill Evans".
  // Wikipedia articles tend to use the shortest commonly-known form, so the
  // full group/ensemble name often won't appear verbatim but a sub-string will.
  function artistVariants(name) {
    if (!name) return [];
    const base = name.toLowerCase().trim();
    const variants = new Set([base]);
    // Strip leading "The "
    const noThe = base.replace(/^the\s+/, "");
    if (noThe !== base) variants.add(noThe);
    // Strip trailing ensemble words (Trio, Quartet, Quintet, Orchestra, Band, Ensemble, Group, Sextet, Septet)
    const noEnsemble = noThe.replace(/\s+(trio|quartet|quintet|orchestra|band|ensemble|group|sextet|septet|big band)$/i, "").trim();
    if (noEnsemble !== noThe) variants.add(noEnsemble);
    // Also try stripping from the base (without prior "The" removal)
    const noEnsembleBase = base.replace(/\s+(trio|quartet|quintet|orchestra|band|ensemble|group|sextet|septet|big band)$/i, "").trim();
    if (noEnsembleBase !== base) variants.add(noEnsembleBase);
    return [...variants];
  }

  // Final safety check: if we know the artist but no variant of their name
  // appears anywhere in the article body, it's likely the wrong subject.
  // However, instead of throwing outright (which loses the candidate entirely),
  // return it flagged as uncertain so the caller can offer a "Paste anyway" option.
  let uncertain = false;
  if (artistName) {
    const firstChunk = extract.slice(0, 4000).toLowerCase();
    const variants = artistVariants(artistName);
    const anyMatch = variants.some((v) => firstChunk.includes(v));
    if (!anyMatch) {
      uncertain = true;
    }
  }

  // Drop common trailing boilerplate sections that add length without value.
  const cutSections = ["\nSee also", "\nReferences", "\nExternal links", "\nNotes\n", "\nFurther reading"];
  for (const marker of cutSections) {
    const idx = extract.indexOf(marker);
    if (idx !== -1) extract = extract.slice(0, idx);
  }

  extract = extract.trim();

  let truncated = false;
  if (extract.length > maxChars) {
    const slice = extract.slice(0, maxChars);
    const lastBreak = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf(".\n"));
    extract = (lastBreak > maxChars * 0.6 ? slice.slice(0, lastBreak + 1) : slice).trim();
    truncated = true;
  }

  const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

  return {
    title,
    extract,
    truncated,
    uncertain,
    content_urls: { desktop: { page: pageUrl } },
  };
}

function appendWikiExtractParagraphs(container, extract) {
  const paragraphs = extract
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  paragraphs.forEach((p) => {
    const para = document.createElement("p");
    para.textContent = p;
    container.appendChild(para);
  });
}

async function grabSpotlightDescription(record, wrap, btn) {
  btn.disabled = true;
  btn.textContent = "Fetching from Wikipedia...";

  try {
    const summaryData = await fetchWikipediaSummary(`${record.album} ${record.artist} album`, {
      primaryTerm: record.album,
      artistName: record.artist,
    });

    const pageUrl = summaryData.content_urls?.desktop?.page;
    const sourceLine = pageUrl ? `Full article: ${summaryData.title} — ${pageUrl}` : null;
    const fullText = sourceLine ? `${summaryData.extract}\n\n${sourceLine}` : summaryData.extract;

    if (summaryData.uncertain) {
      // Found something but not confident — show the title and offer a choice
      // rather than silently saving or silently failing.
      btn.disabled = false;
      btn.textContent = "Grab description from Wikipedia";
      wrap.innerHTML = "";

      const notice = document.createElement("p");
      notice.className = "spotlight-error";
      notice.textContent = `Found "${summaryData.title}" on Wikipedia — this might not be the right article. Use it anyway?`;
      wrap.appendChild(notice);

      const pasteBtn = document.createElement("button");
      pasteBtn.type = "button";
      pasteBtn.className = "btn-secondary";
      pasteBtn.textContent = "Use it anyway";
      pasteBtn.addEventListener("click", () => {
        saveSpotlightDescription(record, fullText, wrap, pasteBtn);
      });
      wrap.appendChild(pasteBtn);
      return;
    }

    await saveSpotlightDescription(record, fullText, wrap, btn);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Grab description from Wikipedia";
    wrap.innerHTML = "";
    const errEl = document.createElement("p");
    errEl.className = "spotlight-error";
    errEl.textContent = `Couldn't fetch a Wikipedia description (${err.message || err}).`;
    wrap.appendChild(errEl);
  }
}

async function saveSpotlightDescription(record, fullText, wrap, btn) {
  const prevText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Saving...";
  try {
    const { error } = await supabaseClient
      .from("records")
      .update({ description: fullText })
      .eq("id", record.id);

    if (error) throw error;

    record.description = fullText;

    if (activeDetailRecordId === record.id) {
      const detailField = document.getElementById("detailDescription");
      if (detailField) detailField.value = fullText;
    }

    wrap.innerHTML = "";
    btn.disabled = false;
    btn.textContent = "Grab description from Wikipedia";
    renderSpotlight();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = prevText;
    wrap.innerHTML = "";
    const errEl = document.createElement("p");
    errEl.className = "spotlight-error";
    errEl.textContent = `Couldn't save the description (${err.message || err}).`;
    wrap.appendChild(errEl);
  }
}

async function findEntityWiki({ query, wrap, btn, idleLabel, primaryTerm }) {
  btn.disabled = true;
  btn.textContent = "Looking up...";

  try {
    const summaryData = await fetchWikipediaSummary(query, { maxChars: 3000, primaryTerm });

    wrap.innerHTML = "";

    const resultBox = document.createElement("div");
    resultBox.className = "spotlight-wiki-result";

    appendWikiExtractParagraphs(resultBox, summaryData.extract);

    const pageUrl = summaryData.content_urls?.desktop?.page;

    if (pageUrl) {
      const actions = document.createElement("div");
      actions.className = "spotlight-wiki-actions";

      const link = document.createElement("a");
      link.href = pageUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = summaryData.truncated
        ? `Read the full article: ${summaryData.title} ↗`
        : `Read more: ${summaryData.title} ↗`;
      link.addEventListener("click", (e) => e.stopPropagation());
      actions.appendChild(link);

      resultBox.appendChild(actions);
    }

    wrap.appendChild(resultBox);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = idleLabel;
    const errEl = document.createElement("p");
    errEl.className = "spotlight-error";
    errEl.textContent = `Couldn't find a Wikipedia summary (${err.message || err}).`;
    wrap.appendChild(errEl);
  }
}

function renderRecentlyAdded() {
  const list = document.getElementById("recentList");
  list.innerHTML = "";

  if (allRecords.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "Nothing added yet.";
    list.appendChild(empty);
    return;
  }

  const recent = [...allRecords].sort((a, b) => b.id - a.id).slice(0, 5);

  recent.forEach((r) => {
    const item = document.createElement("div");
    item.className = "mini-list-item";
    item.appendChild(buildMiniCover(r.cover_url, `${r.album} cover`));

    const info = document.createElement("div");
    info.className = "mini-info";

    const artistEl = document.createElement("div");
    artistEl.className = "mini-artist";
    artistEl.textContent = r.artist;

    const albumEl = document.createElement("div");
    albumEl.className = "mini-album";
    albumEl.textContent = r.album;

    info.appendChild(artistEl);
    info.appendChild(albumEl);
    item.appendChild(info);

    item.addEventListener("click", () => openRecordDetailModal(r.id));
    list.appendChild(item);
  });
}

function renderWishlistHighlights() {
  const list = document.getElementById("wishlistHighlightList");
  list.innerHTML = "";

  if (wishlist.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "Your wishlist is empty.";
    list.appendChild(empty);
    return;
  }

  wishlist.slice(0, 5).forEach((w) => {
    const item = document.createElement("div");
    item.className = "mini-list-item";
    item.appendChild(buildMiniCover(w.cover_url, `${w.album} cover`));

    const info = document.createElement("div");
    info.className = "mini-info";

    const artistEl = document.createElement("div");
    artistEl.className = "mini-artist";
    artistEl.textContent = w.artist;

    const albumEl = document.createElement("div");
    albumEl.className = "mini-album";
    albumEl.textContent = w.album;

    info.appendChild(artistEl);
    info.appendChild(albumEl);
    item.appendChild(info);

    item.addEventListener("click", () => setPage("wishlist"));
    list.appendChild(item);
  });
}

function renderHome() {
  renderStats();
  renderSpotlight();
  renderRecentlyAdded();
  renderWishlistHighlights();
}

// ------------ Profile data ------------

function avatarPathForUser(extension) {
  return `${currentUser.id}/avatar.${extension}`;
}

async function loadProfile() {
  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) throw error;

    currentProfile = data || null;
  } catch (err) {
    console.error(err);
    currentProfile = null;
  }
}

async function saveProfileFields(fields) {
  const payload = {
    user_id: currentUser.id,
    ...fields,
  };

  const { data, error } = await supabaseClient
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;

  currentProfile = data;
  return data;
}

function getDisplayName() {
  if (!currentProfile) return currentUser?.email || "";

  if (currentProfile.preferred_name) return currentProfile.preferred_name;

  if (currentProfile.username) return currentProfile.username;

  return currentUser?.email || "";
}

function getAccountLabel() {
  if (currentProfile?.username) return currentProfile.username;
  return currentUser?.email || "";
}

function getAvatarUrl() {
  return currentProfile?.avatar_url || "icon-512.png";
}

function calculateAge(birthdateStr) {
  if (!birthdateStr) return null;
  const birthdate = new Date(birthdateStr);
  if (isNaN(birthdate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate());
  if (!hasHadBirthdayThisYear) age--;

  return age;
}

// ------------ Tag input (autocomplete multi-select) ------------

function getTagSuggestionSource(source) {
  switch (source) {
    case "genres":
      return genres.map((g) => g.name);
    case "subgenres":
      return subgenres.map((sg) => sg.name);
    case "artists":
      return Array.from(new Set(allRecords.map((r) => r.artist))).sort();
    case "albums":
      return Array.from(new Set(allRecords.map((r) => r.album))).sort();
    default:
      return [];
  }
}

function getTagInputValues(container) {
  return Array.from(container.querySelectorAll(".tag-input-chip"))
    .map((chip) => chip.dataset.value);
}

function setTagInputValues(container, values) {
  const chipsWrap = container.querySelector(".tag-input-chips");
  chipsWrap.innerHTML = "";
  (values || []).forEach((value) => addTagChip(container, value));
}

function addTagChip(container, value) {
  // Guard against pasted or typed values that already contain commas
  // (e.g. pasting "Shop A, Shop B, Shop C" into the input at once) --
  // split those into separate chips instead of creating one chip whose
  // label is the whole comma-joined string.
  if (value.includes(",")) {
    value.split(",").forEach((part) => addTagChip(container, part));
    return;
  }

  const trimmed = value.trim();
  if (!trimmed) return;

  const existing = getTagInputValues(container);
  if (existing.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;

  const chipsWrap = container.querySelector(".tag-input-chips");

  const chip = document.createElement("span");
  chip.className = "tag-input-chip";
  chip.dataset.value = trimmed;

  const label = document.createElement("span");
  label.textContent = trimmed;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.setAttribute("aria-label", `Remove ${trimmed}`);
  removeBtn.textContent = "\u2715";
  removeBtn.addEventListener("click", () => {
    chip.remove();
  });

  chip.appendChild(label);
  chip.appendChild(removeBtn);
  chipsWrap.appendChild(chip);
}

function setupTagInput(container) {
  const input = container.querySelector("input");
  const suggestionsBox = container.querySelector(".tag-input-suggestions");
  const source = container.dataset.source;

  let highlightedIndex = -1;

  function getFilteredSuggestions() {
    const query = input.value.trim().toLowerCase();
    if (!query) return [];

    const existing = new Set(getTagInputValues(container).map((v) => v.toLowerCase()));
    const candidates = getTagSuggestionSource(source);

    return candidates
      .filter((c) => c.toLowerCase().includes(query) && !existing.has(c.toLowerCase()))
      .slice(0, 8);
  }

  function renderSuggestions() {
    const matches = getFilteredSuggestions();
    const query = input.value.trim();

    suggestionsBox.innerHTML = "";
    highlightedIndex = -1;

    matches.forEach((match) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-input-suggestion";
      btn.textContent = match;
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        addTagChip(container, match);
        input.value = "";
        suggestionsBox.hidden = true;
        input.focus();
      });
      suggestionsBox.appendChild(btn);
    });

    if (query) {
      const existing = new Set(getTagInputValues(container).map((v) => v.toLowerCase()));
      const exactMatch = matches.some((m) => m.toLowerCase() === query.toLowerCase());
      if (!exactMatch && !existing.has(query.toLowerCase())) {
        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "tag-input-suggestion tag-input-suggestion-add";
        addBtn.textContent = `Add "${query}"`;
        addBtn.addEventListener("mousedown", (e) => {
          e.preventDefault();
          addTagChip(container, query);
          input.value = "";
          suggestionsBox.hidden = true;
          input.focus();
        });
        suggestionsBox.appendChild(addBtn);
      }
    }

    suggestionsBox.hidden = suggestionsBox.children.length === 0;
  }

  input.addEventListener("input", renderSuggestions);
  input.addEventListener("focus", renderSuggestions);

  input.addEventListener("blur", () => {
    // Delay so a suggestion click (mousedown) registers first
    setTimeout(() => {
      suggestionsBox.hidden = true;
    }, 100);
  });

  input.addEventListener("keydown", (e) => {
    const options = Array.from(suggestionsBox.querySelectorAll(".tag-input-suggestion"));

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (options.length === 0) return;
      highlightedIndex = (highlightedIndex + 1) % options.length;
      options.forEach((o, i) => o.classList.toggle("highlighted", i === highlightedIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (options.length === 0) return;
      highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
      options.forEach((o, i) => o.classList.toggle("highlighted", i === highlightedIndex));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && options[highlightedIndex]) {
        options[highlightedIndex].dispatchEvent(new MouseEvent("mousedown"));
      } else if (input.value.trim()) {
        addTagChip(container, input.value);
        input.value = "";
        suggestionsBox.hidden = true;
      }
    } else if (e.key === ",") {
      e.preventDefault();
      if (input.value.trim()) {
        addTagChip(container, input.value);
        input.value = "";
        renderSuggestions();
      }
    } else if (e.key === "Backspace" && input.value === "") {
      const chips = container.querySelectorAll(".tag-input-chip");
      if (chips.length > 0) {
        chips[chips.length - 1].remove();
      }
    }
  });
}

function setupAllTagInputs() {
  document
    .querySelectorAll(".tag-input:not(.free-list-input)")
    .forEach((container) => setupTagInput(container));
}

// A simpler multi-entry input for free-text lists that have no suggestion
// source to autocomplete against (e.g. "my favorite record shops" - there's
// no canonical list of record shops to suggest from). Reuses the same chip
// rendering/storage helpers as the full tag input, just without the
// suggestions dropdown.
function setupFreeListInput(container) {
  const input = container.querySelector("input");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.value.trim()) {
        addTagChip(container, input.value);
        input.value = "";
      }
    } else if (e.key === "Backspace" && input.value === "") {
      const chips = container.querySelectorAll(".tag-input-chip");
      if (chips.length > 0) {
        chips[chips.length - 1].remove();
      }
    }
  });

  input.addEventListener("blur", () => {
    if (input.value.trim()) {
      addTagChip(container, input.value);
      input.value = "";
    }
  });
}

function setupAllFreeListInputs() {
  document.querySelectorAll(".free-list-input").forEach((container) => setupFreeListInput(container));
}

function refreshAccountButton() {
  const label = getAccountLabel();
  document.getElementById("accountEmail").textContent = label;

  const accountAvatar = document.getElementById("accountAvatarImg");
  if (accountAvatar) {
    accountAvatar.src = getAvatarUrl();
  }
}

// ------------ Favorites (collection -> profile taste) ------------

function parseFavoriteFlags(record) {
  const albums = currentProfile?.favorite_albums || [];
  const artists = currentProfile?.favorite_artists || [];

  return {
    isAlbumFavorite: albums.some((a) => a.toLowerCase() === record.album.toLowerCase()),
    isArtistFavorite: artists.some((a) => a.toLowerCase() === record.artist.toLowerCase()),
  };
}

async function toggleFavorite(field, value, btn, extraInfo) {
  if (!currentUser) return;

  const current = currentProfile?.[field] || [];
  const isActive = current.some((v) => v.toLowerCase() === value.toLowerCase());

  const updated = isActive
    ? current.filter((v) => v.toLowerCase() !== value.toLowerCase())
    : [...current, value];

  const fieldsToSave = { [field]: updated };

  if (field === "favorite_albums") {
    const meta = { ...(currentProfile?.favorite_albums_meta || {}) };
    if (isActive) {
      delete meta[value];
    } else {
      meta[value] = { cover_url: extraInfo?.cover_url || null, artist: extraInfo?.artist || null };
    }
    fieldsToSave.favorite_albums_meta = meta;
  }

  btn.disabled = true;

  try {
    await saveProfileFields(fieldsToSave);

    const nowActive = !isActive;
    btn.classList.toggle("active", nowActive);
    btn.setAttribute("aria-pressed", String(nowActive));

    if (field === "favorite_albums") {
      btn.title = nowActive ? "Remove album from favorites" : "Favorite this album";
    } else {
      btn.title = nowActive ? `Remove ${value} from favorite artists` : `Favorite ${value}`;
    }

    if (currentPage === "profile") {
      renderTasteView();
    }
  } catch (err) {
    console.error(err);
    setStatus("Couldn't update favorites. See console for details.");
  } finally {
    btn.disabled = false;
  }
}

// ------------ Profile rendering ------------

function buildProfileField(label, value) {
  const row = document.createElement("div");
  row.className = "profile-field";

  const labelEl = document.createElement("span");
  labelEl.className = "profile-field-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  if (value) {
    valueEl.className = "profile-field-value";
    valueEl.textContent = value;
  } else {
    valueEl.className = "profile-field-value profile-field-value-empty";
    valueEl.textContent = "Nothing here yet";
  }

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

function buildRecordShopsRow(shops) {
  const row = document.createElement("div");
  row.className = "profile-field profile-field-stacked";

  const labelEl = document.createElement("span");
  labelEl.className = "profile-field-label";
  labelEl.textContent = "My Favorite Record Shops";
  row.appendChild(labelEl);

  if (!shops || shops.length === 0) {
    const emptyEl = document.createElement("span");
    emptyEl.className = "profile-field-value profile-field-value-empty";
    emptyEl.textContent = "Nothing here yet";
    row.appendChild(emptyEl);
    return row;
  }

  const list = document.createElement("div");
  list.className = "record-shops-list";

  shops.forEach((shop) => {
    const name = typeof shop === "string" ? shop : shop.name;
    const url = typeof shop === "object" ? shop.url : null;
    if (!name) return;

    const chip = document.createElement("div");
    chip.className = "record-shop-chip";

    const nameEl = document.createElement("span");
    nameEl.className = "record-shop-name";
    nameEl.textContent = name;
    chip.appendChild(nameEl);

    const links = document.createElement("div");
    links.className = "record-shop-links";

    if (url) {
      const siteLink = document.createElement("a");
      siteLink.href = url.startsWith("http") ? url : `https://${url}`;
      siteLink.target = "_blank";
      siteLink.rel = "noopener noreferrer";
      siteLink.className = "record-shop-link";
      siteLink.innerHTML = '<i class="ti ti-world" aria-hidden="true"></i>';
      siteLink.setAttribute("title", "Visit website");
      links.appendChild(siteLink);
    }

    // Always add a Google Maps search link
    const mapsLink = document.createElement("a");
    mapsLink.href = `https://www.google.com/maps/search/${encodeURIComponent(name)}`;
    mapsLink.target = "_blank";
    mapsLink.rel = "noopener noreferrer";
    mapsLink.className = "record-shop-link";
    mapsLink.innerHTML = '<i class="ti ti-map-pin" aria-hidden="true"></i>';
    mapsLink.setAttribute("title", "Find on Google Maps");
    links.appendChild(mapsLink);

    chip.appendChild(links);
    list.appendChild(chip);
  });

  row.appendChild(list);
  return row;
}

function buildProfileTagRow(label, items, options) {
  const stacked = options?.stacked === true;

  const row = document.createElement("div");
  row.className = stacked ? "profile-field profile-field-stacked" : "profile-field";

  const labelEl = document.createElement("span");
  labelEl.className = "profile-field-label";
  labelEl.textContent = label;

  if (!items || items.length === 0) {
    const emptyEl = document.createElement("span");
    emptyEl.className = "profile-field-value profile-field-value-empty";
    emptyEl.textContent = "Nothing here yet";
    row.appendChild(labelEl);
    row.appendChild(emptyEl);
    return row;
  }

  const tagList = document.createElement("div");
  tagList.className = stacked ? "profile-tag-list profile-tag-list-stacked" : "profile-tag-list";
  // Defensive: repair any legacy entries that were saved as one
  // comma-joined string instead of separate array elements (e.g. from
  // pasting "Shop A, Shop B" before addTagChip split on commas).
  items
    .flatMap((item) => (item.includes(",") ? item.split(",") : [item]))
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const tag = document.createElement("span");
      tag.className = "profile-tag";
      tag.textContent = item;
      tagList.appendChild(tag);
    });

  row.appendChild(labelEl);
  row.appendChild(tagList);
  return row;
}

function buildAlbumGridRow(label, albums, metaByAlbum) {
  const row = document.createElement("div");
  row.className = "profile-field profile-field-stacked";

  const labelEl = document.createElement("span");
  labelEl.className = "profile-field-label";
  labelEl.textContent = label;

  if (!albums || albums.length === 0) {
    const emptyEl = document.createElement("span");
    emptyEl.className = "profile-field-value profile-field-value-empty";
    emptyEl.textContent = "Nothing here yet";
    row.appendChild(labelEl);
    row.appendChild(emptyEl);
    return row;
  }

  const grid = document.createElement("div");
  grid.className = "profile-album-grid";

  const meta = metaByAlbum || {};
  albums.forEach((albumName) => {
    const cell = document.createElement("div");
    cell.className = "profile-album-cell";

    const coverUrl = meta[albumName]?.cover_url;
    if (coverUrl) {
      const img = document.createElement("img");
      img.src = coverUrl;
      img.alt = "";
      img.className = "profile-album-cover";
      cell.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "profile-album-cover profile-album-cover-placeholder";
      cell.appendChild(placeholder);
    }

    const nameEl = document.createElement("span");
    nameEl.className = "profile-album-name";
    nameEl.textContent = albumName;
    cell.appendChild(nameEl);

    grid.appendChild(cell);
  });

  row.appendChild(labelEl);
  row.appendChild(grid);
  return row;
}

function renderWishlistPersonalityView() {
  const view = document.getElementById("wishlistPersonalityView");
  view.innerHTML = "";
  const p = currentProfile || {};

  view.appendChild(buildProfileField("My Grail", p.my_grail));
  view.appendChild(buildProfileField("My White Whale", p.my_white_whale));
  view.appendChild(buildProfileField("My Best Score", p.my_best_score));
  view.appendChild(buildProfileField("My Guiltiest Pleasure", p.my_guilty_pleasure));
  view.appendChild(buildProfileTagRow("My Favorite Record Shops", p.my_record_shops, { stacked: true }));
  // Upgraded shops from new jsonb column
  const shops = p.record_shops || [];
  if (shops.length > 0) {
    // Replace the plain tag row with rich linked version
    const lastChild = view.lastElementChild;
    if (lastChild) lastChild.remove();
    view.appendChild(buildRecordShopsRow(shops));
  }
}

function renderSystemView() {
  const view = document.getElementById("systemView");
  view.innerHTML = "";
  const p = currentProfile || {};

  view.appendChild(buildProfileTagRow("Turntable", p.turntable));
  view.appendChild(buildProfileTagRow("Cartridge", p.cartridge));
  view.appendChild(buildProfileField("Phono Stage", p.phono_stage));
  view.appendChild(buildProfileField("Amplifier / Receiver", p.receiver));
  view.appendChild(buildProfileTagRow("Speakers", p.speakers));
  view.appendChild(buildProfileField("Subwoofer", p.subwoofer));
  view.appendChild(buildProfileTagRow("Headphones", p.headphones));
  view.appendChild(buildProfileField("Record Cleaning", p.record_cleaning));
  view.appendChild(buildProfileField("Next Upgrade", p.next_upgrade));
  view.appendChild(buildProfileField("Dream Component", p.dream_component));
}

function renderTasteView() {
  const view = document.getElementById("tasteView");
  view.innerHTML = "";

  const p = currentProfile || {};
  view.appendChild(buildProfileTagRow("Favorite genres", p.favorite_genres));
  view.appendChild(buildProfileTagRow("Favorite subgenres", p.favorite_subgenres));
  view.appendChild(buildProfileTagRow("Favorite artists", p.favorite_artists, { stacked: true }));
  view.appendChild(buildAlbumGridRow("Favorite albums", p.favorite_albums, p.favorite_albums_meta));
}

function ageRange(age) {
  if (age === null || age === undefined) return "—";
  const decade = Math.floor(age / 10) * 10;
  // E.g. 37 → "Late 30s", 30 → "Early 30s", 35 → "Mid 30s"
  const offset = age - decade;
  const phase = offset < 3 ? "Early" : offset < 7 ? "Mid" : "Late";
  return `${phase} ${decade}s`;
}

function renderProfileTopList(elId, items) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = "";
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.className = "profile-top-list-empty";
    li.textContent = "—";
    el.appendChild(li);
    return;
  }
  items.forEach(({ name, count }) => {
    const li = document.createElement("li");
    li.className = "profile-top-list-item";
    const nameEl = document.createElement("span");
    nameEl.className = "profile-top-list-name";
    nameEl.textContent = name;
    const countEl = document.createElement("span");
    countEl.className = "profile-top-list-count";
    countEl.textContent = count;
    li.appendChild(nameEl);
    li.appendChild(countEl);
    el.appendChild(li);
  });
}

// ============================================================
// Profile Spotlights
// ============================================================

// ---- Trophy Spotlight ----
// Stores up to 3 pinned trophy IDs in profile.favorite_albums_meta
// under the key "pinned_trophies" to avoid a new DB column.

function getPinnedTrophies() {
  try {
    const meta = currentProfile?.favorite_albums_meta || {};
    return Array.isArray(meta.pinned_trophies) ? meta.pinned_trophies : [];
  } catch { return []; }
}

async function savePinnedTrophies(ids) {
  const meta = { ...(currentProfile?.favorite_albums_meta || {}), pinned_trophies: ids };
  await saveProfileFields({ favorite_albums_meta: meta });
}

function renderTrophySpotlight() {
  const view = document.getElementById("trophySpotlightView");
  if (!view) return;
  view.innerHTML = "";

  const pinned = getPinnedTrophies();
  const allTrophies = computeTrophies();

  if (pinned.length === 0) {
    view.innerHTML = '<p class="field-hint" style="font-style:italic">No trophies pinned yet — click the pencil to choose up to 3.</p>';
    return;
  }

  const row = document.createElement("div");
  row.className = "trophy-spotlight-row";

  pinned.forEach((id) => {
    const def = allTrophies.find((t) => t.id === id);
    if (!def) return;
    const wrap = document.createElement("div");
    wrap.className = "trophy-spotlight-item";
    wrap.innerHTML = buildTrophyLabelSvg(def, def.earned, 120);
    const label = document.createElement("p");
    label.className = "trophy-spotlight-label";
    label.textContent = def.name;
    wrap.appendChild(label);
    wrap.addEventListener("click", () => openTrophyLightbox(def));
    row.appendChild(wrap);
  });

  view.appendChild(row);
}

function openTrophySpotlightPicker() {
  const picker = document.getElementById("trophySpotlightPicker");
  const view = document.getElementById("trophySpotlightView");
  const grid = document.getElementById("trophySpotlightPickerGrid");
  picker.hidden = false;
  view.hidden = true;
  grid.innerHTML = "";

  const pinned = new Set(getPinnedTrophies());
  const allTrophies = computeTrophies().filter((t) => t.earned);

  if (allTrophies.length === 0) {
    grid.innerHTML = '<p class="field-hint">Earn some trophies first — then you can pin them here.</p>';
    return;
  }

  allTrophies.forEach((def) => {
    const item = document.createElement("div");
    item.className = "trophy-spotlight-pick-item" + (pinned.has(def.id) ? " selected" : "");
    item.dataset.id = def.id;
    item.innerHTML = buildTrophyLabelSvg(def, true, 90);
    const label = document.createElement("p");
    label.textContent = def.name;
    item.appendChild(label);
    item.addEventListener("click", () => {
      if (item.classList.contains("selected")) {
        item.classList.remove("selected");
      } else {
        const selected = grid.querySelectorAll(".selected");
        if (selected.length >= 3) {
          document.getElementById("trophySpotlightStatus").textContent = "Max 3 trophies — deselect one first.";
          return;
        }
        item.classList.add("selected");
      }
      document.getElementById("trophySpotlightStatus").textContent = "";
    });
    grid.appendChild(item);
  });
}

function closeTrophySpotlightPicker() {
  document.getElementById("trophySpotlightPicker").hidden = true;
  document.getElementById("trophySpotlightView").hidden = false;
}

// ---- Album Spotlight ----
// Stores up to 6 album objects {id, artist, album, cover_url} in
// profile.favorite_albums_meta under key "spotlight_albums".

function getSpotlightAlbums() {
  try {
    const meta = currentProfile?.favorite_albums_meta || {};
    return Array.isArray(meta.spotlight_albums) ? meta.spotlight_albums : [];
  } catch { return []; }
}

async function saveSpotlightAlbums(albums) {
  const meta = { ...(currentProfile?.favorite_albums_meta || {}), spotlight_albums: albums };
  await saveProfileFields({ favorite_albums_meta: meta });
}

function renderAlbumSpotlight() {
  const view = document.getElementById("albumSpotlightView");
  if (!view) return;
  view.innerHTML = "";

  const spotlight = getSpotlightAlbums();

  if (spotlight.length === 0) {
    view.innerHTML = '<p class="field-hint" style="font-style:italic">No albums featured yet — click the pencil to choose up to 6.</p>';
    return;
  }

  const strip = document.createElement("div");
  strip.className = "album-spotlight-strip";

  spotlight.forEach((a) => {
    const item = document.createElement("div");
    item.className = "album-spotlight-item";

    const cover = document.createElement("div");
    cover.className = "album-spotlight-cover";
    if (a.cover_url) {
      const img = document.createElement("img");
      img.src = a.cover_url;
      img.alt = a.album || "";
      img.loading = "lazy";
      cover.appendChild(img);
    } else {
      cover.innerHTML = '<i class="ti ti-vinyl" aria-hidden="true"></i>';
    }

    const meta = document.createElement("div");
    meta.className = "album-spotlight-meta";
    meta.innerHTML = `<p class="album-spotlight-album">${a.album || ""}</p><p class="album-spotlight-artist">${a.artist || ""}</p>`;

    item.appendChild(cover);
    item.appendChild(meta);

    if (a.id) {
      item.style.cursor = "pointer";
      item.addEventListener("click", () => openRecordDetailModal(a.id));
    }

    strip.appendChild(item);
  });

  view.appendChild(strip);
}

let albumSpotlightSelected = [];

function openAlbumSpotlightPicker() {
  const picker = document.getElementById("albumSpotlightPicker");
  const view = document.getElementById("albumSpotlightView");
  picker.hidden = false;
  view.hidden = true;
  albumSpotlightSelected = getSpotlightAlbums().map((a) => a.id);
  document.getElementById("albumSpotlightSearch").value = "";
  renderAlbumSpotlightPickerList("");
}

function closeAlbumSpotlightPicker() {
  document.getElementById("albumSpotlightPicker").hidden = true;
  document.getElementById("albumSpotlightView").hidden = false;
  albumSpotlightSelected = [];
}

function renderAlbumSpotlightPickerList(query) {
  const list = document.getElementById("albumSpotlightPickerList");
  list.innerHTML = "";
  const q = query.toLowerCase();

  const filtered = allRecords
    .filter((r) => !q || (r.artist + " " + r.album).toLowerCase().includes(q))
    .slice(0, 40);

  filtered.forEach((r) => {
    const row = document.createElement("div");
    const isSelected = albumSpotlightSelected.includes(r.id);
    row.className = "album-spotlight-pick-row" + (isSelected ? " selected" : "");

    const cover = document.createElement("div");
    cover.className = "album-spotlight-pick-cover";
    if (r.cover_url) {
      const img = document.createElement("img");
      img.src = r.cover_url;
      img.alt = "";
      cover.appendChild(img);
    } else {
      cover.innerHTML = '<i class="ti ti-vinyl"></i>';
    }

    const info = document.createElement("div");
    info.innerHTML = `<p class="album-spotlight-pick-album">${r.album || ""}</p><p class="album-spotlight-pick-artist">${r.artist || ""}</p>`;

    const check = document.createElement("div");
    check.className = "album-spotlight-pick-check";
    check.innerHTML = '<i class="ti ti-check"></i>';

    row.appendChild(cover);
    row.appendChild(info);
    row.appendChild(check);

    row.addEventListener("click", () => {
      const idx = albumSpotlightSelected.indexOf(r.id);
      if (idx !== -1) {
        albumSpotlightSelected.splice(idx, 1);
        row.classList.remove("selected");
      } else {
        if (albumSpotlightSelected.length >= 6) {
          document.getElementById("albumSpotlightStatus").textContent = "Max 6 albums — deselect one first.";
          return;
        }
        albumSpotlightSelected.push(r.id);
        row.classList.add("selected");
      }
      document.getElementById("albumSpotlightStatus").textContent = "";
    });

    list.appendChild(row);
  });
}

function setupProfileSpotlights() {
  // Trophy spotlight
  document.getElementById("editTrophySpotlightBtn")?.addEventListener("click", () => openTrophySpotlightPicker());
  document.getElementById("cancelTrophySpotlightBtn")?.addEventListener("click", () => closeTrophySpotlightPicker());
  document.getElementById("saveTrophySpotlightBtn")?.addEventListener("click", async () => {
    const selected = [...document.getElementById("trophySpotlightPickerGrid").querySelectorAll(".selected")]
      .map((el) => el.dataset.id);
    const statusEl = document.getElementById("trophySpotlightStatus");
    statusEl.textContent = "Saving…";
    try {
      await savePinnedTrophies(selected);
      closeTrophySpotlightPicker();
      renderTrophySpotlight();
    } catch {
      statusEl.textContent = "Couldn't save. Please try again.";
      statusEl.className = "form-status form-status-error";
    }
  });

  // Album spotlight
  document.getElementById("editAlbumSpotlightBtn")?.addEventListener("click", () => openAlbumSpotlightPicker());
  document.getElementById("cancelAlbumSpotlightBtn")?.addEventListener("click", () => closeAlbumSpotlightPicker());
  document.getElementById("albumSpotlightSearch")?.addEventListener("input", (e) => renderAlbumSpotlightPickerList(e.target.value));
  document.getElementById("saveAlbumSpotlightBtn")?.addEventListener("click", async () => {
    const statusEl = document.getElementById("albumSpotlightStatus");
    statusEl.textContent = "Saving…";
    try {
      const albums = albumSpotlightSelected
        .map((id) => {
          const r = allRecords.find((rec) => rec.id === id);
          return r ? { id: r.id, artist: r.artist, album: r.album, cover_url: r.cover_url || null } : null;
        })
        .filter(Boolean);
      await saveSpotlightAlbums(albums);
      closeAlbumSpotlightPicker();
      renderAlbumSpotlight();
    } catch {
      statusEl.textContent = "Couldn't save. Please try again.";
      statusEl.className = "form-status form-status-error";
    }
  });
}

function renderProfile() {
  document.getElementById("profileAvatarImg").src = getAvatarUrl();
  document.getElementById("profileDisplayName").textContent = getDisplayName();

  const usernameEl = document.getElementById("profileUsername");
  usernameEl.textContent = currentProfile?.username ? `@${currentProfile.username}` : "";

  const locationEl = document.getElementById("profileLocation");
  const location = [currentProfile?.city, currentProfile?.state, currentProfile?.country]
    .filter(Boolean)
    .join(", ");
  locationEl.textContent = location;

  const memberSinceEl = document.getElementById("profileMemberSince");
  if (currentUser?.created_at) {
    const date = new Date(currentUser.created_at);
    const formatted = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    memberSinceEl.textContent = `Member since ${formatted}`;
  } else {
    memberSinceEl.textContent = "";
  }

  // --- Row 1: Key stats ---
  document.getElementById("profileStatRecords").textContent = allRecords.length || "—";
  document.getElementById("profileStatWishlist").textContent = wishlist.length || "—";

  const age = calculateAge(currentProfile?.birthdate);
  document.getElementById("profileStatAge").textContent = ageRange(age);

  const stats = computeCollectionStats();
  document.getElementById("profileStatGenres").textContent = stats.distinctGenres || "—";

  // Decade range: earliest to latest decade represented
  const years = allRecords.map((r) => r.year).filter(Boolean);
  if (years.length > 0) {
    const minDecade = Math.floor(Math.min(...years) / 10) * 10;
    const maxDecade = Math.floor(Math.max(...years) / 10) * 10;
    document.getElementById("profileStatDecades").textContent =
      minDecade === maxDecade ? `${minDecade}s` : `${minDecade}s–${maxDecade}s`;
  } else {
    document.getElementById("profileStatDecades").textContent = "—";
  }

  // --- Row 2: Top 3 lists ---
  const genreData = computeGenreCounts();
  const artistData = computeArtistCounts();

  const topN = (data, n) =>
    data.slice(0, n).map(([name, count]) => ({ name, count }));

  renderProfileTopList("profileTopArtists", topN(artistData, 3));
  renderProfileTopList("profileTopGenres", topN(genreData, 3));

  // Subgenres aren't in a pre-computed function — compute inline
  const subgenreCounts = {};
  allRecords.forEach((r) => {
    if (r.subgenre_name) subgenreCounts[r.subgenre_name] = (subgenreCounts[r.subgenre_name] || 0) + 1;
  });
  const topSubgenres = Object.entries(subgenreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
  renderProfileTopList("profileTopSubgenres", topSubgenres);

  // --- Row 3: Superlatives ---
  const superlativesWrap = document.getElementById("profileSuperlatives");
  superlativesWrap.innerHTML = "";
  const superlatives = buildSuperlatives();
  superlatives.forEach((s) => {
    const card = document.createElement("div");
    card.className = "superlative-card";
    const titleEl = document.createElement("div");
    titleEl.className = "superlative-title";
    titleEl.textContent = s.title;
    const detailEl = document.createElement("div");
    detailEl.className = "superlative-detail";
    detailEl.textContent = s.detail;
    card.appendChild(titleEl);
    card.appendChild(detailEl);
    superlativesWrap.appendChild(card);
  });

  renderWishlistPersonalityView();
  renderTasteView();
  renderSystemView();
  renderTrophySpotlight();
  renderAlbumSpotlight();
}

// ------------ Profile editing ------------

function fillBasicsForm() {
  const p = currentProfile || {};
  document.getElementById("basicsPreferredName").value = p.preferred_name || "";
  document.getElementById("basicsUsername").value = p.username || "";
  document.getElementById("basicsCity").value = p.city || "";
  document.getElementById("basicsState").value = p.state || "";
  document.getElementById("basicsCountry").value = p.country || "";
  document.getElementById("basicsBirthdate").value = p.birthdate || "";
}

function fillWishlistPersonalityForm() {
  const p = currentProfile || {};
  document.getElementById("wishGrailInput").value = p.my_grail || "";
  document.getElementById("wishWhaleInput").value = p.my_white_whale || "";
  document.getElementById("wishScoreInput").value = p.my_best_score || "";
  document.getElementById("wishGuiltyInput").value = p.my_guilty_pleasure || "";
  populateShopsEditor(p.record_shops || []);
}

function populateShopsEditor(shops) {
  const list = document.getElementById("recordShopsEditorList");
  if (!list) return;
  list.innerHTML = "";
  shops.forEach((shop) => addShopEditorRow(list, shop.name, shop.url));
}

function addShopEditorRow(list, name, url) {
  if (!name?.trim()) return;
  const row = document.createElement("div");
  row.className = "record-shops-editor-item";
  row.dataset.name = name.trim();
  row.dataset.url = url?.trim() || "";

  const nameEl = document.createElement("span");
  nameEl.className = "record-shops-editor-name";
  nameEl.textContent = name.trim();

  const urlEl = document.createElement("span");
  urlEl.className = "record-shops-editor-url";
  urlEl.textContent = url?.trim() || "No URL";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "record-shops-editor-remove";
  removeBtn.innerHTML = '<i class="ti ti-x" aria-hidden="true"></i>';
  removeBtn.addEventListener("click", () => row.remove());

  row.appendChild(nameEl);
  row.appendChild(urlEl);
  row.appendChild(removeBtn);
  list.appendChild(row);
}

function setupShopsEditor() {
  document.getElementById("addShopBtn")?.addEventListener("click", () => {
    const nameInput = document.getElementById("newShopNameInput");
    const urlInput = document.getElementById("newShopUrlInput");
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    const list = document.getElementById("recordShopsEditorList");
    addShopEditorRow(list, name, url);
    nameInput.value = "";
    urlInput.value = "";
    nameInput.focus();
  });

  // Allow pressing Enter in name field to trigger Add
  document.getElementById("newShopNameInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("addShopBtn")?.click();
    }
  });
}

function fillTasteForm() {
  const p = currentProfile || {};
  setTagInputValues(document.getElementById("tasteGenresTagInput"), p.favorite_genres || []);
  setTagInputValues(document.getElementById("tasteSubgenresTagInput"), p.favorite_subgenres || []);
  setTagInputValues(document.getElementById("tasteArtistsTagInput"), p.favorite_artists || []);
  setTagInputValues(document.getElementById("tasteAlbumsTagInput"), p.favorite_albums || []);
}

function fillSystemForm() {
  const p = currentProfile || {};
  setTagInputValues(document.getElementById("systemTurntableTagInput"), p.turntable || []);
  setTagInputValues(document.getElementById("systemCartridgeTagInput"), p.cartridge || []);
  document.getElementById("systemPhonoStage").value = p.phono_stage || "";
  document.getElementById("systemReceiver").value = p.receiver || "";
  setTagInputValues(document.getElementById("systemSpeakersTagInput"), p.speakers || []);
  document.getElementById("systemSubwoofer").value = p.subwoofer || "";
  setTagInputValues(document.getElementById("systemHeadphonesTagInput"), p.headphones || []);
  document.getElementById("systemCleaning").value = p.record_cleaning || "";
  document.getElementById("systemNextUpgrade").value = p.next_upgrade || "";
  document.getElementById("systemDreamComponent").value = p.dream_component || "";
}

function toggleProfileEdit(section, editing) {
  const view = document.getElementById(`${section}View`);
  const form = document.getElementById(`${section}Form`);
  view.hidden = editing;
  form.hidden = !editing;

  if (editing) {
    if (section === "basics") fillBasicsForm();
    if (section === "wishlistPersonality") fillWishlistPersonalityForm();
    if (section === "taste") fillTasteForm();
    if (section === "system") fillSystemForm();
  }
}

async function handleBasicsSubmit(event) {
  event.preventDefault();
  const statusEl = document.getElementById("basicsStatus");
  const submitBtn = event.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";
  try {
    await saveProfileFields({
      preferred_name: document.getElementById("basicsPreferredName").value.trim() || null,
      username: document.getElementById("basicsUsername").value.trim(),
      city: document.getElementById("basicsCity").value.trim() || null,
      state: document.getElementById("basicsState").value.trim() || null,
      country: document.getElementById("basicsCountry").value.trim() || null,
      birthdate: document.getElementById("basicsBirthdate").value || null,
    });
    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
    refreshAccountButton();
    renderProfile();
    toggleProfileEdit("basics", false);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      statusEl.textContent = "That username is already taken - please choose another.";
    } else {
      statusEl.textContent = "Couldn't save. Check console for details.";
    }
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleWishlistPersonalitySubmit(event) {
  event.preventDefault();
  const statusEl = document.getElementById("wishlistPersonalityStatus");
  const submitBtn = event.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";
  try {
    // Collect shops from the editor
    const shopRows = document.querySelectorAll(".record-shops-editor-item");
    const recordShops = Array.from(shopRows).map((row) => ({
      name: row.dataset.name,
      url: row.dataset.url || null,
    }));

    await saveProfileFields({
      my_grail: document.getElementById("wishGrailInput").value.trim() || null,
      my_white_whale: document.getElementById("wishWhaleInput").value.trim() || null,
      my_best_score: document.getElementById("wishScoreInput").value.trim() || null,
      my_guilty_pleasure: document.getElementById("wishGuiltyInput").value.trim() || null,
      record_shops: recordShops,
    });
    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
    renderProfile();
    toggleProfileEdit("wishlistPersonality", false);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleTasteSubmit(event) {
  event.preventDefault();

  const statusEl = document.getElementById("tasteStatus");
  const submitBtn = event.target.querySelector("button[type=submit]");

  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    await saveProfileFields({
      favorite_genres: getTagInputValues(document.getElementById("tasteGenresTagInput")),
      favorite_subgenres: getTagInputValues(document.getElementById("tasteSubgenresTagInput")),
      favorite_artists: getTagInputValues(document.getElementById("tasteArtistsTagInput")),
      favorite_albums: getTagInputValues(document.getElementById("tasteAlbumsTagInput")),
    });

    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
    renderProfile();
    toggleProfileEdit("taste", false);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleSystemSubmit(event) {
  event.preventDefault();
  const statusEl = document.getElementById("systemStatus");
  const submitBtn = event.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";
  try {
    await saveProfileFields({
      turntable: getTagInputValues(document.getElementById("systemTurntableTagInput")),
      cartridge: getTagInputValues(document.getElementById("systemCartridgeTagInput")),
      phono_stage: document.getElementById("systemPhonoStage").value.trim() || null,
      receiver: document.getElementById("systemReceiver").value.trim() || null,
      speakers: getTagInputValues(document.getElementById("systemSpeakersTagInput")),
      subwoofer: document.getElementById("systemSubwoofer").value.trim() || null,
      headphones: getTagInputValues(document.getElementById("systemHeadphonesTagInput")),
      record_cleaning: document.getElementById("systemCleaning").value.trim() || null,
      next_upgrade: document.getElementById("systemNextUpgrade").value.trim() || null,
      dream_component: document.getElementById("systemDreamComponent").value.trim() || null,
    });
    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
    renderProfile();
    toggleProfileEdit("system", false);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

// ------------ Avatar picker ------------

function openAvatarModal() {
  const overlay = document.getElementById("avatarOverlay");
  const statusEl = document.getElementById("avatarStatus");
  statusEl.textContent = "";
  statusEl.className = "form-status";
  document.getElementById("avatarFile").value = "";

  const grid = document.getElementById("avatarPresetGrid");
  grid.innerHTML = "";

  AVATAR_PRESETS.forEach((preset) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "avatar-preset-option";
    if (currentProfile?.avatar_url === preset.file) {
      btn.classList.add("active");
    }

    const img = document.createElement("img");
    img.src = preset.file;
    img.alt = preset.label;

    btn.appendChild(img);
    btn.addEventListener("click", () => selectPresetAvatar(preset));
    grid.appendChild(btn);
  });

  overlay.hidden = false;
}

function closeAvatarModal() {
  document.getElementById("avatarOverlay").hidden = true;
}

async function selectPresetAvatar(preset) {
  const statusEl = document.getElementById("avatarStatus");
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    await saveProfileFields({ avatar_url: preset.file });
    renderProfile();
    refreshAccountButton();
    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
    openAvatarModal();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  }
}

async function handleAvatarFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById("avatarStatus");
  statusEl.textContent = "Uploading...";
  statusEl.className = "form-status";

  try {
    const resized = await resizeImageFile(file, 400, 0.85);
    const arrayBuffer = await resized.arrayBuffer();
    const path = avatarPathForUser("jpg");

    const { error: uploadError } = await supabaseClient.storage
      .from("avatars")
      .upload(path, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseClient.storage.from("avatars").getPublicUrl(path);
    // Bust cache so the new image shows immediately even with same path
    const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await saveProfileFields({ avatar_url: cacheBustedUrl });
    renderProfile();
    refreshAccountButton();

    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't upload. Check console for details.";
    statusEl.className = "form-status form-status-error";
  }
}

function setupProfile() {
  setupProfileSpotlights();
  setupShopsEditor();
  document.getElementById("editBasicsBtn").addEventListener("click", () => toggleProfileEdit("basics", true));
  document.getElementById("cancelBasicsBtn").addEventListener("click", () => toggleProfileEdit("basics", false));
  document.getElementById("basicsForm").addEventListener("submit", handleBasicsSubmit);

  document.getElementById("editWishlistPersonalityBtn").addEventListener("click", () => toggleProfileEdit("wishlistPersonality", true));
  document.getElementById("cancelWishlistPersonalityBtn").addEventListener("click", () => toggleProfileEdit("wishlistPersonality", false));
  document.getElementById("wishlistPersonalityForm").addEventListener("submit", handleWishlistPersonalitySubmit);

  document.getElementById("editTasteBtn").addEventListener("click", () => toggleProfileEdit("taste", true));
  document.getElementById("cancelTasteBtn").addEventListener("click", () => toggleProfileEdit("taste", false));
  document.getElementById("tasteForm").addEventListener("submit", handleTasteSubmit);

  document.getElementById("editSystemBtn").addEventListener("click", () => toggleProfileEdit("system", true));
  document.getElementById("cancelSystemBtn").addEventListener("click", () => toggleProfileEdit("system", false));
  document.getElementById("systemForm").addEventListener("submit", handleSystemSubmit);

  document.getElementById("profileAvatarEditBtn").addEventListener("click", () => openAvatarModal());
  document.getElementById("closeAvatarBtn").addEventListener("click", () => closeAvatarModal());
  document.getElementById("avatarFile").addEventListener("change", handleAvatarFileChange);

  document.getElementById("avatarOverlay").addEventListener("click", (e) => {
    if (e.target.id === "avatarOverlay") closeAvatarModal();
  });
}

// ------------ My Room ------------

const ROOM_THEMES = [
  {
    id: "cozy",
    file: "room-cozy.png",
    label: "Cozy Den",
    frames: [
      { left: 18.099, top: 13.477, width: 10.091, height: 20.312 },
      { left: 31.38, top: 13.574, width: 10.026, height: 20.117 },
      { left: 44.531, top: 13.477, width: 10.156, height: 20.312 },
      { left: 57.747, top: 13.574, width: 9.831, height: 20.117 },
      { left: 70.964, top: 13.574, width: 9.635, height: 20.215 },
    ],
    nowPlaying: {
      left: 77.604,
      top: 48.242,
      width: 11.068,
      height: 13.867,
      clipPath: "polygon(17.75% 0%, 99.41% 8.51%, 84.02% 99.29%, 0% 78.72%)",
    },
    shelves: [
      { left: 23.438, top: 54.688, width: 8.854, height: 12.402 },
      { left: 33.138, top: 54.883, width: 8.854, height: 12.305 },
      { left: 55.99, top: 54.98, width: 9.115, height: 12.5 },
      { left: 65.69, top: 54.883, width: 8.919, height: 12.598 },
    ],
    recordPlayer: { left: 41.536, top: 45.898, width: 15.039, height: 7.812 },
  },
  {
    id: "modern",
    file: "room-modern.png",
    label: "Modern Loft",
    frames: [
      { left: 21.745, top: 13.477, width: 9.375, height: 20.508 },
      { left: 34.375, top: 13.574, width: 9.245, height: 20.41 },
      { left: 46.745, top: 13.77, width: 9.245, height: 20.215 },
      { left: 59.115, top: 13.574, width: 9.18, height: 20.41 },
      { left: 71.159, top: 13.672, width: 9.245, height: 20.41 },
    ],
    nowPlaying: {
      left: 79.167,
      top: 48.438,
      width: 10.417,
      height: 14.258,
      clipPath: "polygon(13.21% 0.69%, 99.37% 8.28%, 84.28% 99.31%, 0.63% 82.76%)",
    },
    shelves: [
      { left: 25.911, top: 54.492, width: 8.333, height: 12.109 },
      { left: 34.505, top: 54.492, width: 8.659, height: 12.109 },
      { left: 57.943, top: 54.492, width: 8.333, height: 12.207 },
      { left: 66.602, top: 54.492, width: 8.203, height: 12.109 },
    ],
    recordPlayer: { left: 42.969, top: 45.117, width: 14.974, height: 8.203 },
  },
  {
    id: "retro",
    file: "room-retro.png",
    label: "Mid-Century Retro",
    frames: [
      { left: 22.526, top: 11.133, width: 9.31, height: 22.559 },
      { left: 34.505, top: 11.035, width: 9.115, height: 22.559 },
      { left: 46.224, top: 11.133, width: 9.375, height: 22.461 },
      { left: 58.333, top: 11.035, width: 8.984, height: 22.559 },
      { left: 70.182, top: 11.133, width: 9.115, height: 22.461 },
    ],
    nowPlaying: {
      left: 80.469,
      top: 50.293,
      width: 11.068,
      height: 16.309,
      clipPath: "polygon(12.43% 0.6%, 99.41% 12.05%, 87.57% 99.4%, 0.59% 80.12%)",
    },
    shelves: [
      { left: 23.438, top: 52.344, width: 9.505, height: 12.5 },
      { left: 33.333, top: 52.539, width: 9.245, height: 13.281 },
      { left: 58.333, top: 52.637, width: 9.31, height: 13.184 },
      { left: 68.099, top: 52.637, width: 9.635, height: 12.207 },
    ],
    recordPlayer: { left: 43.099, top: 42.773, width: 14.844, height: 8.984 },
  },
  {
    id: "rock",
    file: "room-rock.png",
    label: "Classic Rock",
    frames: [
      { left: 22.917, top: 11.23, width: 8.529, height: 21.973 },
      { left: 34.115, top: 11.426, width: 8.464, height: 21.777 },
      { left: 45.182, top: 11.426, width: 8.724, height: 21.582 },
      { left: 56.38, top: 11.426, width: 8.594, height: 21.777 },
      { left: 67.578, top: 11.523, width: 8.333, height: 21.582 },
    ],
    nowPlaying: {
      left: 78.906,
      top: 49.023,
      width: 10.807,
      height: 17.383,
      clipPath: "polygon(13.94% 0.56%, 100% 10.73%, 86.06% 99.44%, 0.61% 82.49%)",
    },
    shelves: [
      { left: 25.13, top: 53.223, width: 8.464, height: 12.402 },
      { left: 34.18, top: 53.125, width: 7.682, height: 12.5 },
      { left: 59.049, top: 52.832, width: 8.073, height: 13.086 },
      { left: 67.969, top: 52.637, width: 8.919, height: 13.281 },
    ],
    recordPlayer: { left: 42.448, top: 41.992, width: 15.495, height: 9.57 },
  },
  {
    id: "punk",
    file: "room-punk.png",
    label: "Punk Record Shop",
    frames: [
      { left: 23.047, top: 11.621, width: 8.073, height: 25.0 },
      { left: 33.594, top: 11.621, width: 8.073, height: 25.0 },
      { left: 44.271, top: 11.621, width: 8.073, height: 25.0 },
      { left: 54.688, top: 11.719, width: 8.073, height: 24.902 },
      { left: 65.039, top: 11.914, width: 8.203, height: 24.609 },
    ],
    nowPlaying: {
      left: 75.977,
      top: 48.828,
      width: 10.026,
      height: 15.234,
      clipPath: "polygon(11.76% 0.65%, 99.35% 10.32%, 84.31% 99.35%, 0.65% 80.65%)",
    },
    shelves: [
      { left: 26.888, top: 55.469, width: 7.487, height: 11.719 },
      { left: 35.091, top: 55.469, width: 7.943, height: 11.816 },
      { left: 55.599, top: 55.176, width: 8.203, height: 12.012 },
      { left: 64.583, top: 55.176, width: 8.268, height: 12.012 },
    ],
    recordPlayer: { left: 41.927, top: 45.312, width: 13.802, height: 8.008 },
  },
  {
    id: "store",
    file: "room-store.png",
    label: "Indie Record Store",
    frames: [
      { left: 22.852, top: 13.086, width: 8.529, height: 21.875 },
      { left: 33.854, top: 13.086, width: 8.594, height: 21.875 },
      { left: 44.922, top: 13.086, width: 8.594, height: 21.875 },
      { left: 56.25, top: 13.086, width: 8.659, height: 21.875 },
      { left: 67.383, top: 13.086, width: 8.724, height: 21.875 },
    ],
    nowPlaying: {
      left: 75.26,
      top: 47.949,
      width: 9.896,
      height: 16.309,
      clipPath: "polygon(16.56% 0.6%, 99.34% 9.04%, 84.77% 99.4%, 0.66% 81.33%)",
    },
    shelves: [
      { left: 23.698, top: 54.004, width: 8.268, height: 12.988 },
      { left: 32.292, top: 54.004, width: 8.268, height: 13.184 },
      { left: 54.948, top: 54.102, width: 8.398, height: 12.988 },
      { left: 64.128, top: 54.199, width: 8.398, height: 12.988 },
    ],
    recordPlayer: { left: 41.016, top: 44.922, width: 13.737, height: 8.105 },
  },
];

function getRoomTheme() {
  const themeId = currentProfile?.room_theme || "cozy";
  return ROOM_THEMES.find((t) => t.id === themeId) || ROOM_THEMES[0];
}

function renderRoom() {
  const theme = getRoomTheme();
  document.getElementById("roomBackgroundImg").src = theme.file;

  renderRoomFrames(theme);
  renderRoomNowPlaying(theme);
  renderRoomShelves(theme);
  renderRoomPlayerHotspot(theme);
}

function getRoomWallAlbums() {
  const favoriteAlbums = currentProfile?.favorite_albums || [];
  const wallAlbums = currentProfile?.room_wall_albums || [];

  // If the user has configured a wall arrangement, use it as-is
  // (it may include empty strings for intentionally blank frames).
  // Otherwise, fall back to the first 5 favorites in order.
  if (wallAlbums.length > 0) {
    return [0, 1, 2, 3, 4].map((i) => wallAlbums[i] || "");
  }
  return [0, 1, 2, 3, 4].map((i) => favoriteAlbums[i] || "");
}

function getRoomShelfBuckets(theme) {
  const allBuckets = currentProfile?.room_shelf_buckets || {};
  const themeBuckets = allBuckets[theme.id] || [];

  // Positionally aligned with theme.shelves. Pad/truncate to match the
  // shelf count for this room, same defensive pattern as the wall frames.
  return theme.shelves.map((_, i) => {
    const bucket = themeBuckets[i];
    return {
      name: bucket?.name || "",
      albums: Array.isArray(bucket?.albums) ? bucket.albums : [],
    };
  });
}

function renderRoomFrames(theme) {
  const container = document.getElementById("roomFrames");
  container.innerHTML = "";

  const wallAlbums = getRoomWallAlbums();
  const meta = currentProfile?.favorite_albums_meta || {};

  theme.frames.forEach((frame, i) => {
    const albumName = wallAlbums[i];
    const albumMeta = albumName ? meta[albumName] : null;

    const el = document.createElement(albumName ? "button" : "div");
    el.className = "room-frame";
    el.style.left = `${frame.left}%`;
    el.style.top = `${frame.top}%`;
    el.style.width = `${frame.width}%`;
    el.style.height = `${frame.height}%`;

    if (albumName) {
      el.type = "button";

      const matchingRecord = allRecords.find(
        (r) => r.album.toLowerCase() === albumName.toLowerCase()
      );
      if (matchingRecord) {
        el.addEventListener("click", () => openRecordDetailModal(matchingRecord.id));
      }

      const coverUrl = albumMeta?.cover_url || matchingRecord?.cover_url || null;
      const artist = albumMeta?.artist || matchingRecord?.artist || null;

      el.title = artist ? `${artist} — ${albumName}` : albumName;

      if (coverUrl) {
        const img = document.createElement("img");
        img.src = coverUrl;
        img.alt = albumName;
        el.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "room-frame-empty";
        const icon = document.createElement("i");
        icon.className = "ti ti-disc";
        icon.setAttribute("aria-hidden", "true");
        placeholder.appendChild(icon);
        el.appendChild(placeholder);
      }
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "room-frame-empty";
      const icon = document.createElement("i");
      icon.className = "ti ti-photo-plus";
      icon.setAttribute("aria-hidden", "true");
      placeholder.appendChild(icon);
      const label = document.createElement("span");
      label.className = "room-frame-empty-label";
      label.textContent = "Favorite an album to display here";
      placeholder.appendChild(label);
      placeholder.title = "Favorite an album from your collection, or use \u201cArrange wall\u201d above, to display it here";
      el.appendChild(placeholder);
    }

    container.appendChild(el);
  });
}

function renderRoomNowPlaying(theme) {
  const wrap = document.getElementById("roomNowPlaying");

  wrap.style.left = `${theme.nowPlaying.left}%`;
  wrap.style.top = `${theme.nowPlaying.top}%`;
  wrap.style.width = `${theme.nowPlaying.width}%`;
  wrap.style.height = `${theme.nowPlaying.height}%`;
  wrap.style.clipPath = theme.nowPlaying.clipPath || "";

  // Positioning is synchronous, but the actual playback content is fetched
  // async — start blank/hidden until we know whether anything's playing.
  wrap.innerHTML = "";
  wrap.hidden = true;

  refreshRoomNowPlayingSign();
}

// Populates the in-room "Now Playing" sign from REAL playback state (not a
// random record from the collection). Blank whenever nothing is actually
// playing. Reused by both the public poll path and instant SDK-driven
// updates from the owner's own session — see renderAllSpotifyNowPlayingSlots.
//
// TODO(apple-music): once native Apple Music playback exists, this sign
// should reflect whichever service is actually playing (Spotify OR Apple
// Music) for the person viewing the room. That likely means this function
// takes a `source` along with `info`, or gets a sibling
// refreshRoomNowPlayingSignFromAppleMusic() that the same broadcast call
// site (renderAllSpotifyNowPlayingSlots, which should be renamed at that
// point) invokes alongside this one.
async function refreshRoomNowPlayingSign(info) {
  const wrap = document.getElementById("roomNowPlaying");
  if (!wrap) return;

  // No info passed in means "go fetch the current public state" — used on
  // initial room load and by the header's poll cadence. SDK-driven updates
  // pass the state directly so this can stay perfectly in sync without an
  // extra round trip. Note: SDK-shaped state has no `connected` field (a
  // live SDK event already implies a connection), so only `playing` is
  // checked here — it's present and meaningful on both shapes.
  const data = info || (await fetchSpotifyNowPlaying());

  if (!data || !data.playing) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    return;
  }

  wrap.innerHTML = "";

  if (data.coverUrl) {
    const img = document.createElement("img");
    img.src = data.coverUrl;
    img.alt = data.album || data.track || "";
    img.className = "room-now-playing-cover";
    wrap.appendChild(img);
  } else {
    const textEl = document.createElement("p");
    textEl.className = "room-now-playing-text";
    textEl.textContent = data.artist ? `${data.artist} — ${data.track}` : data.track || "";
    wrap.appendChild(textEl);
  }

  wrap.title = data.artist ? `${data.artist} — ${data.track}` : data.track || "";
  wrap.hidden = false;
}

function renderRoomShelves(theme) {
  const container = document.getElementById("roomShelves");
  container.innerHTML = "";

  const buckets = getRoomShelfBuckets(theme);

  theme.shelves.forEach((shelf, i) => {
    const bucket = buckets[i];

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room-shelf";
    btn.style.left = `${shelf.left}%`;
    btn.style.top = `${shelf.top}%`;
    btn.style.width = `${shelf.width}%`;
    btn.style.height = `${shelf.height}%`;
    btn.addEventListener("click", () => openShelfBucketModal(i));

    if (bucket.albums.length > 0) {
      btn.classList.add("room-shelf-filled");
      btn.title = bucket.name
        ? `${bucket.name} (${bucket.albums.length} ${bucket.albums.length === 1 ? "album" : "albums"})`
        : `${bucket.albums.length} ${bucket.albums.length === 1 ? "album" : "albums"}`;

      if (bucket.name) {
        const label = document.createElement("span");
        label.className = "room-shelf-label";
        label.textContent = bucket.name;
        btn.appendChild(label);
      }

      const count = document.createElement("span");
      count.className = "room-shelf-count";
      count.textContent = bucket.albums.length;
      btn.appendChild(count);
    } else {
      btn.classList.add("room-shelf-empty");
      btn.title = "Click to organize albums on this shelf";

      const icon = document.createElement("i");
      icon.className = "ti ti-plus room-shelf-empty-icon";
      icon.setAttribute("aria-hidden", "true");
      btn.appendChild(icon);
    }

    container.appendChild(btn);
  });
}

function renderRoomPlayerHotspot(theme) {
  const btn = document.getElementById("roomPlayerHotspot");
  if (!theme.recordPlayer) {
    btn.hidden = true;
    return;
  }

  btn.style.left = `${theme.recordPlayer.left}%`;
  btn.style.top = `${theme.recordPlayer.top}%`;
  btn.style.width = `${theme.recordPlayer.width}%`;
  btn.style.height = `${theme.recordPlayer.height}%`;
  btn.hidden = false;
}

function openRoomThemeModal() {
  const overlay = document.getElementById("roomThemeOverlay");
  const statusEl = document.getElementById("roomThemeStatus");
  statusEl.textContent = "";
  statusEl.className = "form-status";

  const grid = document.getElementById("roomThemeGrid");
  grid.innerHTML = "";

  const currentThemeId = getRoomTheme().id;

  ROOM_THEMES.forEach((theme) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room-theme-option";
    if (theme.id === currentThemeId) btn.classList.add("active");

    const img = document.createElement("img");
    img.src = theme.file;
    img.alt = theme.label;

    const label = document.createElement("span");
    label.className = "room-theme-option-label";
    label.textContent = theme.label;

    btn.appendChild(img);
    btn.appendChild(label);
    btn.addEventListener("click", () => selectRoomTheme(theme));
    grid.appendChild(btn);
  });

  overlay.hidden = false;
}

function closeRoomThemeModal() {
  document.getElementById("roomThemeOverlay").hidden = true;
}

async function selectRoomTheme(theme) {
  const statusEl = document.getElementById("roomThemeStatus");
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    await saveProfileFields({ room_theme: theme.id });
    renderRoom();
    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
    openRoomThemeModal();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  }
}

function setupRoom() {
  document.getElementById("changeRoomThemeBtn").addEventListener("click", () => openRoomThemeModal());
  document.getElementById("closeRoomThemeBtn").addEventListener("click", () => closeRoomThemeModal());

  document.getElementById("roomThemeOverlay").addEventListener("click", (e) => {
    if (e.target.id === "roomThemeOverlay") closeRoomThemeModal();
  });

  document.getElementById("arrangeWallBtn").addEventListener("click", () => openArrangeWallModal());
  document.getElementById("closeArrangeWallBtn").addEventListener("click", () => closeArrangeWallModal());

  document.getElementById("arrangeWallOverlay").addEventListener("click", (e) => {
    if (e.target.id === "arrangeWallOverlay") closeArrangeWallModal();
  });

  document.getElementById("roomPlayerHotspot").addEventListener("click", () => openRoomPlayerModal());
  document.getElementById("closeRoomPlayerBtn").addEventListener("click", () => closeRoomPlayerModal());

  document.getElementById("roomPlayerOverlay").addEventListener("click", (e) => {
    if (e.target.id === "roomPlayerOverlay") closeRoomPlayerModal();
  });

  document.getElementById("closeShelfBucketBtn").addEventListener("click", () => closeShelfBucketModal());

  document.getElementById("shelfBucketOverlay").addEventListener("click", (e) => {
    if (e.target.id === "shelfBucketOverlay") closeShelfBucketModal();
  });

  document.getElementById("shelfBucketNameInput").addEventListener("input", () => saveShelfBucketName());
  document.getElementById("shelfBucketSearchInput").addEventListener("input", () => renderShelfBucketAlbumList());
}

function openRoomPlayerModal() {
  document.getElementById("roomPlayerOverlay").hidden = false;
  renderRoomPlayerModal();
}

function closeRoomPlayerModal() {
  document.getElementById("roomPlayerOverlay").hidden = true;
}

function openArrangeWallModal() {
  const overlay = document.getElementById("arrangeWallOverlay");
  const statusEl = document.getElementById("arrangeWallStatus");
  statusEl.textContent = "";
  statusEl.className = "form-status";

  const container = document.getElementById("arrangeWallSlots");
  container.innerHTML = "";

  const favoriteAlbums = currentProfile?.favorite_albums || [];
  const meta = currentProfile?.favorite_albums_meta || {};
  const wallAlbums = getRoomWallAlbums();

  if (favoriteAlbums.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "Favorite some albums from your collection first, then come back here to arrange them on your wall.";
    container.appendChild(empty);
    overlay.hidden = false;
    return;
  }

  for (let i = 0; i < 5; i++) {
    const row = document.createElement("div");
    row.className = "arrange-wall-slot";

    const label = document.createElement("span");
    label.className = "arrange-wall-slot-label";
    label.textContent = `Frame ${i + 1}`;

    const select = document.createElement("select");
    select.dataset.slotIndex = String(i);

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Empty";
    select.appendChild(emptyOption);

    favoriteAlbums.forEach((albumName) => {
      const option = document.createElement("option");
      option.value = albumName;
      const artist = meta[albumName]?.artist;
      option.textContent = artist ? `${artist} — ${albumName}` : albumName;
      select.appendChild(option);
    });

    select.value = wallAlbums[i] || "";
    select.addEventListener("change", () => saveRoomWallArrangement());

    row.appendChild(label);
    row.appendChild(select);
    container.appendChild(row);
  }

  overlay.hidden = false;
}

function closeArrangeWallModal() {
  document.getElementById("arrangeWallOverlay").hidden = true;
}

async function saveRoomWallArrangement() {
  const statusEl = document.getElementById("arrangeWallStatus");
  const selects = document.querySelectorAll("#arrangeWallSlots select");

  const wallAlbums = Array.from(selects).map((s) => s.value || "");

  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    await saveProfileFields({ room_wall_albums: wallAlbums });
    renderRoomFrames(getRoomTheme());
    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  }
}

// ------------ Shelf buckets ------------

let activeShelfIndex = null;
let shelfBucketBrowsing = false;

function openShelfBucketModal(shelfIndex) {
  activeShelfIndex = shelfIndex;
  shelfBucketBrowsing = false;

  const theme = getRoomTheme();
  const buckets = getRoomShelfBuckets(theme);
  const bucket = buckets[shelfIndex];

  document.getElementById("shelfBucketNameInput").value = bucket.name;
  document.getElementById("shelfBucketSearchInput").value = "";
  document.getElementById("shelfBucketStatus").textContent = "";
  document.getElementById("shelfBucketStatus").className = "form-status";

  // Start in "browse" mode automatically if the shelf is empty, since
  // there's nothing to show in the default in-shelf-only view yet.
  if (bucket.albums.length === 0) shelfBucketBrowsing = true;

  renderShelfBucketAlbumList();

  document.getElementById("shelfBucketOverlay").hidden = false;
}

function closeShelfBucketModal() {
  document.getElementById("shelfBucketOverlay").hidden = true;
  activeShelfIndex = null;
  shelfBucketBrowsing = false;
}

function getUniqueAlbumRecords() {
  // One row per unique album in the user's collection (allRecords may
  // contain duplicates/multiple pressings of the same album).
  const seen = new Set();
  const uniqueAlbums = [];
  allRecords.forEach((r) => {
    const key = r.album.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    uniqueAlbums.push(r);
  });
  return uniqueAlbums;
}

function buildShelfBucketAlbumRow(record, isSelected) {
  const row = document.createElement("label");
  row.className = "shelf-bucket-album-row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isSelected;
  checkbox.addEventListener("change", () => toggleShelfBucketAlbum(record.album, checkbox.checked));

  const info = document.createElement("span");
  info.className = "shelf-bucket-album-info";

  if (record.cover_url) {
    const img = document.createElement("img");
    img.src = record.cover_url;
    img.alt = "";
    img.className = "shelf-bucket-album-cover";
    info.appendChild(img);
  }

  const textWrap = document.createElement("span");
  textWrap.className = "shelf-bucket-album-text-wrap";

  const text = document.createElement("span");
  text.className = "shelf-bucket-album-text";
  text.textContent = `${record.artist} — ${record.album}`;
  textWrap.appendChild(text);

  if (record.genre_name) {
    const genreEl = document.createElement("span");
    genreEl.className = "shelf-bucket-album-genre";
    genreEl.textContent = record.subgenre_name
      ? `${record.genre_name} · ${record.subgenre_name}`
      : record.genre_name;
    textWrap.appendChild(genreEl);
  }

  info.appendChild(textWrap);

  row.appendChild(checkbox);
  row.appendChild(info);
  return row;
}

function renderShelfBucketAlbumList() {
  if (activeShelfIndex === null) return;

  const theme = getRoomTheme();
  const buckets = getRoomShelfBuckets(theme);
  const bucket = buckets[activeShelfIndex];
  const selectedNames = bucket.albums;
  const selectedLower = new Set(selectedNames.map((a) => a.toLowerCase()));

  const uniqueAlbums = getUniqueAlbumRecords();
  const byAlbumLower = new Map(uniqueAlbums.map((r) => [r.album.toLowerCase(), r]));

  const list = document.getElementById("shelfBucketAlbumList");
  list.innerHTML = "";

  const browseToggleRow = document.createElement("div");
  browseToggleRow.className = "shelf-bucket-browse-toggle";
  const browseBtn = document.createElement("button");
  browseBtn.type = "button";
  browseBtn.className = "link-btn";
  browseBtn.textContent = shelfBucketBrowsing ? "Hide collection browser" : "Add more albums";
  browseBtn.addEventListener("click", () => {
    shelfBucketBrowsing = !shelfBucketBrowsing;
    renderShelfBucketAlbumList();
  });
  browseToggleRow.appendChild(browseBtn);

  // --- "In this shelf" section: always shown when non-empty ---
  if (selectedNames.length > 0) {
    const inHeader = document.createElement("p");
    inHeader.className = "shelf-bucket-section-header";
    inHeader.textContent = `In this shelf (${selectedNames.length})`;
    list.appendChild(inHeader);

    const inSection = document.createElement("div");
    inSection.className = "shelf-bucket-section shelf-bucket-section-in";

    selectedNames.forEach((albumName) => {
      const record = byAlbumLower.get(albumName.toLowerCase()) || {
        artist: "",
        album: albumName,
        cover_url: null,
        genre_name: "",
        subgenre_name: "",
      };
      inSection.appendChild(buildShelfBucketAlbumRow(record, true));
    });

    list.appendChild(inSection);
    list.appendChild(browseToggleRow);
  } else {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "Nothing on this shelf yet. Add some albums below.";
    list.appendChild(empty);
  }

  if (!shelfBucketBrowsing) return;

  // --- Browse/search section: only rendered when explicitly opened ---
  const query = document.getElementById("shelfBucketSearchInput").value.trim().toLowerCase();

  const outHeader = document.createElement("p");
  outHeader.className = "shelf-bucket-section-header";
  outHeader.textContent = "Add from your collection";
  list.appendChild(outHeader);

  const filtered = uniqueAlbums
    .filter((r) => !selectedLower.has(r.album.toLowerCase()))
    .filter((r) => {
      if (!query) return true;
      return (
        r.album.toLowerCase().includes(query) ||
        r.artist.toLowerCase().includes(query) ||
        (r.genre_name || "").toLowerCase().includes(query) ||
        (r.subgenre_name || "").toLowerCase().includes(query)
      );
    })
    .sort((a, b) => a.album.localeCompare(b.album));

  const outSection = document.createElement("div");
  outSection.className = "shelf-bucket-section shelf-bucket-section-out";

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = allRecords.length === 0
      ? "Add some records to your collection first, then come back here to build this shelf."
      : query
        ? "No albums match that search."
        : "Every album in your collection is already on this shelf.";
    outSection.appendChild(empty);
  } else {
    filtered.forEach((record) => {
      outSection.appendChild(buildShelfBucketAlbumRow(record, false));
    });
  }

  list.appendChild(outSection);
}

async function toggleShelfBucketAlbum(albumName, isSelected) {
  if (activeShelfIndex === null) return;

  const theme = getRoomTheme();
  const allBuckets = { ...(currentProfile?.room_shelf_buckets || {}) };
  const themeBuckets = getRoomShelfBuckets(theme);

  const current = themeBuckets[activeShelfIndex];
  const updatedAlbums = isSelected
    ? [...current.albums, albumName]
    : current.albums.filter((a) => a.toLowerCase() !== albumName.toLowerCase());

  themeBuckets[activeShelfIndex] = { name: current.name, albums: updatedAlbums };
  allBuckets[theme.id] = themeBuckets;

  await saveShelfBuckets(allBuckets);
  renderShelfBucketAlbumList();
}

async function saveShelfBucketName() {
  if (activeShelfIndex === null) return;

  const theme = getRoomTheme();
  const allBuckets = { ...(currentProfile?.room_shelf_buckets || {}) };
  const themeBuckets = getRoomShelfBuckets(theme);

  const name = document.getElementById("shelfBucketNameInput").value.trim();
  const current = themeBuckets[activeShelfIndex];

  themeBuckets[activeShelfIndex] = { name, albums: current.albums };
  allBuckets[theme.id] = themeBuckets;

  await saveShelfBuckets(allBuckets);
}

async function saveShelfBuckets(allBuckets) {
  const statusEl = document.getElementById("shelfBucketStatus");
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    await saveProfileFields({ room_shelf_buckets: allBuckets });
    renderRoomShelves(getRoomTheme());
    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  }
}

function resetSessionUiState() {
  // Clear any transient UI left over from a previous account/session
  spotlightRecordId = null;
  artistFilter = null;
  yearFilter = null;

  const recommendationsList = document.getElementById("recommendationsList");
  const recommendationsStatus = document.getElementById("recommendationsStatus");
  if (recommendationsList) recommendationsList.innerHTML = "";
  if (recommendationsStatus) {
    recommendationsStatus.textContent = "";
    recommendationsStatus.className = "form-status";
  }

  const searchInput = document.getElementById("searchInput");
  const genreFilter = document.getElementById("genreFilter");
  const subgenreFilter = document.getElementById("subgenreFilter");
  const ratingFilter = document.getElementById("ratingFilter");
  if (searchInput) searchInput.value = "";
  if (genreFilter) genreFilter.value = "";
  if (subgenreFilter) subgenreFilter.value = "";
  if (ratingFilter) ratingFilter.value = "";
}

function goToChart(canvasId) {
  setPage("collection");
  requestAnimationFrame(() => {
    const canvas = document.getElementById(canvasId);
    const card = canvas ? canvas.closest(".chart-card") : null;
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("highlight");
    setTimeout(() => card.classList.remove("highlight"), 1200);
  });
}

// ------------ AI Recommendations ------------

function buildTasteProfile() {
  const loved = allRecords
    .filter((r) => r.rating === "love")
    .map((r) => ({ artist: r.artist, album: r.album, genre: r.genre_name, subgenre: r.subgenre_name }));

  const liked = allRecords
    .filter((r) => r.rating === "like")
    .map((r) => ({ artist: r.artist, album: r.album, genre: r.genre_name, subgenre: r.subgenre_name }));

  const ownedArtists = Array.from(new Set(allRecords.map((r) => r.artist)));

  const genreCounts = {};
  allRecords.forEach((r) => {
    if (r.genre_name) genreCounts[r.genre_name] = (genreCounts[r.genre_name] || 0) + 1;
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return { loved, liked, ownedArtists, topGenres };
}

async function handleGetRecommendations(
  btnId = "getRecommendationsBtn",
  statusId = "recommendationsStatus",
  listId = "recommendationsList"
) {
  const btn = document.getElementById(btnId);
  const statusEl = document.getElementById(statusId);
  const list = document.getElementById(listId);

  if (!btn || !statusEl || !list) return;

  const profile = buildTasteProfile();

  if (profile.loved.length === 0 && profile.liked.length === 0) {
    statusEl.textContent = 'Rate some albums "Love" or "Like" first so we have something to base suggestions on.';
    statusEl.className = "form-status form-status-error";
    return;
  }

  btn.disabled = true;
  statusEl.textContent = "Thinking about what you might enjoy...";
  statusEl.className = "form-status";
  list.innerHTML = "";

  try {
    const response = await fetch(RECOMMENDATIONS_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(profile),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Request failed (${response.status})`);
    }

    const suggestions = result.suggestions || [];

    if (suggestions.length === 0) {
      statusEl.textContent = "No suggestions came back. Try again in a moment.";
      statusEl.className = "form-status";
      return;
    }

    statusEl.textContent = "";

    const activeSuggestions = suggestions.filter(
      (s) =>
        !isSuggestionDismissed(s.artist, s.album) &&
        !isAlbumOwned(s.artist, s.album) &&
        !isAlbumOnWishlist(s.artist, s.album)
    );

    if (activeSuggestions.length === 0) {
      statusEl.textContent = "All suggestions are already in your collection or wishlist — try dismissing some or getting a fresh set.";
      return;
    }

    activeSuggestions.forEach((s) => {
      list.appendChild(buildMoreLikeThisCard(s, profile));
    });
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't get recommendations. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    btn.disabled = false;
  }
}

async function findRecommendationSong(suggestion, wrap, btn) {
  btn.disabled = true;
  btn.textContent = "Looking up...";

  try {
    const song = await fetchNotableSong(suggestion.artist, suggestion.album);
    wrap.innerHTML = "";
    wrap.appendChild(buildSongLink(suggestion.artist, song, "spotlight-song-link recommendation-song-link"));
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "Find a notable track";
    const errEl = document.createElement("p");
    errEl.className = "spotlight-error";
    errEl.textContent = `Couldn't find a track suggestion (${err.message || err}).`;
    wrap.appendChild(errEl);
  }
}

async function addRecommendationToWishlist(artist, album, btn) {
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const { data, error } = await supabaseClient
      .from("wishlist")
      .insert({
        artist,
        album,
        year: null,
        label: null,
        genre_id: null,
        subgenre_id: null,
        notes: "Suggested by Spin Vinyl",
        cover_url: null,
        discogs_release_id: null,
      })
      .select(
        `
        id,
        artist,
        album,
        year,
        label,
        genre_id,
        subgenre_id,
        discogs_release_id,
        cover_url,
        notes,
        added_at,
        price_data,
        price_currency,
        price_checked_at
      `
      )
      .single();

    if (error) throw error;

    const enriched = { ...data, genre_name: "", subgenre_name: "" };
    wishlist.unshift(enriched);

    btn.textContent = "Added \u2713";

    // Try to find a Discogs match/cover in the background
    findWishlistDiscogsMatch(data.id).then(() => {
      if (currentPage === "wishlist") render();
      if (currentPage === "home") renderWishlistHighlights();
    });

    if (currentPage === "home") renderWishlistHighlights();
  } catch (err) {
    console.error(err);
    btn.textContent = "Error";
    btn.disabled = false;
  }
}

// ------------ "More like this" recommendations (shared) ------------

// Normalizes a title/name for fuzzy comparison: lowercases, strips
// parenthetical/bracketed suffixes (remaster notes, "(Mono)", reissue labels,
// etc.), strips punctuation, and collapses whitespace. This is deliberately
// loose because real-world catalog data rarely matches character-for-character
// even when it's clearly "the same album" (e.g. "Waltz for Debby" vs.
// "Waltz for Debby (Original Jazz Classics Remaster)").
function normalizeForMatch(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[\(\[][^)\]]*[\)\]]/g, " ") // drop (...) and [...] content
    .replace(/[^a-z0-9\s]/g, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// Strips a trailing ensemble word (Trio, Quartet, Orchestra, etc.) and a
// leading "The" so artist-name formatting differences don't block a match.
function normalizeArtistForMatch(str) {
  let s = normalizeForMatch(str);
  s = s.replace(/^the\s+/, "");
  s = s.replace(/\s+(trio|quartet|quintet|orchestra|band|ensemble|group|sextet|septet|big band)$/, "");
  return s.trim();
}

function titlesLooselyMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  // Treat as a match if one normalized title contains the other as a whole
  // word sequence - catches "Night Train" vs "Night Train (Deluxe Edition)"
  // after parenthetical-stripping still leaving minor trailing differences.
  return a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a));
}

function isAlbumOwned(artist, album) {
  const a = normalizeArtistForMatch(artist);
  const b = normalizeForMatch(album);
  if (!a || !b) return false;
  return allRecords.some((r) => {
    const ra = normalizeArtistForMatch(r.artist);
    const rb = normalizeForMatch(r.album);
    return ra === a && titlesLooselyMatch(rb, b);
  });
}

function isAlbumOnWishlist(artist, album) {
  const a = normalizeArtistForMatch(artist);
  const b = normalizeForMatch(album);
  if (!a || !b) return false;
  return wishlist.some((w) => {
    const wa = normalizeArtistForMatch(w.artist);
    const wb = normalizeForMatch(w.album);
    return wa === a && titlesLooselyMatch(wb, b);
  });
}

// ---- Persistent suggestion dismissal ----
//
// Dismissed suggestions are stored in localStorage so they survive
// page reloads and are filtered out of future "Get suggestions" results.
// Key format: spin-dismissed-suggestions (JSON array of "artist|album" strings).
// Stored client-side (not DB) since this is a personal preference that
// doesn't need to sync across devices.

const DISMISSED_SUGGESTIONS_KEY = "spin-dismissed-suggestions";

function getDismissedSuggestions() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_SUGGESTIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function makeSuggestionKey(artist, album) {
  return `${(artist || "").toLowerCase().trim()}|${(album || "").toLowerCase().trim()}`;
}

function isSuggestionDismissed(artist, album) {
  const key = makeSuggestionKey(artist, album);
  return getDismissedSuggestions().includes(key);
}

function persistDismissSuggestion(artist, album) {
  const key = makeSuggestionKey(artist, album);
  const dismissed = getDismissedSuggestions();
  if (!dismissed.includes(key)) {
    dismissed.push(key);
    // Cap at 500 entries so localStorage doesn't grow unbounded
    const capped = dismissed.slice(-500);
    try {
      localStorage.setItem(DISMISSED_SUGGESTIONS_KEY, JSON.stringify(capped));
    } catch {
      // localStorage can fail in private/incognito if storage quota is exceeded
    }
  }
}

// Generates a "Because you liked..." hook for a suggestion by matching
// it against the current taste profile (loved/liked records + top genres).
// Deterministic — no AI call needed since the profile data is already loaded.
function generateBecauseText(suggestion, profile) {
  if (!profile) return null;

  const loved = profile.loved || [];
  const liked = profile.liked || [];
  const topGenres = profile.topGenres || [];

  // The suggestion's own subgenre/genre isn't returned by the AI, so we
  // derive the connection from the taste profile data we do have:

  // 1. If the top genre is explicitly named in the AI's reason, use it —
  //    the AI chose to mention it, so it's genuinely the reason.
  //    Only use genres here (not artist names), since artist mentions in
  //    AI reason text can be incidental comparisons ("Fans of AC/DC...").
  const reasonLower = (suggestion.reason || "").toLowerCase();

  const lovedGenreInReason = loved.find(
    (r) => r.genre && r.genre.length > 3 && reasonLower.includes(r.genre.toLowerCase())
  );
  if (lovedGenreInReason) return `Because you love ${lovedGenreInReason.genre}`;

  const topGenreInReason = topGenres.find(
    (g) => g && g.length > 3 && reasonLower.includes(g.toLowerCase())
  );
  if (topGenreInReason) return `Because of your love of ${topGenreInReason}`;

  // 2. Subgenre match
  const lovedSubgenreInReason = loved.find(
    (r) => r.subgenre && r.subgenre.length > 3 && reasonLower.includes(r.subgenre.toLowerCase())
  );
  if (lovedSubgenreInReason) return `Because you love ${lovedSubgenreInReason.subgenre}`;

  // 3. Fallback: top genre regardless of whether it appears in the reason
  if (topGenres.length > 0) return `Because of your taste in ${topGenres[0]}`;

  return null;
}

function buildMoreLikeThisCard(suggestion, profile) {
  const card = document.createElement("div");
  card.className = "recommendation-card";

  const owned = isAlbumOwned(suggestion.artist, suggestion.album);
  const onWishlist = !owned && isAlbumOnWishlist(suggestion.artist, suggestion.album);

  // Dismiss button — top-right X, persists so it won't resurface
  const dismissBtn = document.createElement("button");
  dismissBtn.type = "button";
  dismissBtn.className = "recommendation-dismiss";
  dismissBtn.setAttribute("aria-label", "Dismiss suggestion");
  dismissBtn.textContent = "×";
  dismissBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    persistDismissSuggestion(suggestion.artist, suggestion.album);
    card.style.transition = "opacity 0.2s ease";
    card.style.opacity = "0";
    setTimeout(() => card.remove(), 200);
  });
  card.appendChild(dismissBtn);

  const artistEl = document.createElement("div");
  artistEl.className = "recommendation-artist";
  artistEl.textContent = suggestion.artist;

  const albumEl = document.createElement("div");
  albumEl.className = "recommendation-album";
  albumEl.textContent = suggestion.album;

  const reasonEl = document.createElement("div");
  reasonEl.className = "recommendation-reason";
  reasonEl.textContent = suggestion.reason || "";

  card.appendChild(artistEl);
  card.appendChild(albumEl);

  // "Because you liked..." hook — shown before the description in gold italics
  const becauseText = generateBecauseText(suggestion, profile);
  if (becauseText) {
    const becauseEl = document.createElement("div");
    becauseEl.className = "recommendation-because";
    becauseEl.textContent = becauseText;
    card.appendChild(becauseEl);
  }

  card.appendChild(reasonEl);

  if (owned) {
    const ownedEl = document.createElement("div");
    ownedEl.className = "recommendation-owned-tag";
    ownedEl.textContent = "Already in your collection";
    card.appendChild(ownedEl);
  } else if (onWishlist) {
    const wishlistEl = document.createElement("div");
    wishlistEl.className = "recommendation-wishlist-tag";
    wishlistEl.textContent = "Already on your wishlist";
    card.appendChild(wishlistEl);
  } else {
    const actions = document.createElement("div");
    actions.className = "recommendation-actions";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-secondary";
    addBtn.textContent = "Add to Wishlist";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addRecommendationToWishlist(suggestion.artist, suggestion.album, addBtn);
    });

    const songBtn = document.createElement("button");
    songBtn.type = "button";
    songBtn.className = "btn-secondary";
    songBtn.textContent = "Find a notable track";

    const songWrap = document.createElement("div");
    songWrap.className = "recommendation-song-wrap";

    songBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      findRecommendationSong(suggestion, songWrap, songBtn);
    });

    actions.appendChild(addBtn);
    actions.appendChild(songBtn);
    card.appendChild(actions);
    card.appendChild(songWrap);
  }

  return card;
}

async function fetchMoreLikeThis(artist, album, label) {
  const response = await fetch(RECOMMENDATIONS_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ mode: "similar", artist, album, label: label || null }),
  });

  const result = await response.json();
  console.log("More like this debug:", result);

  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }

  return result;
}

function buildMoreLikeThisBucket(title, items) {
  const bucket = document.createElement("div");
  bucket.className = "more-like-this-bucket";

  const heading = document.createElement("h4");
  heading.className = "more-like-this-heading";
  heading.textContent = title;
  bucket.appendChild(heading);

  if (!items || items.length === 0) {
    const emptyEl = document.createElement("p");
    emptyEl.className = "empty-hint";
    emptyEl.textContent = "Nothing to suggest here yet.";
    bucket.appendChild(emptyEl);
    return bucket;
  }

  const grid = document.createElement("div");
  grid.className = "more-like-this-grid";
  items.forEach((s) => grid.appendChild(buildMoreLikeThisCard(s, null)));
  bucket.appendChild(grid);

  return bucket;
}

function buildVinylSpinner(label = "Finding similar albums...") {
  const wrap = document.createElement("div");
  wrap.className = "vinyl-spinner";

  // SVG vinyl record: outer gold ring, grooves, and a center label bearing
  // the Spin wordmark in the brand's script style - reads like a real LP
  // label spinning on a turntable rather than a generic loading icon.
  wrap.innerHTML = `
    <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- Outer edge / gold rim -->
      <circle cx="64" cy="64" r="61" fill="#1a1208" stroke="#caa15a" stroke-width="3"/>
      <!-- Grooves (concentric rings, slightly lighter than the base) -->
      <circle cx="64" cy="64" r="55" fill="none" stroke="#2a2010" stroke-width="0.9"/>
      <circle cx="64" cy="64" r="49" fill="none" stroke="#2a2010" stroke-width="0.9"/>
      <circle cx="64" cy="64" r="43" fill="none" stroke="#2a2010" stroke-width="0.9"/>
      <circle cx="64" cy="64" r="37" fill="none" stroke="#2a2010" stroke-width="0.9"/>
      <!-- Label area (center circle, golden) -->
      <circle cx="64" cy="64" r="30" fill="#8a5a1a" stroke="#caa15a" stroke-width="1.5"/>
      <circle cx="64" cy="64" r="25" fill="none" stroke="#caa15a" stroke-width="0.6" opacity="0.5"/>
      <!-- Spin wordmark on the label -->
      <text x="64" y="70" text-anchor="middle" class="vinyl-spinner-wordmark">Spin</text>
      <!-- Spindle hole -->
      <circle cx="64" cy="64" r="3.5" fill="#020617"/>
    </svg>
    <span class="vinyl-spinner-label">${label}</span>
  `;

  return wrap;
}

async function loadMoreLikeThis(record, wrap, btn) {
  btn.disabled = true;
  btn.textContent = "Loading...";
  wrap.innerHTML = "";
  wrap.appendChild(buildVinylSpinner("Finding similar albums..."));

  try {
    const result = await fetchMoreLikeThis(record.artist, record.album, record.label);

    wrap.innerHTML = "";
    wrap.appendChild(buildMoreLikeThisBucket(`More like "${record.album}"`, result.similarAlbums));
    wrap.appendChild(buildMoreLikeThisBucket(`More from ${record.artist}`, result.moreFromArtist));
    if (record.label) {
      wrap.appendChild(buildMoreLikeThisBucket(`Also on ${record.label}`, result.labelPicks));
    }

    btn.textContent = "Refresh suggestions";
    btn.disabled = false;
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.textContent = "More like this";
    wrap.innerHTML = "";
    const errEl = document.createElement("p");
    errEl.className = "spotlight-error";
    errEl.textContent = `Couldn't load suggestions (${err.message || err}).`;
    wrap.appendChild(errEl);
  }
}



// ------------ Collection superlatives ------------

function computeCollectionStats() {
  const total = allRecords.length;

  const genreCounts = {};
  const subgenreCounts = {};
  const labelCounts = {};
  const artistCounts = {};
  const decadeCounts = {};
  const ratingCounts = { love: 0, like: 0, neutral: 0, dislike: 0, unrated: 0 };
  let storyCount = 0;

  allRecords.forEach((r) => {
    if (r.genre_name) genreCounts[r.genre_name] = (genreCounts[r.genre_name] || 0) + 1;
    if (r.subgenre_name) subgenreCounts[r.subgenre_name] = (subgenreCounts[r.subgenre_name] || 0) + 1;
    if (r.label) labelCounts[r.label] = (labelCounts[r.label] || 0) + 1;
    if (r.artist) artistCounts[r.artist] = (artistCounts[r.artist] || 0) + 1;
    if (r.year) {
      const decade = Math.floor(r.year / 10) * 10;
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
    }
    if (r.rating && ratingCounts.hasOwnProperty(r.rating)) {
      ratingCounts[r.rating]++;
    } else {
      ratingCounts.unrated++;
    }
    if (r.acquired_date || r.acquired_location || r.listening_notes || r.personal_story) {
      storyCount++;
    }
  });

  const ranked = (counts) =>
    Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  const genreRanked = ranked(genreCounts);
  const subgenreRanked = ranked(subgenreCounts);
  const labelRanked = ranked(labelCounts);
  const artistRanked = ranked(artistCounts);

  const topGenre = genreRanked[0] || null;
  const secondGenre = genreRanked[1] || null;
  const topSubgenre = subgenreRanked[0] || null;
  const topLabel = labelRanked[0] || null;
  const secondLabel = labelRanked[1] || null;
  const topArtist = artistRanked[0] || null;
  const secondArtist = artistRanked[1] || null;

  const distinctGenres = genreRanked.length;
  const distinctLabels = labelRanked.length;
  const distinctArtists = artistRanked.length;
  const distinctDecades = Object.keys(decadeCounts).length;

  return {
    total,
    topGenre,
    topGenreShare: topGenre && total ? topGenre.count / total : 0,
    secondGenre,
    topSubgenre,
    topLabel,
    topLabelShare: topLabel && total ? topLabel.count / total : 0,
    secondLabel,
    topArtist,
    secondArtist,
    distinctGenres,
    distinctLabels,
    distinctArtists,
    distinctDecades,
    ratingCounts,
    ratedCount: total - ratingCounts.unrated,
    storyCount,
    storyShare: total ? storyCount / total : 0,
  };
}

// Curated genre/subgenre/label -> evocative title overrides. Falls back to a
// generic "{Name} Devotee" / "{Name} Loyalist" pattern when nothing more
// specific is defined, so any genre or label still gets a sensible title.
const GENRE_SUPERLATIVES = {
  Jazz: "Jazz Explorer",
  Blues: "Blues Traveler",
  Rock: "Arena Rocker",
  "Hard Rock": "Arena Rocker",
  "Classic Rock": "Classic Rock Lifer",
  "Prog Rock": "Prog Voyager",
  "Psychedelic Rock": "Acid Trip Curator",
  Metal: "Headbanger",
  Punk: "Basement Show Regular",
  "Hip Hop": "Crate Digger",
  Hip: "Crate Digger",
  Rap: "Crate Digger",
  Soul: "Soul Searcher",
  Funk: "Funk Disciple",
  Reggae: "Skank Enthusiast",
  Electronic: "Synth Voyager",
  House: "Late Night DJ",
  Techno: "Warehouse Regular",
  Classical: "Concert Hall Regular",
  Folk: "Front Porch Picker",
  Country: "Backroads Wanderer",
  "R&B": "Late Night Soul",
  Disco: "Dance Floor Veteran",
  Pop: "Pop Connoisseur",
  Indie: "Indie Tastemaker",
  "Singer-Songwriter": "Lyric Listener",
  World: "Global Listener",
  Latin: "Global Listener",
  Gospel: "Sunday Morning Soul",
};

const SUBGENRE_SUPERLATIVES = {
  // Jazz
  Bebop: "Bebop Scholar",
  "Hard Bop": "Hard Bop Scholar",
  "Modal Jazz": "Modal Jazz Devotee",
  Fusion: "Fusion Head",
  "Free Jazz": "Free Jazz Adventurer",
  "Cool Jazz": "Cool Jazz Devotee",
  "Smooth Jazz": "Smooth Jazz Regular",

  // Blues / Soul / Roots
  "Delta Blues": "Delta Blues Pilgrim",
  "Chicago Blues": "Chicago Blues Faithful",
  "Electric Blues": "Electric Blues Disciple",
  "Bossa Nova": "Bossa Nova Romantic",
  "Bluegrass": "Bluegrass Picker",
  "Northern Soul": "Northern Soul Faithful",
  "Southern Soul": "Southern Soul Faithful",

  // Rock / Indie / Alt
  "New Wave": "New Wave Kid",
  "Post-Punk": "Post-Punk Purist",
  Grunge: "Flannel & Feedback",
  Shoegaze: "Shoegaze Dreamer",
  "Math Rock": "Math Rock Theorist",
  Emo: "Emo Lifer",
  "Lo-fi": "Lo-fi Loyalist",
  "Dream Pop": "Dream Pop Romantic",
  "Garage Rock": "Garage Rock Regular",
  "Surf Rock": "Surf Rock Wanderer",

  // Metal
  "Death Metal": "Death Metal Disciple",
  "Black Metal": "Black Metal Initiate",
  Thrash: "Thrash Survivor",
  "Doom Metal": "Doom Metal Pilgrim",
  "Power Metal": "Power Metal Champion",
  Sludge: "Sludge Devotee",
  "Nu Metal": "Nu Metal Throwback",
  Metalcore: "Metalcore Regular",
  "Progressive Metal": "Prog Metal Theorist",

  // Punk / Hardcore
  "Hardcore Punk": "Hardcore Lifer",
  "Ska Punk": "Ska Punk Skanker",
  "Pop Punk": "Pop Punk Kid",
  "Crust Punk": "Crust Punk Diehard",
  "Street Punk": "Street Punk Regular",

  // Electronic
  "Drum and Bass": "D&B Selector",
  "Drum & Bass": "D&B Selector",
  Ambient: "Ambient Drifter",
  IDM: "IDM Theorist",
  Trance: "Trance Pilgrim",
  Dubstep: "Dubstep Disciple",
  Synthwave: "Synthwave Dreamer",
  Industrial: "Industrial Devotee",
  "Deep House": "Deep House Regular",
  Electro: "Electro Disciple",
  Breakbeat: "Breakbeat Veteran",

  // Hip-Hop
  "Boom Bap": "Boom Bap Purist",
  Trap: "Trap Regular",
  "Conscious Hip Hop": "Conscious Listener",
  "East Coast Hip Hop": "East Coast Loyalist",
  "West Coast Hip Hop": "West Coast Loyalist",
  "Southern Hip Hop": "Dirty South Devotee",
  "Gangsta Rap": "Gangsta Rap Veteran",

  // World / Latin
  Afrobeat: "Afrobeat Devotee",
  Cumbia: "Cumbia Dancer",
  Reggaeton: "Reggaeton Regular",
  "K-Pop": "K-Pop Stan",
  Salsa: "Salsa Dancer",
  Highlife: "Highlife Devotee",
};

const LABEL_SUPERLATIVES = {
  // Jazz
  "Blue Note": "Blue Note Connoisseur",
  Verve: "Verve Devotee",
  Prestige: "Prestige Purist",
  "Riverside": "Riverside Regular",
  Impulse: "Impulse! Acolyte",
  "Impulse!": "Impulse! Acolyte",
  ECM: "ECM Purist",

  // Soul / Blues / Early Rock
  Atlantic: "Atlantic Loyalist",
  Motown: "Motown Faithful",
  Stax: "Stax Soul Patrol",
  Chess: "Chess Records Faithful",
  Columbia: "Columbia Regular",
  "Sun Records": "Sun Records Pilgrim",

  // Indie / Alt
  "Sub Pop": "Sub Pop Disciple",
  "4AD": "4AD Aesthete",
  Factory: "Factory Records Faithful",
  Matador: "Matador Regular",
  Merge: "Merge Records Faithful",
  "Saddle Creek": "Saddle Creek Loyalist",
  Jagjaguwar: "Jagjaguwar Devotee",

  // Metal
  Earache: "Earache Disciple",
  Roadrunner: "Roadrunner Loyalist",
  "Nuclear Blast": "Nuclear Blast Faithful",
  "Metal Blade": "Metal Blade Veteran",
  Relapse: "Relapse Records Faithful",
  "Century Media": "Century Media Devotee",

  // Punk / Hardcore
  Epitaph: "Epitaph Regular",
  "Fat Wreck Chords": "Fat Wreck Loyalist",
  Dischord: "Dischord Purist",
  SST: "SST Diehard",

  // Electronic
  Warp: "Warp Records Head",
  "Ninja Tune": "Ninja Tune Regular",
  Hyperdub: "Hyperdub Disciple",
  Kompakt: "Kompakt Devotee",
  Mute: "Mute Records Loyalist",

  // Hip-Hop
  "Def Jam": "Def Jam Loyalist",
  "Death Row": "Death Row Devotee",
  Rawkus: "Rawkus Regular",
  "Stones Throw": "Stones Throw Disciple",
  "Top Dawg": "TDE Faithful",
  "Cash Money": "Cash Money Loyalist",
};

function titleForGenre(name) {
  return GENRE_SUPERLATIVES[name] || `${name} Devotee`;
}

function titleForSubgenre(name) {
  return SUBGENRE_SUPERLATIVES[name] || `${name} Enthusiast`;
}

function titleForLabel(name) {
  return LABEL_SUPERLATIVES[name] || `${name} Loyalist`;
}

function buildSuperlatives() {
  const stats = computeCollectionStats();
  const candidates = [];

  if (stats.total === 0) return [];

  // --- Genre-based ---

  if (stats.topGenre && stats.topGenreShare >= 0.2) {
    candidates.push({
      category: "genre",
      title: titleForGenre(stats.topGenre.name),
      detail: `${Math.round(stats.topGenreShare * 100)}% of your collection is ${stats.topGenre.name}`,
      strength: stats.topGenreShare + 0.2,
    });
  }

  if (
    stats.secondGenre &&
    stats.total >= 10 &&
    stats.secondGenre.count >= 3 &&
    stats.secondGenre.name !== stats.topGenre?.name
  ) {
    candidates.push({
      category: "genre",
      title: titleForGenre(stats.secondGenre.name),
      detail: `Your second-favorite genre, with ${stats.secondGenre.count} records`,
      strength: (stats.secondGenre.count / stats.total) * 0.7,
    });
  }

  if (stats.topSubgenre && stats.topSubgenre.count >= 3) {
    candidates.push({
      category: "genre",
      title: titleForSubgenre(stats.topSubgenre.name),
      detail: `${stats.topSubgenre.count} records in ${stats.topSubgenre.name}`,
      strength: (stats.topSubgenre.count / stats.total) * 0.9,
    });
  }

  if (stats.distinctGenres >= 6 && stats.topGenreShare < 0.25 && stats.total >= 15) {
    candidates.push({
      category: "genre",
      title: "Genre Omnivore",
      detail: `${stats.distinctGenres} different genres across your shelves`,
      strength: Math.min(stats.distinctGenres / 12, 1),
    });
  }

  // --- Artist-based ---

  if (stats.topArtist && stats.topArtist.count >= 4) {
    candidates.push({
      category: "artist",
      title: "Completist",
      detail: `${stats.topArtist.count} albums by ${stats.topArtist.name}`,
      strength: Math.min(stats.topArtist.count / 10, 1) + 0.15,
    });
  }

  if (
    stats.secondArtist &&
    stats.secondArtist.count >= 3 &&
    stats.secondArtist.name !== stats.topArtist?.name
  ) {
    candidates.push({
      category: "artist",
      title: "Devoted Fan",
      detail: `${stats.secondArtist.count} albums by ${stats.secondArtist.name}`,
      strength: Math.min(stats.secondArtist.count / 10, 1),
    });
  }

  if (stats.distinctArtists >= 20 && stats.total >= 25) {
    const ratio = stats.distinctArtists / stats.total;
    if (ratio >= 0.7) {
      candidates.push({
        category: "artist",
        title: "Wide Net Collector",
        detail: `${stats.distinctArtists} different artists, rarely repeating`,
        strength: ratio * 0.8,
      });
    }
  }

  // --- Label-based ---

  if (stats.topLabel && stats.topLabelShare >= 0.12 && stats.topLabel.count >= 3) {
    candidates.push({
      category: "label",
      title: titleForLabel(stats.topLabel.name),
      detail: `${stats.topLabel.count} records on ${stats.topLabel.name}`,
      strength: stats.topLabelShare + 0.15,
    });
  }

  if (
    stats.secondLabel &&
    stats.secondLabel.count >= 3 &&
    stats.secondLabel.name !== stats.topLabel?.name
  ) {
    candidates.push({
      category: "label",
      title: titleForLabel(stats.secondLabel.name),
      detail: `${stats.secondLabel.count} more records on ${stats.secondLabel.name}`,
      strength: (stats.secondLabel.count / stats.total) * 0.6,
    });
  }

  if (stats.distinctLabels >= 10 && stats.topLabelShare < 0.12 && stats.total >= 15) {
    candidates.push({
      category: "label",
      title: "Crate Variety",
      detail: `${stats.distinctLabels} different labels represented`,
      strength: Math.min(stats.distinctLabels / 20, 1),
    });
  }

  // --- Era ---

  if (stats.distinctDecades >= 5) {
    candidates.push({
      category: "era",
      title: "Time Traveler",
      detail: `Spanning ${stats.distinctDecades} decades of music`,
      strength: Math.min(stats.distinctDecades / 7, 1) * 0.75,
    });
  }

  // --- Taste patterns ---

  if (stats.ratedCount >= 10) {
    const loveLikeShare = (stats.ratingCounts.love + stats.ratingCounts.like) / stats.ratedCount;
    const toughShare = (stats.ratingCounts.dislike + stats.ratingCounts.neutral) / stats.ratedCount;

    if (loveLikeShare >= 0.8) {
      candidates.push({
        category: "taste",
        title: "Easy to Please",
        detail: `You've rated ${Math.round(loveLikeShare * 100)}% of your collection Love or Like`,
        strength: loveLikeShare * 0.7,
      });
    } else if (toughShare >= 0.5) {
      candidates.push({
        category: "taste",
        title: "Tough Critic",
        detail: `Plenty of Neutral and Dislike ratings in the mix`,
        strength: toughShare * 0.7,
      });
    }
  }

  // --- Storytelling ---

  if (stats.storyCount >= 5 && stats.storyShare >= 0.15) {
    candidates.push({
      category: "story",
      title: "Storyteller",
      detail: `You've added personal stories to ${stats.storyCount} records`,
      strength: stats.storyShare * 0.7,
    });
  }

  // Always-available fallback so there's at least something to show.
  candidates.push({
    category: "fallback",
    title: "Record Collector",
    detail: `${stats.total} record${stats.total === 1 ? "" : "s"} and counting`,
    strength: 0,
  });

  candidates.sort((a, b) => b.strength - a.strength);

  const seen = new Set();
  const deduped = [];
  for (const c of candidates) {
    if (seen.has(c.title)) continue;
    seen.add(c.title);
    deduped.push(c);
  }

  // Genre/artist/label superlatives are the preferred categories - bring them
  // to the front (preserving their internal strength order) so they fill the
  // available slots first, then backfill with era/taste/story/fallback.
  const priorityCategories = new Set(["genre", "artist", "label"]);
  const prioritized = deduped.filter((c) => priorityCategories.has(c.category));
  const rest = deduped.filter((c) => !priorityCategories.has(c.category));

  const targetCount = Math.min(deduped.length, 9);
  return [...prioritized, ...rest].slice(0, Math.max(targetCount, 1));
}

function renderSuperlatives() {
  const wrap = document.getElementById("superlativesWrap");
  if (!wrap) return;
  wrap.innerHTML = "";

  const superlatives = buildSuperlatives();
  if (superlatives.length === 0) {
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;

  superlatives.forEach((s) => {
    const card = document.createElement("div");
    card.className = "superlative-card";

    const titleEl = document.createElement("div");
    titleEl.className = "superlative-title";
    titleEl.textContent = s.title;

    const detailEl = document.createElement("div");
    detailEl.className = "superlative-detail";
    detailEl.textContent = s.detail;

    card.appendChild(titleEl);
    card.appendChild(detailEl);
    wrap.appendChild(card);
  });
}

function computeGenreCounts() {
  const counts = {};
  allRecords.forEach((r) => {
    const name = r.genre_name || "Unspecified";
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function computeArtistCounts() {
  const counts = {};
  allRecords.forEach((r) => {
    counts[r.artist] = (counts[r.artist] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

function computeDecadeCounts() {
  const counts = {};
  allRecords.forEach((r) => {
    if (!r.year) return;
    const decade = Math.floor(r.year / 10) * 10;
    counts[decade] = (counts[decade] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([d, c]) => [Number(d), c])
    .sort((a, b) => a[0] - b[0]);
}

// ------------ Taste profile radar ------------

const TASTE_PROFILE_AXIS_COUNT = 7;
const RATING_SCORES = { love: 4, like: 3, neutral: 2, dislike: 1 };

// One distinct, vivid color per axis position so the radar reads as a
// colorful map of taste diversity rather than a single-tone shape.
const TASTE_PROFILE_PALETTE = [
  "#caa15a", // gold (brand accent, reserved for the top genre)
  "#e0566e", // rose
  "#5ab0c9", // teal
  "#9b7fe0", // violet
  "#6fc77a", // green
  "#e0944a", // amber
  "#e0567e", // pink
];
const TASTE_PROFILE_OTHER_COLOR = "#6b7280"; // neutral gray for the catch-all bucket

function colorForAxisIndex(index, isOtherBucket) {
  if (isOtherBucket) return TASTE_PROFILE_OTHER_COLOR;
  return TASTE_PROFILE_PALETTE[index % TASTE_PROFILE_PALETTE.length];
}

let tasteProfileRadarChartInstance = null;
let tasteProfileSelectedGenre = null;

function computeTasteProfileAxes() {
  const total = allRecords.length;
  if (total === 0) return [];

  const genreCounts = {};
  allRecords.forEach((r) => {
    const name = r.genre_name || "Unspecified";
    genreCounts[name] = (genreCounts[name] || 0) + 1;
  });

  const ranked = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const top = ranked.slice(0, TASTE_PROFILE_AXIS_COUNT);
  const rest = ranked.slice(TASTE_PROFILE_AXIS_COUNT);
  const otherCount = rest.reduce((sum, g) => sum + g.count, 0);

  const axes = top.map((g) => ({
    name: g.name,
    count: g.count,
    share: g.count / total,
    isOther: false,
  }));

  if (otherCount > 0) {
    axes.push({
      name: "Other",
      count: otherCount,
      share: otherCount / total,
      isOther: false,
      otherGenres: rest.map((g) => g.name),
      isOtherBucket: true,
    });
  }

  return axes;
}

function computeGenreDetail(genreName, axis) {
  const records = axis?.isOtherBucket
    ? allRecords.filter((r) => (axis.otherGenres || []).includes(r.genre_name || "Unspecified"))
    : allRecords.filter((r) => (r.genre_name || "Unspecified") === genreName);

  const total = records.length;

  const artistCounts = {};
  const labelCounts = {};
  const subgenreCounts = {};
  const yearCounts = {};
  const years = [];
  const ratingScores = [];

  records.forEach((r) => {
    if (r.artist) artistCounts[r.artist] = (artistCounts[r.artist] || 0) + 1;
    if (r.label) labelCounts[r.label] = (labelCounts[r.label] || 0) + 1;
    if (r.subgenre_name) subgenreCounts[r.subgenre_name] = (subgenreCounts[r.subgenre_name] || 0) + 1;
    if (r.year) {
      years.push(r.year);
      yearCounts[r.year] = (yearCounts[r.year] || 0) + 1;
    }
    if (r.rating && RATING_SCORES[r.rating]) ratingScores.push(RATING_SCORES[r.rating]);
  });

  const topN = (counts, n) =>
    Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);

  const decadeRange =
    years.length > 0
      ? `${Math.floor(Math.min(...years) / 10) * 10}s – ${Math.floor(Math.max(...years) / 10) * 10}s`
      : "Unknown";

  let avgRatingLabel = "Not enough rated records";
  if (ratingScores.length > 0) {
    const avg = ratingScores.reduce((a, b) => a + b, 0) / ratingScores.length;
    const rounded = Math.round(avg * 10) / 10;
    const nearest = RATING_OPTIONS.slice().sort(
      (a, b) => Math.abs(RATING_SCORES[a.value] - avg) - Math.abs(RATING_SCORES[b.value] - avg)
    )[0];
    avgRatingLabel = `${rounded} / 4 — closest to "${nearest.label}"`;
  }

  return {
    total,
    topArtists: topN(artistCounts, 5),
    topSubgenres: topN(subgenreCounts, 5),
    topLabels: topN(labelCounts, 5),
    topYears: topN(yearCounts, 5),
    decadeRange,
    avgRatingLabel,
  };
}

function buildTasteProfileSnapshot(axis) {
  const detail = computeGenreDetail(axis.name, axis);
  const lines = [`${axis.count} records (${Math.round(axis.share * 100)}% of your collection)`];
  if (detail.topArtists[0]) lines.push(`Top artist: ${detail.topArtists[0].name}`);
  return lines;
}

function renderTasteProfileLegend(axes) {
  const legend = document.getElementById("tasteProfileLegend");
  if (!legend) return;
  legend.innerHTML = "";

  axes.forEach((axis) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "taste-profile-legend-item";

    const swatch = document.createElement("span");
    swatch.className = "taste-profile-legend-swatch";
    swatch.style.backgroundColor = axis.color;

    const name = document.createElement("span");
    name.className = "taste-profile-legend-name";
    name.textContent = axis.name;

    const share = document.createElement("span");
    share.className = "taste-profile-legend-share";
    share.textContent = `${Math.round(axis.share * 100)}%`;

    item.appendChild(swatch);
    item.appendChild(name);
    item.appendChild(share);
    item.addEventListener("click", () => renderTasteProfileGenreDetail(axis));

    legend.appendChild(item);
  });
}

function renderTasteProfile() {
  if (typeof Chart === "undefined") return;

  const axes = computeTasteProfileAxes().map((axis, index) => ({
    ...axis,
    color: colorForAxisIndex(index, axis.isOtherBucket),
  }));
  const detailWrap = document.getElementById("tasteProfileGenreDetail");

  renderTasteProfileLegend(axes);

  if (axes.length === 0) {
    detailWrap.hidden = true;
    if (tasteProfileRadarChartInstance) {
      tasteProfileRadarChartInstance.destroy();
      tasteProfileRadarChartInstance = null;
    }
    return;
  }

  const labels = axes.map((a) => a.name);
  const data = axes.map((a) => Math.round(a.share * 1000) / 10);
  const pointColors = axes.map((a) => a.color);

  const canvas = document.getElementById("tasteProfileRadarChart");

  if (tasteProfileRadarChartInstance) {
    tasteProfileRadarChartInstance.data.labels = labels;
    tasteProfileRadarChartInstance.data.datasets[0].data = data;
    tasteProfileRadarChartInstance.data.datasets[0].pointBackgroundColor = pointColors;
    tasteProfileRadarChartInstance.options.scales.r.pointLabels.color = pointColors;
    tasteProfileRadarChartInstance.config._axes = axes;
    tasteProfileRadarChartInstance.update();
  } else {
    tasteProfileRadarChartInstance = new Chart(canvas, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: "Share of collection",
            data,
            backgroundColor: "rgba(202, 161, 90, 0.18)",
            borderColor: "#caa15a",
            pointBackgroundColor: pointColors,
            pointBorderColor: "#0b1220",
            pointRadius: 7,
            pointHoverRadius: 10,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: "#1f2937" },
            grid: { color: "#1f2937" },
            pointLabels: {
              color: pointColors,
              font: { size: 15, weight: "600" },
            },
            ticks: {
              color: "#6b7280",
              backdropColor: "transparent",
              callback: (value) => `${value}%`,
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => items[0]?.label || "",
              label: (item) => {
                const axis = tasteProfileRadarChartInstance.config._axes[item.dataIndex];
                return axis ? buildTasteProfileSnapshot(axis) : "";
              },
            },
          },
        },
        onClick: (evt, elements) => {
          if (!elements.length) return;
          const axis = tasteProfileRadarChartInstance.config._axes[elements[0].index];
          if (axis) renderTasteProfileGenreDetail(axis);
        },
        onHover: (evt, elements) => {
          evt.native.target.style.cursor = elements.length ? "pointer" : "default";
        },
      },
    });
    tasteProfileRadarChartInstance.config._axes = axes;
  }

  // Keep the detail panel in sync if a genre was already selected (e.g. data refreshed).
  if (tasteProfileSelectedGenre) {
    const stillThere = axes.find((a) => a.name === tasteProfileSelectedGenre);
    if (stillThere) {
      renderTasteProfileGenreDetail(stillThere);
    } else {
      detailWrap.hidden = true;
      tasteProfileSelectedGenre = null;
    }
  }
}

function renderTasteProfileGenreDetail(axis) {
  tasteProfileSelectedGenre = axis.name;
  const wrap = document.getElementById("tasteProfileGenreDetail");
  wrap.innerHTML = "";
  wrap.hidden = false;
  wrap.style.borderColor = axis.color || "#2d2410";

  const detail = computeGenreDetail(axis.name, axis);

  const heading = document.createElement("h3");
  heading.className = "taste-profile-detail-heading";
  heading.textContent = axis.isOtherBucket ? "Other Genres" : axis.name;
  heading.style.color = axis.color || "#caa15a";
  wrap.appendChild(heading);

  if (axis.isOtherBucket && axis.otherGenres?.length) {
    const subnote = document.createElement("p");
    subnote.className = "field-hint";
    subnote.textContent = `Includes: ${axis.otherGenres.join(", ")}`;
    wrap.appendChild(subnote);
  }

  const statsGrid = document.createElement("div");
  statsGrid.className = "taste-profile-detail-stats";

  const statBlocks = [
    { label: "Records", value: String(detail.total) },
    { label: "Share of collection", value: `${Math.round(axis.share * 100)}%` },
    { label: "Decade range", value: detail.decadeRange, isText: true },
    { label: "Average rating", value: detail.avgRatingLabel, isText: true },
  ];

  statBlocks.forEach((s) => {
    const block = document.createElement("div");
    block.className = "taste-profile-stat-block";
    const valueEl = document.createElement("div");
    valueEl.className = s.isText
      ? "taste-profile-stat-value taste-profile-stat-value-text"
      : "taste-profile-stat-value";
    valueEl.textContent = s.value;
    const labelEl = document.createElement("div");
    labelEl.className = "taste-profile-stat-label";
    labelEl.textContent = s.label;
    block.appendChild(valueEl);
    block.appendChild(labelEl);
    statsGrid.appendChild(block);
  });

  wrap.appendChild(statsGrid);

  const listsWrap = document.createElement("div");
  listsWrap.className = "taste-profile-detail-lists";

  const buildList = (title, items) => {
    const col = document.createElement("div");
    col.className = "taste-profile-detail-list";
    const h4 = document.createElement("h4");
    h4.textContent = title;
    col.appendChild(h4);
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-hint";
      empty.textContent = "Nothing here yet.";
      col.appendChild(empty);
    } else {
      const ul = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} (${item.count})`;
        ul.appendChild(li);
      });
      col.appendChild(ul);
    }
    return col;
  };

  listsWrap.appendChild(buildList("Top Artists", detail.topArtists));
  listsWrap.appendChild(buildList("Top Sub-Genres", detail.topSubgenres));
  listsWrap.appendChild(buildList("Top Labels", detail.topLabels));
  listsWrap.appendChild(buildList("Top Years", detail.topYears));
  wrap.appendChild(listsWrap);

  if (!axis.isOtherBucket) {
    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn-secondary";
    viewBtn.textContent = `View all ${axis.name} records`;
    viewBtn.addEventListener("click", () => {
      const matchedGenre = genres.find((g) => g.name === axis.name);
      if (matchedGenre) {
        document.getElementById("genreFilter").value = String(matchedGenre.id);
        populateSubgenreFilterOptions();
      }
      setPage("collection");
    });
    wrap.appendChild(viewBtn);
  }

  wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ------------ Genre evolution (spaghetti chart) ------------

const GENRE_EVOLUTION_MIN_ALBUMS = 5;

// A larger, high-contrast palette for artist lines, since a deep collection
// can easily have a dozen-plus qualifying artists on screen at once.
const GENRE_EVOLUTION_PALETTE = [
  "#caa15a", "#e0566e", "#5ab0c9", "#9b7fe0", "#6fc77a",
  "#e0944a", "#e0567e", "#4ad6c7", "#d6c34a", "#7e9be0",
  "#c97ab0", "#80c9a0", "#e07a7a", "#a0a8e0", "#c9a05a",
];

let genreEvolutionChartInstance = null;
let genreEvolutionFocusedArtist = null;

function computeGenreEvolutionAxisOrder(timelines) {
  const counts = {};

  if (timelines && timelines.length > 0) {
    // Scoped to whatever's actually being plotted (one artist, or the
    // current overview set) - this keeps the axis tight and relevant
    // instead of dragging in every style in the whole collection.
    timelines.forEach((t) => {
      t.points.forEach((p) => {
        counts[p.genre] = (counts[p.genre] || 0) + 1;
      });
    });
  } else {
    allRecords.forEach((r) => {
      const name = r.subgenre_name || r.genre_name || "Unspecified";
      counts[name] = (counts[name] || 0) + 1;
    });
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

const GENRE_EVOLUTION_EXCLUDED_ARTISTS = new Set(["Various Artists", "Various", "V/A"]);

function computeArtistGenreTimelines() {
  const byArtist = {};
  allRecords.forEach((r) => {
    if (!r.artist || !r.year) return;
    if (GENRE_EVOLUTION_EXCLUDED_ARTISTS.has(r.artist.trim())) return;
    if (!byArtist[r.artist]) byArtist[r.artist] = [];
    byArtist[r.artist].push({
      year: r.year,
      genre: r.subgenre_name || r.genre_name || "Unspecified",
      album: r.album,
      id: r.id,
    });
  });

  const deepCatalog = Object.entries(byArtist)
    .filter(([, points]) => points.length >= GENRE_EVOLUTION_MIN_ALBUMS)
    .map(([artist, points]) => ({
      artist,
      points: points.slice().sort((a, b) => a.year - b.year),
    }))
    .sort((a, b) => b.points.length - a.points.length);

  return deepCatalog;
}

function renderGenreEvolutionLegend(timelines) {
  const legend = document.getElementById("genreEvolutionLegend");
  if (!legend) return;
  legend.innerHTML = "";

  timelines.forEach((t, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "genre-evolution-legend-item";
    item.classList.toggle(
      "active",
      genreEvolutionFocusedArtist === t.artist || !genreEvolutionFocusedArtist
    );

    const swatch = document.createElement("span");
    swatch.className = "taste-profile-legend-swatch";
    swatch.style.backgroundColor = GENRE_EVOLUTION_PALETTE[index % GENRE_EVOLUTION_PALETTE.length];

    const name = document.createElement("span");
    name.className = "taste-profile-legend-name";
    name.textContent = t.artist;

    const count = document.createElement("span");
    count.className = "taste-profile-legend-share";
    count.textContent = `${t.points.length} albums`;

    item.appendChild(swatch);
    item.appendChild(name);
    item.appendChild(count);
    item.addEventListener("click", () => {
      const next = genreEvolutionFocusedArtist === t.artist ? null : t.artist;
      setGenreEvolutionFocus(next);
    });

    legend.appendChild(item);
  });
}

function setGenreEvolutionFocus(artistName) {
  genreEvolutionFocusedArtist = artistName || null;
  const select = document.getElementById("genreEvolutionArtistSelect");
  if (select) select.value = genreEvolutionFocusedArtist || "";
  renderGenreEvolution({ skipRebuildSelect: true });
}

// ============================================================
// My Trophies
// ============================================================
//
// Trophies are computed entirely client-side from allRecords + wishlist.
// Definitions are static; earned state is derived on each render.
// Visual: each trophy is an SVG circle styled like a vinyl record label —
// catalog number, name, concentric rings. Unearned trophies appear as
// dark pressed-vinyl silhouettes so you can see what you're working toward.

const TROPHY_DEFS = [
  // Collection size milestones
  {
    id: "first_record",
    name: "First Groove",
    catalog: "SV-001",
    label: "Side A",
    desc: "Add your first record to the collection.",
    color: "#c8973a",
    ring: "#e8c87a",
    check: (r) => r.length >= 1,
  },
  {
    id: "collector_10",
    name: "Growing Stack",
    catalog: "SV-010",
    label: "Vol. 10",
    desc: "Reach 10 records in your collection.",
    color: "#7b6fa0",
    ring: "#b09fd0",
    check: (r) => r.length >= 10,
  },
  {
    id: "collector_50",
    name: "Serious Collector",
    catalog: "SV-050",
    label: "Vol. 50",
    desc: "Reach 50 records in your collection.",
    color: "#3d7a6b",
    ring: "#6db8a5",
    check: (r) => r.length >= 50,
  },
  {
    id: "collector_100",
    name: "Century Club",
    catalog: "SV-100",
    label: "100 RPM",
    desc: "Reach 100 records in your collection.",
    color: "#b04040",
    ring: "#d98080",
    check: (r) => r.length >= 100,
  },
  {
    id: "collector_250",
    name: "Deep Stacks",
    catalog: "SV-250",
    label: "Vol. 250",
    desc: "Reach 250 records in your collection.",
    color: "#2a5c8a",
    ring: "#5a9cc8",
    check: (r) => r.length >= 250,
  },
  {
    id: "collector_500",
    name: "Legendary",
    catalog: "SV-500",
    label: "Vol. 500",
    desc: "Reach 500 records. You are the real thing.",
    color: "#caa15a",
    ring: "#f0d090",
    check: (r) => r.length >= 500,
  },
  // Genre breadth
  {
    id: "five_genres",
    name: "Eclectic Ear",
    catalog: "SV-G05",
    label: "5 Genres",
    desc: "Own records across 5 different genres.",
    color: "#7a4b8a",
    ring: "#c090d0",
    check: (r) => new Set(r.map((x) => x.genre_id).filter(Boolean)).size >= 5,
  },
  {
    id: "ten_genres",
    name: "Omnivore",
    catalog: "SV-G10",
    label: "10 Genres",
    desc: "Own records across 10 different genres.",
    color: "#2a7a3a",
    ring: "#60b870",
    check: (r) => new Set(r.map((x) => x.genre_id).filter(Boolean)).size >= 10,
  },
  // Decade reach
  {
    id: "four_decades",
    name: "Time Traveler",
    catalog: "SV-D04",
    label: "4 Decades",
    desc: "Own records from 4 different decades.",
    color: "#4a6a8a",
    ring: "#80a8c8",
    check: (r) =>
      new Set(
        r
          .filter((x) => x.year && x.year > 1900)
          .map((x) => Math.floor(x.year / 10) * 10)
      ).size >= 4,
  },
  {
    id: "six_decades",
    name: "Living History",
    catalog: "SV-D06",
    label: "6 Decades",
    desc: "Own records from 6 different decades.",
    color: "#6a3a2a",
    ring: "#b07060",
    check: (r) =>
      new Set(
        r
          .filter((x) => x.year && x.year > 1900)
          .map((x) => Math.floor(x.year / 10) * 10)
      ).size >= 6,
  },
  // Vintage
  {
    id: "pre_1970",
    name: "Vintage Crate",
    catalog: "SV-V70",
    label: "Pre '70",
    desc: "Own a record released before 1970.",
    color: "#8a7a3a",
    ring: "#c8b870",
    check: (r) => r.some((x) => x.year && x.year < 1970),
  },
  {
    id: "pre_1960",
    name: "Rare Wax",
    catalog: "SV-V60",
    label: "Pre '60",
    desc: "Own a record released before 1960.",
    color: "#5a3a2a",
    ring: "#a07060",
    check: (r) => r.some((x) => x.year && x.year < 1960),
  },
  // Artist depth
  {
    id: "artist_depth",
    name: "Deep Cut",
    catalog: "SV-A05",
    label: "5 Albums",
    desc: "Own 5 or more albums by the same artist.",
    color: "#2a6a7a",
    ring: "#50a8b8",
    check: (r) => {
      const counts = {};
      r.forEach((x) => {
        if (x.artist) counts[x.artist.toLowerCase()] = (counts[x.artist.toLowerCase()] || 0) + 1;
      });
      return Object.values(counts).some((c) => c >= 5);
    },
  },
  {
    id: "artist_devotion",
    name: "Devotee",
    catalog: "SV-A10",
    label: "10 Albums",
    desc: "Own 10 or more albums by the same artist.",
    color: "#6a2a5a",
    ring: "#b060a0",
    check: (r) => {
      const counts = {};
      r.forEach((x) => {
        if (x.artist) counts[x.artist.toLowerCase()] = (counts[x.artist.toLowerCase()] || 0) + 1;
      });
      return Object.values(counts).some((c) => c >= 10);
    },
  },
  // Ratings
  {
    id: "love_streak",
    name: "True Believer",
    catalog: "SV-R10",
    label: "Loved",
    desc: "Rate 10 or more records as Love.",
    color: "#8a2a3a",
    ring: "#d06070",
    check: (r) => r.filter((x) => x.rating === "love").length >= 10,
  },
  // Wishlist
  {
    id: "full_wishlist",
    name: "The Hunt",
    catalog: "SV-W10",
    label: "Want List",
    desc: "Add 10 items to your wishlist.",
    color: "#3a5a2a",
    ring: "#70a050",
    check: (r, w) => w.length >= 10,
  },

  // ---- 20 new trophies ----

  // Collection milestones (filling the ladder)
  {
    id: "collector_25",
    name: "Finding Rhythm",
    catalog: "SV-025",
    label: "Vol. 25",
    desc: "Reach 25 records — you're finding your groove.",
    color: "#5a6a8a",
    ring: "#90a8c8",
    check: (r) => r.length >= 25,
  },
  {
    id: "collector_1000",
    name: "The Archive",
    catalog: "SV-1K",
    label: "1000 Records",
    desc: "Reach 1,000 records. This is a serious archive.",
    color: "#8a2a20",
    ring: "#d06050",
    check: (r) => r.length >= 1000,
  },

  // Wishlist completion
  {
    id: "wishlist_25",
    name: "Deep Wants",
    catalog: "SV-W25",
    label: "25 Items",
    desc: "Build a wishlist of 25 albums.",
    color: "#2a6a4a",
    ring: "#50b880",
    check: (r, w) => w.length >= 25,
  },
  {
    id: "wishlist_50",
    name: "Endless Crate",
    catalog: "SV-W50",
    label: "50 Items",
    desc: "50 albums on your wishlist. The hunt never ends.",
    color: "#1a5a3a",
    ring: "#40a870",
    check: (r, w) => w.length >= 50,
  },

  // Rating depth
  {
    id: "first_dislike",
    name: "Discerning",
    catalog: "SV-R01",
    label: "Standards",
    desc: "Rate your first record as Dislike. Not everything makes the cut.",
    color: "#5a4a3a",
    ring: "#a08060",
    check: (r) => r.some((x) => x.rating === "dislike"),
  },
  {
    id: "love_25",
    name: "Devotional",
    catalog: "SV-R25",
    label: "25 Loved",
    desc: "Rate 25 records as Love.",
    color: "#7a1a2a",
    ring: "#c05060",
    check: (r) => r.filter((x) => x.rating === "love").length >= 25,
  },
  {
    id: "fully_rated",
    name: "The Critic",
    catalog: "SV-RC",
    label: "All Rated",
    desc: "Rate every record in your collection.",
    color: "#4a3a6a",
    ring: "#8870b0",
    check: (r) => r.length >= 5 && r.every((x) => x.rating && x.rating !== "neutral"),
  },
  {
    id: "high_standards",
    name: "High Standards",
    catalog: "SV-RH",
    label: "50% Loved",
    desc: "Over half your collection rated Love or Like.",
    color: "#6a4a1a",
    ring: "#b08040",
    check: (r) => {
      if (r.length < 10) return false;
      const loved = r.filter((x) => x.rating === "love" || x.rating === "like").length;
      return loved / r.length >= 0.5;
    },
  },

  // Artist/collection breadth
  {
    id: "broad_church",
    name: "Broad Church",
    catalog: "SV-B20",
    label: "20 Artists",
    desc: "Own records from 20 different artists.",
    color: "#2a4a6a",
    ring: "#6090b0",
    check: (r) =>
      new Set(r.map((x) => (x.artist || "").toLowerCase().trim()).filter(Boolean)).size >= 20,
  },
  {
    id: "curated",
    name: "Curated",
    catalog: "SV-CUR",
    label: "Curated",
    desc: "Own 3 or more albums from 5 different artists.",
    color: "#3a5a6a",
    ring: "#6098b0",
    check: (r) => {
      const counts = {};
      r.forEach((x) => {
        if (x.artist) {
          const k = x.artist.toLowerCase().trim();
          counts[k] = (counts[k] || 0) + 1;
        }
      });
      return Object.values(counts).filter((c) => c >= 3).length >= 5;
    },
  },

  // Era / decade specific
  {
    id: "golden_age",
    name: "Golden Age",
    catalog: "SV-50s",
    label: "1950s",
    desc: "Own a record from the 1950s.",
    color: "#7a6a1a",
    ring: "#c8b840",
    check: (r) => r.some((x) => x.year >= 1950 && x.year < 1960),
  },
  {
    id: "full_spectrum",
    name: "Full Spectrum",
    catalog: "SV-FS",
    label: "6 Decades",
    desc: "Own records from every decade from the 1960s through the 2010s.",
    color: "#2a3a6a",
    ring: "#5070c0",
    check: (r) => {
      const decades = new Set(
        r.filter((x) => x.year).map((x) => Math.floor(x.year / 10) * 10)
      );
      return [1960, 1970, 1980, 1990, 2000, 2010].every((d) => decades.has(d));
    },
  },
  {
    id: "staying_current",
    name: "Staying Current",
    catalog: "SV-NOW",
    label: "2020s",
    desc: "Own a record from the current decade.",
    color: "#1a5a5a",
    ring: "#40a8a8",
    check: (r) => r.some((x) => x.year >= 2020),
  },

  // Collection quality / engagement
  {
    id: "archivist",
    name: "Archivist",
    catalog: "SV-ARC",
    label: "Cover Art",
    desc: "Upload a custom cover photo for a record.",
    color: "#5a3a6a",
    ring: "#a070c0",
    check: (r) =>
      r.some(
        (x) =>
          x.cover_url &&
          !x.cover_url.includes("discogs.com") &&
          !x.cover_url.includes("api.discogs")
      ),
  },
  {
    id: "storyteller",
    name: "Storyteller",
    catalog: "SV-STY",
    label: "Your Story",
    desc: "Write a personal story for a record in your collection.",
    color: "#4a2a5a",
    ring: "#9060b0",
    check: (r) => r.some((x) => x.personal_story && x.personal_story.trim().length > 0),
  },

  // Social / sharing
  {
    id: "open_stack",
    name: "Open Stack",
    catalog: "SV-PUB",
    label: "Public",
    desc: "Make your wishlist public so others can see what you're hunting for.",
    color: "#1a4a5a",
    ring: "#3088a8",
    check: (r, w, p) => !!p?.wishlist_public,
  },

  // SPIN VINYL — app-specific room trophies
  {
    id: "gallery_wall",
    name: "Gallery Wall",
    catalog: "SV-GW",
    label: "5 Frames",
    desc: "Assign all 5 frames on your Listening Room wall.",
    color: "#4a2a3a",
    ring: "#906070",
    check: (r, w, p) => {
      const wall = p?.room_wall_albums || [];
      return wall.filter((x) => x && x !== "").length >= 5;
    },
  },
  {
    id: "full_shelves",
    name: "Full Shelves",
    catalog: "SV-SHF",
    label: "Shelved",
    desc: "Fill all four shelf buckets in at least one Listening Room.",
    color: "#2a3a4a",
    ring: "#507080",
    check: (r, w, p) => {
      const buckets = p?.room_shelf_buckets || {};
      return Object.values(buckets).some(
        (roomBuckets) =>
          Array.isArray(roomBuckets) &&
          roomBuckets.filter((b) => b?.albums && b.albums.length > 0).length >= 4
      );
    },
  },
  {
    id: "night_owl",
    name: "Night Owl",
    catalog: "SV-OWL",
    label: "After Dark",
    desc: "Own more than 20 jazz or blues records. The late-night listener.",
    color: "#1a2a4a",
    ring: "#305090",
    check: (r) => {
      const jazzBlues = r.filter((x) => {
        const g = (x.genre_name || "").toLowerCase();
        return g.includes("jazz") || g.includes("blues");
      });
      return jazzBlues.length >= 20;
    },
  },
  {
    id: "global_crate",
    name: "Global Crate",
    catalog: "SV-GLB",
    label: "World Music",
    desc: "Own records from 3 or more distinct world music genres or subgenres.",
    color: "#3a4a2a",
    ring: "#708050",
    check: (r) => {
      const world = new Set(
        r
          .filter((x) => {
            const g = (x.genre_name || x.subgenre_name || "").toLowerCase();
            return (
              g.includes("latin") ||
              g.includes("afrobeat") ||
              g.includes("reggae") ||
              g.includes("bossa") ||
              g.includes("samba") ||
              g.includes("cumbia") ||
              g.includes("salsa") ||
              g.includes("afro") ||
              g.includes("world") ||
              g.includes("flamenco") ||
              g.includes("fado") ||
              g.includes("cajun")
            );
          })
          .map((x) => x.genre_name || x.subgenre_name)
      );
      return world.size >= 3;
    },
  },
];

function computeTrophies() {
  return TROPHY_DEFS.map((def) => ({
    ...def,
    earned: def.check(allRecords, wishlist, currentProfile),
  }));
}

function buildTrophyLabelSvg(def, earned, size = 150) {
  const c = earned ? def.color : "#2a2a2a";
  const ring = earned ? def.ring : "#3a3a3a";
  const textColor = earned ? "#fff" : "#555";
  const dimText = earned ? "#fff9" : "#444";
  const cx = size / 2;
  const cy = size / 2;
  const labelR = Math.round(size * 0.307); // label circle radius scales with size
  const scale = size / 150;               // text/ring sizes scale proportionally

  const nameWords = def.name.split(" ");
  const line1 = nameWords.slice(0, Math.ceil(nameWords.length / 2)).join(" ");
  const line2 = nameWords.slice(Math.ceil(nameWords.length / 2)).join(" ");

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="trophy-label-svg" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="${cx - 2}" fill="${earned ? "#111" : "#181818"}" stroke="${ring}22" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${cx - 8 * scale}" fill="none" stroke="${ring}18" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${cx - 14 * scale}" fill="none" stroke="${ring}18" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${cx - 20 * scale}" fill="none" stroke="${ring}18" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${cx - 26 * scale}" fill="none" stroke="${ring}18" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${labelR}" fill="${c}" opacity="${earned ? 1 : 0.4}"/>
    <circle cx="${cx}" cy="${cy}" r="${labelR}" fill="none" stroke="${ring}" stroke-width="${earned ? 1.5 : 0.5}" opacity="${earned ? 0.6 : 0.2}"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(4 * scale)}" fill="${earned ? "#000" : "#111"}"/>
    <text x="${cx}" y="${cy - 22 * scale}" text-anchor="middle" font-family="Jost,Inter,system-ui" font-size="${7 * scale}" font-weight="600" letter-spacing="0.12em" fill="${dimText}" opacity="0.8">${def.catalog}</text>
    <text x="${cx}" y="${cy - 6 * scale}" text-anchor="middle" font-family="Jost,Inter,system-ui" font-size="${(line2 ? 10 : 11) * scale}" font-weight="700" fill="${textColor}">${line1}</text>
    ${line2 ? `<text x="${cx}" y="${cy + 7 * scale}" text-anchor="middle" font-family="Jost,Inter,system-ui" font-size="${10 * scale}" font-weight="700" fill="${textColor}">${line2}</text>` : ""}
    <text x="${cx}" y="${cy + 22 * scale}" text-anchor="middle" font-family="Jost,Inter,system-ui" font-size="${8 * scale}" font-weight="600" letter-spacing="0.06em" fill="${ring}" opacity="${earned ? 0.9 : 0.3}">${def.label}</text>
  </svg>`;
}

function renderTrophies() {
  const grid = document.getElementById("trophiesGrid");
  const summary = document.getElementById("trophiesSummary");
  if (!grid) return;

  const trophies = computeTrophies();
  const earnedCount = trophies.filter((t) => t.earned).length;

  summary.textContent = `${earnedCount} of ${trophies.length} earned`;

  grid.innerHTML = "";

  // Earned first, then unearned
  const sorted = [
    ...trophies.filter((t) => t.earned),
    ...trophies.filter((t) => !t.earned),
  ];

  sorted.forEach((t) => {
    const card = document.createElement("div");
    card.className = `trophy-card${t.earned ? " trophy-earned" : " trophy-locked"}`;
    card.setAttribute("title", t.desc);
    card.style.cursor = "pointer";
    card.addEventListener("click", () => openTrophyLightbox(t));

    const svgWrap = document.createElement("div");
    svgWrap.className = "trophy-svg-wrap";
    svgWrap.innerHTML = buildTrophyLabelSvg(t, t.earned);
    card.appendChild(svgWrap);

    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = t.desc;
    card.appendChild(desc);

    if (!t.earned) {
      const lock = document.createElement("span");
      lock.className = "trophy-lock-badge";
      lock.textContent = "Not yet earned";
      card.appendChild(lock);
    }

    grid.appendChild(card);
  });
}

function openTrophyLightbox(trophy) {
  const lightbox = document.getElementById("trophyLightbox");
  const svgEl = document.getElementById("trophyLightboxSvg");
  const nameEl = document.getElementById("trophyLightboxName");
  const descEl = document.getElementById("trophyLightboxDesc");
  const earnedEl = document.getElementById("trophyLightboxEarned");

  // Render a large version of the SVG (300px)
  svgEl.innerHTML = buildTrophyLabelSvg(trophy, trophy.earned, 300);

  nameEl.textContent = trophy.name;
  descEl.textContent = trophy.desc;
  earnedEl.textContent = trophy.earned ? "✓ Earned" : "Not yet earned";
  earnedEl.className = trophy.earned
    ? "trophy-lightbox-earned trophy-lightbox-earned-yes"
    : "trophy-lightbox-earned trophy-lightbox-earned-no";

  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeTrophyLightbox() {
  const lightbox = document.getElementById("trophyLightbox");
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

function renderGenreEvolution(opts = {}) {
  if (typeof Chart === "undefined") return;

  const emptyEl = document.getElementById("genreEvolutionEmpty");
  const card = document.querySelector(".genre-evolution-chart-card");
  const timelines = computeArtistGenreTimelines();

  if (timelines.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    if (card) card.hidden = true;
    document.getElementById("genreEvolutionLegend").innerHTML = "";
    if (genreEvolutionChartInstance) {
      genreEvolutionChartInstance.destroy();
      genreEvolutionChartInstance = null;
    }
    return;
  }

  if (emptyEl) emptyEl.hidden = true;
  if (card) card.hidden = false;

  const visibleTimelines = genreEvolutionFocusedArtist
    ? timelines.filter((t) => t.artist === genreEvolutionFocusedArtist)
    : timelines;

  // The axis should only include styles that are actually present among the
  // artists currently on screen - showing every style in the whole
  // collection (Christmas, Opera, etc.) when focused on one jazz artist
  // crushes their real movement into a sliver of the chart.
  const axisOrder = computeGenreEvolutionAxisOrder(visibleTimelines);
  const axisIndex = new Map(axisOrder.map((name, i) => [name, i]));

  if (!opts.skipRebuildSelect) {
    const select = document.getElementById("genreEvolutionArtistSelect");
    const previousValue = select.value;
    select.innerHTML = '<option value="">All deep-catalog artists</option>';
    timelines.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.artist;
      opt.textContent = `${t.artist} (${t.points.length})`;
      select.appendChild(opt);
    });
    if (timelines.some((t) => t.artist === previousValue)) {
      select.value = previousValue;
    }
  }

  const datasets = visibleTimelines.map((t) => {
    const originalIndex = timelines.indexOf(t);
    const color = GENRE_EVOLUTION_PALETTE[originalIndex % GENRE_EVOLUTION_PALETTE.length];
    const isFocused = !!genreEvolutionFocusedArtist;

    return {
      label: t.artist,
      // y is the genre/subgenre's numeric index in axisOrder, not the string
      // itself - this avoids relying on Chart.js's category-scale string
      // resolution, which proved unreliable and could plot points on the
      // wrong row entirely.
      data: t.points.map((p) => ({ x: p.year, y: axisIndex.get(p.genre) ?? axisOrder.length, _album: p.album, _genre: p.genre })),
      borderColor: color,
      backgroundColor: color,
      pointBackgroundColor: color,
      pointRadius: isFocused ? 5 : 3.5,
      pointHoverRadius: 7,
      borderWidth: isFocused ? 3 : 2,
      tension: 0,
      fill: false,
      spanGaps: true,
    };
  });

  const canvas = document.getElementById("genreEvolutionChart");

  const config = {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: { xAxisKey: "x", yAxisKey: "y" },
      scales: {
        x: {
          type: "linear",
          ticks: {
            color: "#9ca3af",
            stepSize: 5,
            precision: 0,
            callback: (value) => Math.round(value).toString(),
          },
          grid: { color: "#1f2937" },
          title: { display: true, text: "Release year", color: "#9ca3af" },
        },
        y: {
          type: "linear",
          min: 0,
          max: axisOrder.length - 1,
          reverse: false,
          ticks: {
            color: "#d1d5db",
            stepSize: 1,
            callback: (value) => axisOrder[value] ?? "",
          },
          grid: { color: "#1f2937" },
          title: { display: true, text: "Style / subgenre", color: "#9ca3af" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.dataset.label || "",
            label: (item) => {
              const point = item.raw;
              return `${point._album} (${point.x}) — ${point._genre}`;
            },
          },
        },
      },
      onClick: (evt, elements) => {
        if (!elements.length) return;
        const dataset = datasets[elements[0].datasetIndex];
        if (dataset) {
          const next = genreEvolutionFocusedArtist === dataset.label ? null : dataset.label;
          setGenreEvolutionFocus(next);
        }
      },
      onHover: (evt, elements) => {
        evt.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
    },
  };

  if (genreEvolutionChartInstance) {
    genreEvolutionChartInstance.destroy();
  }
  genreEvolutionChartInstance = new Chart(canvas, config);

  renderGenreEvolutionLegend(timelines);
}

function upsertBarChart(instance, canvasId, labels, data, onBarClick, highlightIndex = -1, onAnimationComplete = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return instance;

  // The top bar gets a brighter, more saturated gold; the rest recede to a
  // muted tone so the chart reads as "here's what defines your collection"
  // rather than a flat, undifferentiated bar chart.
  const colors = data.map((_, i) => (i === highlightIndex ? "#e8b96a" : "#6b5530"));
  const hoverColors = data.map((_, i) => (i === highlightIndex ? "#f3ca85" : "#85714a"));

  if (instance) {
    instance.data.labels = labels;
    instance.data.datasets[0].data = data;
    instance.data.datasets[0].backgroundColor = colors;
    instance.data.datasets[0].hoverBackgroundColor = hoverColors;
    instance.update();
    if (onAnimationComplete) {
      // No animation runs on a plain .update() in most cases, but resize/data
      // changes can still animate - defer one frame so bar positions settle.
      requestAnimationFrame(onAnimationComplete);
    }
    return instance;
  }

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          hoverBackgroundColor: hoverColors,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 700,
        easing: "easeOutQuart",
        onComplete: onAnimationComplete || undefined,
      },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#9ca3af", autoSkip: true, maxRotation: 45, minRotation: 0 },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#9ca3af", precision: 0 },
          grid: { color: "#1f2937" },
          beginAtZero: true,
        },
      },
      onClick: (evt, elements, chart) => {
        if (!elements.length) return;
        const idx = elements[0].index;
        const label = chart.data.labels[idx];
        onBarClick(label);
      },
    },
  });
}

const RATING_LABELS = Object.fromEntries(RATING_OPTIONS.map((o) => [o.value, o.label]));
RATING_LABELS.unrated = "Unrated";

function clearAllFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("genreFilter").value = "";
  populateSubgenreFilterOptions();
  document.getElementById("ratingFilter").value = "";
  artistFilter = null;
  yearFilter = null;
  render();
}

function renderActiveFilters() {
  const bar = document.getElementById("activeFiltersBar");
  bar.innerHTML = "";

  if (currentPage !== "collection" && currentPage !== "wishlist") {
    bar.hidden = true;
    return;
  }

  const isWishlist = currentPage === "wishlist";

  const chips = [];

  const searchVal = document.getElementById("searchInput").value.trim();
  if (searchVal) {
    chips.push({
      label: `Search: "${searchVal}"`,
      onClear: () => {
        document.getElementById("searchInput").value = "";
        render();
      },
    });
  }

  const genreVal = document.getElementById("genreFilter").value;
  if (genreVal) {
    chips.push({
      label: `Genre: ${genreNameById(Number(genreVal))}`,
      onClear: () => {
        document.getElementById("genreFilter").value = "";
        populateSubgenreFilterOptions();
        render();
      },
    });
  }

  const subgenreVal = document.getElementById("subgenreFilter").value;
  if (subgenreVal) {
    chips.push({
      label: `Subgenre: ${subgenreNameById(Number(subgenreVal))}`,
      onClear: () => {
        document.getElementById("subgenreFilter").value = "";
        render();
      },
    });
  }

  if (!isWishlist) {
    const ratingVal = document.getElementById("ratingFilter").value;
    if (ratingVal) {
      chips.push({
        label: `Rating: ${RATING_LABELS[ratingVal] || ratingVal}`,
        onClear: () => {
          document.getElementById("ratingFilter").value = "";
          render();
        },
      });
    }

    if (artistFilter) {
      chips.push({
        label: `Artist: ${artistFilter}`,
        onClear: () => {
          artistFilter = null;
          render();
        },
      });
    }
  }

  if (!isWishlist && yearFilter) {
    chips.push({
      label: `Decade: ${yearFilter.start}s`,
      onClear: () => {
        yearFilter = null;
        render();
      },
    });
  }

  if (chips.length === 0) {
    bar.hidden = true;
    return;
  }

  chips.forEach((chip) => {
    const el = document.createElement("span");
    el.className = "filter-chip";

    const text = document.createElement("span");
    text.textContent = chip.label;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "✕";
    btn.setAttribute("aria-label", `Clear ${chip.label}`);
    btn.addEventListener("click", chip.onClear);

    el.appendChild(text);
    el.appendChild(btn);
    bar.appendChild(el);
  });

  if (chips.length > 1) {
    const clearAllBtn = document.createElement("button");
    clearAllBtn.type = "button";
    clearAllBtn.className = "filter-chip clear-all";
    clearAllBtn.textContent = "Clear all";
    clearAllBtn.addEventListener("click", clearAllFilters);
    bar.appendChild(clearAllBtn);
  }

  bar.hidden = false;
}

// ------------ Chart personalization (headlines + cover art) ------------

function buildGenreChartHeadline(genreData) {
  if (genreData.length === 0) return "";
  const total = allRecords.length;
  const [topName, topCount] = genreData[0];
  const share = total ? Math.round((topCount / total) * 100) : 0;

  if (genreData.length === 1) {
    return `${topName} is the whole story so far — every record you own.`;
  }
  if (share >= 50) {
    return `${topName} has been your home base — ${share}% of your collection.`;
  }
  if (share >= 25) {
    return `${topName} leads the way, with ${genreData.length - 1} other genre${genreData.length - 1 === 1 ? "" : "s"} keeping things interesting.`;
  }
  return `A genuine mix — ${topName} edges out the rest, but no single sound dominates.`;
}

function buildArtistChartHeadline(artistData) {
  if (artistData.length === 0) return "";
  const [topName, topCount] = artistData[0];
  const second = artistData[1];

  if (!second) {
    return `${topName} is the only name on the board so far, with ${topCount} record${topCount === 1 ? "" : "s"}.`;
  }
  const lead = topCount - second[1];
  if (lead >= Math.max(5, topCount * 0.4)) {
    return `No one comes close to ${topName} in your collection.`;
  }
  if (lead <= 1) {
    return `${topName} and ${second[0]} are neck and neck at the top.`;
  }
  return `${topName} leads your most-collected artists, just ahead of ${second[0]}.`;
}

function buildDecadeChartHeadline(decadeData) {
  if (decadeData.length === 0) return "";
  const peak = decadeData.slice().sort((a, b) => b[1] - a[1])[0];
  const sorted = decadeData.slice().sort((a, b) => a[0] - b[0]);
  const span = sorted.length;
  const earliest = sorted[0][0];

  if (span === 1) {
    return `Every record you own comes from the ${peak[0]}s.`;
  }
  return `The ${peak[0]}s defined your collection — ${peak[1]} record${peak[1] === 1 ? "" : "s"} and counting, spanning back to the ${earliest}s.`;
}

function buildChartCoverMosaic(wrapId, genreName, limit = 4) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  wrap.innerHTML = "";

  if (!genreName) return;

  const covers = allRecords
    .filter((r) => (r.genre_name || "Unspecified") === genreName && r.cover_url)
    .slice(0, limit);

  if (covers.length === 0) return;

  covers.forEach((r) => {
    const img = document.createElement("img");
    img.src = r.cover_url;
    img.alt = `${r.album} cover`;
    img.className = "chart-cover-mosaic-img";
    wrap.appendChild(img);
  });
}

function renderArtistChartCovers(artistData) {
  const wrap = document.getElementById("artistChartCovers");
  if (!wrap || !artistChart) return;
  wrap.innerHTML = "";

  const meta = artistChart.getDatasetMeta(0);
  if (!meta || !meta.data) return;

  artistData.forEach(([artistName], i) => {
    const bar = meta.data[i];
    if (!bar) return;

    const record = allRecords.find((r) => r.artist === artistName && r.cover_url);
    if (!record) return;

    const img = document.createElement("img");
    img.src = record.cover_url;
    img.alt = `${artistName} cover`;
    img.className = "chart-bar-cover-img";
    img.style.left = `${bar.x}px`;
    wrap.appendChild(img);
  });
}

function renderCharts() {
  if (typeof Chart === "undefined") return;

  const genreData = computeGenreCounts();
  const artistData = computeArtistCounts();
  const decadeData = computeDecadeCounts();

  // --- By Genre ---
  document.getElementById("genreChartHeadline").textContent = buildGenreChartHeadline(genreData);
  buildChartCoverMosaic("genreChartMosaic", genreData[0]?.[0] || null);

  genreChart = upsertBarChart(
    genreChart,
    "genreChart",
    genreData.map(([k]) => k),
    genreData.map(([, v]) => v),
    (label) => {
      const g = genres.find((g) => g.name === label);
      if (!g) return;
      document.getElementById("genreFilter").value = String(g.id);
      populateSubgenreFilterOptions();
      render();
    },
    0 // top genre is always first since computeGenreCounts is sorted desc
  );

  // --- Top Artists ---
  document.getElementById("artistChartHeadline").textContent = buildArtistChartHeadline(artistData);

  artistChart = upsertBarChart(
    artistChart,
    "artistChart",
    artistData.map(([k]) => k),
    artistData.map(([, v]) => v),
    (label) => {
      artistFilter = artistFilter === label ? null : label;
      yearFilter = null;
      render();
    },
    0, // top artist is always first since computeArtistCounts is sorted desc
    () => renderArtistChartCovers(artistData)
  );

  // --- By Decade ---
  document.getElementById("decadeChartHeadline").textContent = buildDecadeChartHeadline(decadeData);

  const peakDecadeIndex =
    decadeData.length > 0
      ? decadeData.reduce((bestIdx, entry, i, arr) => (entry[1] > arr[bestIdx][1] ? i : bestIdx), 0)
      : -1;

  decadeChart = upsertBarChart(
    decadeChart,
    "decadeChart",
    decadeData.map(([d]) => `${d}s`),
    decadeData.map(([, v]) => v),
    (label) => {
      const start = Number(label.replace("s", ""));
      if (yearFilter && yearFilter.start === start) {
        yearFilter = null;
      } else {
        yearFilter = { start, end: start + 9 };
      }
      artistFilter = null;
      render();
    },
    peakDecadeIndex
  );
}

// ------------ Render / page switching ------------

function render() {
  if (currentPage === "home") {
    renderHome();
    return;
  }

  if (currentPage === "wishlist") {
    const filteredWishlist = getFilteredWishlist();
    renderWishlist(filteredWishlist);
    renderActiveFilters();
    setStatus(`Showing ${filteredWishlist.length} of ${wishlist.length} wishlist item${wishlist.length === 1 ? "" : "s"}`);
    return;
  }

  const filtered = getFilteredRecords();
  renderCards(filtered);
  renderCharts();
  renderSuperlatives();
  renderActiveFilters();

  setStatus(`Showing ${filtered.length} of ${allRecords.length} records`);
}

function setPage(page) {
  currentPage = page;

  const homeBtn = document.getElementById("homePageBtn");
  const collectionBtn = document.getElementById("collectionPageBtn");
  const wishlistBtn = document.getElementById("wishlistPageBtn");
  const roomBtn = document.getElementById("roomPageBtn");
  const tasteProfileBtn = document.getElementById("tasteProfilePageBtn");
  const genreEvolutionBtn = document.getElementById("genreEvolutionPageBtn");
  const trophiesBtn = document.getElementById("trophiesPageBtn");

  const homeSection = document.getElementById("homeSection");
  const profileSection = document.getElementById("profileSection");
  const settingsSection = document.getElementById("settingsSection");
  const roomSection = document.getElementById("roomSection");
  const tasteProfileSection = document.getElementById("tasteProfileSection");
  const genreEvolutionSection = document.getElementById("genreEvolutionSection");
  const trophiesSection = document.getElementById("trophiesSection");
  const collectionDnaSection = document.getElementById("collectionDnaSection");
  const atAGlanceSection = document.getElementById("atAGlanceSection");
  const cardSection = document.getElementById("cardSection");
  const wishlistSection = document.getElementById("wishlistSection");
  const statusSection = document.getElementById("status");
  const pageNav = document.getElementById("pageNav");

  const isHome = page === "home";
  const isCollection = page === "collection";
  const isWishlist = page === "wishlist";
  const isProfile = page === "profile";
  const isSettings = page === "settings";
  const isRoom = page === "room";
  const isTasteProfile = page === "tasteProfile";
  const isGenreEvolution = page === "genreEvolution";
  const isTrophies = page === "trophies";

  [
    [homeBtn, isHome],
    [collectionBtn, isCollection],
    [wishlistBtn, isWishlist],
    [roomBtn, isRoom],
    [tasteProfileBtn, isTasteProfile],
    [genreEvolutionBtn, isGenreEvolution],
    [trophiesBtn, isTrophies],
  ].forEach(([btn, active]) => {
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  homeSection.hidden = !isHome;
  profileSection.hidden = !isProfile;
  settingsSection.hidden = !isSettings;
  roomSection.hidden = !isRoom;
  tasteProfileSection.hidden = !isTasteProfile;
  genreEvolutionSection.hidden = !isGenreEvolution;
  trophiesSection.hidden = !isTrophies;
  collectionDnaSection.hidden = !isCollection;
  atAGlanceSection.hidden = !isCollection;
  document.getElementById("cardSectionHeader").hidden = !isCollection;
  cardSection.hidden = !isCollection;
  wishlistSection.hidden = !isWishlist;
  statusSection.hidden = isHome || isProfile || isSettings || isRoom || isTasteProfile || isGenreEvolution || isTrophies;
  pageNav.hidden = isProfile || isSettings;

  if (isProfile) {
    renderProfile();
    return;
  }

  if (isSettings) {
    renderSettings();
    return;
  }

  if (isRoom) {
    renderRoom();
    return;
  }

  if (isTasteProfile) {
    renderTasteProfile();
    return;
  }

  if (isGenreEvolution) {
    renderGenreEvolution();
    return;
  }

  if (isTrophies) {
    renderTrophies();
    return;
  }

  render();
}

// ------------ Grid density ------------

function applyGridCols(value) {
  const root = document.documentElement.style;
  if (value === "auto") {
    root.setProperty("--grid-cols", "auto-fill");
    root.setProperty("--grid-min", "150px");
  } else {
    root.setProperty("--grid-cols", value);
    root.setProperty("--grid-min", "0px");
  }
  try {
    localStorage.setItem("spin-grid-cols", value);
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

async function updateRating(recordId, newRating) {
  // Optimistically update local state first
  const record = allRecords.find((r) => r.id === recordId);
  const previousRating = record ? record.rating : null;
  // Toggle off if clicking the already-active rating
  const ratingToSet = previousRating === newRating ? null : newRating;

  if (record) {
    record.rating = ratingToSet;
  }

  render();

  const { error } = await supabaseClient
    .from("records")
    .update({ rating: ratingToSet })
    .eq("id", recordId);

  if (error) {
    console.error("Failed to update rating:", error);
    setStatus("Couldn't save rating. Check console for details.");
    // Revert on failure
    if (record) {
      record.rating = previousRating;
    }
    render();
  }
}

function buildRatingControls(record) {
  const wrap = document.createElement("div");
  wrap.className = "rating-controls";

  RATING_OPTIONS.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `rating-btn rating-${opt.value}`;
    btn.textContent = opt.label;
    btn.setAttribute("aria-pressed", record.rating === opt.value ? "true" : "false");
    if (record.rating === opt.value) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      updateRating(record.id, opt.value);
    });
    wrap.appendChild(btn);
  });

  return wrap;
}


// ------------ Barcode scanning (shared) ------------

let pendingScannedCoverUrl = null;
let html5QrCode = null;
let activeScanConfig = null;
let scannerTorchOn = false;

async function startBarcodeScan(scanConfig) {
  activeScanConfig = scanConfig;
  scannerTorchOn = false;

  const scannerWrap = document.getElementById(scanConfig.wrapId);
  const scanStatus = document.getElementById(scanConfig.statusId);
  const scanBtn = document.getElementById(scanConfig.btnId);

  scanStatus.textContent = "Starting camera…";
  scanStatus.className = "form-status";
  scannerWrap.hidden = false;
  scanBtn.hidden = true;

  // Step 1: Request camera permission explicitly FIRST.
  // iOS Safari requires a clean getUserMedia call to show the permission prompt.
  // If we skip this and go straight to html5QrCode.start(), iOS silently fails.
  try {
    const testStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    // Permission granted — stop the test stream immediately, the library
    // will open its own stream in Step 2.
    testStream.getTracks().forEach((t) => t.stop());
  } catch (permErr) {
    const isDenied =
      permErr.name === "NotAllowedError" ||
      permErr.name === "PermissionDeniedError";

    if (isDenied) {
      scanStatus.innerHTML =
        "Camera access was denied. To fix this:<br>" +
        "<strong>iPhone:</strong> Settings → Safari → Camera → Allow<br>" +
        "<strong>Android:</strong> tap the camera icon in the address bar.";
    } else {
      scanStatus.textContent =
        "No camera found. Make sure your device has a camera and try again.";
    }
    scanStatus.className = "form-status form-status-error";
    scannerWrap.hidden = true;
    scanBtn.hidden = false;
    return;
  }

  // Step 2: Permission confirmed — start the barcode library.
  scanStatus.textContent = "Point camera at barcode";

  html5QrCode = new Html5Qrcode(scanConfig.videoId);

  const qrboxFn = (viewfinderWidth, viewfinderHeight) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const boxSize = Math.floor(minEdge * 0.72);
    return { width: boxSize, height: Math.floor(boxSize * 0.55) };
  };

  const baseConfig = {
    fps: 24,
    qrbox: qrboxFn,
    aspectRatio: 1.777,
    disableFlip: false,
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
    ],
  };

  const attempts = [
    {
      cameraId: { facingMode: "environment" },
      config: {
        ...baseConfig,
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
    },
    {
      cameraId: { facingMode: "environment" },
      config: baseConfig,
    },
    {
      cameraId: { facingMode: "user" },
      config: baseConfig,
    },
  ];

  let started = false;
  for (const attempt of attempts) {
    try {
      await html5QrCode.start(
        attempt.cameraId,
        attempt.config,
        (decodedText) => onBarcodeDetected(decodedText),
        () => {}
      );
      started = true;
      addTorchButton(scanConfig);
      break;
    } catch (err) {
      console.warn("[Scanner] Attempt failed:", err?.message || err);
      try { html5QrCode.clear(); } catch {}
      html5QrCode = new Html5Qrcode(scanConfig.videoId);
    }
  }

  if (!started) {
    scanStatus.innerHTML =
      "Camera couldn't start. Try closing other apps using the camera, then tap Scan again.";
    scanStatus.className = "form-status form-status-error";
    scannerWrap.hidden = true;
    scanBtn.hidden = false;
  }
}

function addTorchButton(scanConfig) {
  const scannerWrap = document.getElementById(scanConfig.wrapId);
  if (!scannerWrap || scannerWrap.querySelector(".scanner-torch-btn")) return;

  // Only add if the track supports torch
  const track = html5QrCode?.getRunningTrackCapabilities?.();
  const supportsTorch = track?.torch !== undefined;

  const torchBtn = document.createElement("button");
  torchBtn.type = "button";
  torchBtn.className = "scanner-torch-btn";
  torchBtn.innerHTML = '<i class="ti ti-bulb" aria-hidden="true"></i> Light';
  torchBtn.setAttribute("aria-label", "Toggle flashlight");

  torchBtn.addEventListener("click", async () => {
    try {
      scannerTorchOn = !scannerTorchOn;
      await html5QrCode?.applyVideoConstraints({
        advanced: [{ torch: scannerTorchOn }],
      });
      torchBtn.classList.toggle("scanner-torch-btn-on", scannerTorchOn);
      torchBtn.innerHTML = scannerTorchOn
        ? '<i class="ti ti-bulb-filled" aria-hidden="true"></i> Light on'
        : '<i class="ti ti-bulb" aria-hidden="true"></i> Light';
    } catch {
      torchBtn.hidden = true; // device doesn't support torch
    }
  });

  scannerWrap.appendChild(torchBtn);
}

async function stopBarcodeScan() {
  if (!activeScanConfig) return;

  const scannerWrap = document.getElementById(activeScanConfig.wrapId);
  const scanBtn = document.getElementById(activeScanConfig.btnId);

  // Turn off torch before stopping
  if (scannerTorchOn && html5QrCode) {
    try {
      await html5QrCode.applyVideoConstraints({ advanced: [{ torch: false }] });
    } catch {}
    scannerTorchOn = false;
  }

  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (err) {
      // ignore stop errors
    }
    html5QrCode = null;
  }

  // Remove torch button
  scannerWrap?.querySelector(".scanner-torch-btn")?.remove();

  scannerWrap.hidden = true;
  scanBtn.hidden = false;
}

// ============================================================
// MusicBrainz Integration
// ============================================================
//
// MusicBrainz is a free, open music encyclopedia with a public REST API.
// No authentication required. Rate limit: 1 req/sec.
// All calls include a User-Agent identifying SPIN VINYL per MB policy.
//
// Four uses:
//   1. mbLookupByBarcode()    — fallback when Discogs scan fails
//   2. mbSearchRelease()      — enrich manual Add Record search
//   3. mbEnrichCoverArt()     — silently fetch covers for records missing art
//   4. mbLookupByTitle()      — used by future Google Lens identification

const MB_BASE = "https://musicbrainz.org/ws/2";
const MB_HEADERS = {
  "User-Agent": "SPIN-VINYL/1.0 (spinvinyl.co; contact@spinvinyl.co)",
  "Accept": "application/json",
};
const CAA_BASE = "https://coverartarchive.org";

// Delay helper to respect the 1 req/sec rate limit
function mbDelay(ms = 1100) {
  return new Promise((res) => setTimeout(res, ms));
}

// Normalise a MusicBrainz release into a SPIN VINYL record shape
function mbReleaseToRecord(release) {
  const artistCredit = release["artist-credit"]?.[0];
  const artist = artistCredit?.artist?.name || artistCredit?.name || null;
  const label = release["label-info"]?.[0]?.label?.name || null;
  const catNo = release["label-info"]?.[0]?.["catalog-number"] || null;
  const year = release.date ? parseInt(release.date.slice(0, 4)) : null;
  const mbid = release.id || null;
  const rgMbid = release["release-group"]?.id || null;

  return {
    artist,
    album: release.title || null,
    year: isNaN(year) ? null : year,
    label,
    catalog_number: catNo,
    mbid,
    rgMbid,   // release-group MBID — better for cover art lookups
    country: release.country || null,
    cover_url: null,
  };
}

// 1. Barcode lookup via MusicBrainz
async function mbLookupByBarcode(barcode) {
  try {
    const url = `${MB_BASE}/release?query=barcode:${encodeURIComponent(barcode)}&limit=5&fmt=json`;
    const res = await fetch(url, { headers: MB_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    const releases = data.releases || [];
    if (releases.length === 0) return null;

    // Prefer releases with higher score and original pressings
    const best = releases.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    const record = mbReleaseToRecord(best);

    // Try to get cover art for the best match
    if (best.id) {
      const coverUrl = await mbFetchCoverUrl(best.id);
      if (coverUrl) record.cover_url = coverUrl;
    }

    return record.artist && record.album ? record : null;
  } catch (err) {
    console.warn("MusicBrainz barcode lookup failed:", err);
    return null;
  }
}

// 2. Full-text search by artist + album title
async function mbSearchRelease(artist, album) {
  try {
    // Build query — encode special chars but keep the field: prefix unencoded
    const parts = [];
    if (artist) parts.push(`artist:"${artist.replace(/"/g, "")}"`);
    if (album) parts.push(`release:"${album.replace(/"/g, "")}"`);
    if (parts.length === 0) return [];

    const query = parts.join(" AND ");
    const url = `${MB_BASE}/release?query=${encodeURIComponent(query)}&inc=release-groups+artist-credits+labels&limit=5&fmt=json`;
    const res = await fetch(url, { headers: MB_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.releases || []).map(mbReleaseToRecord);
  } catch (err) {
    console.warn("MusicBrainz search failed:", err);
    return [];
  }
}

// 3. Fetch cover art URL from Cover Art Archive by MBID
async function mbFetchCoverUrl(mbid) {
  try {
    const res = await fetch(`${CAA_BASE}/release/${mbid}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const front = data.images?.find((img) => img.front) || data.images?.[0];
    return front?.thumbnails?.large || front?.image || null;
  } catch {
    return null;
  }
}

// 3b. Lookup by release-group MBID (more stable for cover art)
async function mbFetchCoverUrlByGroup(mbid) {
  try {
    const res = await fetch(`${CAA_BASE}/release-group/${mbid}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const front = data.images?.find((img) => img.front) || data.images?.[0];
    return front?.thumbnails?.large || front?.image || null;
  } catch {
    return null;
  }
}

// 4. Lookup by title only (for AI image identification flow)
async function mbLookupByTitle(title, artistHint = "") {
  try {
    const query = artistHint
      ? `release:${encodeURIComponent(title)} AND artist:${encodeURIComponent(artistHint)}`
      : `release:${encodeURIComponent(title)}`;
    const url = `${MB_BASE}/release?query=${query}&limit=3&fmt=json`;
    const res = await fetch(url, { headers: MB_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.releases || []).map(mbReleaseToRecord);
  } catch (err) {
    console.warn("MusicBrainz title lookup failed:", err);
    return [];
  }
}

// ============================================================
// Cover Art Enrichment — background job
// ============================================================
// Runs after loadData() for any records missing cover_url.
// Respects MB rate limit with 1.1s delay between requests.
// Saves fetched URLs back to the DB silently.

let mbEnrichmentRunning = false;

async function mbEnrichMissingCovers() {
  if (mbEnrichmentRunning) return;
  const missing = allRecords.filter((r) => !r.cover_url && r.artist && r.album);
  if (missing.length === 0) return;

  mbEnrichmentRunning = true;
  console.log(`[MB] Starting cover art enrichment for ${missing.length} records`);

  for (const record of missing) {
    try {
      await mbDelay(1100);

      const results = await mbSearchRelease(record.artist, record.album);
      if (results.length === 0) continue;

      const best = results[0];

      // Try the specific release first, then fall back to release-group.
      // Release-group art is more likely to exist and matches the canonical
      // album art rather than a specific pressing.
      let coverUrl = null;
      if (best.mbid) coverUrl = await mbFetchCoverUrl(best.mbid);
      if (!coverUrl && best.rgMbid) coverUrl = await mbFetchCoverUrlByGroup(best.rgMbid);
      if (!coverUrl) continue;

      const { error } = await supabaseClient
        .from("records")
        .update({ cover_url: coverUrl })
        .eq("id", record.id)
        .eq("user_id", currentUser.id);

      if (!error) {
        record.cover_url = coverUrl;
        console.log(`[MB] ✓ Cover art found: ${record.artist} — ${record.album}`);
        render();
      }
    } catch (err) {
      console.warn(`[MB] Enrichment failed for ${record.album}:`, err);
    }
  }

  mbEnrichmentRunning = false;
  console.log("[MB] Cover art enrichment complete");
}

// ---- MusicBrainz search handler for Add Record form ----

async function handleMbSearch() {
  const artist = document.getElementById("fieldArtist").value.trim();
  const album = document.getElementById("fieldAlbum").value.trim();
  const statusEl = document.getElementById("mbSearchStatus");
  const resultsEl = document.getElementById("mbSearchResults");
  const btn = document.getElementById("mbSearchBtn");

  if (!artist && !album) {
    statusEl.textContent = "Enter artist or album name first.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  btn.disabled = true;
  statusEl.textContent = "Searching MusicBrainz…";
  statusEl.className = "form-status";
  resultsEl.hidden = true;
  resultsEl.innerHTML = "";

  try {
    const results = await mbSearchRelease(artist, album);

    if (results.length === 0) {
      statusEl.textContent = "No matches found on MusicBrainz.";
      btn.disabled = false;
      return;
    }

    statusEl.textContent = `${results.length} result${results.length > 1 ? "s" : ""} found — click one to fill in the form.`;
    statusEl.className = "form-status form-status-success";
    resultsEl.hidden = false;

    results.forEach((r) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mb-result-row";

      const meta = document.createElement("div");
      meta.innerHTML = `
        <p class="mb-result-title">${r.album || "Unknown album"}</p>
        <p class="mb-result-sub">${[r.artist, r.year, r.label].filter(Boolean).join(" · ")}</p>
      `;
      row.appendChild(meta);

      row.addEventListener("click", async () => {
        // Fill form fields
        if (r.artist) document.getElementById("fieldArtist").value = r.artist;
        if (r.album) document.getElementById("fieldAlbum").value = r.album;
        if (r.year) document.getElementById("fieldYear").value = r.year;
        if (r.label) document.getElementById("fieldLabel").value = r.label;

        // Fetch cover art
        if (r.mbid) {
          statusEl.textContent = "Fetching cover art…";
          statusEl.className = "form-status";
          const coverUrl = await mbFetchCoverUrl(r.mbid);
          if (coverUrl) {
            pendingScannedCoverUrl = coverUrl;
            setCoverPreview(coverUrl);
            statusEl.textContent = "Details and cover art filled in from MusicBrainz.";
          } else {
            statusEl.textContent = "Details filled in — no cover art found.";
          }
          statusEl.className = "form-status form-status-success";
        } else {
          statusEl.textContent = "Details filled in from MusicBrainz.";
          statusEl.className = "form-status form-status-success";
        }

        resultsEl.hidden = true;
      });

      resultsEl.appendChild(row);
    });

  } catch (err) {
    console.error(err);
    statusEl.textContent = "MusicBrainz search failed. Try again.";
    statusEl.className = "form-status form-status-error";
  }

  btn.disabled = false;
}

// ---- Barcode fallback: try MusicBrainz when Discogs returns nothing ----

async function onBarcodeDetected(barcode) {
  const scanConfig = activeScanConfig;
  const scanStatus = document.getElementById(scanConfig.statusId);

  await stopBarcodeScan();

  scanStatus.textContent = `Scanned ${barcode}. Looking up...`;
  scanStatus.className = "form-status";

  try {
    // Try Discogs first
    const response = await fetch(DISCOGS_LOOKUP_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ barcode }),
    });

    const result = await response.json();

    if (response.ok && result.found) {
      scanConfig.onResult(result);
      scanStatus.textContent = "Found on Discogs. Review details below.";
      scanStatus.className = "form-status form-status-success";
      return;
    }

    // Discogs found nothing — try MusicBrainz
    scanStatus.textContent = "Not on Discogs. Trying MusicBrainz...";

    const mbResult = await mbLookupByBarcode(barcode);
    if (mbResult) {
      scanConfig.onResult({
        found: true,
        artist: mbResult.artist,
        album: mbResult.album,
        year: mbResult.year,
        label: mbResult.label,
        cover_url: mbResult.cover_url,
      });
      scanStatus.textContent = "Found on MusicBrainz. Review details below.";
      scanStatus.className = "form-status form-status-success";
      return;
    }

    scanStatus.textContent = `No match found for barcode ${barcode}. Enter details manually.`;
    scanStatus.className = "form-status";

  } catch (err) {
    console.error(err);
    scanStatus.textContent = "Couldn't look up barcode. Check console for details.";
    scanStatus.className = "form-status form-status-error";
  }
}

const ADD_RECORD_SCAN_CONFIG = {
  videoId: "scannerVideo",
  wrapId: "scannerWrap",
  btnId: "scanBarcodeBtn",
  cancelBtnId: "cancelScanBtn",
  statusId: "scanStatus",
  onResult: (result) => {
    if (result.artist) document.getElementById("fieldArtist").value = result.artist;
    if (result.album) document.getElementById("fieldAlbum").value = result.album;
    if (result.year) document.getElementById("fieldYear").value = result.year;
    if (result.label) document.getElementById("fieldLabel").value = result.label;
    if (result.genre) document.getElementById("fieldGenre").value = result.genre;
    if (result.style) document.getElementById("fieldSubgenre").value = result.style;
    if (result.genre) populateSubgenreOptionsForGenre(result.genre);
    if (result.cover_url) pendingScannedCoverUrl = result.cover_url;
  },
};

const ADD_WISHLIST_SCAN_CONFIG = {
  videoId: "wishScannerVideo",
  wrapId: "wishScannerWrap",
  btnId: "wishScanBarcodeBtn",
  cancelBtnId: "wishCancelScanBtn",
  statusId: "wishScanStatus",
  onResult: (result) => {
    if (result.artist) document.getElementById("wishArtist").value = result.artist;
    if (result.album) document.getElementById("wishAlbum").value = result.album;
    if (result.year) document.getElementById("wishYear").value = result.year;
    if (result.label) document.getElementById("wishLabel").value = result.label;
    if (result.genre) document.getElementById("wishGenre").value = result.genre;
    if (result.style) document.getElementById("wishSubgenre").value = result.style;
    if (result.genre) populateSubgenreOptionsForGenre(result.genre);
    if (result.discogs_release_id) pendingWishlistDiscogsId = result.discogs_release_id;
    if (result.cover_url) pendingWishlistCoverUrl = result.cover_url;
  },
};

// In-store scan config — goes to Album Intel modal instead of a form
const IN_STORE_SCAN_CONFIG = {
  videoId: "inStoreScannerVideo",
  wrapId: "albumIntelScannerState",
  btnId: "scanInStoreBtn",
  cancelBtnId: "cancelInStoreScanBtn",
  statusId: "inStoreScanStatus",
  onResult: (result) => showAlbumIntel(result),
};

// ============================================================
// Cover Identify — Google Lens-style album ID from photo (#13)
// ============================================================
// Flow: open camera → user taps "Identify" → capture frame as
// base64 JPEG → send to Claude Vision API → parse artist/album
// → look up on MusicBrainz → show Album Intel card

let coverIdentifyStream = null;
let coverIdentifyPendingResult = null;

async function openCoverIdentifyModal() {
  document.getElementById("coverIdentifyOverlay").hidden = false;
  document.body.style.overflow = "hidden";
  showCoverIdentifyState("camera");
  await startCoverIdentifyCamera();
}

function closeCoverIdentifyModal() {
  stopCoverIdentifyCamera();
  document.getElementById("coverIdentifyOverlay").hidden = true;
  document.body.style.overflow = "";
  coverIdentifyPendingResult = null;
  document.getElementById("coverIdentifyActionStatus").textContent = "";
}

function showCoverIdentifyState(state) {
  document.getElementById("coverIdentifyCameraState").hidden = state !== "camera";
  document.getElementById("coverIdentifyLoadingState").hidden = state !== "loading";
  document.getElementById("coverIdentifyResultState").hidden = state !== "result";
}

async function startCoverIdentifyCamera() {
  const video = document.getElementById("coverIdentifyVideo");
  const statusEl = document.getElementById("coverIdentifyCameraStatus");

  try {
    coverIdentifyStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    video.srcObject = coverIdentifyStream;
  } catch (err) {
    const denied = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
    statusEl.textContent = denied
      ? "Camera access denied. Check Settings → Safari → Camera."
      : "Couldn't start camera. Try again.";
    statusEl.className = "form-status form-status-error";
  }
}

function stopCoverIdentifyCamera() {
  coverIdentifyStream?.getTracks().forEach((t) => t.stop());
  coverIdentifyStream = null;
  const video = document.getElementById("coverIdentifyVideo");
  video.srcObject = null;
}

async function captureAndIdentifyCover() {
  const video = document.getElementById("coverIdentifyVideo");
  const canvas = document.getElementById("coverIdentifyCanvas");

  // Capture a frame from the video
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext("2d").drawImage(video, 0, 0);

  // Convert to base64 JPEG
  const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];

  stopCoverIdentifyCamera();
  showCoverIdentifyState("loading");
  document.getElementById("coverIdentifyLoadingText").textContent = "Analysing cover art…";

  try {
    // Ask Claude to identify the album
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: "This is a photo of a vinyl record album cover. Identify the album. Reply with ONLY a JSON object with these fields: {\"artist\": \"...\", \"album\": \"...\", \"year\": 1234, \"confidence\": \"high|medium|low\"}. If you cannot identify the album, return {\"artist\": null, \"album\": null, \"confidence\": \"low\"}. No other text.",
            },
          ],
        }],
      }),
    });

    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      throw new Error("Couldn't parse AI response");
    }

    if (!parsed.artist || !parsed.album) {
      document.getElementById("coverIdentifyLoadingText").textContent = "Couldn't identify — trying again…";
      showCoverIdentifyState("camera");
      await startCoverIdentifyCamera();
      document.getElementById("coverIdentifyCameraStatus").textContent =
        "Couldn't identify that cover. Try a clearer angle or better lighting.";
      document.getElementById("coverIdentifyCameraStatus").className = "form-status form-status-error";
      return;
    }

    // Look up on MusicBrainz
    document.getElementById("coverIdentifyLoadingText").textContent = "Looking up on MusicBrainz…";
    const mbResults = await mbLookupByTitle(parsed.album, parsed.artist);

    const intel = {
      artist: parsed.artist,
      album: parsed.album,
      year: mbResults[0]?.year || parsed.year || null,
      label: mbResults[0]?.label || null,
      cover_url: null,
      confidence: parsed.confidence || "medium",
    };

    // Fetch cover art
    if (mbResults[0]?.mbid) {
      let cover = await mbFetchCoverUrl(mbResults[0].mbid);
      if (!cover && mbResults[0].rgMbid) cover = await mbFetchCoverUrlByGroup(mbResults[0].rgMbid);
      if (cover) intel.cover_url = cover;
    }

    coverIdentifyPendingResult = intel;
    renderCoverIdentifyResult(intel);
    showCoverIdentifyState("result");

  } catch (err) {
    console.error("[CoverID]", err);
    showCoverIdentifyState("camera");
    await startCoverIdentifyCamera();
    document.getElementById("coverIdentifyCameraStatus").textContent =
      "Something went wrong. Check your connection and try again.";
    document.getElementById("coverIdentifyCameraStatus").className = "form-status form-status-error";
  }
}

function renderCoverIdentifyResult(intel) {
  const coverImg = document.getElementById("coverIdentifyResultCover");
  const placeholder = document.getElementById("coverIdentifyResultPlaceholder");
  if (intel.cover_url) {
    coverImg.src = intel.cover_url;
    coverImg.hidden = false;
    placeholder.hidden = true;
  } else {
    coverImg.hidden = true;
    placeholder.hidden = false;
  }

  document.getElementById("coverIdentifyResultArtist").textContent = intel.artist || "";
  document.getElementById("coverIdentifyResultTitle").textContent = intel.album || "Unknown Album";

  const metaEl = document.getElementById("coverIdentifyResultMeta");
  metaEl.innerHTML = "";
  [intel.year, intel.label].filter(Boolean).forEach((val) => {
    const pill = document.createElement("span");
    pill.className = "album-intel-meta-pill";
    pill.textContent = val;
    metaEl.appendChild(pill);
  });

  const confEl = document.getElementById("coverIdentifyConfidence");
  const confMap = { high: "✓ High confidence match", medium: "~ Medium confidence — please verify", low: "? Low confidence — please verify" };
  confEl.textContent = confMap[intel.confidence] || "";
  confEl.className = `cover-identify-confidence cover-identify-confidence-${intel.confidence}`;
}

async function coverIdentifyAddToWishlist() {
  const intel = coverIdentifyPendingResult;
  if (!intel) return;
  const statusEl = document.getElementById("coverIdentifyActionStatus");
  statusEl.textContent = "Adding to wishlist…";
  try {
    await supabaseClient.from("wishlist").insert({
      user_id: currentUser.id,
      artist: intel.artist,
      album: intel.album,
      year: intel.year || null,
      cover_url: intel.cover_url || null,
    });
    statusEl.textContent = "✓ Added to wishlist!";
    statusEl.className = "form-status form-status-success";
    await loadData();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't add. Try again.";
    statusEl.className = "form-status form-status-error";
  }
}

function setupCoverIdentifyModal() {
  document.getElementById("identifyCoverBtn")
    ?.addEventListener("click", () => openCoverIdentifyModal());

  document.getElementById("coverIdentifyCloseBtn")
    ?.addEventListener("click", () => closeCoverIdentifyModal());

  document.getElementById("coverIdentifyOverlay")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "coverIdentifyOverlay") closeCoverIdentifyModal();
    });

  document.getElementById("coverIdentifyCaptureBtn")
    ?.addEventListener("click", () => captureAndIdentifyCover());

  document.getElementById("coverIdentifyCancelBtn")
    ?.addEventListener("click", () => closeCoverIdentifyModal());

  document.getElementById("coverIdentifyTryAgainBtn")
    ?.addEventListener("click", async () => {
      coverIdentifyPendingResult = null;
      showCoverIdentifyState("camera");
      await startCoverIdentifyCamera();
    });

  document.getElementById("coverIdentifyAddWishlistBtn")
    ?.addEventListener("click", () => coverIdentifyAddToWishlist());

  document.getElementById("coverIdentifyAddCollectionBtn")
    ?.addEventListener("click", () => {
      const intel = coverIdentifyPendingResult;
      if (!intel) return;
      closeCoverIdentifyModal();
      openAddRecordModal();
      if (intel.artist) document.getElementById("fieldArtist").value = intel.artist;
      if (intel.album) document.getElementById("fieldAlbum").value = intel.album;
      if (intel.year) document.getElementById("fieldYear").value = intel.year;
      if (intel.cover_url) {
        pendingScannedCoverUrl = intel.cover_url;
        setCoverPreview(intel.cover_url);
      }
    });
}

// ============================================================
// Album Intel Modal
// ============================================================

let albumIntelPendingResult = null;

function openAlbumIntelModal() {
  document.getElementById("albumIntelOverlay").hidden = false;
  document.body.style.overflow = "hidden";
  showAlbumIntelState("scanner");
  startBarcodeScan(IN_STORE_SCAN_CONFIG);
}

function closeAlbumIntelModal() {
  stopBarcodeScan();
  document.getElementById("albumIntelOverlay").hidden = true;
  document.body.style.overflow = "";
  albumIntelPendingResult = null;
  document.getElementById("albumIntelActionStatus").textContent = "";
}

function showAlbumIntelState(state) {
  document.getElementById("albumIntelScannerState").hidden = state !== "scanner";
  document.getElementById("albumIntelLoadingState").hidden = state !== "loading";
  document.getElementById("albumIntelResultState").hidden = state !== "result";
}

async function showAlbumIntel(result) {
  showAlbumIntelState("loading");
  document.getElementById("albumIntelLoadingText").textContent = "Looking up album...";

  // Start with what the barcode lookup already gave us
  let intel = {
    artist: result.artist || null,
    album: result.album || null,
    year: result.year || null,
    label: result.label || null,
    genre: result.genre || null,
    cover_url: result.cover_url || null,
    description: null,
    discogs_release_id: result.discogs_release_id || null,
    lowest_price: null,
    median_price: null,
    currency: "USD",
  };

  // Try to enrich with Discogs pricing if we have a release ID
  if (intel.discogs_release_id) {
    try {
      document.getElementById("albumIntelLoadingText").textContent = "Fetching pricing data...";
      const priceRes = await fetch(DISCOGS_LOOKUP_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ release_id: intel.discogs_release_id, action: "price" }),
      });
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        if (priceData.lowest_price) intel.lowest_price = priceData.lowest_price;
        if (priceData.median_price) intel.median_price = priceData.median_price;
        if (priceData.currency) intel.currency = priceData.currency;
      }
    } catch { /* pricing is optional — fail silently */ }
  }

  // If MusicBrainz gave us a description, use it
  if (!intel.description && intel.artist && intel.album) {
    try {
      document.getElementById("albumIntelLoadingText").textContent = "Fetching album info...";
      const mbResults = await mbSearchRelease(intel.artist, intel.album);
      if (mbResults.length > 0 && mbResults[0].rgMbid && !intel.cover_url) {
        const coverUrl = await mbFetchCoverUrlByGroup(mbResults[0].rgMbid);
        if (coverUrl) intel.cover_url = coverUrl;
      }
    } catch { /* fail silently */ }
  }

  albumIntelPendingResult = intel;
  renderAlbumIntel(intel);
  showAlbumIntelState("result");
}

function renderAlbumIntel(intel) {
  // Cover art
  const coverImg = document.getElementById("albumIntelCover");
  const coverPlaceholder = document.getElementById("albumIntelCoverPlaceholder");
  if (intel.cover_url) {
    coverImg.src = intel.cover_url;
    coverImg.hidden = false;
    coverPlaceholder.hidden = true;
  } else {
    coverImg.hidden = true;
    coverPlaceholder.hidden = false;
  }

  // Text
  document.getElementById("albumIntelArtist").textContent = intel.artist || "";
  document.getElementById("albumIntelTitle").textContent = intel.album || "Unknown Album";

  // Meta pills — year, label, genre
  const metaEl = document.getElementById("albumIntelMeta");
  metaEl.innerHTML = "";
  [intel.year, intel.label, intel.genre].filter(Boolean).forEach((val) => {
    const pill = document.createElement("span");
    pill.className = "album-intel-meta-pill";
    pill.textContent = val;
    metaEl.appendChild(pill);
  });

  // Description
  const descEl = document.getElementById("albumIntelDescription");
  descEl.textContent = intel.description || "";
  descEl.hidden = !intel.description;

  // Pricing
  const pricingEl = document.getElementById("albumIntelPricing");
  const pricingText = document.getElementById("albumIntelPricingText");
  if (intel.lowest_price || intel.median_price) {
    const parts = [];
    if (intel.lowest_price) parts.push(`From ${intel.currency} ${intel.lowest_price}`);
    if (intel.median_price) parts.push(`median ${intel.currency} ${intel.median_price}`);
    pricingText.textContent = parts.join(" · ") + " on Discogs";
    pricingEl.hidden = false;
  } else {
    pricingEl.hidden = true;
  }
}

async function albumIntelAddToWishlist() {
  const intel = albumIntelPendingResult;
  if (!intel) return;
  const statusEl = document.getElementById("albumIntelActionStatus");
  statusEl.textContent = "Adding to wishlist...";

  try {
    const payload = {
      user_id: currentUser.id,
      artist: intel.artist,
      album: intel.album,
      year: intel.year || null,
      label: intel.label || null,
      cover_url: intel.cover_url || null,
      discogs_release_id: intel.discogs_release_id || null,
    };
    const { error } = await supabaseClient.from("wishlist").insert(payload);
    if (error) throw error;
    statusEl.textContent = "✓ Added to wishlist!";
    statusEl.className = "form-status form-status-success";
    await loadData();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't add to wishlist. Try again.";
    statusEl.className = "form-status form-status-error";
  }
}

async function albumIntelAddToCollection() {
  const intel = albumIntelPendingResult;
  if (!intel) return;

  // Close modal and open Add Record form pre-filled
  closeAlbumIntelModal();
  openAddRecordModal();

  if (intel.artist) document.getElementById("fieldArtist").value = intel.artist;
  if (intel.album) document.getElementById("fieldAlbum").value = intel.album;
  if (intel.year) document.getElementById("fieldYear").value = intel.year;
  if (intel.label) document.getElementById("fieldLabel").value = intel.label;
  if (intel.cover_url) {
    pendingScannedCoverUrl = intel.cover_url;
    setCoverPreview(intel.cover_url);
  }
}

function setupAlbumIntelModal() {
  document.getElementById("scanInStoreBtn")
    ?.addEventListener("click", () => openAlbumIntelModal());

  document.getElementById("albumIntelCloseBtn")
    ?.addEventListener("click", () => closeAlbumIntelModal());

  document.getElementById("albumIntelOverlay")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "albumIntelOverlay") closeAlbumIntelModal();
    });

  document.getElementById("cancelInStoreScanBtn")
    ?.addEventListener("click", () => closeAlbumIntelModal());

  document.getElementById("albumIntelAddWishlistBtn")
    ?.addEventListener("click", () => albumIntelAddToWishlist());

  document.getElementById("albumIntelAddCollectionBtn")
    ?.addEventListener("click", () => albumIntelAddToCollection());

  document.getElementById("albumIntelScanAgainBtn")
    ?.addEventListener("click", () => {
      albumIntelPendingResult = null;
      document.getElementById("albumIntelActionStatus").textContent = "";
      showAlbumIntelState("scanner");
      startBarcodeScan(IN_STORE_SCAN_CONFIG);
    });
}

// ------------ Add Record ------------

async function getOrCreateGenreId(genreNameRaw) {
  const name = normalizeGenre(genreNameRaw);
  if (!name) return null;

  const existing = genres.find(
    (g) => g.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing.id;

  const { data, error } = await supabaseClient
    .from("genres")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;

  genres.push(data);
  return data.id;
}

async function getOrCreateSubgenreId(subgenreNameRaw, genreId) {
  const name = normalizeGenre(subgenreNameRaw);
  if (!name) return null;

  const existing = subgenres.find(
    (sg) => sg.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) return existing.id;

  const { data, error } = await supabaseClient
    .from("subgenres")
    .insert({ name, genre_id: genreId })
    .select()
    .single();

  if (error) throw error;

  subgenres.push(data);
  return data.id;
}

function openAddRecordModal() {
  document.getElementById("addRecordOverlay").hidden = false;
  document.getElementById("addRecordStatus").textContent = "";
  document.getElementById("scanStatus").textContent = "";
  document.getElementById("scanStatus").className = "form-status";
  pendingScannedCoverUrl = null;
  populateSubgenreOptionsForGenre(document.getElementById("fieldGenre").value);
  document.getElementById("fieldArtist").focus();
}

function closeAddRecordModal() {
  document.getElementById("addRecordOverlay").hidden = true;
  stopBarcodeScan();
}

function resetAddRecordForm() {
  document.getElementById("addRecordForm").reset();
  document.getElementById("fieldQuantity").value = 1;
  document.getElementById("addRecordStatus").textContent = "";
  document.getElementById("scanStatus").textContent = "";
  document.getElementById("scanStatus").className = "form-status";
  pendingScannedCoverUrl = null;
  populateSubgenreOptionsForGenre(null);
}

async function handleAddRecordSubmit(event) {
  event.preventDefault();

  const statusEl = document.getElementById("addRecordStatus");
  const submitBtn = document.getElementById("submitAddRecordBtn");

  const artist = document.getElementById("fieldArtist").value.trim();
  const album = document.getElementById("fieldAlbum").value.trim();

  if (!artist || !album) {
    statusEl.textContent = "Artist and Album are required.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  const yearVal = parseYearInput(document.getElementById("fieldYear").value);
  const quantityVal = parseYearInput(document.getElementById("fieldQuantity").value) || 1;
  const label = document.getElementById("fieldLabel").value.trim() || null;
  const genreInput = document.getElementById("fieldGenre").value.trim();
  const subgenreInput = document.getElementById("fieldSubgenre").value.trim();
  const vinylGrade = document.getElementById("fieldVinylGrade").value.trim() || null;
  const sleeveGrade = document.getElementById("fieldSleeveGrade").value.trim() || null;
  const description = document.getElementById("fieldDescription").value.trim() || null;
  const notes = document.getElementById("fieldNotes").value.trim() || null;

  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    const genreId = await getOrCreateGenreId(genreInput);
    const subgenreId = subgenreInput
      ? await getOrCreateSubgenreId(subgenreInput, genreId)
      : null;

    const newRecord = {
      artist,
      album,
      year: yearVal,
      year_raw: yearVal !== null ? String(yearVal) : null,
      label,
      genre_id: genreId,
      subgenre_id: subgenreId,
      description,
      vinyl_grade: vinylGrade,
      sleeve_grade: sleeveGrade,
      notes,
      quantity: quantityVal,
      cover_url: pendingScannedCoverUrl,
    };

    const { data, error } = await supabaseClient
      .from("records")
      .insert(newRecord)
      .select(
        `
        id,
        artist,
        album,
        year,
        label,
        genre_id,
        subgenre_id,
        cover_url,
        rating,
        description,
        vinyl_grade,
        sleeve_grade,
        notes,
        quantity,
        acquired_date,
        acquired_location,
        listening_notes,
        personal_story,
        genres ( name ),
        subgenres ( name )
      `
      )
      .single();

    if (error) throw error;

    const enriched = {
      ...data,
      genre_name: data.genres?.name ?? "",
      subgenre_name: data.subgenres?.name ?? "",
    };

    allRecords.push(enriched);
    allRecords.sort((a, b) => a.artist.localeCompare(b.artist));

    renderFilters();
    render();

    statusEl.textContent = `Added "${album}" by ${artist}.`;
    statusEl.className = "form-status form-status-success";

    resetAddRecordForm();
    setTimeout(() => {
      closeAddRecordModal();
    }, 900);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save this record. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}


// ------------ Wishlist ------------

const DISCOGS_PRICE_FUNCTION_URL = "https://wdgiskawukblqgapkmig.supabase.co/functions/v1/discogs-price";

function formatPrice(value, currency) {
  if (value === null || value === undefined) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function renderWishlist(filtered) {
  const grid = document.getElementById("wishlistGrid");
  grid.innerHTML = "";

  if (wishlist.length === 0) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "Your wishlist is empty. Use \"+ Add to Wishlist\" to start tracking albums you want next.";
    grid.appendChild(empty);
    return;
  }

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "No wishlist items match your filters.";
    grid.appendChild(empty);
    return;
  }

  filtered.forEach((w) => {
    const card = document.createElement("div");
    card.className = "record-card wishlist-card";
    card.addEventListener("click", () => openWishlistDetailModal(w.id));

    const coverWrap = document.createElement("div");
    coverWrap.className = "cover-wrap";

    const disc = document.createElement("div");
    disc.className = "vinyl-disc";
    coverWrap.appendChild(disc);

    if (w.cover_url) {
      const img = document.createElement("img");
      img.className = "cover-img";
      img.src = w.cover_url;
      img.alt = `${w.album} cover`;
      img.loading = "lazy";
      coverWrap.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "cover-img cover-placeholder";
      const placeholderImg = document.createElement("img");
      placeholderImg.src = "icon-512.png";
      placeholderImg.alt = "";
      placeholderImg.loading = "lazy";
      placeholder.appendChild(placeholderImg);
      coverWrap.appendChild(placeholder);
    }

    card.appendChild(coverWrap);

    const info = document.createElement("div");
    info.className = "record-info";

    const artistEl = document.createElement("div");
    artistEl.className = "record-artist";
    artistEl.textContent = w.artist;

    const albumEl = document.createElement("div");
    albumEl.className = "record-album";
    albumEl.textContent = w.album;

    const metaEl = document.createElement("div");
    metaEl.className = "record-meta";
    const metaParts = [];
    if (w.year) metaParts.push(w.year);
    if (w.genre_name) metaParts.push(w.genre_name);
    if (w.subgenre_name) metaParts.push(w.subgenre_name);
    metaEl.textContent = metaParts.join(" · ");

    info.appendChild(artistEl);
    info.appendChild(albumEl);
    if (metaParts.length) info.appendChild(metaEl);

    // Price section
    const priceWrap = document.createElement("div");
    priceWrap.className = "price-wrap";

    if (w.price_data) {
      const priceList = document.createElement("div");
      priceList.className = "price-list";
      Object.entries(w.price_data).forEach(([grade, info]) => {
        const row = document.createElement("div");
        row.className = "price-row";
        row.textContent = `${grade}: ${formatPrice(info.value, info.currency)}`;
        priceList.appendChild(row);
      });
      priceWrap.appendChild(priceList);

      if (w.price_checked_at) {
        const checkedEl = document.createElement("div");
        checkedEl.className = "price-checked";
        checkedEl.textContent = `Checked ${new Date(w.price_checked_at).toLocaleDateString()}`;
        priceWrap.appendChild(checkedEl);
      }
    }

    if (w.discogs_release_id) {
      const priceBtn = document.createElement("button");
      priceBtn.type = "button";
      priceBtn.className = "btn-secondary price-btn";
      priceBtn.textContent = "Check price";
      priceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        checkWishlistPrice(w.id);
      });
      priceWrap.appendChild(priceBtn);
    } else {
      const findBtn = document.createElement("button");
      findBtn.type = "button";
      findBtn.className = "btn-secondary price-btn";
      findBtn.textContent = "Find on Discogs";
      findBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        findWishlistDiscogsMatch(w.id);
      });
      priceWrap.appendChild(findBtn);
    }

    info.appendChild(priceWrap);

    // Actions
    const actions = document.createElement("div");
    actions.className = "wishlist-actions";

    const moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.className = "btn-primary";
    moveBtn.textContent = "Move to collection";
    moveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      moveWishlistItemToCollection(w.id);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeWishlistItem(w.id);
    });

    actions.appendChild(moveBtn);
    actions.appendChild(removeBtn);
    info.appendChild(actions);

    if (w.notes) {
      const notesEl = document.createElement("div");
      notesEl.className = "record-meta";
      notesEl.textContent = w.notes;
      info.appendChild(notesEl);
    }

    card.appendChild(info);
    grid.appendChild(card);
  });
}

async function checkWishlistPrice(wishlistId) {
  const item = wishlist.find((w) => w.id === wishlistId);
  if (!item || !item.discogs_release_id) return;

  setStatus("Checking price...");

  try {
    const response = await fetch(DISCOGS_PRICE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ release_id: item.discogs_release_id }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Price check failed (${response.status})`);
    }

    const updates = {
      price_data: result.price_data || null,
      price_currency: result.currency || null,
      price_checked_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient
      .from("wishlist")
      .update(updates)
      .eq("id", wishlistId);

    if (error) throw error;

    Object.assign(item, updates);
    render();
  } catch (err) {
    console.error(err);
    setStatus("Couldn't check price. See console for details.");
  }
}

async function lookupDiscogsByArtistAlbum(artist, album) {
  const response = await fetch(DISCOGS_LOOKUP_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ artist, album }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Lookup failed (${response.status})`);
  }

  return result;
}

async function buildWishlistUpdatesFromDiscogs(item, result) {
  const updates = {
    discogs_release_id: result.discogs_release_id || null,
    cover_url: item.cover_url || result.cover_url || null,
  };

  if (!item.year && result.year) {
    updates.year = result.year;
  }

  if (!item.label && result.label) {
    updates.label = result.label;
  }

  if (!item.genre_id && result.genre) {
    const genreId = await getOrCreateGenreId(result.genre);
    if (genreId) {
      updates.genre_id = genreId;
      if (!item.subgenre_id && result.style) {
        const subgenreId = await getOrCreateSubgenreId(result.style, genreId);
        if (subgenreId) updates.subgenre_id = subgenreId;
      }
    }
  }

  return updates;
}

async function findWishlistDiscogsMatch(wishlistId) {
  const item = wishlist.find((w) => w.id === wishlistId);
  if (!item) return;

  setStatus(`Searching Discogs for "${item.album}" by ${item.artist}...`);

  try {
    const result = await lookupDiscogsByArtistAlbum(item.artist, item.album);
    console.log("Discogs lookup debug:", result.debug, result);

    if (!result.found) {
      setStatus(`No Discogs match found for "${item.album}" by ${item.artist}.`);
      return;
    }

    const updates = await buildWishlistUpdatesFromDiscogs(item, result);

    const { error } = await supabaseClient
      .from("wishlist")
      .update(updates)
      .eq("id", wishlistId);

    if (error) throw error;

    Object.assign(item, updates);
    item.genre_name = genreNameById(item.genre_id);
    item.subgenre_name = subgenreNameById(item.subgenre_id);
    render();
    setStatus(`Found a Discogs match for "${item.album}" by ${item.artist}.`);
  } catch (err) {
    console.error(err);
    setStatus("Couldn't search Discogs. See console for details.");
  }
}

async function findAllWishlistDiscogsMatches() {
  const targets = wishlist.filter((w) => !w.discogs_release_id);

  if (targets.length === 0) {
    setStatus("Every wishlist item already has a Discogs match.");
    return;
  }

  const btn = document.getElementById("findAllDiscogsBtn");
  if (btn) btn.disabled = true;

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    setStatus(`Checking Discogs ${i + 1} of ${targets.length}: "${item.album}" by ${item.artist}...`);

    try {
      const result = await lookupDiscogsByArtistAlbum(item.artist, item.album);

      if (result.found) {
        const updates = await buildWishlistUpdatesFromDiscogs(item, result);

        const { error } = await supabaseClient
          .from("wishlist")
          .update(updates)
          .eq("id", item.id);

        if (!error) {
          Object.assign(item, updates);
          item.genre_name = genreNameById(item.genre_id);
          item.subgenre_name = subgenreNameById(item.subgenre_id);
          found++;
        }
      } else {
        notFound++;
      }
    } catch (err) {
      console.error(err);
      notFound++;
    }

    render();

    // Discogs allows ~60 authenticated requests/minute
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  if (btn) btn.disabled = false;
  setStatus(`Done. Matched ${found}, no match for ${notFound}.`);
}

// ------------ Wishlist item detail modal ------------

let activeDetailWishlistId = null;

function setWishlistDetailCoverPreview(url) {
  const coverImg = document.getElementById("wishlistDetailCoverImg");
  const coverPlaceholder = document.getElementById("wishlistDetailCoverPlaceholder");
  if (url) {
    coverImg.src = url;
    coverImg.hidden = false;
    coverPlaceholder.hidden = true;
  } else {
    coverImg.hidden = true;
    coverPlaceholder.hidden = false;
  }
}

function openWishlistDetailModal(wishlistId) {
  const item = wishlist.find((w) => w.id === wishlistId);
  if (!item) return;

  activeDetailWishlistId = wishlistId;
  pendingWishlistCoverUrlEdit = undefined; // reset cover edit state

  document.getElementById("wishlistDetailCoverUploadStatus").textContent = "";
  document.getElementById("wishlistDetailCoverUploadStatus").className = "form-status";

  document.getElementById("wishlistDetailArtist").value = item.artist || "";
  document.getElementById("wishlistDetailAlbum").value = item.album || "";
  document.getElementById("wishlistDetailYear").value = item.year ?? "";
  document.getElementById("wishlistDetailLabel").value = item.label || "";
  document.getElementById("wishlistDetailGenre").value = item.genre_name || "";
  document.getElementById("wishlistDetailSubgenre").value = item.subgenre_name || "";
  populateSubgenreOptionsForGenre(item.genre_name || "");
  document.getElementById("wishlistDetailNotes").value = item.notes || "";

  setWishlistDetailCoverPreview(item.cover_url || null);

  document.getElementById("wishlistDetailStatus").textContent = "";
  document.getElementById("wishlistDetailStatus").className = "form-status";
  document.getElementById("wishlistDetailDiscogsStatus").textContent = "";
  document.getElementById("wishlistDetailDiscogsStatus").className = "form-status";

  const moreLikeThisWrap = document.getElementById("wishlistDetailMoreLikeThisWrap");
  const moreLikeThisResults = document.getElementById("wishlistDetailMoreLikeThisResults");
  moreLikeThisWrap.innerHTML = "";
  moreLikeThisResults.innerHTML = "";

  const moreLikeThisBtn = document.createElement("button");
  moreLikeThisBtn.type = "button";
  moreLikeThisBtn.className = "btn-secondary";
  moreLikeThisBtn.textContent = "More like this";
  moreLikeThisBtn.addEventListener("click", () => {
    loadMoreLikeThis(item, moreLikeThisResults, moreLikeThisBtn);
  });
  moreLikeThisWrap.appendChild(moreLikeThisBtn);

  document.getElementById("wishlistDetailOverlay").hidden = false;
}

function closeWishlistDetailModal() {
  document.getElementById("wishlistDetailOverlay").hidden = true;
  activeDetailWishlistId = null;
}

async function handleWishlistDetailSubmit(event) {
  event.preventDefault();
  if (activeDetailWishlistId === null) return;

  const statusEl = document.getElementById("wishlistDetailStatus");
  const saveBtn = document.getElementById("saveWishlistDetailBtn");

  const artist = document.getElementById("wishlistDetailArtist").value.trim();
  const album = document.getElementById("wishlistDetailAlbum").value.trim();

  if (!artist || !album) {
    statusEl.textContent = "Artist and Album are required.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  const yearVal = parseYearInput(document.getElementById("wishlistDetailYear").value);
  const label = document.getElementById("wishlistDetailLabel").value.trim() || null;
  const genreInput = document.getElementById("wishlistDetailGenre").value.trim();
  const subgenreInput = document.getElementById("wishlistDetailSubgenre").value.trim();
  const notes = document.getElementById("wishlistDetailNotes").value.trim() || null;

  saveBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    const genreId = await getOrCreateGenreId(genreInput);
    const subgenreId = subgenreInput
      ? await getOrCreateSubgenreId(subgenreInput, genreId)
      : null;

    const updates = {
      artist,
      album,
      year: yearVal,
      label,
      genre_id: genreId,
      subgenre_id: subgenreId,
      notes,
      // Only include cover_url if the user explicitly changed it this session
      // (uploaded a new one or clicked Remove). `undefined` means untouched.
      ...(pendingWishlistCoverUrlEdit !== undefined
        ? { cover_url: pendingWishlistCoverUrlEdit }
        : {}),
    };

    const { error } = await supabaseClient
      .from("wishlist")
      .update(updates)
      .eq("id", activeDetailWishlistId);

    if (error) throw error;

    const item = wishlist.find((w) => w.id === activeDetailWishlistId);
    if (item) {
      Object.assign(item, updates);
      item.genre_name = genreNameById(genreId);
      item.subgenre_name = subgenreNameById(subgenreId);
    }

    renderFilters();
    render();

    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";

    setTimeout(() => {
      closeWishlistDetailModal();
    }, 700);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save changes. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleWishlistDetailDiscogsCheck() {
  if (activeDetailWishlistId === null) return;

  const item = wishlist.find((w) => w.id === activeDetailWishlistId);
  if (!item) return;

  const statusEl = document.getElementById("wishlistDetailDiscogsStatus");
  const btn = document.getElementById("wishlistDetailDiscogsBtn");

  btn.disabled = true;
  statusEl.textContent = "Searching Discogs...";
  statusEl.className = "form-status";

  try {
    const result = await lookupDiscogsByArtistAlbum(item.artist, item.album);
    console.log("Discogs lookup debug:", result.debug, result);

    if (!result.found) {
      statusEl.textContent = "No Discogs match found.";
      statusEl.className = "form-status form-status-error";
      return;
    }

    const updates = await buildWishlistUpdatesFromDiscogs(item, result);

    const { error } = await supabaseClient
      .from("wishlist")
      .update(updates)
      .eq("id", activeDetailWishlistId);

    if (error) throw error;

    Object.assign(item, updates);
    item.genre_name = genreNameById(item.genre_id);
    item.subgenre_name = subgenreNameById(item.subgenre_id);

    // Reflect any newly-filled fields in the open form
    document.getElementById("wishlistDetailYear").value = item.year ?? "";
    document.getElementById("wishlistDetailLabel").value = item.label || "";
    document.getElementById("wishlistDetailGenre").value = item.genre_name || "";
    document.getElementById("wishlistDetailSubgenre").value = item.subgenre_name || "";
    populateSubgenreOptionsForGenre(item.genre_name || "");
    setWishlistDetailCoverPreview(item.cover_url || null);

    render();

    statusEl.textContent = "Found a Discogs match.";
    statusEl.className = "form-status form-status-success";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't search Discogs. See console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    btn.disabled = false;
  }
}

async function handleRemoveWishlistDetail() {
  if (activeDetailWishlistId === null) return;
  const wishlistId = activeDetailWishlistId;
  await removeWishlistItem(wishlistId);
  if (!wishlist.find((w) => w.id === wishlistId)) {
    closeWishlistDetailModal();
  }
}

function openAddWishlistModal() {
  document.getElementById("addWishlistOverlay").hidden = false;
  document.getElementById("addWishlistStatus").textContent = "";
  document.getElementById("wishScanStatus").textContent = "";
  document.getElementById("wishScanStatus").className = "form-status";
  pendingWishlistCoverUrl = null;
  pendingWishlistDiscogsId = null;
  populateSubgenreOptionsForGenre(document.getElementById("wishGenre").value);
  document.getElementById("wishArtist").focus();
}

function closeAddWishlistModal() {
  document.getElementById("addWishlistOverlay").hidden = true;
  stopBarcodeScan();
}

function resetAddWishlistForm() {
  document.getElementById("addWishlistForm").reset();
  document.getElementById("addWishlistStatus").textContent = "";
  document.getElementById("wishScanStatus").textContent = "";
  document.getElementById("wishScanStatus").className = "form-status";
  const warning = document.getElementById("wishlistDuplicateWarning");
  if (warning) warning.hidden = true;
  pendingWishlistCoverUrl = null;
  pendingWishlistDiscogsId = null;
  populateSubgenreOptionsForGenre(null);
}

// ---- Duplicate detection for Add to Wishlist ----
//
// When the user tries to add something they may already own or already
// have on their wishlist, we show a dismissable warning instead of
// silently adding a duplicate. `wishlistDuplicateSaveAnywayBtn` calls
// doAddWishlistItem(true) to skip the check and save regardless.


function checkWishlistDuplicate(artist, album) {
  const owned = isAlbumOwned(artist, album);
  if (owned) {
    return { type: "owned", msg: `You may already own "${album}" by ${artist}.` };
  }
  const onWishlist = isAlbumOnWishlist(artist, album);
  if (onWishlist) {
    return { type: "wishlist", msg: `"${album}" by ${artist} is already on your Wishlist.` };
  }
  return null;
}

async function handleAddWishlistSubmit(event) {
  event.preventDefault();
  await doAddWishlistItem(false);
}

async function doAddWishlistItem(skipDuplicateCheck = false) {
  const statusEl = document.getElementById("addWishlistStatus");
  const submitBtn = document.getElementById("submitAddWishlistBtn");
  const warningEl = document.getElementById("wishlistDuplicateWarning");
  const warningMsg = document.getElementById("wishlistDuplicateMsg");

  const artist = document.getElementById("wishArtist").value.trim();
  const album = document.getElementById("wishAlbum").value.trim();

  if (!artist || !album) {
    statusEl.textContent = "Artist and Album are required.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  // Duplicate check — fires on first attempt only; "Save anyway" bypasses it.
  if (!skipDuplicateCheck) {
    const dupe = checkWishlistDuplicate(artist, album);
    if (dupe) {
      warningMsg.textContent = dupe.msg;
      warningEl.hidden = false;
      statusEl.textContent = "";
      statusEl.className = "form-status";
      return;
    }
  }

  // Hide warning (either no dupe, or user chose to save anyway).
  if (warningEl) warningEl.hidden = true;

  const yearVal = parseYearInput(document.getElementById("wishYear").value);
  const label = document.getElementById("wishLabel").value.trim() || null;
  const genreInput = document.getElementById("wishGenre").value.trim();
  const subgenreInput = document.getElementById("wishSubgenre").value.trim();
  const notes = document.getElementById("wishNotes").value.trim() || null;

  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    const genreId = await getOrCreateGenreId(genreInput);
    const subgenreId = subgenreInput
      ? await getOrCreateSubgenreId(subgenreInput, genreId)
      : null;

    const newItem = {
      artist,
      album,
      year: yearVal,
      label,
      genre_id: genreId,
      subgenre_id: subgenreId,
      notes,
      discogs_release_id: pendingWishlistDiscogsId,
      cover_url: pendingWishlistCoverUrl,
    };

    const { data, error } = await supabaseClient
      .from("wishlist")
      .insert(newItem)
      .select(
        `
        id,
        artist,
        album,
        year,
        label,
        genre_id,
        subgenre_id,
        discogs_release_id,
        cover_url,
        notes,
        added_at,
        price_data,
        price_currency,
        price_checked_at
      `
      )
      .single();

    if (error) throw error;

    const enriched = {
      ...data,
      genre_name: genreNameById(data.genre_id),
      subgenre_name: subgenreNameById(data.subgenre_id),
    };

    wishlist.unshift(enriched);

    renderFilters();
    render();

    statusEl.textContent = `Added "${album}" by ${artist} to your wishlist.`;
    statusEl.className = "form-status form-status-success";

    resetAddWishlistForm();
    setTimeout(() => {
      closeAddWishlistModal();
    }, 900);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save this item. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

// ---- Wishlist cover upload ----

let pendingWishlistCoverUrlEdit = undefined; // tracks cover changes in the edit modal

async function handleWishlistCoverFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || activeDetailWishlistId === null) return;

  const statusEl = document.getElementById("wishlistDetailCoverUploadStatus");
  statusEl.textContent = "Uploading cover...";
  statusEl.className = "form-status";

  try {
    const blob = await resizeImageFile(file);

    const formData = new FormData();
    formData.append("file", blob, "cover.jpg");
    formData.append("wishlistId", String(activeDetailWishlistId));

    const response = await fetch(UPLOAD_COVER_FUNCTION_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Upload failed (${response.status})`);
    }

    pendingWishlistCoverUrlEdit = result.url;
    setWishlistDetailCoverPreview(pendingWishlistCoverUrlEdit);

    statusEl.textContent = "Cover uploaded. Click Save changes to apply.";
    statusEl.className = "form-status form-status-success";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't upload cover. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    event.target.value = "";
  }
}

function handleWishlistRemoveCover() {
  pendingWishlistCoverUrlEdit = null;
  setWishlistDetailCoverPreview(null);
  const statusEl = document.getElementById("wishlistDetailCoverUploadStatus");
  statusEl.textContent = "Cover will be removed. Click Save changes to apply.";
  statusEl.className = "form-status";
}

async function copyShareUrl(url, btn) {
  try {
    await navigator.clipboard.writeText(url);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> Copied!';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 2000);
  } catch {
    window.prompt("Copy this link:", url);
  }
}

// ---- Share Collection ----

function getCollectionShareUrl() {
  return (
    window.location.origin +
    window.location.pathname +
    "#share=collection&uid=" +
    (currentUser?.id || "")
  );
}

function getTrophiesShareUrl() {
  return (
    window.location.origin +
    window.location.pathname +
    "#share=trophies&uid=" +
    (currentUser?.id || "")
  );
}

async function handleShareCollection() {
  await handleSharePublicToggle(
    "collection_public",
    "Your collection is currently private. Enable public sharing so anyone with the link can view it?",
    getCollectionShareUrl(),
    "shareCollectionBtn",
    "My Vinyl Collection — SPIN VINYL",
    "Check out my vinyl collection on SPIN VINYL."
  );
}

async function handleShareTrophies() {
  await handleSharePublicToggle(
    "collection_public",
    "Sharing trophies requires your collection to be public. Enable public sharing?",
    getTrophiesShareUrl(),
    "shareTrophiesBtn",
    "My Trophies — SPIN VINYL",
    "Check out my vinyl trophies on SPIN VINYL."
  );
}

// Shared helper — enables the public flag if needed, then copies/shares the URL.
async function handleSharePublicToggle(flagField, confirmMsg, url, btnId, shareTitle, shareText) {
  const isPublic = !!currentProfile?.[flagField];

  if (!isPublic) {
    const enable = window.confirm(confirmMsg);
    if (!enable) return;
    try {
      await saveProfileFields({ [flagField]: true });
      if (currentProfile) currentProfile[flagField] = true;
    } catch (err) {
      console.error("Failed to enable sharing:", err);
      alert("Couldn't enable sharing. Please try again.");
      return;
    }
  }

  const btn = document.getElementById(btnId);
  try {
    if (navigator.share) {
      await navigator.share({ title: shareTitle, text: shareText, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> Copied!';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 2000);
  } catch {
    window.prompt("Copy this link:", url);
  }
}

// ---- Share Wishlist ----

// ---- Public Wishlist Sharing ----
//
// When `wishlist_public` is true on the owner's profile, anyone with
// the share URL can view a read-only list of their wishlist items —
// no login required. The shared URL includes the owner's user_id so
// Supabase can serve the right rows via the permissive anon RLS policy
// added in wishlist_share_migration.sql.

function getWishlistShareUrl() {
  return (
    window.location.origin +
    window.location.pathname +
    "#share=wishlist&uid=" +
    (currentUser?.id || "")
  );
}

async function handleWishlistPublicToggle() {
  const checkbox = document.getElementById("wishlistPublicToggle");
  const isPublic = checkbox.checked;

  try {
    await saveProfileFields({ wishlist_public: isPublic });
    syncPrivacySettings();
  } catch (err) {
    console.error("Failed to save wishlist_public:", err);
    checkbox.checked = !isPublic;
  }
}

function syncWishlistPublicToggle() {
  const checkbox = document.getElementById("wishlistPublicToggle");
  if (checkbox) checkbox.checked = !!currentProfile?.wishlist_public;
  syncPrivacySettings();
}

function syncPrivacySettings() {
  const collectionPublic = !!currentProfile?.collection_public;
  const wishlistPublic = !!currentProfile?.wishlist_public;

  // Settings page toggles
  const collectionToggle = document.getElementById("settingsCollectionPublicToggle");
  const wishlistToggle = document.getElementById("settingsWishlistPublicToggle");
  if (collectionToggle) collectionToggle.checked = collectionPublic;
  if (wishlistToggle) wishlistToggle.checked = wishlistPublic;

  // Wishlist toolbar checkbox
  const toolbarWishlistToggle = document.getElementById("wishlistPublicToggle");
  if (toolbarWishlistToggle) toolbarWishlistToggle.checked = wishlistPublic;

  // Copy link buttons — only show when public
  const copyCollectionBtn = document.getElementById("settingsCopyCollectionUrlBtn");
  const copyTrophiesBtn = document.getElementById("settingsCopyTrophiesUrlBtn");
  const trophiesLinkedBadge = document.getElementById("settingsTrophiesLinkedBadge");
  const copyWishlistBtn = document.getElementById("settingsCopyWishlistUrlBtn");
  if (copyCollectionBtn) copyCollectionBtn.hidden = !collectionPublic;
  if (copyTrophiesBtn) copyTrophiesBtn.hidden = !collectionPublic;
  if (trophiesLinkedBadge) trophiesLinkedBadge.hidden = !collectionPublic;
  if (copyWishlistBtn) copyWishlistBtn.hidden = !wishlistPublic;
}

async function handleShareWishlist() {
  const isPublic = !!currentProfile?.wishlist_public;

  if (!isPublic) {
    // Guide the owner to enable public sharing first
    const enable = window.confirm(
      "Your wishlist is currently private. Enable public sharing so anyone with the link can view it?"
    );
    if (!enable) return;

    try {
      await saveProfileFields({ wishlist_public: true });
      syncWishlistPublicToggle();
    } catch (err) {
      console.error("Failed to enable wishlist sharing:", err);
      alert("Couldn't enable sharing. Please try again.");
      return;
    }
  }

  const btn = document.getElementById("shareWishlistBtn");
  const url = getWishlistShareUrl();

  try {
    if (navigator.share) {
      await navigator.share({
        title: "My Vinyl Wishlist — SPIN VINYL",
        text: "Check out my vinyl wishlist on SPIN VINYL.",
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);

    const original = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> Copied!';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    window.prompt("Copy this link to share your wishlist:", url);
  }
}

// ---- Shared wishlist public view ----
//
// Detected at startup (before auth) from ?share=wishlist&uid=... URL params.
// Uses the anon Supabase client — no session needed — because the RLS
// policy allows reads when wishlist_public = true.

function getSharedViewParams() {
  const hash = window.location.hash.slice(1);
  const search = window.location.search;
  console.log("[SPIN] getSharedViewParams — hash:", hash, "search:", search);
  const params = new URLSearchParams(hash || search);
  const share = params.get("share");
  const uid = params.get("uid");
  console.log("[SPIN] share:", share, "uid:", uid);
  if ((share === "wishlist" || share === "collection" || share === "trophies") && uid) {
    return { share, uid };
  }
  return null;
}

// Legacy alias — wishlist code calls this directly
function getSharedWishlistParams() {
  const result = getSharedViewParams();
  if (result?.share === "wishlist") return result.uid;
  return null;
}

async function maybeShowSharedWishlist() {
  const params = getSharedViewParams();
  if (!params) return false;

  // Hide the entire normal app shell immediately.
  document.getElementById("splashScreen").hidden = true;
  document.getElementById("authOverlay").hidden = true;
  document.body.classList.add("shared-wishlist-mode");

  if (params.share === "collection") {
    document.getElementById("sharedCollectionView").hidden = false;
    await renderSharedCollection(params.uid);
    return true;
  }

  if (params.share === "trophies") {
    document.getElementById("sharedTrophiesView").hidden = false;
    await renderSharedTrophies(params.uid);
    return true;
  }

  // Default: wishlist
  const sharedView = document.getElementById("sharedWishlistView");
  sharedView.hidden = false;

  try {
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("preferred_name, username, wishlist_public")
      .eq("user_id", params.uid)
      .maybeSingle();

    if (profileError || !profile || !profile.wishlist_public) {
      document.getElementById("sharedWishlistError").hidden = false;
      return true;
    }

    const ownerName =
      profile.preferred_name ||
      (profile.username ? `@${profile.username}` : "Someone's");
    document.getElementById("sharedWishlistOwnerName").textContent =
      `${ownerName}'s Wishlist`;
    document.title = `${ownerName}'s Wishlist — SPIN VINYL`;

    const { data: items, error: wishlistError } = await supabaseClient
      .from("wishlist")
      .select("id, artist, album, year, cover_url")
      .eq("user_id", params.uid)
      .order("added_at", { ascending: false });

    if (wishlistError) throw wishlistError;

    const list = document.getElementById("sharedWishlistList");
    const emptyEl = document.getElementById("sharedWishlistEmpty");

    if (!items || items.length === 0) {
      emptyEl.hidden = false;
      return true;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "shared-wishlist-item";

      const cover = document.createElement("div");
      cover.className = "shared-wishlist-cover";
      if (item.cover_url) {
        const img = document.createElement("img");
        img.src = item.cover_url;
        img.alt = item.album || "";
        img.loading = "lazy";
        cover.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "shared-wishlist-cover-placeholder";
        placeholder.innerHTML = '<i class="ti ti-vinyl" aria-hidden="true"></i>';
        cover.appendChild(placeholder);
      }
      row.appendChild(cover);

      const info = document.createElement("div");
      info.className = "shared-wishlist-info";

      const artist = document.createElement("p");
      artist.className = "shared-wishlist-artist";
      artist.textContent = item.artist || "";
      info.appendChild(artist);

      const album = document.createElement("p");
      album.className = "shared-wishlist-album";
      album.textContent = item.album || "";
      info.appendChild(album);

      if (item.year) {
        const year = document.createElement("p");
        year.className = "shared-wishlist-year";
        year.textContent = item.year;
        info.appendChild(year);
      }

      row.appendChild(info);
      list.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load shared wishlist:", err);
    document.getElementById("sharedWishlistError").hidden = false;
  }

  return true;
}

async function renderSharedCollection(uid) {
  try {
    console.log("[SPIN] renderSharedCollection called for uid:", uid);

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("preferred_name, username, collection_public")
      .eq("user_id", uid)
      .maybeSingle();

    console.log("[SPIN] profile fetch result:", { profile, profileError });

    if (profileError) {
      console.error("[SPIN] Profile fetch error:", profileError);
      document.getElementById("sharedCollectionError").hidden = false;
      return;
    }
    if (!profile) {
      console.error("[SPIN] No profile found for uid:", uid);
      document.getElementById("sharedCollectionError").hidden = false;
      return;
    }
    if (!profile.collection_public) {
      console.warn("[SPIN] collection_public is false or missing. Value:", profile.collection_public);
      console.log("[SPIN] Full profile object:", JSON.stringify(profile));
      document.getElementById("sharedCollectionError").hidden = false;
      return;
    }

    const ownerName =
      profile.preferred_name ||
      (profile.username ? `@${profile.username}` : "Someone's");
    document.getElementById("sharedCollectionOwnerName").textContent =
      `${ownerName}'s Collection`;
    document.title = `${ownerName}'s Collection — SPIN VINYL`;

    const { data: records, error: recordsError } = await supabaseClient
      .from("records")
      .select("id, artist, album, year, cover_url, rating, genres ( name ), subgenres ( name )")
      .eq("user_id", uid)
      .order("artist", { ascending: true });

    console.log("[SPIN] records fetch — data:", records?.length, "error:", recordsError);
    if (recordsError) {
      console.error("[SPIN] records error detail:", JSON.stringify(recordsError));
      throw recordsError;
    }

    const grid = document.getElementById("sharedCollectionGrid");
    const emptyEl = document.getElementById("sharedCollectionEmpty");

    if (!records || records.length === 0) {
      emptyEl.hidden = false;
      return;
    }

    records.forEach((record) => {
      const card = document.createElement("div");
      card.className = "shared-collection-card";

      const coverWrap = document.createElement("div");
      coverWrap.className = "shared-collection-cover";
      if (record.cover_url) {
        const img = document.createElement("img");
        img.src = record.cover_url;
        img.alt = record.album || "";
        img.loading = "lazy";
        coverWrap.appendChild(img);
      } else {
        coverWrap.innerHTML = '<div class="shared-collection-cover-placeholder"><i class="ti ti-vinyl" aria-hidden="true"></i></div>';
      }
      card.appendChild(coverWrap);

      const info = document.createElement("div");
      info.className = "shared-collection-info";

      const artist = document.createElement("p");
      artist.className = "shared-collection-artist";
      artist.textContent = record.artist || "";

      const album = document.createElement("p");
      album.className = "shared-collection-album";
      album.textContent = record.album || "";

      const meta = document.createElement("p");
      meta.className = "shared-collection-meta";
      const genreName = record.genres?.name || "";
      meta.textContent = [record.year, genreName].filter(Boolean).join(" · ");

      info.appendChild(album);
      info.appendChild(artist);
      if (record.year || genreName) info.appendChild(meta);
      card.appendChild(info);

      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load shared collection:", err);
    document.getElementById("sharedCollectionError").hidden = false;
  }
}

async function renderSharedTrophies(uid) {
  try {
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("preferred_name, username, collection_public")
      .eq("user_id", uid)
      .maybeSingle();

    if (profileError || !profile || !profile.collection_public) {
      document.getElementById("sharedTrophiesError").hidden = false;
      return;
    }

    const ownerName =
      profile.preferred_name ||
      (profile.username ? `@${profile.username}` : "Someone's");
    document.getElementById("sharedTrophiesOwnerName").textContent =
      `${ownerName}'s Trophies`;
    document.title = `${ownerName}'s Trophies — SPIN VINYL`;

    const { data: records, error: recordsError } = await supabaseClient
      .from("records")
      .select("id, artist, album, year, genre_id, rating, cover_url, personal_story, genres ( name ), subgenres ( name )")
      .eq("user_id", uid);

    if (recordsError) throw recordsError;

    // Fetch wishlist for trophy checks that need it
    const { data: wl } = await supabaseClient
      .from("wishlist")
      .select("id")
      .eq("user_id", uid);

    // Normalise joined genre names so TROPHY_DEFS.check() finds genre_name
    const fetchedRecords = (records || []).map((r) => ({
      ...r,
      genre_name: r.genres?.name || null,
      subgenre_name: r.subgenres?.name || null,
    }));
    const fetchedWishlist = wl || [];

    const trophies = TROPHY_DEFS.map((def) => ({
      ...def,
      earned: def.check(fetchedRecords, fetchedWishlist, profile),
    }));

    const earnedCount = trophies.filter((t) => t.earned).length;
    const earnedEl = document.getElementById("sharedTrophiesEarned");
    earnedEl.textContent = `${earnedCount} of ${trophies.length} trophies earned`;

    const grid = document.getElementById("sharedTrophiesGrid");
    const emptyEl = document.getElementById("sharedTrophiesEmpty");

    if (earnedCount === 0) {
      emptyEl.hidden = false;
      return;
    }

    // Show earned first then locked
    const sorted = [
      ...trophies.filter((t) => t.earned),
      ...trophies.filter((t) => !t.earned),
    ];

    sorted.forEach((t) => {
      const card = document.createElement("div");
      card.className = `trophy-card ${t.earned ? "trophy-earned" : "trophy-locked"}`;
      card.setAttribute("title", t.desc);

      const svgWrap = document.createElement("div");
      svgWrap.className = "trophy-svg-wrap";
      svgWrap.innerHTML = buildTrophyLabelSvg(t, t.earned);
      card.appendChild(svgWrap);

      const desc = document.createElement("p");
      desc.className = "trophy-desc";
      desc.textContent = t.desc;
      card.appendChild(desc);

      if (!t.earned) {
        const lock = document.createElement("span");
        lock.className = "trophy-lock-badge";
        lock.textContent = "Not yet earned";
        card.appendChild(lock);
      }

      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load shared trophies:", err);
    document.getElementById("sharedTrophiesError").hidden = false;
  }
}

async function removeWishlistItem(wishlistId) {
  const item = wishlist.find((w) => w.id === wishlistId);
  const label = item ? `"${item.album}" by ${item.artist}` : "this item";

  const confirmed = window.confirm(`Remove ${label} from your wishlist?`);
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from("wishlist")
      .delete()
      .eq("id", wishlistId);

    if (error) throw error;

    wishlist = wishlist.filter((w) => w.id !== wishlistId);
    render();
  } catch (err) {
    console.error(err);
    setStatus("Couldn't remove item. See console for details.");
  }
}

async function moveWishlistItemToCollection(wishlistId) {
  const item = wishlist.find((w) => w.id === wishlistId);
  if (!item) return;

  const confirmed = window.confirm(
    `Move "${item.album}" by ${item.artist} to your collection?`
  );
  if (!confirmed) return;

  try {
    const newRecord = {
      artist: item.artist,
      album: item.album,
      year: item.year,
      year_raw: item.year !== null ? String(item.year) : null,
      label: item.label,
      genre_id: item.genre_id,
      subgenre_id: item.subgenre_id,
      cover_url: item.cover_url,
      notes: item.notes,
      quantity: 1,
    };

    const { data, error } = await supabaseClient
      .from("records")
      .insert(newRecord)
      .select(
        `
        id,
        artist,
        album,
        year,
        label,
        genre_id,
        subgenre_id,
        cover_url,
        rating,
        description,
        vinyl_grade,
        sleeve_grade,
        notes,
        quantity,
        acquired_date,
        acquired_location,
        listening_notes,
        personal_story,
        genres ( name ),
        subgenres ( name )
      `
      )
      .single();

    if (error) throw error;

    const enriched = {
      ...data,
      genre_name: data.genres?.name ?? "",
      subgenre_name: data.subgenres?.name ?? "",
    };

    allRecords.push(enriched);
    allRecords.sort((a, b) => a.artist.localeCompare(b.artist));

    const { error: deleteError } = await supabaseClient
      .from("wishlist")
      .delete()
      .eq("id", wishlistId);

    if (deleteError) throw deleteError;

    wishlist = wishlist.filter((w) => w.id !== wishlistId);

    renderFilters();
    render();
  } catch (err) {
    console.error(err);
    setStatus("Couldn't move item to collection. See console for details.");
  }
}


// ------------ Bulk Import ------------

function buildImportPreview() {
  const preview = document.getElementById("importPreview");
  const summary = document.getElementById("importSummary");
  const colMap = document.getElementById("importColumnMap");
  const confirmBtn = document.getElementById("confirmImportBtn");

  if (!importRawRows || importRawRows.length === 0) {
    preview.hidden = true;
    confirmBtn.disabled = true;
    importParsedRows = [];
    return;
  }

  const target = document.getElementById("importTarget").value;
  const rowKeys = Object.keys(importRawRows[0]);

  const colKeys = {};
  Object.keys(IMPORT_COLUMN_ALIASES).forEach((field) => {
    colKeys[field] = findColumnKey(rowKeys, IMPORT_COLUMN_ALIASES[field]);
  });

  const relevantFields =
    target === "records"
      ? ["artist", "album", "year", "label", "genre", "subgenre", "description", "vinylGrade", "sleeveGrade", "quantity", "catalogNum", "releaseId"]
      : ["artist", "album", "year", "label", "genre", "subgenre", "description"];

  const parsed = [];
  let skipped = 0;

  importRawRows.forEach((row) => {
    const artistRaw = colKeys.artist ? row[colKeys.artist] : null;
    const albumRaw = colKeys.album ? row[colKeys.album] : null;

    const artistStr = artistRaw != null ? String(artistRaw).trim() : "";
    const albumStr = albumRaw != null ? String(albumRaw).trim() : "";

    if (!artistStr || !albumStr) {
      skipped++;
      return;
    }

    const { year, yearRaw } = colKeys.year
      ? parseYearFlexible(row[colKeys.year])
      : { year: null, yearRaw: null };

    const genreRaw = colKeys.genre ? row[colKeys.genre] : null;
    const subgenreRaw = colKeys.subgenre ? row[colKeys.subgenre] : null;
    const descriptionRaw = colKeys.description ? row[colKeys.description] : null;

    const item = {
      artist: artistStr,
      album: albumStr,
      year,
      year_raw: yearRaw,
      label: colKeys.label && row[colKeys.label] != null ? String(row[colKeys.label]).trim() || null : null,
      _genreNorm: normalizeGenre(genreRaw != null ? String(genreRaw) : null),
      _subgenreNorm: normalizeGenre(subgenreRaw != null ? String(subgenreRaw) : null),
      notes: descriptionRaw != null ? String(descriptionRaw).trim() || null : null,
      discogs_release_id: colKeys.releaseId && row[colKeys.releaseId] != null
        ? String(row[colKeys.releaseId]).trim() || null
        : null,
    };

    if (target === "records") {
      item.description = item.notes;
      item.vinyl_grade =
        colKeys.vinylGrade && row[colKeys.vinylGrade] != null
          ? String(row[colKeys.vinylGrade]).trim() || null
          : null;
      item.sleeve_grade =
        colKeys.sleeveGrade && row[colKeys.sleeveGrade] != null
          ? String(row[colKeys.sleeveGrade]).trim() || null
          : null;

      let qty = 1;
      if (colKeys.quantity && row[colKeys.quantity] != null) {
        const n = parseYearInput(row[colKeys.quantity]);
        qty = n && n > 0 ? n : 1;
      }
      item.quantity = qty;
    }

    parsed.push(item);
  });

  importParsedRows = parsed;

  const existingGenreNames = new Set(genres.map((g) => g.name.toLowerCase()));
  const existingSubgenreNames = new Set(subgenres.map((sg) => sg.name.toLowerCase()));
  const newGenres = new Set();
  const newSubgenres = new Set();

  parsed.forEach((r) => {
    if (r._genreNorm && !existingGenreNames.has(r._genreNorm.toLowerCase())) {
      newGenres.add(r._genreNorm);
    }
    if (r._subgenreNorm && !existingSubgenreNames.has(r._subgenreNorm.toLowerCase())) {
      newSubgenres.add(r._subgenreNorm);
    }
  });

  summary.textContent =
    `${parsed.length} row${parsed.length === 1 ? "" : "s"} ready to import` +
    (skipped ? ` (${skipped} skipped — missing artist or album)` : "") +
    `. ${newGenres.size} new genre${newGenres.size === 1 ? "" : "s"} and ` +
    `${newSubgenres.size} new subgenre${newSubgenres.size === 1 ? "" : "s"} will be created.`;

  colMap.innerHTML = "";
  relevantFields.forEach((field) => {
    const span = document.createElement("span");
    const key = colKeys[field];
    span.className = key ? "mapped" : "unmapped";
    span.textContent = `${field}: ${key ? `"${key}"` : "not found"}`;
    colMap.appendChild(span);
  });

  preview.hidden = false;
  confirmBtn.disabled = parsed.length === 0;
}

async function handleImportFileChange(event) {
  const file = event.target.files && event.target.files[0];
  const statusEl = document.getElementById("importStatus");
  statusEl.textContent = "";
  statusEl.className = "form-status";

  if (!file) {
    importRawRows = [];
    buildImportPreview();
    return;
  }

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    importRawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    buildImportPreview();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't read this file. Check console for details.";
    statusEl.className = "form-status form-status-error";
    importRawRows = [];
    buildImportPreview();
  }
}

async function ensureGenresAndSubgenres(rows) {
  const existingGenreNames = new Set(genres.map((g) => g.name.toLowerCase()));
  const newGenreNames = new Set();

  rows.forEach((r) => {
    if (r._genreNorm && !existingGenreNames.has(r._genreNorm.toLowerCase())) {
      newGenreNames.add(r._genreNorm);
    }
  });

  if (newGenreNames.size > 0) {
    const insertRows = Array.from(newGenreNames).map((name) => ({ name }));
    const { data, error } = await supabaseClient.from("genres").insert(insertRows).select();
    if (error) throw error;
    genres.push(...data);
  }

  const genreIdByName = {};
  genres.forEach((g) => {
    genreIdByName[g.name.toLowerCase()] = g.id;
  });

  const existingSubgenreNames = new Set(subgenres.map((sg) => sg.name.toLowerCase()));
  const newSubgenres = new Map();

  rows.forEach((r) => {
    if (!r._subgenreNorm) return;
    const key = r._subgenreNorm.toLowerCase();
    if (existingSubgenreNames.has(key) || newSubgenres.has(key)) return;
    const genreId = r._genreNorm ? genreIdByName[r._genreNorm.toLowerCase()] ?? null : null;
    newSubgenres.set(key, { name: r._subgenreNorm, genre_id: genreId });
  });

  if (newSubgenres.size > 0) {
    const insertRows = Array.from(newSubgenres.values());
    const { data, error } = await supabaseClient.from("subgenres").insert(insertRows).select();
    if (error) throw error;
    subgenres.push(...data);
  }

  const subgenreIdByName = {};
  subgenres.forEach((sg) => {
    subgenreIdByName[sg.name.toLowerCase()] = sg.id;
  });

  rows.forEach((r) => {
    r.genre_id = r._genreNorm ? genreIdByName[r._genreNorm.toLowerCase()] ?? null : null;
    r.subgenre_id = r._subgenreNorm ? subgenreIdByName[r._subgenreNorm.toLowerCase()] ?? null : null;
  });
}

async function handleConfirmImport() {
  const statusEl = document.getElementById("importStatus");
  const confirmBtn = document.getElementById("confirmImportBtn");
  const target = document.getElementById("importTarget").value;

  if (!importParsedRows || importParsedRows.length === 0) return;

  confirmBtn.disabled = true;
  statusEl.className = "form-status";
  statusEl.textContent = "Preparing genres and subgenres...";

  try {
    await ensureGenresAndSubgenres(importParsedRows);

    const rows = importParsedRows.map((r) => {
      const base = {
        artist: r.artist,
        album: r.album,
        year: r.year,
        label: r.label,
        genre_id: r.genre_id,
        subgenre_id: r.subgenre_id,
        notes: r.notes,
        cover_url: null,
      };

      if (target === "records") {
        return {
          ...base,
          year_raw: r.year_raw,
          description: r.description,
          vinyl_grade: r.vinyl_grade,
          sleeve_grade: r.sleeve_grade,
          quantity: r.quantity,
        };
      }

      return {
        ...base,
        discogs_release_id: r.discogs_release_id || null,
      };
    });

    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      const chunk = rows.slice(start, start + BATCH_SIZE);
      statusEl.textContent = `Importing ${start + 1}–${Math.min(start + BATCH_SIZE, rows.length)} of ${rows.length}...`;
      const { error } = await supabaseClient.from(target).insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }

    statusEl.textContent = `Imported ${inserted} item${inserted === 1 ? "" : "s"}. Refreshing...`;
    statusEl.className = "form-status form-status-success";

    await loadData();

    statusEl.textContent = `Imported ${inserted} item${inserted === 1 ? "" : "s"} successfully.`;

    setTimeout(() => {
      closeImportModal();
    }, 1200);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Import failed. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    confirmBtn.disabled = importParsedRows.length === 0;
  }
}

function openImportModal() {
  document.getElementById("importOverlay").hidden = false;
  document.getElementById("importTarget").value = currentPage === "wishlist" ? "wishlist" : "records";
  document.getElementById("importStatus").textContent = "";
  document.getElementById("importStatus").className = "form-status";
  document.getElementById("importPreview").hidden = true;
  document.getElementById("confirmImportBtn").disabled = true;
  document.getElementById("importFile").value = "";
  importRawRows = [];
  importParsedRows = [];
}

function closeImportModal() {
  document.getElementById("importOverlay").hidden = true;
}


let activeDetailRecordId = null;
let pendingCoverUrl; // undefined = no change, null = remove, string = new URL

function resizeImageFile(file, maxDim = 800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create image blob"));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function setCoverPreview(url) {
  const coverImg = document.getElementById("detailCoverImg");
  const coverPlaceholder = document.getElementById("detailCoverPlaceholder");
  if (url) {
    coverImg.src = url;
    coverImg.hidden = false;
    coverPlaceholder.hidden = true;
  } else {
    coverImg.hidden = true;
    coverPlaceholder.hidden = false;
  }
}

async function handleCoverFileChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || activeDetailRecordId === null) return;

  const statusEl = document.getElementById("coverUploadStatus");
  statusEl.textContent = "Uploading cover...";
  statusEl.className = "form-status";

  try {
    const blob = await resizeImageFile(file);

    const formData = new FormData();
    formData.append("file", blob, "cover.jpg");
    formData.append("recordId", String(activeDetailRecordId));

    const response = await fetch(UPLOAD_COVER_FUNCTION_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Upload failed (${response.status})`);
    }

    pendingCoverUrl = result.url;
    setCoverPreview(pendingCoverUrl);

    statusEl.textContent = "Cover uploaded. Click Save changes to apply.";
    statusEl.className = "form-status form-status-success";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't upload cover. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    event.target.value = "";
  }
}

function handleRemoveCover() {
  pendingCoverUrl = null;
  setCoverPreview(null);
  const statusEl = document.getElementById("coverUploadStatus");
  statusEl.textContent = "Cover will be removed. Click Save changes to apply.";
  statusEl.className = "form-status";
}


function openRecordDetailModal(recordId, startTab = "details") {
  const record = allRecords.find((r) => r.id === recordId);
  if (!record) return;

  activeDetailRecordId = recordId;
  pendingCoverUrl = undefined;

  document.getElementById("detailArtist").value = record.artist || "";
  document.getElementById("detailAlbum").value = record.album || "";
  document.getElementById("detailYear").value = record.year ?? "";
  document.getElementById("detailQuantity").value = record.quantity ?? 1;
  document.getElementById("detailLabel").value = record.label || "";
  document.getElementById("detailGenre").value = record.genre_name || "";
  document.getElementById("detailSubgenre").value = record.subgenre_name || "";
  populateSubgenreOptionsForGenre(record.genre_name || "");
  document.getElementById("detailVinylGrade").value = record.vinyl_grade || "";
  document.getElementById("detailSleeveGrade").value = record.sleeve_grade || "";
  document.getElementById("detailDescription").value = record.description || "";
  document.getElementById("detailNotes").value = record.notes || "";

  document.getElementById("storyAcquiredDate").value = record.acquired_date || "";
  document.getElementById("storyAcquiredLocation").value = record.acquired_location || "";
  document.getElementById("storyListeningNotes").value = record.listening_notes || "";
  document.getElementById("storyPersonalStory").value = record.personal_story || "";
  document.getElementById("recordStoryStatus").textContent = "";
  document.getElementById("recordStoryStatus").className = "form-status";

  switchDetailTab(startTab);

  setCoverPreview(record.cover_url || null);

  const ratingWrap = document.getElementById("detailRatingControls");
  ratingWrap.innerHTML = "";
  ratingWrap.appendChild(buildRatingControls(record));

  document.getElementById("recordDetailStatus").textContent = "";
  document.getElementById("recordDetailStatus").className = "form-status";
  document.getElementById("coverUploadStatus").textContent = "";
  document.getElementById("coverUploadStatus").className = "form-status";

  const moreLikeThisWrap = document.getElementById("detailMoreLikeThisWrap");
  const moreLikeThisResults = document.getElementById("detailMoreLikeThisResults");
  moreLikeThisWrap.innerHTML = "";
  moreLikeThisResults.innerHTML = "";

  const moreLikeThisBtn = document.createElement("button");
  moreLikeThisBtn.type = "button";
  moreLikeThisBtn.className = "btn-secondary";
  moreLikeThisBtn.textContent = "More like this";
  moreLikeThisBtn.addEventListener("click", () => {
    loadMoreLikeThis(record, moreLikeThisResults, moreLikeThisBtn);
  });
  moreLikeThisWrap.appendChild(moreLikeThisBtn);

  document.getElementById("recordDetailOverlay").hidden = false;

  renderRecordSpotifyControls(record);
}

function closeRecordDetailModal() {
  document.getElementById("recordDetailOverlay").hidden = true;
  activeDetailRecordId = null;
}

function switchDetailTab(tab) {
  const detailsBtn = document.getElementById("detailTabDetailsBtn");
  const storyBtn = document.getElementById("detailTabStoryBtn");
  const moreBtn = document.getElementById("detailTabMoreBtn");
  const detailsPanel = document.getElementById("detailTabDetailsPanel");
  const storyPanel = document.getElementById("detailTabStoryPanel");
  const morePanel = document.getElementById("detailTabMorePanel");

  const showDetails = tab === "details";
  const showStory = tab === "story";
  const showMore = tab === "more";

  detailsBtn.classList.toggle("active", showDetails);
  detailsBtn.setAttribute("aria-selected", String(showDetails));
  storyBtn.classList.toggle("active", showStory);
  storyBtn.setAttribute("aria-selected", String(showStory));
  moreBtn.classList.toggle("active", showMore);
  moreBtn.setAttribute("aria-selected", String(showMore));

  detailsPanel.hidden = !showDetails;
  storyPanel.hidden = !showStory;
  morePanel.hidden = !showMore;
}

async function handleRecordStorySubmit(event) {
  event.preventDefault();
  if (activeDetailRecordId === null) return;

  const statusEl = document.getElementById("recordStoryStatus");
  const saveBtn = document.getElementById("saveRecordStoryBtn");

  const acquiredDate = document.getElementById("storyAcquiredDate").value || null;
  const acquiredLocation = document.getElementById("storyAcquiredLocation").value.trim() || null;
  const listeningNotes = document.getElementById("storyListeningNotes").value.trim() || null;
  const personalStory = document.getElementById("storyPersonalStory").value.trim() || null;

  saveBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    const updates = {
      acquired_date: acquiredDate,
      acquired_location: acquiredLocation,
      listening_notes: listeningNotes,
      personal_story: personalStory,
    };

    const { error } = await supabaseClient
      .from("records")
      .update(updates)
      .eq("id", activeDetailRecordId);

    if (error) throw error;

    const record = allRecords.find((r) => r.id === activeDetailRecordId);
    if (record) Object.assign(record, updates);

    if (currentPage === "home") renderSpotlight();

    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";

    setTimeout(() => {
      closeRecordDetailModal();
    }, 700);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save your story. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleRecordDetailSubmit(event) {
  event.preventDefault();
  if (activeDetailRecordId === null) return;

  const statusEl = document.getElementById("recordDetailStatus");
  const saveBtn = document.getElementById("saveRecordDetailBtn");

  const artist = document.getElementById("detailArtist").value.trim();
  const album = document.getElementById("detailAlbum").value.trim();

  if (!artist || !album) {
    statusEl.textContent = "Artist and Album are required.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  const yearVal = parseYearInput(document.getElementById("detailYear").value);
  const quantityVal = parseYearInput(document.getElementById("detailQuantity").value) || 1;
  const label = document.getElementById("detailLabel").value.trim() || null;
  const genreInput = document.getElementById("detailGenre").value.trim();
  const subgenreInput = document.getElementById("detailSubgenre").value.trim();
  const vinylGrade = document.getElementById("detailVinylGrade").value.trim() || null;
  const sleeveGrade = document.getElementById("detailSleeveGrade").value.trim() || null;
  const description = document.getElementById("detailDescription").value.trim() || null;
  const notes = document.getElementById("detailNotes").value.trim() || null;

  saveBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    const genreId = await getOrCreateGenreId(genreInput);
    const subgenreId = subgenreInput
      ? await getOrCreateSubgenreId(subgenreInput, genreId)
      : null;

    const updates = {
      artist,
      album,
      year: yearVal,
      year_raw: yearVal !== null ? String(yearVal) : null,
      label,
      genre_id: genreId,
      subgenre_id: subgenreId,
      description,
      vinyl_grade: vinylGrade,
      sleeve_grade: sleeveGrade,
      notes,
      quantity: quantityVal,
    };

    if (pendingCoverUrl !== undefined) {
      updates.cover_url = pendingCoverUrl;
    }

    const { error } = await supabaseClient
      .from("records")
      .update(updates)
      .eq("id", activeDetailRecordId);

    if (error) throw error;

    // Update local copy
    const record = allRecords.find((r) => r.id === activeDetailRecordId);
    if (record) {
      Object.assign(record, updates);
      const genreObj = genres.find((g) => g.id === genreId);
      const subgenreObj = subgenres.find((sg) => sg.id === subgenreId);
      record.genre_name = genreObj?.name || "";
      record.subgenre_name = subgenreObj?.name || "";
    }

    renderFilters();
    render();

    statusEl.textContent = "Saved.";
    statusEl.className = "form-status form-status-success";

    setTimeout(() => {
      closeRecordDetailModal();
    }, 700);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save changes. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleDeleteRecord() {
  if (activeDetailRecordId === null) return;

  const record = allRecords.find((r) => r.id === activeDetailRecordId);
  const label = record ? `"${record.album}" by ${record.artist}` : "this record";

  const confirmed = window.confirm(
    `Delete ${label}? This cannot be undone.`
  );
  if (!confirmed) return;

  const statusEl = document.getElementById("recordDetailStatus");
  const deleteBtn = document.getElementById("deleteRecordBtn");
  deleteBtn.disabled = true;
  statusEl.textContent = "Deleting...";
  statusEl.className = "form-status";

  try {
    const { error } = await supabaseClient
      .from("records")
      .delete()
      .eq("id", activeDetailRecordId);

    if (error) throw error;

    allRecords = allRecords.filter((r) => r.id !== activeDetailRecordId);
    render();
    closeRecordDetailModal();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't delete record. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    deleteBtn.disabled = false;
  }
}


async function loadData() {
  try {
    setStatus("Loading genres...");
    const { data: genreData, error: genreError } = await supabaseClient
      .from("genres")
      .select("id, name")
      .order("name");
    if (genreError) throw genreError;
    genres = genreData || [];

    setStatus("Loading subgenres...");
    const { data: subgenreData, error: subgenreError } = await supabaseClient
      .from("subgenres")
      .select("id, name, genre_id")
      .order("name");
    if (subgenreError) throw subgenreError;
    subgenres = subgenreData || [];

    setStatus("Loading records...");
    const { data: recordsData, error: recordsError } = await supabaseClient
      .from("records")
      .select(
        `
        id,
        artist,
        album,
        year,
        label,
        genre_id,
        subgenre_id,
        cover_url,
        rating,
        description,
        vinyl_grade,
        sleeve_grade,
        notes,
        quantity,
        acquired_date,
        acquired_location,
        listening_notes,
        personal_story,
        genres ( name ),
        subgenres ( name )
      `
      )
      .order("artist", { ascending: true })
      .limit(1000); // safe upper bound for now
    if (recordsError) throw recordsError;

    // Flatten genre/subgenre names into each record
    allRecords =
      recordsData?.map((r) => ({
        ...r,
        genre_name: r.genres?.name ?? "",
        subgenre_name: r.subgenres?.name ?? "",
      })) || [];

    setStatus("Loading wishlist...");
    const { data: wishlistData, error: wishlistError } = await supabaseClient
      .from("wishlist")
      .select(
        `
        id,
        artist,
        album,
        year,
        label,
        genre_id,
        subgenre_id,
        discogs_release_id,
        cover_url,
        notes,
        added_at,
        price_data,
        price_currency,
        price_checked_at
      `
      )
      .order("added_at", { ascending: false });
    if (wishlistError) throw wishlistError;

    wishlist =
      wishlistData?.map((w) => ({
        ...w,
        genre_name: genreNameById(w.genre_id),
        subgenre_name: subgenreNameById(w.subgenre_id),
      })) || [];

    renderFilters();
    render();

    // Background: silently fetch cover art for records missing it.
    // 2s delay ensures the UI is fully rendered and responsive first.
    setTimeout(() => mbEnrichMissingCovers(), 2000);

  } catch (err) {
    console.error(err);
    setStatus("Error loading data. See console for details.");
  }
}

// 6. Wire up events
function setupEvents() {
  setupAlbumIntelModal();
  setupCoverIdentifyModal();

  // Trophy lightbox
  document.getElementById("trophyLightboxClose")
    .addEventListener("click", closeTrophyLightbox);
  document.getElementById("trophyLightbox")
    .addEventListener("click", (e) => {
      if (e.target.classList.contains("trophy-lightbox-backdrop")) closeTrophyLightbox();
    });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const lb = document.getElementById("trophyLightbox");
      if (!lb.hidden) closeTrophyLightbox();
    }
  });

  document
    .getElementById("searchInput")
    .addEventListener("input", () => render());

  // Wishlist-specific filter listeners
  document
    .getElementById("wishlistSearchInput")
    .addEventListener("input", () => render());

  document
    .getElementById("wishlistGenreFilter")
    .addEventListener("change", () => {
      populateWishlistSubgenreOptions();
      render();
    });

  document
    .getElementById("wishlistSubgenreFilter")
    .addEventListener("change", () => render());

  document
    .getElementById("wishlistSortSelect")
    .addEventListener("change", () => render());

  // Make the subgenre suggestions in Add Record / Add Wishlist / Edit forms
  // depend on whatever genre name has been typed in that same form.
  ["fieldGenre", "wishGenre", "detailGenre", "wishlistDetailGenre"].forEach((id) => {
    document.getElementById(id).addEventListener("input", (e) => {
      populateSubgenreOptionsForGenre(e.target.value);
    });
    document.getElementById(id).addEventListener("focus", (e) => {
      populateSubgenreOptionsForGenre(e.target.value);
    });
  });

  document
    .getElementById("genreFilter")
    .addEventListener("change", () => {
      populateSubgenreFilterOptions();
      render();
    });

  document
    .getElementById("subgenreFilter")
    .addEventListener("change", () => render());

  document
    .getElementById("ratingFilter")
    .addEventListener("change", () => render());

  document
    .getElementById("sortSelect")
    .addEventListener("change", () => render());

  document
    .getElementById("brandHomeBtn")
    .addEventListener("click", () => setPage("home"));

  function makeKeyboardClickable(el) {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  }

  const statRecordsBox = document.getElementById("statRecordsBox");
  const statGenresBox = document.getElementById("statGenresBox");
  const statDecadeBox = document.getElementById("statDecadeBox");
  const statWishlistBox = document.getElementById("statWishlistBox");

  statRecordsBox.addEventListener("click", () => setPage("collection"));
  statGenresBox.addEventListener("click", () => goToChart("genreChart"));
  statDecadeBox.addEventListener("click", () => goToChart("decadeChart"));
  statWishlistBox.addEventListener("click", () => setPage("wishlist"));

  [statRecordsBox, statGenresBox, statDecadeBox, statWishlistBox].forEach(makeKeyboardClickable);

  document
    .getElementById("homePageBtn")
    .addEventListener("click", () => setPage("home"));

  document
    .getElementById("collectionPageBtn")
    .addEventListener("click", () => setPage("collection"));

  document
    .getElementById("wishlistPageBtn")
    .addEventListener("click", () => setPage("wishlist"));

  document
    .getElementById("roomPageBtn")
    .addEventListener("click", () => setPage("room"));

  document
    .getElementById("headerNowPlayingRoomLink")
    ?.addEventListener("click", () => setPage("room"));

  document
    .getElementById("tasteProfilePageBtn")
    .addEventListener("click", () => setPage("tasteProfile"));

  document
    .getElementById("genreEvolutionPageBtn")
    .addEventListener("click", () => setPage("genreEvolution"));

  document
    .getElementById("trophiesPageBtn")
    .addEventListener("click", () => setPage("trophies"));

  document
    .getElementById("genreEvolutionArtistSelect")
    .addEventListener("change", (e) => {
      setGenreEvolutionFocus(e.target.value || null);
    });

  document
    .getElementById("spotlightShuffleBtn")
    .addEventListener("click", () => {
      spotlightRecordId = null;
      renderSpotlight();
    });

  // Wishlist: Suggested For You (moved from home page)
  document
    .getElementById("wishlistGetRecommendationsBtn")
    .addEventListener("click", () =>
      handleGetRecommendations(
        "wishlistGetRecommendationsBtn",
        "wishlistRecommendationsStatus",
        "wishlistRecommendationsList"
      )
    );

  document
    .getElementById("clearDismissedSuggestionsBtn")
    ?.addEventListener("click", () => {
      try {
        localStorage.removeItem(DISMISSED_SUGGESTIONS_KEY);
      } catch {}
      const statusEl = document.getElementById("wishlistRecommendationsStatus");
      if (statusEl) {
        statusEl.textContent = "Dismissed suggestions cleared — click Get suggestions to refresh.";
        statusEl.className = "form-status";
      }
    });

  // Wishlist: public/private toggle (toolbar)
  document
    .getElementById("wishlistPublicToggle")
    ?.addEventListener("change", () => handleWishlistPublicToggle());

  // Settings: Privacy & Sharing toggles
  document
    .getElementById("settingsCollectionPublicToggle")
    ?.addEventListener("change", async (e) => {
      const isPublic = e.target.checked;
      const statusEl = document.getElementById("settingsPrivacyStatus");
      try {
        await saveProfileFields({ collection_public: isPublic });
        syncPrivacySettings();
        statusEl.textContent = isPublic ? "Collection is now public." : "Collection is now private.";
        statusEl.className = "form-status form-status-success";
        setTimeout(() => { statusEl.textContent = ""; }, 2500);
      } catch (err) {
        console.error("Failed to save collection_public:", err);
        e.target.checked = !isPublic;
        statusEl.textContent = "Couldn't save. Has the collection_share_migration.sql been run in Supabase?";
        statusEl.className = "form-status form-status-error";
      }
    });

  document
    .getElementById("settingsWishlistPublicToggle")
    ?.addEventListener("change", async (e) => {
      const isPublic = e.target.checked;
      const statusEl = document.getElementById("settingsPrivacyStatus");
      try {
        await saveProfileFields({ wishlist_public: isPublic });
        syncPrivacySettings();
        statusEl.textContent = isPublic ? "Wishlist is now public." : "Wishlist is now private.";
        statusEl.className = "form-status form-status-success";
        setTimeout(() => { statusEl.textContent = ""; }, 2500);
      } catch (err) {
        console.error("Failed to save wishlist_public:", err);
        e.target.checked = !isPublic;
        statusEl.textContent = "Couldn't save. Please try again.";
        statusEl.className = "form-status form-status-error";
      }
    });

  // Settings: copy link buttons
  document
    .getElementById("settingsCopyCollectionUrlBtn")
    ?.addEventListener("click", (e) => copyShareUrl(getCollectionShareUrl(), e.currentTarget));

  document
    .getElementById("settingsCopyTrophiesUrlBtn")
    ?.addEventListener("click", (e) => copyShareUrl(getTrophiesShareUrl(), e.currentTarget));

  document
    .getElementById("settingsCopyWishlistUrlBtn")
    ?.addEventListener("click", (e) => copyShareUrl(getWishlistShareUrl(), e.currentTarget));

  // Wishlist: Share button (toolbar)
  document
    .getElementById("shareWishlistBtn")
    .addEventListener("click", () => handleShareWishlist());

  document
    .getElementById("shareCollectionBtn")
    ?.addEventListener("click", () => handleShareCollection());

  document
    .getElementById("shareTrophiesBtn")
    ?.addEventListener("click", () => handleShareTrophies());

  // Wishlist: duplicate check — "Save anyway" bypass
  document
    .getElementById("wishlistDuplicateSaveAnywayBtn")
    .addEventListener("click", () => doAddWishlistItem(true));

  // Wishlist: cover file upload
  document
    .getElementById("wishlistDetailCoverFile")
    .addEventListener("change", handleWishlistCoverFileChange);

  document
    .getElementById("wishlistDetailRemoveCoverBtn")
    .addEventListener("click", () => handleWishlistRemoveCover());

  const gridColsSelect = document.getElementById("gridColsSelect");
  let savedCols = "auto";
  try {
    savedCols = localStorage.getItem("spin-grid-cols") || "auto";
  } catch {
    // ignore storage errors
  }
  gridColsSelect.value = savedCols;
  applyGridCols(savedCols);
  gridColsSelect.addEventListener("change", (e) => applyGridCols(e.target.value));

  document
    .getElementById("importBtn")
    .addEventListener("click", () => openImportModal());

  document
    .getElementById("closeImportBtn")
    .addEventListener("click", () => closeImportModal());

  document
    .getElementById("cancelImportBtn")
    .addEventListener("click", () => closeImportModal());

  document
    .getElementById("importFile")
    .addEventListener("change", handleImportFileChange);

  document
    .getElementById("importTarget")
    .addEventListener("change", () => buildImportPreview());

  document
    .getElementById("confirmImportBtn")
    .addEventListener("click", () => handleConfirmImport());

  document
    .getElementById("importOverlay")
    .addEventListener("click", (e) => {
      if (e.target.id === "importOverlay") {
        closeImportModal();
      }
    });


  document
    .getElementById("addWishlistBtn")
    .addEventListener("click", () => openAddWishlistModal());

  document
    .getElementById("findAllDiscogsBtn")
    .addEventListener("click", () => findAllWishlistDiscogsMatches());

  document
    .getElementById("closeAddWishlistBtn")
    .addEventListener("click", () => closeAddWishlistModal());

  document
    .getElementById("cancelAddWishlistBtn")
    .addEventListener("click", () => {
      resetAddWishlistForm();
      closeAddWishlistModal();
    });

  document
    .getElementById("addWishlistForm")
    .addEventListener("submit", handleAddWishlistSubmit);

  document
    .getElementById("wishScanBarcodeBtn")
    .addEventListener("click", () => startBarcodeScan(ADD_WISHLIST_SCAN_CONFIG));

  document
    .getElementById("wishCancelScanBtn")
    .addEventListener("click", () => stopBarcodeScan());

  document
    .getElementById("addWishlistOverlay")
    .addEventListener("click", (e) => {
      if (e.target.id === "addWishlistOverlay") {
        closeAddWishlistModal();
      }
    });

  document
    .getElementById("addRecordBtn")
    .addEventListener("click", () => openAddRecordModal());

  document
    .getElementById("closeAddRecordBtn")
    .addEventListener("click", () => closeAddRecordModal());

  document
    .getElementById("cancelAddRecordBtn")
    .addEventListener("click", () => {
      resetAddRecordForm();
      closeAddRecordModal();
    });

  document
    .getElementById("addRecordForm")
    .addEventListener("submit", handleAddRecordSubmit);

  document
    .getElementById("scanBarcodeBtn")
    .addEventListener("click", () => startBarcodeScan(ADD_RECORD_SCAN_CONFIG));

  document
    .getElementById("cancelScanBtn")
    .addEventListener("click", () => stopBarcodeScan());

  // MusicBrainz search button in Add Record form
  document
    .getElementById("mbSearchBtn")
    ?.addEventListener("click", () => handleMbSearch());

  document
    .getElementById("addRecordOverlay")
    .addEventListener("click", (e) => {
      if (e.target.id === "addRecordOverlay") {
        closeAddRecordModal();
      }
    });

  // Record detail / edit modal
  document
    .getElementById("closeRecordDetailBtn")
    .addEventListener("click", () => closeRecordDetailModal());

  document
    .getElementById("cancelRecordDetailBtn")
    .addEventListener("click", () => closeRecordDetailModal());

  document
    .getElementById("recordDetailForm")
    .addEventListener("submit", handleRecordDetailSubmit);

  document
    .getElementById("deleteRecordBtn")
    .addEventListener("click", () => handleDeleteRecord());

  document
    .getElementById("detailCoverFile")
    .addEventListener("change", handleCoverFileChange);

  document
    .getElementById("removeCoverBtn")
    .addEventListener("click", () => handleRemoveCover());

  document
    .getElementById("detailTabDetailsBtn")
    .addEventListener("click", () => switchDetailTab("details"));

  document
    .getElementById("detailTabStoryBtn")
    .addEventListener("click", () => switchDetailTab("story"));

  document
    .getElementById("detailTabMoreBtn")
    .addEventListener("click", () => switchDetailTab("more"));

  document
    .getElementById("recordStoryForm")
    .addEventListener("submit", handleRecordStorySubmit);

  document
    .getElementById("cancelRecordStoryBtn")
    .addEventListener("click", () => closeRecordDetailModal());

  document
    .getElementById("recordDetailOverlay")
    .addEventListener("click", (e) => {
      if (e.target.id === "recordDetailOverlay") {
        closeRecordDetailModal();
      }
    });

  // Wishlist item detail modal
  document
    .getElementById("closeWishlistDetailBtn")
    .addEventListener("click", () => closeWishlistDetailModal());

  document
    .getElementById("cancelWishlistDetailBtn")
    .addEventListener("click", () => closeWishlistDetailModal());

  document
    .getElementById("wishlistDetailForm")
    .addEventListener("submit", handleWishlistDetailSubmit);

  document
    .getElementById("removeWishlistDetailBtn")
    .addEventListener("click", () => handleRemoveWishlistDetail());

  document
    .getElementById("wishlistDetailDiscogsBtn")
    .addEventListener("click", () => handleWishlistDetailDiscogsCheck());

  document
    .getElementById("wishlistDetailOverlay")
    .addEventListener("click", (e) => {
      if (e.target.id === "wishlistDetailOverlay") {
        closeWishlistDetailModal();
      }
    });
}

// ------------ Auth ------------

let currentUser = null;
let currentProfile = null;

const AVATAR_PRESETS = [
  { id: "record", file: "record.png", label: "Vinyl record" },
  { id: "acoustic-guitar", file: "acoustic_guitar.png", label: "Acoustic guitar" },
  { id: "electric-guitar", file: "electric_guitar.png", label: "Electric guitar" },
  { id: "drums", file: "drums.png", label: "Drums" },
  { id: "piano", file: "piano.png", label: "Piano" },
  { id: "saxophone", file: "saxophone.png", label: "Saxophone" },
  { id: "trumpet", file: "trumpet.png", label: "Trumpet" },
  { id: "violin", file: "violin.png", label: "Violin" },
  { id: "notes", file: "notes.png", label: "Music notes" },
];
let authMode = "signin"; // "signin" | "signup"

function showAuthOverlay(show) {
  const overlay = document.getElementById("authOverlay");
  overlay.hidden = !show;
}

function resetPasswordVisibility() {
  const input = document.getElementById("authPassword");
  const btn = document.getElementById("authPasswordToggle");
  input.type = "password";
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Show password");
  btn.innerHTML = '<i class="ti ti-eye" aria-hidden="true"></i>';
}

function setAuthMode(mode) {
  authMode = mode;
  const submitBtn = document.getElementById("authSubmitBtn");
  const toggleBtn = document.getElementById("authToggleBtn");
  const statusEl = document.getElementById("authStatus");

  statusEl.textContent = "";
  statusEl.className = "form-status";
  resetPasswordVisibility();

  if (mode === "signup") {
    submitBtn.textContent = "Create account";
    submitBtn.classList.remove("landing-btn-primary");
    submitBtn.classList.add("landing-btn-secondary");
    toggleBtn.textContent = "Sign in instead";
    toggleBtn.classList.remove("landing-btn-secondary");
    toggleBtn.classList.add("landing-btn-primary");
  } else {
    submitBtn.textContent = "Sign in";
    submitBtn.classList.remove("landing-btn-secondary");
    submitBtn.classList.add("landing-btn-primary");
    toggleBtn.textContent = "Create account";
    toggleBtn.classList.remove("landing-btn-primary");
    toggleBtn.classList.add("landing-btn-secondary");
  }
}

async function handleSocialLogin(provider) {
  const statusEl = document.getElementById("authSocialStatus");
  statusEl.textContent = "";
  statusEl.className = "form-status";

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });

  if (error) {
    statusEl.textContent =
      error.message === "OAuth provider not enabled"
        ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in isn't enabled yet.`
        : error.message;
    statusEl.className = "form-status form-status-error";
  }
  // On success, Supabase redirects to the OAuth provider automatically —
  // no further action needed here; onAuthStateChange handles the return.
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const submitBtn = document.getElementById("authSubmitBtn");
  const statusEl = document.getElementById("authStatus");

  submitBtn.disabled = true;
  statusEl.textContent = authMode === "signup" ? "Creating account..." : "Signing in...";
  statusEl.className = "form-status";

  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;

      if (data.session) {
        // Email confirmation not required - signed in immediately
        statusEl.textContent = "Account created!";
        statusEl.className = "form-status form-status-success";
      } else {
        statusEl.textContent = "Check your email to confirm your account, then sign in.";
        statusEl.className = "form-status form-status-success";
        setAuthMode("signin");
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      statusEl.textContent = "";
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message || "Something went wrong. Please try again.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleSignOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.error(err);
  }
}

function renderSettings() {
  document.getElementById("settingsCurrentEmail").textContent = currentUser?.email || "—";

  const emailForm = document.getElementById("changeEmailForm");
  const emailStatus = document.getElementById("changeEmailStatus");
  emailForm.reset();
  emailStatus.textContent = "";
  emailStatus.className = "form-status";

  const passwordForm = document.getElementById("changePasswordForm");
  const passwordStatus = document.getElementById("changePasswordStatus");
  passwordForm.reset();
  passwordStatus.textContent = "";
  passwordStatus.className = "form-status";
}

async function handleChangeEmail(event) {
  event.preventDefault();

  const newEmail = document.getElementById("newEmailInput").value.trim();
  const submitBtn = event.target.querySelector("button[type='submit']");
  const statusEl = document.getElementById("changeEmailStatus");

  if (!newEmail) return;

  if (newEmail.toLowerCase() === (currentUser?.email || "").toLowerCase()) {
    statusEl.textContent = "That's already your current email.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = "Updating email...";
  statusEl.className = "form-status";

  try {
    const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
    if (error) throw error;

    statusEl.textContent =
      "Check both your old and new email inboxes — Supabase sends a confirmation link to each, and the change takes effect once you confirm.";
    statusEl.className = "form-status form-status-success";
    document.getElementById("changeEmailForm").reset();
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message || "Couldn't update your email. Please try again.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleChangePassword(event) {
  event.preventDefault();

  const newPassword = document.getElementById("newPasswordInput").value;
  const confirmPassword = document.getElementById("confirmPasswordInput").value;
  const submitBtn = event.target.querySelector("button[type='submit']");
  const statusEl = document.getElementById("changePasswordStatus");

  if (newPassword.length < 6) {
    statusEl.textContent = "Password must be at least 6 characters.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  if (newPassword !== confirmPassword) {
    statusEl.textContent = "Passwords don't match.";
    statusEl.className = "form-status form-status-error";
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = "Updating password...";
  statusEl.className = "form-status";

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;

    statusEl.textContent = "Password updated.";
    statusEl.className = "form-status form-status-success";
    document.getElementById("changePasswordForm").reset();
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message || "Couldn't update your password. Please try again.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function onSignedIn(user) {
  currentUser = user;

  document.getElementById("accountSection").hidden = false;
  showAuthOverlay(false);

  resetSessionUiState();
  await loadProfile();
  refreshAccountButton();
  syncWishlistPublicToggle();
  await loadData();
  maybeShowOnboarding();
}

function onSignedOut() {
  currentUser = null;
  currentProfile = null;

  document.getElementById("accountSection").hidden = true;
  document.getElementById("accountAvatarImg").src = "icon-512.png";
  document.getElementById("authForm").reset();
  setAuthMode("signin");
  document.getElementById("onboardingScreen").hidden = true;
  resetSessionUiState();
  allRecords = [];
  wishlist = [];
  setPage("home");
  showAuthOverlay(true);
}

// ------------ Landing page ------------

// ---- Room ownership ----
// Each user owns their own Listening Room. isRoomOwner() returns true
// when the signed-in user is viewing their own room — which is always
// the case in the current single-user-room model (every user has one room,
// their own). This replaces the old hardcoded LANDING_OWNER_USER_ID check.

function isRoomOwner() {
  return !!currentUser;
}

// The user whose Spotify/room data to show. In the current model this is
// always the signed-in user. When public room URLs are added (future), this
// will be overridden by the URL's uid param.
function getRoomUserId() {
  return currentUser?.id || null;
}

const LANDING_VIDEOS = {
  left: ["left-1.mp4", "left-2.mp4", "left-3.mp4", "left-4.mp4"],
  right: ["right-1.mp4", "right-2.mp4", "right-3.mp4"],
};

const LANDING_VIDEO_PLAYBACK_RATE = 0.8;

function setupLandingVideoCarousel(videoEl, files) {
  if (!videoEl || files.length === 0) return;

  let index = 0;

  function playCurrent() {
    videoEl.src = files[index];
    videoEl.load();
    videoEl.playbackRate = LANDING_VIDEO_PLAYBACK_RATE;
    videoEl.play().catch(() => {
      // Autoplay can be blocked until user interaction; ignore.
    });
  }

  // Some browsers reset playbackRate when a new source loads,
  // so reapply it once metadata is available too.
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.playbackRate = LANDING_VIDEO_PLAYBACK_RATE;
  });

  videoEl.addEventListener("ended", () => {
    index = (index + 1) % files.length;
    playCurrent();
  });

  // In case a clip is itself set to loop, advance on error too
  // (e.g. missing file) so the carousel doesn't get stuck.
  videoEl.addEventListener("error", () => {
    if (files.length > 1) {
      index = (index + 1) % files.length;
      playCurrent();
    }
  });

  videoEl.loop = false;
  playCurrent();
}

// ============================================================
// Take a Tour
// ============================================================

const TOUR_TOTAL = 6;
let tourCurrentStep = 1;

function openTour() {
  tourCurrentStep = 1;
  document.getElementById("tourOverlay").hidden = false;
  document.body.style.overflow = "hidden";
  renderTourStep();
  buildTourDots();
  buildTourTrophies();
}

function closeTour() {
  document.getElementById("tourOverlay").hidden = true;
  document.body.style.overflow = "";
}

function renderTourStep() {
  document.querySelectorAll(".tour-step").forEach((el) => {
    el.hidden = parseInt(el.dataset.step) !== tourCurrentStep;
  });

  // Progress bar
  const pct = ((tourCurrentStep - 1) / (TOUR_TOTAL - 1)) * 100;
  document.getElementById("tourProgressBar").style.width = pct + "%";

  // Prev/next buttons
  const prevBtn = document.getElementById("tourPrevBtn");
  const nextBtn = document.getElementById("tourNextBtn");
  prevBtn.hidden = tourCurrentStep === 1;
  nextBtn.hidden = tourCurrentStep === TOUR_TOTAL;

  // Dots
  document.querySelectorAll(".tour-dot").forEach((dot, i) => {
    dot.classList.toggle("tour-dot-active", i + 1 === tourCurrentStep);
  });
}

function buildTourDots() {
  const container = document.getElementById("tourDots");
  container.innerHTML = "";
  for (let i = 1; i <= TOUR_TOTAL; i++) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "tour-dot" + (i === 1 ? " tour-dot-active" : "");
    dot.setAttribute("aria-label", `Go to step ${i}`);
    dot.addEventListener("click", () => {
      tourCurrentStep = i;
      renderTourStep();
    });
    container.appendChild(dot);
  }
}

function buildTourTrophies() {
  // Render 4 sample trophies in the tour using the real SVG builder
  const container = document.getElementById("tourTrophyRow");
  if (!container) return;
  container.innerHTML = "";

  const samples = [
    { id: "first_record", name: "First Groove", catalog: "SV-001", label: "Side A", color: "#c8973a", ring: "#e8c87a" },
    { id: "collector_50", name: "Serious Collector", catalog: "SV-050", label: "Vol. 50", color: "#3d7a6b", ring: "#6db8a5" },
    { id: "six_decades", name: "Living History", catalog: "SV-D06", label: "6 Decades", color: "#6a3a2a", ring: "#b07060" },
    { id: "love_streak", name: "True Believer", catalog: "SV-R10", label: "Loved", color: "#8a2a3a", ring: "#d06070" },
  ];

  samples.forEach((def, i) => {
    const wrap = document.createElement("div");
    wrap.className = "tour-trophy-item";
    wrap.innerHTML = buildTrophyLabelSvg(def, i < 3, 110); // first 3 earned, last locked
    container.appendChild(wrap);
  });
}

function setupTour() {
  document.getElementById("takeTourBtn")
    ?.addEventListener("click", () => openTour());

  document.getElementById("tourCloseBtn")
    ?.addEventListener("click", () => closeTour());

  document.getElementById("tourOverlay")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "tourOverlay") closeTour();
    });

  document.getElementById("tourPrevBtn")
    ?.addEventListener("click", () => {
      if (tourCurrentStep > 1) { tourCurrentStep--; renderTourStep(); }
    });

  document.getElementById("tourNextBtn")
    ?.addEventListener("click", () => {
      if (tourCurrentStep < TOUR_TOTAL) { tourCurrentStep++; renderTourStep(); }
    });

  document.getElementById("tourGetStartedBtn")
    ?.addEventListener("click", () => {
      closeTour();
      // Scroll auth form into view and focus the email field
      document.getElementById("authEmail")?.focus();
      document.getElementById("authToggleBtn")?.click(); // switch to "Create account"
    });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    const overlay = document.getElementById("tourOverlay");
    if (!overlay || overlay.hidden) return;
    if (e.key === "ArrowRight" && tourCurrentStep < TOUR_TOTAL) { tourCurrentStep++; renderTourStep(); }
    if (e.key === "ArrowLeft" && tourCurrentStep > 1) { tourCurrentStep--; renderTourStep(); }
    if (e.key === "Escape") closeTour();
  });
}

function setupLandingPage() {
  setupLandingVideoCarousel(document.getElementById("landingVideoLeft"), LANDING_VIDEOS.left);
  setupLandingVideoCarousel(document.getElementById("landingVideoRight"), LANDING_VIDEOS.right);
  setupTour();
}

// ============================================================
// Spotify Connect (owner-only)
// ============================================================
//
// Architecture recap:
//   - Only the SITE OWNER ever authorizes Spotify (Development Mode caps
//     Spotify apps at 5 authorized users — see session notes). Any signed-in
//     visitor who isn't the owner just sees a read-only "what's playing"
//     snapshot with no controls, same as a signed-out landing-page visitor.
//   - Auth uses Authorization Code Flow with PKCE (Spotify retired the
//     implicit grant flow; PKCE means no client secret has to live anywhere
//     in this static frontend).
//   - The actual token exchange/refresh/storage happens in the
//     `spotify-auth` Supabase Edge Function. The browser only ever holds a
//     short-lived access_token (≤1hr) for the Web Playback SDK — refresh
//     tokens never touch the browser.
//   - A separate static page, spotify-callback.html, is the OAuth redirect
//     target. It finishes the code exchange and then closes itself /
//     hands control back to the main app (see that file for details).

const SPOTIFY_CLIENT_ID = "abce6ebe89b248b796cd64532ce397a7";
const SPOTIFY_REDIRECT_URI = "https://spinvinyl.co/spotify-callback.html";
const SPOTIFY_AUTH_FUNCTION_URL = "https://wdgiskawukblqgapkmig.supabase.co/functions/v1/spotify-auth";
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

let spotifyPlayer = null; // Web Playback SDK instance, once initialized
let spotifyDeviceId = null;
let spotifyAccessToken = null;
let spotifyPollTimer = null;
let spotifyLatestState = null; // last known { track, artist, album, coverUrl, playing } from the SDK

// ---- PKCE helpers ----

function spotifyGenerateRandomString(length) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (x) => possible[x % possible.length]).join("");
}

async function spotifySha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function spotifyBase64Encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// ---- Edge Function calls ----

async function callSpotifyAuthFunction(action, extra = {}) {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const response = await fetch(SPOTIFY_AUTH_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action, ...extra }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Spotify auth request failed (${response.status})`);
  }
  return result;
}

// Legacy alias — all callers now use isRoomOwner()
function isSpotifyOwner() {
  return isRoomOwner();
}

// ---- Connect flow (owner only) ----

async function startSpotifyConnect() {
  const codeVerifier = spotifyGenerateRandomString(64);
  const hashed = await spotifySha256(codeVerifier);
  const codeChallenge = spotifyBase64Encode(hashed);

  // sessionStorage (not localStorage) — this only needs to survive the
  // single redirect round-trip to Spotify and back.
  sessionStorage.setItem("spotify_code_verifier", codeVerifier);

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  }).toString();

  window.location.href = authUrl.toString();
}

async function disconnectSpotify() {
  await callSpotifyAuthFunction("disconnect");
  spotifyAccessToken = null;
  if (spotifyPlayer) {
    spotifyPlayer.disconnect();
    spotifyPlayer = null;
    spotifyDeviceId = null;
  }
  renderRoomPlayerModal();
}

// ---- Web Playback SDK ----

function loadSpotifyPlaybackSdk() {
  return new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.head.appendChild(script);
  });
}

async function ensureSpotifyPlayer() {
  if (spotifyPlayer) return spotifyPlayer;

  await loadSpotifyPlaybackSdk();

  spotifyPlayer = new window.Spotify.Player({
    name: "SPIN VINYL Listening Room",
    getOAuthToken: async (callback) => {
      const token = await getValidSpotifyAccessToken();
      callback(token || "");
    },
    volume: 0.6,
  });

  spotifyPlayer.addListener("ready", ({ device_id }) => {
    spotifyDeviceId = device_id;
    console.log("Spotify player ready, device_id:", device_id);
  });

  spotifyPlayer.addListener("not_ready", ({ device_id }) => {
    spotifyDeviceId = null;
    console.warn("Spotify device went offline:", device_id);
  });

  spotifyPlayer.addListener("initialization_error", ({ message }) => {
    console.error("Spotify init error:", message);
  });
  spotifyPlayer.addListener("authentication_error", ({ message }) => {
    console.error("Spotify auth error:", message);
  });
  spotifyPlayer.addListener("account_error", ({ message }) => {
    // Most commonly: the connected account isn't Premium.
    console.error("Spotify account error:", message);
    showRoomPlayerStatus(
      "This Spotify account doesn't have Premium, which the Web Playback SDK requires."
    );
  });

  spotifyPlayer.addListener("player_state_changed", (state) => {
    console.log("Spotify player_state_changed:", state);
    if (!state) {
      spotifyLatestState = null;
      renderAllSpotifyNowPlayingSlots(null);
      return;
    }
    spotifyLatestState = {
      track: state.track_window.current_track.name,
      artist: state.track_window.current_track.artists.map((a) => a.name).join(", "),
      album: state.track_window.current_track.album.name,
      coverUrl: state.track_window.current_track.album.images?.[0]?.url || null,
      playing: !state.paused,
      contextUri: state.context?.uri || null,
      position: state.position || 0,       // ms elapsed
      duration: state.duration || 0,       // ms total
      positionAt: Date.now(),              // wall-clock time when position was sampled
    };
    renderAllSpotifyNowPlayingSlots(spotifyLatestState);
    // Nudge the header strip to refresh now rather than waiting for the
    // next poll — Spotify's API reflects the new state almost immediately.
    refreshHeaderNowPlaying();
  });

  const connected = await spotifyPlayer.connect();
  console.log("Spotify player.connect() result:", connected);

  return spotifyPlayer;
}

async function getValidSpotifyAccessToken() {
  try {
    const result = await callSpotifyAuthFunction("token");
    if (!result.connected) {
      spotifyAccessToken = null;
      return null;
    }
    spotifyAccessToken = result.access_token;
    return spotifyAccessToken;
  } catch (err) {
    console.error("Failed to get Spotify access token:", err);
    return null;
  }
}

// ---- Room player modal ----

function showRoomPlayerStatus(message) {
  const el = document.getElementById("roomPlayerStatus");
  if (el) el.textContent = message || "";
  const recordEl = document.getElementById("recordSpotifyStatus");
  if (recordEl) recordEl.textContent = message || "";
}

// Updates every now-playing display currently in the DOM (room modal,
// record modal) from a single shared state object. Either may be absent
// depending on which modal is open, so each render function no-ops safely
// if its target elements aren't present.
function renderAllSpotifyNowPlayingSlots(info) {
  renderRoomPlayerNowPlaying(info);
  renderRecordSpotifyNowPlaying(info);
  renderHeaderNowPlayingFromState(info);
  refreshRoomNowPlayingSign(info);
  renderDeepListenNowPlaying(info);
}

// Format ms to m:ss
function formatMs(ms) {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

let deepListenProgressTimer = null;

function renderDeepListenNowPlaying(info) {
  const nowPlayingEl = document.getElementById("deepListenNowPlaying");
  if (!nowPlayingEl) return;

  // Clear any existing tick timer
  if (deepListenProgressTimer) {
    clearInterval(deepListenProgressTimer);
    deepListenProgressTimer = null;
  }

  if (!info || !info.playing) {
    nowPlayingEl.hidden = true;
    return;
  }

  nowPlayingEl.hidden = false;

  const trackEl = document.getElementById("deepListenTrackName");
  const posEl = document.getElementById("deepListenPosition");
  const durEl = document.getElementById("deepListenDuration");
  const bar = document.getElementById("deepListenProgressBar");

  if (trackEl) trackEl.textContent = info.track || "";
  if (durEl) durEl.textContent = formatMs(info.duration);

  // Tick forward every second, estimating position since last SDK event
  function tick() {
    if (!spotifyLatestState || !spotifyLatestState.playing) return;
    const elapsed = Date.now() - (spotifyLatestState.positionAt || Date.now());
    const pos = Math.min(spotifyLatestState.position + elapsed, spotifyLatestState.duration || 0);
    if (posEl) posEl.textContent = formatMs(pos);
    if (bar && spotifyLatestState.duration > 0) {
      bar.style.width = `${(pos / spotifyLatestState.duration) * 100}%`;
    }
  }

  tick(); // immediate first render
  deepListenProgressTimer = setInterval(tick, 1000);
}

// Lightweight sync for the header bar driven directly by SDK events (no
// network round-trip needed, unlike refreshHeaderNowPlaying's poll path).
function renderHeaderNowPlayingFromState(info) {
  const wrap = document.getElementById("headerNowPlaying");
  if (!wrap || wrap.hidden) return;

  const playPauseBtn = document.getElementById("headerSpotifyPlayPauseBtn");
  if (!info || !playPauseBtn) return;

  playPauseBtn.innerHTML = info.playing
    ? '<i class="ti ti-player-pause" aria-hidden="true"></i>'
    : '<i class="ti ti-player-play" aria-hidden="true"></i>';
}

function renderRoomPlayerNowPlaying(info) {
  const wrap = document.getElementById("roomPlayerNowPlaying");
  if (!wrap) return;

  if (!info) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    return;
  }

  wrap.hidden = false;
  wrap.innerHTML = "";

  if (info.coverUrl) {
    const img = document.createElement("img");
    img.src = info.coverUrl;
    img.alt = info.album || info.track;
    img.className = "room-player-now-playing-cover";
    wrap.appendChild(img);
  }

  const textWrap = document.createElement("div");
  textWrap.className = "room-player-now-playing-text";

  const trackEl = document.createElement("p");
  trackEl.className = "room-player-now-playing-track";
  trackEl.textContent = info.track;
  textWrap.appendChild(trackEl);

  const artistEl = document.createElement("p");
  artistEl.className = "room-player-now-playing-artist";
  artistEl.textContent = info.artist;
  textWrap.appendChild(artistEl);

  wrap.appendChild(textWrap);

  const badge = document.createElement("span");
  badge.className = "room-player-now-playing-badge";
  badge.textContent = info.playing ? "Playing" : "Paused";
  wrap.appendChild(badge);

  const playPauseBtn = document.getElementById("spotifyPlayPauseBtn");
  const icon = playPauseBtn?.querySelector("i");
  if (icon) {
    icon.className = info.playing ? "ti ti-player-pause" : "ti ti-player-play";
  }
}

// Renders the modal body based on: owner+connected, owner+not-connected,
// or visitor (read-only).
async function renderRoomPlayerModal() {
  const ownerView = document.getElementById("roomPlayerOwnerView");
  const visitorView = document.getElementById("roomPlayerVisitorView");
  const connectBtn = document.getElementById("spotifyConnectBtn");
  const disconnectBtn = document.getElementById("spotifyDisconnectBtn");
  const controls = document.getElementById("roomPlayerControls");

  showRoomPlayerStatus("");

  if (!isSpotifyOwner()) {
    ownerView.hidden = true;
    visitorView.hidden = false;
    await refreshVisitorNowPlaying();
    return;
  }

  ownerView.hidden = false;
  visitorView.hidden = true;

  let status;
  try {
    status = await callSpotifyAuthFunction("status");
  } catch (err) {
    showRoomPlayerStatus("Couldn't reach Spotify right now. Try again in a moment.");
    return;
  }

  if (!status.connected) {
    connectBtn.hidden = false;
    disconnectBtn.hidden = true;
    controls.hidden = true;
    renderRoomPlayerNowPlaying(null);
    return;
  }

  connectBtn.hidden = true;
  disconnectBtn.hidden = false;
  controls.hidden = false;

  try {
    await ensureSpotifyPlayer();
    // If playback was already underway before this modal opened, reflect
    // it immediately instead of waiting for the next state-change event.
    renderRoomPlayerNowPlaying(spotifyLatestState);
  } catch (err) {
    console.error("Spotify player init failed:", err);
    showRoomPlayerStatus("Couldn't start the Spotify player. Make sure this account has Premium.");
  }
}

// Read-only "now playing" for non-owner visitors (and reused by the
// signed-out landing page). Calls the public, unauthenticated
// "now-playing" action — no tokens are ever involved on this path.
// Shared by the room player's visitor view and the persistent header strip.
// Public, unauthenticated call — works for signed-out visitors too.
async function fetchSpotifyNowPlaying(uid = null) {
  try {
    const targetUid = uid || getRoomUserId();
    const response = await fetch(SPOTIFY_AUTH_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: "now-playing", uid: targetUid }),
    });
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch Spotify now-playing:", err);
    return { connected: false, playing: false };
  }
}

async function refreshVisitorNowPlaying() {
  const wrap = document.getElementById("roomPlayerVisitorNowPlaying");
  const emptyMsg = document.getElementById("roomPlayerVisitorEmpty");
  if (!wrap) return;

  const data = await fetchSpotifyNowPlaying();

  if (!data.connected || !data.playing) {
    wrap.hidden = true;
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }

  if (emptyMsg) emptyMsg.hidden = true;
  wrap.hidden = false;
  wrap.innerHTML = "";

  if (data.coverUrl) {
    const img = document.createElement("img");
    img.src = data.coverUrl;
    img.alt = data.album || data.track;
    img.className = "room-player-now-playing-cover";
    wrap.appendChild(img);
  }

  const textWrap = document.createElement("div");
  textWrap.className = "room-player-now-playing-text";
  const trackEl = document.createElement("p");
  trackEl.className = "room-player-now-playing-track";
  trackEl.textContent = data.track;
  textWrap.appendChild(trackEl);
  const artistEl = document.createElement("p");
  artistEl.className = "room-player-now-playing-artist";
  artistEl.textContent = data.artist;
  textWrap.appendChild(artistEl);
  wrap.appendChild(textWrap);
}

// ---- Persistent header Now Playing strip (visible to everyone, every page) ----

let headerNowPlayingPollTimer = null;

async function refreshHeaderNowPlaying() {
  const wrap = document.getElementById("headerNowPlaying");
  if (!wrap) return;

  const controls = document.getElementById("headerNowPlayingControls");
  const playPauseBtn = document.getElementById("headerSpotifyPlayPauseBtn");

  const data = await fetchSpotifyNowPlaying();

  if (!data.connected || !data.playing) {
    wrap.hidden = true;
    return;
  }

  const coverImg = document.getElementById("headerNowPlayingCover");
  const trackEl = document.getElementById("headerNowPlayingTrack");
  const artistEl = document.getElementById("headerNowPlayingArtist");

  if (data.coverUrl) {
    coverImg.src = data.coverUrl;
    coverImg.alt = data.album || data.track || "";
    coverImg.hidden = false;
  } else {
    coverImg.hidden = true;
  }

  trackEl.textContent = data.track || "";
  artistEl.textContent = data.artist || "";
  wrap.hidden = false;

  // Controls only make sense for the owner — visitors and signed-out
  // people get the same read-only info everyone else gets.
  if (controls) {
    controls.hidden = !isSpotifyOwner();
  }
  if (playPauseBtn) {
    playPauseBtn.innerHTML = data.playing
      ? '<i class="ti ti-player-pause" aria-hidden="true"></i>'
      : '<i class="ti ti-player-play" aria-hidden="true"></i>';
  }
}

function startHeaderNowPlayingPolling() {
  refreshHeaderNowPlaying();
  if (headerNowPlayingPollTimer) clearInterval(headerNowPlayingPollTimer);
  // 30s strikes a balance between feeling "live" and not hammering the
  // Edge Function / Spotify's currently-playing endpoint on every page.
  headerNowPlayingPollTimer = setInterval(refreshHeaderNowPlaying, 30000);
}

// ---- Playback controls (owner only, called from modal buttons) ----

async function spotifyTogglePlayback() {
  try {
    await ensureSpotifyPlayer();
    if (!spotifyPlayer) return;
    const state = await spotifyPlayer.getCurrentState();
    console.log("Spotify getCurrentState before toggle:", state);

    if (!state) {
      // No active playback session on this device yet — togglePlay() has
      // nothing to resume in that case. Transfer playback to this device
      // so it becomes the active Spotify Connect target, which also
      // un-pauses whatever was last playing on the account (if anything).
      showRoomPlayerStatus("Connecting to Spotify…");
      const token = await getValidSpotifyAccessToken();
      if (!token || !spotifyDeviceId) {
        showRoomPlayerStatus("Spotify isn't ready yet. Try again in a moment.");
        return;
      }

      const resp = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ device_ids: [spotifyDeviceId], play: true }),
      });

      if (!resp.ok && resp.status !== 204) {
        const errBody = await resp.json().catch(() => ({}));
        console.error("Spotify transfer playback failed:", errBody);
        showRoomPlayerStatus(
          errBody.error?.message ||
            "Nothing queued yet \u2014 open a record in your collection and hit \u201cPlay on Spotify\u201d to start something."
        );
        return;
      }

      showRoomPlayerStatus("");
      return;
    }

    await spotifyPlayer.togglePlay();
  } catch (err) {
    console.error("Spotify toggle playback failed:", err);
    showRoomPlayerStatus("Couldn't reach Spotify. Try again in a moment.");
  }
}

async function spotifyNextTrack() {
  try {
    await ensureSpotifyPlayer();
    if (!spotifyPlayer) return;
    await spotifyPlayer.nextTrack();
  } catch (err) {
    console.error("Spotify next track failed:", err);
    showRoomPlayerStatus("Couldn't skip — make sure something's already playing.");
  }
}

async function spotifyPreviousTrack() {
  try {
    await ensureSpotifyPlayer();
    if (!spotifyPlayer) return;
    await spotifyPlayer.previousTrack();
  } catch (err) {
    console.error("Spotify previous track failed:", err);
    showRoomPlayerStatus("Couldn't skip — make sure something's already playing.");
  }
}

// ---- Record-to-Spotify-album matching ----
//
// Records don't store a Spotify URI until the owner first tries to play
// them. At that point we search Spotify by artist+album, cache the top
// match on the record as 'auto', and let the owner override it via the
// match picker if it's wrong (e.g. a compilation or reissue matched
// instead of the original pressing).

async function searchSpotifyAlbumCandidates(artist, album) {
  const result = await callSpotifyAuthFunction("search-album", { artist, album });
  return result.candidates || [];
}

async function saveRecordSpotifyMatch(recordId, uri, status) {
  const { data, error } = await supabaseClient
    .from("records")
    .update({ spotify_album_uri: uri, spotify_match_status: status })
    .eq("id", recordId)
    .select()
    .single();

  if (error) throw error;

  // Keep the in-memory copy in sync so the UI doesn't need a full reload.
  const idx = allRecords.findIndex((r) => r.id === recordId);
  if (idx !== -1) {
    allRecords[idx] = { ...allRecords[idx], ...data };
  }
  return data;
}

// ---- Visitor listen options (Spotify deep-link + Apple Music placeholder) ----
//
// Unlike the owner's in-room playback, visitors never get a Spotify
// session on this site at all (Development Mode's 5-user cap makes that
// permanently impossible at any real scale — see project notes). Instead:
//   - "Listen on Spotify" deep-links out to open.spotify.com, where the
//     visitor uses whatever Spotify session they're already logged into.
//     Precise link if the owner has already matched this record; falls
//     back to a Spotify search URL otherwise (no API call, works for
//     anyone, no auth required).
//   - "Listen here on Apple Music" is reserved for native in-site
//     playback via MusicKit JS (each visitor signs in with their own
//     Apple Music account, no per-user cap). Not built yet — see TODO.

function buildSpotifyDeepLink(record) {
  if (record.spotify_album_uri && record.spotify_match_status !== "not_found") {
    // spotify:album:XXXXX -> https://open.spotify.com/album/XXXXX
    const id = record.spotify_album_uri.split(":").pop();
    return `https://open.spotify.com/album/${id}`;
  }
  const query = encodeURIComponent(`${record.album || ""} ${record.artist || ""}`.trim());
  return `https://open.spotify.com/search/${query}`;
}

function renderVisitorListenOptions(wrap, record) {
  wrap.hidden = false;
  wrap.innerHTML = "";
  wrap.classList.add("visitor-listen-options");

  const appleBtn = document.createElement("button");
  appleBtn.type = "button";
  appleBtn.className = "btn-secondary listen-option-btn listen-option-apple";
  appleBtn.innerHTML = '<i class="ti ti-brand-apple" aria-hidden="true"></i> Listen here on Apple Music';
  appleBtn.disabled = true;
  appleBtn.title = "Coming soon";
  wrap.appendChild(appleBtn);

  const comingSoonNote = document.createElement("p");
  comingSoonNote.className = "listen-option-note";
  comingSoonNote.textContent = "Apple Music playback is coming soon.";
  wrap.appendChild(comingSoonNote);

  const spotifyLink = document.createElement("a");
  spotifyLink.className = "btn-secondary listen-option-btn listen-option-spotify";
  spotifyLink.href = buildSpotifyDeepLink(record);
  spotifyLink.target = "_blank";
  spotifyLink.rel = "noopener noreferrer";
  spotifyLink.innerHTML = '<i class="ti ti-brand-spotify" aria-hidden="true"></i> Listen on Spotify';
  wrap.appendChild(spotifyLink);
}

// Renders the small "Play on Spotify" control inside the record detail
// modal: resolves a match (auto-searching the first time), shows a
// "play" button once one exists, and a "change match" link to override it.
async function renderRecordSpotifyControls(record) {
  const wrap = document.getElementById("recordSpotifyControls");
  if (!wrap) return;

  if (!isSpotifyOwner()) {
    renderVisitorListenOptions(wrap, record);
    return;
  }

  wrap.hidden = false;
  wrap.innerHTML = "";

  const status = await callSpotifyAuthFunction("status").catch(() => ({ connected: false }));
  if (!status.connected) {
    const hint = document.createElement("p");
    hint.className = "field-hint";
    hint.textContent = "Connect Spotify in My Listening Room to play albums from here.";
    wrap.appendChild(hint);
    return;
  }

  if (record.spotify_album_uri && record.spotify_match_status !== "not_found") {
    renderSpotifyMatchFound(wrap, record);
    return;
  }

  if (record.spotify_match_status === "not_found") {
    renderSpotifyNoMatch(wrap, record);
    return;
  }

  // Never searched yet — search automatically.
  renderSpotifySearching(wrap);
  try {
    const candidates = await searchSpotifyAlbumCandidates(record.artist, record.album);
    if (candidates.length === 0) {
      await saveRecordSpotifyMatch(record.id, null, "not_found");
      renderSpotifyNoMatch(wrap, record);
      return;
    }
    const best = candidates[0];
    await saveRecordSpotifyMatch(record.id, best.uri, "auto");
    renderSpotifyMatchFound(wrap, { ...record, spotify_album_uri: best.uri, spotify_match_status: "auto" });
  } catch (err) {
    console.error("Spotify album search failed:", err);
    wrap.innerHTML = "";
    const errEl = document.createElement("p");
    errEl.className = "form-status";
    errEl.textContent = "Couldn't search Spotify right now.";
    wrap.appendChild(errEl);
  }
}

function renderSpotifySearching(wrap) {
  wrap.innerHTML = "";
  const p = document.createElement("p");
  p.className = "field-hint";
  p.textContent = "Looking for this album on Spotify…";
  wrap.appendChild(p);
}

function renderSpotifyNoMatch(wrap, record) {
  wrap.innerHTML = "";
  const p = document.createElement("p");
  p.className = "field-hint";
  p.textContent = "No Spotify match found for this album.";
  wrap.appendChild(p);

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "btn-text";
  retryBtn.textContent = "Search again";
  retryBtn.addEventListener("click", () => openSpotifyMatchPicker(record));
  wrap.appendChild(retryBtn);
}

function renderSpotifyMatchFound(wrap, record) {
  wrap.innerHTML = "";
  wrap.classList.add("record-spotify-controls-active");

  const transport = document.createElement("div");
  transport.className = "record-spotify-transport";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "btn-secondary record-spotify-transport-btn";
  prevBtn.setAttribute("aria-label", "Previous track");
  prevBtn.innerHTML = '<i class="ti ti-player-skip-back" aria-hidden="true"></i>';
  prevBtn.addEventListener("click", () => spotifyPreviousTrack());
  transport.appendChild(prevBtn);

  const playPauseBtn = document.createElement("button");
  playPauseBtn.type = "button";
  playPauseBtn.id = "recordSpotifyPlayPauseBtn";
  playPauseBtn.className = "btn-primary record-spotify-playpause-btn";
  playPauseBtn.setAttribute("aria-label", "Play or pause");
  playPauseBtn.innerHTML = '<i class="ti ti-player-play" aria-hidden="true"></i>';
  playPauseBtn.addEventListener("click", () =>
    spotifyHandleRecordPlayPause(record.spotify_album_uri, playPauseBtn)
  );
  transport.appendChild(playPauseBtn);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "btn-secondary record-spotify-transport-btn";
  nextBtn.setAttribute("aria-label", "Next track");
  nextBtn.innerHTML = '<i class="ti ti-player-skip-forward" aria-hidden="true"></i>';
  nextBtn.addEventListener("click", () => spotifyNextTrack());
  transport.appendChild(nextBtn);

  wrap.appendChild(transport);

  const nowPlayingEl = document.createElement("div");
  nowPlayingEl.id = "recordSpotifyNowPlaying";
  nowPlayingEl.className = "record-spotify-now-playing";
  nowPlayingEl.hidden = true;
  wrap.appendChild(nowPlayingEl);

  const statusEl = document.createElement("p");
  statusEl.id = "recordSpotifyStatus";
  statusEl.className = "form-status";
  wrap.appendChild(statusEl);

  if (record.spotify_match_status === "auto") {
    const changeBtn = document.createElement("button");
    changeBtn.type = "button";
    changeBtn.className = "record-spotify-change-match";
    changeBtn.textContent = "Wrong match? Change it";
    changeBtn.addEventListener("click", () => openSpotifyMatchPicker(record));
    wrap.appendChild(changeBtn);
  }

  // Reflect whatever the SDK already knows right now, in case playback
  // was already underway before this modal opened.
  renderRecordSpotifyNowPlaying(spotifyLatestState);
}

// Renders the track/artist line + keeps the play/pause icon in sync, scoped
// to the record detail modal's controls. Only shows anything if the
// currently-playing context actually matches the record this modal is
// open for — otherwise it's leftover state from a previously played
// record and would be misleading to display here.
function renderRecordSpotifyNowPlaying(info) {
  const wrap = document.getElementById("recordSpotifyNowPlaying");
  const playPauseBtn = document.getElementById("recordSpotifyPlayPauseBtn");
  if (!wrap) return;

  const openRecord = allRecords.find((r) => r.id === activeDetailRecordId);
  const matchesOpenRecord =
    info && openRecord && info.contextUri && info.contextUri === openRecord.spotify_album_uri;

  if (!matchesOpenRecord) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    if (playPauseBtn) {
      playPauseBtn.innerHTML = '<i class="ti ti-player-play" aria-hidden="true"></i>';
    }
    return;
  }

  wrap.hidden = false;
  wrap.innerHTML = "";

  const trackEl = document.createElement("p");
  trackEl.className = "record-spotify-now-playing-track";
  trackEl.textContent = info.track;
  wrap.appendChild(trackEl);

  const artistEl = document.createElement("p");
  artistEl.className = "record-spotify-now-playing-artist";
  artistEl.textContent = info.artist;
  wrap.appendChild(artistEl);

  if (playPauseBtn) {
    playPauseBtn.innerHTML = info.playing
      ? '<i class="ti ti-player-pause" aria-hidden="true"></i>'
      : '<i class="ti ti-player-play" aria-hidden="true"></i>';
  }
}

// The center transport button does double duty: if nothing's playing yet
// on this device, it starts the album (same as the old "Play on Spotify"
// button); once something IS playing, it becomes a plain pause/resume
// toggle so it doesn't restart the album from track 1 every time.
// The center transport button does double duty: if this record's album
// isn't the one currently playing (nothing playing at all, or a
// DIFFERENT album is active), it starts this album fresh. Only when this
// exact album is already the active context does it become a plain
// pause/resume toggle — otherwise pressing play on a new record would
// just pause/resume whatever was already playing instead of switching.
async function spotifyHandleRecordPlayPause(albumUri, btn) {
  const alreadyPlayingThisAlbum =
    spotifyLatestState && spotifyLatestState.contextUri === albumUri;

  if (alreadyPlayingThisAlbum) {
    await spotifyTogglePlayback();
    return;
  }
  await spotifyPlayAlbumByUri(albumUri, btn);
}

// ---- Match picker modal (manual override) ----

async function openSpotifyMatchPicker(record) {
  const overlay = document.getElementById("spotifyMatchOverlay");
  const list = document.getElementById("spotifyMatchList");
  const statusEl = document.getElementById("spotifyMatchStatus");
  if (!overlay || !list) return;

  overlay.hidden = false;
  statusEl.textContent = "";
  list.innerHTML = "<p class=\"field-hint\">Searching Spotify…</p>";

  try {
    const candidates = await searchSpotifyAlbumCandidates(record.artist, record.album);
    list.innerHTML = "";

    if (candidates.length === 0) {
      list.innerHTML = "<p class=\"field-hint\">No matches found.</p>";
      return;
    }

    candidates.forEach((c) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "spotify-match-row";

      if (c.coverUrl) {
        const img = document.createElement("img");
        img.src = c.coverUrl;
        img.alt = c.name;
        row.appendChild(img);
      }

      const textWrap = document.createElement("div");
      const nameEl = document.createElement("p");
      nameEl.className = "spotify-match-row-name";
      nameEl.textContent = c.name;
      textWrap.appendChild(nameEl);
      const metaEl = document.createElement("p");
      metaEl.className = "spotify-match-row-meta";
      metaEl.textContent = [c.artist, c.year].filter(Boolean).join(" · ");
      textWrap.appendChild(metaEl);
      row.appendChild(textWrap);

      row.addEventListener("click", async () => {
        try {
          await saveRecordSpotifyMatch(record.id, c.uri, "confirmed");
          closeSpotifyMatchPicker();
          renderRecordSpotifyControls({ ...record, spotify_album_uri: c.uri, spotify_match_status: "confirmed" });
        } catch (err) {
          statusEl.textContent = "Couldn't save that match. Try again.";
        }
      });

      list.appendChild(row);
    });
  } catch (err) {
    console.error("Spotify match search failed:", err);
    list.innerHTML = "";
    statusEl.textContent = "Couldn't search Spotify right now.";
  }
}

function closeSpotifyMatchPicker() {
  const overlay = document.getElementById("spotifyMatchOverlay");
  if (overlay) overlay.hidden = true;
}

// Called by the "Play this record" button inside the record detail modal.
async function spotifyPlayAlbumByUri(albumUri, triggerBtn) {
  if (!isSpotifyOwner() || !albumUri) return;

  const originalLabel = triggerBtn ? triggerBtn.innerHTML : null;
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.textContent = "Starting playback…";
  }

  try {
    // The Web Playback SDK device might not be ready yet if the owner
    // hasn't opened the room player modal this session — make sure it is.
    await ensureSpotifyPlayer();

    // Device registration with Spotify's servers can lag a beat behind
    // the SDK's "ready" event firing locally; give it a short window.
    let attempts = 0;
    while (!spotifyDeviceId && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      attempts++;
    }

    if (!spotifyDeviceId) {
      throw new Error("Spotify player isn't ready yet. Try again in a moment.");
    }

    const token = await getValidSpotifyAccessToken();
    if (!token) throw new Error("Spotify isn't connected.");

    const resp = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context_uri: albumUri }),
    });

    if (!resp.ok && resp.status !== 204) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Playback failed (${resp.status})`);
    }
  } catch (err) {
    console.error("spotifyPlayAlbumByUri failed:", err);
    if (triggerBtn) {
      triggerBtn.textContent = err.message || "Couldn't start playback";
      setTimeout(() => {
        if (triggerBtn) {
          triggerBtn.disabled = false;
          triggerBtn.innerHTML = originalLabel;
        }
      }, 2500);
      return;
    }
  }

  if (triggerBtn) {
    triggerBtn.disabled = false;
    triggerBtn.innerHTML = originalLabel;
  }
}

// ---- Setup ----

// ============================================================
// Listening Room Modes
// ============================================================

// ---- Shared: play a record by URI ----
async function playRoomRecord(record, statusEl) {
  if (!record) return;

  if (statusEl) {
    statusEl.textContent = "Starting playback…";
    statusEl.className = "form-status";
  }

  try {
    if (record.spotify_album_uri) {
      await spotifyPlayAlbumByUri(record.spotify_album_uri, null);
      if (statusEl) statusEl.textContent = "";
    } else {
      // No URI yet — trigger auto-search and save result, then play
      if (statusEl) statusEl.textContent = "Looking up on Spotify…";
      try {
        const candidates = await searchSpotifyAlbumCandidates(record.artist, record.album);
        if (candidates.length > 0) {
          const best = candidates[0];
          await saveRecordSpotifyMatch(record.id, best.uri, "auto");
          record.spotify_album_uri = best.uri;
          record.spotify_match_status = "auto";
          await spotifyPlayAlbumByUri(best.uri, null);
          if (statusEl) statusEl.textContent = "";
        } else {
          if (statusEl) {
            statusEl.textContent = "No Spotify match found for this album.";
            statusEl.className = "form-status form-status-error";
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = "Couldn't find this album on Spotify.";
          statusEl.className = "form-status form-status-error";
        }
      }
    }
  } catch (err) {
    console.error("playRoomRecord failed:", err);
    if (statusEl) {
      statusEl.textContent = err.message || "Playback failed. Make sure Spotify is connected.";
      statusEl.className = "form-status form-status-error";
    }
  }
}

// Shared mini transport bar — reused in Discover result and Deep Listen views
function buildMiniTransport() {
  const wrap = document.createElement("div");
  wrap.className = "room-mode-transport";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "btn-secondary room-mode-transport-btn";
  prev.setAttribute("aria-label", "Previous track");
  prev.innerHTML = '<i class="ti ti-player-skip-back" aria-hidden="true"></i>';
  prev.addEventListener("click", () => spotifyPreviousTrack());

  const playPause = document.createElement("button");
  playPause.type = "button";
  playPause.className = "btn-primary room-mode-transport-btn room-mode-transport-btn-primary";
  playPause.setAttribute("aria-label", "Play or pause");
  playPause.id = "roomModePlayPauseBtn";
  playPause.innerHTML = '<i class="ti ti-player-play" aria-hidden="true"></i>';
  playPause.addEventListener("click", () => spotifyTogglePlayback());

  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn-secondary room-mode-transport-btn";
  next.setAttribute("aria-label", "Next track");
  next.innerHTML = '<i class="ti ti-player-skip-forward" aria-hidden="true"></i>';
  next.addEventListener("click", () => spotifyNextTrack());

  wrap.appendChild(prev);
  wrap.appendChild(playPause);
  wrap.appendChild(next);
  return wrap;
}

// ---- Discover My Collection ----

const DISCOVER_QUESTIONS = [
  {
    id: "energy",
    question: "What kind of energy are you in the mood for?",
    options: [
      { label: "Chill & mellow", value: "chill", emoji: "🌙" },
      { label: "Energised & alive", value: "energised", emoji: "⚡" },
      { label: "Melancholic & reflective", value: "melancholic", emoji: "🌧️" },
      { label: "Adventurous & curious", value: "adventurous", emoji: "🧭" },
    ],
  },
  {
    id: "setting",
    question: "Where are you right now?",
    options: [
      { label: "Late night, city lights", value: "latenight", emoji: "🌃" },
      { label: "Sunny afternoon", value: "sunny", emoji: "☀️" },
      { label: "Focused & working", value: "working", emoji: "📖" },
      { label: "Just unwinding at home", value: "home", emoji: "🛋️" },
    ],
  },
  {
    id: "era",
    question: "Any pull toward a particular era?",
    options: [
      { label: "Old school (pre-1970)", value: "old", emoji: "📻" },
      { label: "Classic (1970s–1990s)", value: "classic", emoji: "🎸" },
      { label: "Modern (2000s+)", value: "modern", emoji: "🎛️" },
      { label: "Surprise me", value: "any", emoji: "🎲" },
    ],
  },
];

function scoreRecordForAnswers(record, answers) {
  let score = 0;
  const genre = (record.genre_name || "").toLowerCase();
  const subgenre = (record.subgenre_name || "").toLowerCase();
  const combined = genre + " " + subgenre;
  const year = record.year || 0;

  // Rating — strong signal but not overwhelming
  if (record.rating === "love") score += 6;
  else if (record.rating === "like") score += 3;
  else if (record.rating === "dislike") score -= 20; // hard exclude
  else score -= 1; // unrated gets slight penalty vs rated

  const energy = answers.energy;
  const setting = answers.setting;
  const era = answers.era;

  // ---- Energy matching ----
  // Each energy maps to primary (+6) and secondary (+3) genre families.
  // Mismatched energy gets a small penalty (-2) to separate results more.

  const energyMap = {
    chill: {
      primary: ["jazz", "bossa", "ambient", "classical", "new age", "easy listening", "cool"],
      secondary: ["soul", "folk", "acoustic", "singer", "blues", "r&b", "soft"],
      avoid: ["metal", "punk", "hardcore", "noise", "thrash", "death"],
    },
    energised: {
      primary: ["rock", "punk", "funk", "metal", "reggae", "dance", "electronic", "hip hop"],
      secondary: ["blues", "rhythm", "gospel", "soul", "hard bop", "swing", "latin"],
      avoid: ["ambient", "new age", "easy listening", "classical"],
    },
    melancholic: {
      primary: ["blues", "folk", "country", "singer", "americana", "chamber", "slowcore"],
      secondary: ["soul", "jazz", "gospel", "ballad", "torch", "delta"],
      avoid: ["punk", "metal", "dance", "funk", "electronic"],
    },
    adventurous: {
      primary: ["experimental", "avant", "free jazz", "world", "latin", "afro", "fusion", "progressive"],
      secondary: ["jazz", "electronic", "psychedelic", "krautrock", "ethnic", "modal"],
      avoid: ["easy listening", "pop", "country"],
    },
  };

  const eMap = energyMap[energy];
  if (eMap) {
    const isPrimary = eMap.primary.some((k) => combined.includes(k));
    const isSecondary = eMap.secondary.some((k) => combined.includes(k));
    const isAvoided = eMap.avoid.some((k) => combined.includes(k));

    if (isPrimary) score += 6;
    else if (isSecondary) score += 3;
    else if (isAvoided) score -= 2;
    // No genre data = 0, treated as neutral
  }

  // ---- Setting matching ----
  const settingMap = {
    latenight: {
      primary: ["jazz", "blues", "soul", "ambient", "bossa", "cool"],
      secondary: ["folk", "acoustic", "singer", "r&b"],
      yearBonus: { min: 1940, max: 1979, pts: 2 },
    },
    sunny: {
      primary: ["reggae", "latin", "funk", "bossa", "pop", "ska", "afro"],
      secondary: ["rock", "soul", "folk", "rhythm"],
      yearBonus: { min: 1960, max: 1989, pts: 1 },
    },
    working: {
      primary: ["jazz", "classical", "ambient", "electronic", "instrumental"],
      secondary: ["folk", "acoustic", "cool", "modal"],
      yearBonus: null,
    },
    home: {
      primary: ["rock", "folk", "soul", "pop", "blues", "country", "singer"],
      secondary: ["jazz", "reggae", "funk", "r&b"],
      yearBonus: null,
    },
  };

  const sMap = settingMap[setting];
  if (sMap) {
    const isPrimary = sMap.primary.some((k) => combined.includes(k));
    const isSecondary = sMap.secondary.some((k) => combined.includes(k));
    if (isPrimary) score += 4;
    else if (isSecondary) score += 2;
    if (sMap.yearBonus && year >= sMap.yearBonus.min && year <= sMap.yearBonus.max) {
      score += sMap.yearBonus.pts;
    }
  }

  // ---- Era matching ----
  if (era === "old") {
    if (year > 0 && year < 1970) score += 6;
    else if (year >= 1970) score -= 2;
  } else if (era === "classic") {
    if (year >= 1970 && year <= 1999) score += 6;
    else if (year < 1970 || year >= 2000) score -= 1;
  } else if (era === "modern") {
    if (year >= 2000) score += 6;
    else if (year > 0 && year < 2000) score -= 1;
  }
  // "any" = no bonus, no penalty

  return score;
}

let discoverAnswers = {};

function openDiscoverQuiz() {
  discoverAnswers = {};
  const overlay = document.getElementById("discoverQuizOverlay");
  if (overlay) {
    overlay.hidden = false;
    document.getElementById("discoverQuizTitle").textContent = "Discover My Collection";
  }
  renderDiscoverQuestion(0);
}

function closeDiscoverQuiz() {
  const overlay = document.getElementById("discoverQuizOverlay");
  if (overlay) overlay.hidden = true;
}

function renderDiscoverQuestion(index) {
  const body = document.getElementById("discoverQuizBody");
  body.innerHTML = "";

  if (index >= DISCOVER_QUESTIONS.length) {
    // Score everything, exclude hard dislikes
    const scored = allRecords
      .filter((r) => r.rating !== "dislike")
      .map((r) => ({ record: r, score: scoreRecordForAnswers(r, discoverAnswers) }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      body.innerHTML = '<p class="form-status">No records found. Add some to your collection first!</p>';
      return;
    }

    // Pick randomly from the top 3 scoring records so the same album
    // doesn't always win — but only among records within 3 points of the top score
    const topScore = scored[0].score;
    const topPool = scored.filter((s) => s.score >= topScore - 3).slice(0, 5);
    const pick = topPool[Math.floor(Math.random() * topPool.length)].record;

    renderDiscoverResult(body, pick, "Based on your mood, here's what we picked:");
    return;
  }

  const q = DISCOVER_QUESTIONS[index];

  const progress = document.createElement("p");
  progress.className = "discover-progress";
  progress.textContent = `Question ${index + 1} of ${DISCOVER_QUESTIONS.length}`;
  body.appendChild(progress);

  const questionEl = document.createElement("h3");
  questionEl.className = "discover-question";
  questionEl.textContent = q.question;
  body.appendChild(questionEl);

  const optionsGrid = document.createElement("div");
  optionsGrid.className = "discover-options";

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "discover-option-btn";
    btn.innerHTML = `<span class="discover-option-emoji">${opt.emoji}</span><span class="discover-option-label">${opt.label}</span>`;
    btn.addEventListener("click", () => {
      discoverAnswers[q.id] = opt.value;
      renderDiscoverQuestion(index + 1);
    });
    optionsGrid.appendChild(btn);
  });

  body.appendChild(optionsGrid);
}

function renderDiscoverResult(container, record, subtitle) {
  container.innerHTML = "";

  if (subtitle) {
    const sub = document.createElement("p");
    sub.className = "discover-result-subtitle";
    sub.textContent = subtitle;
    container.appendChild(sub);
  }

  const result = document.createElement("div");
  result.className = "discover-result";

  const cover = document.createElement("img");
  cover.className = "discover-result-cover";
  cover.src = record.cover_url || "icon-512.png";
  cover.alt = record.album || "";
  result.appendChild(cover);

  const meta = document.createElement("div");
  meta.className = "discover-result-meta";

  const albumEl = document.createElement("h3");
  albumEl.className = "discover-result-album";
  albumEl.textContent = record.album || "";
  meta.appendChild(albumEl);

  const artistEl = document.createElement("p");
  artistEl.className = "discover-result-artist";
  artistEl.textContent = record.artist || "";
  meta.appendChild(artistEl);

  if (record.year) {
    const yearEl = document.createElement("p");
    yearEl.className = "discover-result-year";
    yearEl.textContent = record.year;
    meta.appendChild(yearEl);
  }

  if (record.genre_name) {
    const genreEl = document.createElement("p");
    genreEl.className = "discover-result-genre";
    genreEl.textContent = [record.genre_name, record.subgenre_name].filter(Boolean).join(" · ");
    meta.appendChild(genreEl);
  }

  result.appendChild(meta);
  container.appendChild(result);

  // Status for playback feedback
  const statusEl = document.createElement("p");
  statusEl.className = "form-status";
  container.appendChild(statusEl);

  // Transport controls
  container.appendChild(buildMiniTransport());

  const actions = document.createElement("div");
  actions.className = "discover-result-actions";

  const playBtn = document.createElement("button");
  playBtn.type = "button";
  playBtn.className = "btn-primary";
  playBtn.innerHTML = '<i class="ti ti-brand-spotify" aria-hidden="true"></i> Play this album';
  playBtn.addEventListener("click", async () => {
    playBtn.disabled = true;
    playBtn.textContent = "Starting…";
    await playRoomRecord(record, statusEl);
    playBtn.disabled = false;
    playBtn.innerHTML = '<i class="ti ti-brand-spotify" aria-hidden="true"></i> Play this album';
  });
  actions.appendChild(playBtn);

  const againBtn = document.createElement("button");
  againBtn.type = "button";
  againBtn.className = "btn-secondary";
  againBtn.textContent = "Try again";
  againBtn.addEventListener("click", () => openDiscoverQuiz());
  actions.appendChild(againBtn);

  container.appendChild(actions);
}

// ---- Surprise Me ----

async function playSurpriseAlbum() {
  if (allRecords.length === 0) {
    showRoomPlayerStatus("Add some records to your collection first.");
    return;
  }

  const pool = allRecords.filter((r) => r.rating !== "dislike");
  const lovedPool = pool.filter((r) => r.rating === "love" || r.rating === "like");
  const candidates = lovedPool.length >= 3 ? lovedPool : pool.length > 0 ? pool : allRecords;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];

  if (!pick) return;

  // Open the overlay and render result directly — don't go through openDiscoverQuiz()
  // which would overwrite the body with question UI before we can show the result.
  document.getElementById("discoverQuizOverlay").hidden = false;
  document.getElementById("discoverQuizTitle").textContent = "Surprise Me";
  const body = document.getElementById("discoverQuizBody");
  renderDiscoverResult(body, pick, "Here's a random pick from your collection:");
}

// ---- Deep Listening ----

let deepListenRecordId = null;

function openDeepListen() {
  const overlay = document.getElementById("deepListenOverlay");
  overlay.hidden = false;
  document.getElementById("deepListenActive").hidden = true;
  document.getElementById("deepListenPicker").hidden = false;
  document.getElementById("deepListenSearch").value = "";
  renderDeepListenPicker();
}

function closeDeepListen() {
  document.getElementById("deepListenOverlay").hidden = true;
  if (deepListenProgressTimer) {
    clearInterval(deepListenProgressTimer);
    deepListenProgressTimer = null;
  }
}

function renderDeepListenPicker() {
  const search = (document.getElementById("deepListenSearch").value || "").toLowerCase();
  const list = document.getElementById("deepListenPickerList");
  list.innerHTML = "";

  const filtered = allRecords
    .filter((r) => {
      if (!search) return true;
      return (
        (r.artist || "").toLowerCase().includes(search) ||
        (r.album || "").toLowerCase().includes(search)
      );
    })
    .slice(0, 40);

  if (filtered.length === 0) {
    list.innerHTML = '<p class="field-hint" style="padding:8px">No records found.</p>';
    return;
  }

  filtered.forEach((record) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "deep-listen-picker-row";
    row.addEventListener("click", () => selectDeepListenRecord(record));

    if (record.cover_url) {
      const img = document.createElement("img");
      img.src = record.cover_url;
      img.alt = "";
      img.className = "deep-listen-picker-cover";
      row.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "deep-listen-picker-cover deep-listen-picker-cover-placeholder";
      placeholder.innerHTML = '<i class="ti ti-vinyl" aria-hidden="true"></i>';
      row.appendChild(placeholder);
    }

    const meta = document.createElement("div");
    const albumEl = document.createElement("p");
    albumEl.className = "deep-listen-picker-album";
    albumEl.textContent = record.album || "";
    const artistEl = document.createElement("p");
    artistEl.className = "deep-listen-picker-artist";
    artistEl.textContent = record.artist || "";
    meta.appendChild(albumEl);
    meta.appendChild(artistEl);
    row.appendChild(meta);

    list.appendChild(row);
  });
}

async function selectDeepListenRecord(record) {
  deepListenRecordId = record.id;

  document.getElementById("deepListenPicker").hidden = true;
  const active = document.getElementById("deepListenActive");
  active.hidden = false;

  document.getElementById("deepListenCover").src = record.cover_url || "icon-512.png";
  document.getElementById("deepListenAlbumName").textContent = record.album || "";
  document.getElementById("deepListenArtistName").textContent = record.artist || "";

  const story = [
    record.personal_story,
    record.acquired_date ? `Acquired: ${record.acquired_date}` : null,
    record.acquired_location ? `From: ${record.acquired_location}` : null,
  ].filter(Boolean).join("\n\n");

  const storyEl = document.getElementById("deepListenStory");
  if (story) {
    storyEl.textContent = story;
    storyEl.style.fontStyle = "normal";
    storyEl.style.opacity = "1";
  } else {
    storyEl.textContent = "No story written yet. Open the record details to add one.";
    storyEl.style.fontStyle = "italic";
    storyEl.style.opacity = "0.5";
  }

  const notesEl = document.getElementById("deepListenNotes");
  notesEl.value = record.listening_notes || "";
  document.getElementById("deepListenNotesStatus").textContent = "";

  // Start playback and show status/transport in the header area
  const statusEl = document.getElementById("deepListenPlayStatus");
  await playRoomRecord(record, statusEl);
}

async function saveDeepListenNotes() {
  const notes = document.getElementById("deepListenNotes").value.trim();
  const statusEl = document.getElementById("deepListenNotesStatus");

  if (!deepListenRecordId) return;

  statusEl.textContent = "Saving…";
  statusEl.className = "form-status";

  try {
    const { error } = await supabaseClient
      .from("records")
      .update({ listening_notes: notes })
      .eq("id", deepListenRecordId);

    if (error) throw error;

    const idx = allRecords.findIndex((r) => r.id === deepListenRecordId);
    if (idx !== -1) allRecords[idx].listening_notes = notes;

    statusEl.textContent = "Notes saved.";
    statusEl.className = "form-status form-status-success";
    setTimeout(() => { statusEl.textContent = ""; }, 2000);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Please try again.";
    statusEl.className = "form-status form-status-error";
  }
}

function setupSpotify() {
  document.getElementById("spotifyConnectBtn")?.addEventListener("click", () => startSpotifyConnect());
  document.getElementById("spotifyDisconnectBtn")?.addEventListener("click", () => disconnectSpotify());
  document.getElementById("spotifyPlayPauseBtn")?.addEventListener("click", () => spotifyTogglePlayback());
  document.getElementById("spotifyNextBtn")?.addEventListener("click", () => spotifyNextTrack());
  document.getElementById("spotifyPrevBtn")?.addEventListener("click", () => spotifyPreviousTrack());

  document.getElementById("headerSpotifyPlayPauseBtn")?.addEventListener("click", () => spotifyTogglePlayback());
  document.getElementById("headerSpotifyNextBtn")?.addEventListener("click", () => spotifyNextTrack());
  document.getElementById("headerSpotifyPrevBtn")?.addEventListener("click", () => spotifyPreviousTrack());

  // Clicking the room Now Playing sign opens that album's detail modal
  document.getElementById("roomNowPlaying")?.addEventListener("click", () => {
    if (!spotifyLatestState?.contextUri) return;
    const record = allRecords.find((r) => r.spotify_album_uri === spotifyLatestState.contextUri);
    if (record) openRecordDetailModal(record.id);
  });

  // Listening modes
  document.getElementById("discoverModeBtn")?.addEventListener("click", () => openDiscoverQuiz());
  document.getElementById("deepListenModeBtn")?.addEventListener("click", () => openDeepListen());
  document.getElementById("surpriseModeBtn")?.addEventListener("click", () => playSurpriseAlbum());

  // Discover quiz modal
  document.getElementById("closeDiscoverQuizBtn")?.addEventListener("click", () => closeDiscoverQuiz());
  document.getElementById("discoverQuizOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "discoverQuizOverlay") closeDiscoverQuiz();
  });

  // Deep Listening modal
  document.getElementById("closeDeepListenBtn")?.addEventListener("click", () => closeDeepListen());
  document.getElementById("deepListenOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "deepListenOverlay") closeDeepListen();
  });
  document.getElementById("deepListenSearch")?.addEventListener("input", () => renderDeepListenPicker());
  document.getElementById("deepListenChangeBtn")?.addEventListener("click", () => {
    document.getElementById("deepListenActive").hidden = true;
    document.getElementById("deepListenPicker").hidden = false;
    document.getElementById("deepListenSearch").value = "";
    renderDeepListenPicker();
  });
  document.getElementById("deepListenSaveNotes")?.addEventListener("click", () => saveDeepListenNotes());

  document.getElementById("closeSpotifyMatchBtn")?.addEventListener("click", () => closeSpotifyMatchPicker());
  document.getElementById("spotifyMatchOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "spotifyMatchOverlay") closeSpotifyMatchPicker();
  });

  window.addEventListener("message", (event) => {
    if (event.data?.type !== "spotify-auth-complete") return;
    const overlay = document.getElementById("roomPlayerOverlay");
    if (overlay && !overlay.hidden) {
      renderRoomPlayerModal();
    }
  });
}


function setupAuth() {
  document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);

  // Social OAuth buttons
  document.getElementById("authGoogleBtn").addEventListener("click", () =>
    handleSocialLogin("google")
  );
  document.getElementById("authAppleBtn").addEventListener("click", () =>
    handleSocialLogin("apple")
  );

  document.getElementById("authPasswordToggle").addEventListener("click", () => {
    const input = document.getElementById("authPassword");
    const btn = document.getElementById("authPasswordToggle");
    const isVisible = input.type === "text";

    input.type = isVisible ? "password" : "text";
    btn.setAttribute("aria-pressed", String(!isVisible));
    btn.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    btn.innerHTML = isVisible
      ? '<i class="ti ti-eye" aria-hidden="true"></i>'
      : '<i class="ti ti-eye-off" aria-hidden="true"></i>';
  });

  document.getElementById("authToggleBtn").addEventListener("click", () => {
    setAuthMode(authMode === "signup" ? "signin" : "signup");
  });

  function closeAccountMenu() {
    document.getElementById("accountMenu").hidden = true;
    document.getElementById("accountBtn").setAttribute("aria-expanded", "false");
  }

  function openAccountMenu() {
    document.getElementById("accountMenu").hidden = false;
    document.getElementById("accountBtn").setAttribute("aria-expanded", "true");
  }

  document.getElementById("accountBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = document.getElementById("accountMenu");
    if (menu.hidden) {
      openAccountMenu();
    } else {
      closeAccountMenu();
    }
  });

  document.getElementById("accountMenuProfileBtn").addEventListener("click", () => {
    closeAccountMenu();
    setPage("profile");
  });

  document.getElementById("accountMenuSettingsBtn").addEventListener("click", () => {
    closeAccountMenu();
    setPage("settings");
  });

  document.getElementById("accountMenuSignOutBtn").addEventListener("click", () => {
    closeAccountMenu();
    handleSignOut();
  });

  document.addEventListener("click", (e) => {
    const wrap = document.querySelector(".account-menu-wrap");
    if (wrap && !wrap.contains(e.target)) closeAccountMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAccountMenu();
  });

  document.getElementById("profileBackBtn").addEventListener("click", () => setPage("home"));

  document.getElementById("profileSignOutBtn").addEventListener("click", () => handleSignOut());

  document.getElementById("settingsBackBtn").addEventListener("click", () => setPage("home"));

  document.getElementById("changeEmailForm").addEventListener("submit", handleChangeEmail);
  document.getElementById("changePasswordForm").addEventListener("submit", handleChangePassword);

  function wirePasswordToggle(toggleId, inputId) {
    document.getElementById(toggleId).addEventListener("click", () => {
      const input = document.getElementById(inputId);
      const btn = document.getElementById(toggleId);
      const isVisible = input.type === "text";

      input.type = isVisible ? "password" : "text";
      btn.setAttribute("aria-pressed", String(!isVisible));
      btn.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      btn.innerHTML = isVisible
        ? '<i class="ti ti-eye" aria-hidden="true"></i>'
        : '<i class="ti ti-eye-off" aria-hidden="true"></i>';
    });
  }

  wirePasswordToggle("newPasswordToggle", "newPasswordInput");
  wirePasswordToggle("confirmPasswordToggle", "confirmPasswordInput");

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      onSignedIn(session.user);
    } else {
      onSignedOut();
    }
  });
}

// ------------ Onboarding ------------

function maybeShowOnboarding() {
  const screen = document.getElementById("onboardingScreen");
  if (!screen) return;

  // Check profile flag first (persists across devices/browsers)
  if (currentProfile?.onboarding_done) {
    screen.hidden = true;
    return;
  }

  // Fall back to localStorage
  if (localStorage.getItem("spin-onboarding-done") === "true") {
    screen.hidden = true;
    saveProfileFields({ onboarding_done: true }).catch(() => {});
    return;
  }

  // If they already have data, they've been here before
  if (allRecords.length > 0 || wishlist.length > 0) {
    localStorage.setItem("spin-onboarding-done", "true");
    saveProfileFields({ onboarding_done: true }).catch(() => {});
    screen.hidden = true;
    return;
  }

  // Truly new user — show onboarding
  showOnboardingStep(1);
  screen.hidden = false;
}

function showOnboardingStep(step) {
  const s1 = document.getElementById("onboardingStep1");
  const s2 = document.getElementById("onboardingStep2");
  const s3 = document.getElementById("onboardingStep3");
  const s4 = document.getElementById("onboardingStep4");
  if (s1) s1.hidden = step !== 1;
  if (s2) s2.hidden = step !== 2;
  if (s3) s3.hidden = step !== 3;
  if (s4) s4.hidden = step !== 4;
}

function dismissOnboarding() {
  localStorage.setItem("spin-onboarding-done", "true");
  saveProfileFields({ onboarding_done: true }).catch(() => {});
  const screen = document.getElementById("onboardingScreen");
  if (screen) screen.hidden = true;
}

let onboardingDestination = null;

function goToOnboardingDestination() {
  // If the user chose a meaningful destination (import or add manually),
  // show a brief "Getting Started" step 4 that confirms what's about to
  // happen and builds excitement before dropping them into the app.
  // "Explore first" goes straight through — no friction for that path.
  if (onboardingDestination === "import" || onboardingDestination === "add") {
    renderOnboardingStep4();
    showOnboardingStep(4);
  } else {
    launchIntoApp();
  }
}

function launchIntoApp() {
  dismissOnboarding();

  if (onboardingDestination === "import") {
    setPage("collection");
    openImportModal();
  } else if (onboardingDestination === "add") {
    setPage("collection");
    openAddRecordModal();
  } else {
    setPage("home");
  }

  onboardingDestination = null;
}

function renderOnboardingStep4() {
  const iconEl = document.getElementById("onboardStep4Icon");
  const titleEl = document.getElementById("onboardStep4Title");
  const descEl = document.getElementById("onboardStep4Desc");
  const tipsEl = document.getElementById("onboardStep4Tips");
  const btn = document.getElementById("onboardStep4Btn");

  if (onboardingDestination === "import") {
    iconEl.innerHTML = '<i class="ti ti-brand-discogs" aria-hidden="true"></i>';
    titleEl.textContent = "Let's bring in your collection";
    descEl.textContent = "In a moment you'll upload your Discogs export. Here's what happens next:";
    tipsEl.innerHTML = `
      <li>Your records import instantly — artist, title, year, label, and condition</li>
      <li>Your Collection DNA and Taste Profile populate automatically</li>
      <li>You can rate albums, add cover art, and write your story for each one</li>
      <li>The more you add, the better your recommendations get</li>
    `;
    btn.textContent = "Import my collection →";
  } else {
    iconEl.innerHTML = '<i class="ti ti-disc" aria-hidden="true"></i>';
    titleEl.textContent = "Let's add your first record";
    descEl.textContent = "Start with a record you love — we'll build from there. Here's what you can do:";
    tipsEl.innerHTML = `
      <li>Scan a barcode or search by artist and album</li>
      <li>Rate it, add cover art, and write your story</li>
      <li>Add a few more and your Taste Profile starts to take shape</li>
      <li>You can always import from Discogs later if you have a bigger collection</li>
    `;
    btn.textContent = "Add my first record →";
  }

  btn.onclick = () => launchIntoApp();
}

async function handleOnboardingBasicsSubmit(event) {
  event.preventDefault();

  const statusEl = document.getElementById("onboardingStep2Status");
  const submitBtn = event.target.querySelector("button[type=submit]");

  const firstName = document.getElementById("onboardFirstName").value.trim();
  const lastName = document.getElementById("onboardLastName").value.trim();
  const username = document.getElementById("onboardUsername").value.trim();

  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    await saveProfileFields({
      first_name: firstName,
      last_name: lastName,
      username,
    });

    refreshAccountButton();
    statusEl.textContent = "";
    showOnboardingStep(3);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      statusEl.textContent = "That username is already taken - please choose another.";
    } else {
      statusEl.textContent = "Couldn't save. Check console for details.";
    }
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleOnboardingMoreSubmit(event) {
  event.preventDefault();

  const statusEl = document.getElementById("onboardingStep3Status");
  const submitBtn = event.target.querySelector("button[type=submit]");

  submitBtn.disabled = true;
  statusEl.textContent = "Saving...";
  statusEl.className = "form-status";

  try {
    await saveProfileFields({
      preferred_name: document.getElementById("onboardPreferredName").value.trim() || null,
      city: document.getElementById("onboardCity").value.trim() || null,
      state: document.getElementById("onboardState").value.trim() || null,
      country: document.getElementById("onboardCountry").value.trim() || null,
      birthdate: document.getElementById("onboardBirthdate").value || null,
      favorite_genres: getTagInputValues(document.getElementById("onboardGenresTagInput")),
      favorite_subgenres: getTagInputValues(document.getElementById("onboardSubgenresTagInput")),
      favorite_artists: getTagInputValues(document.getElementById("onboardArtistsTagInput")),
      favorite_albums: getTagInputValues(document.getElementById("onboardAlbumsTagInput")),
      turntable: getTagInputValues(document.getElementById("onboardTurntableTagInput")),
      cartridge: getTagInputValues(document.getElementById("onboardCartridgeTagInput")),
      receiver: document.getElementById("onboardReceiver").value.trim() || null,
      speakers: getTagInputValues(document.getElementById("onboardSpeakersTagInput")),
      subwoofer: document.getElementById("onboardSubwoofer").value.trim() || null,
      onboarding_completed: true,
    });

    refreshAccountButton();
    goToOnboardingDestination();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't save. Check console for details.";
    statusEl.className = "form-status form-status-error";
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleOnboardingSkip() {
  try {
    await saveProfileFields({ onboarding_completed: true });
    refreshAccountButton();
  } catch (err) {
    console.error(err);
  }
  goToOnboardingDestination();
}

function setupOnboarding() {
  document.getElementById("onboardImportBtn").addEventListener("click", () => {
    onboardingDestination = "import";
    showOnboardingStep(2);
  });

  document.getElementById("onboardAddBtn").addEventListener("click", () => {
    onboardingDestination = "add";
    showOnboardingStep(2);
  });

  document.getElementById("onboardExploreBtn").addEventListener("click", () => {
    onboardingDestination = "explore";
    showOnboardingStep(2);
  });

  document.getElementById("onboardingBasicsForm").addEventListener("submit", handleOnboardingBasicsSubmit);
  document.getElementById("onboardingMoreForm").addEventListener("submit", handleOnboardingMoreSubmit);
  document.getElementById("onboardingSkipBtn").addEventListener("click", () => handleOnboardingSkip());
}



function setupSplashScreen() {
  const splash = document.getElementById("splashScreen");
  if (!splash) return;

  let dismissed = false;

  const dismiss = (skip) => {
    if (dismissed) return;
    dismissed = true;
    if (skip) {
      splash.classList.add("splash-skip");
    }
  };

  splash.addEventListener("click", () => dismiss(true));
  splash.addEventListener("animationend", (e) => {
    if (e.target === splash) {
      splash.hidden = true;
    }
  });

  // Safety net in case the animationend event doesn't fire for some reason
  setTimeout(() => {
    splash.hidden = true;
  }, 4000);
}

// ============================================================
// Feedback
// ============================================================

function setupFeedback() {
  const btn = document.getElementById("feedbackBtn");
  const overlay = document.getElementById("feedbackOverlay");
  const form = document.getElementById("feedbackForm");
  const closeBtn = document.getElementById("feedbackCloseBtn");
  const cancelBtn = document.getElementById("feedbackCancelBtn");
  const textarea = document.getElementById("feedbackMessage");
  const charCount = document.getElementById("feedbackCharCount");
  const statusEl = document.getElementById("feedbackStatus");
  const successState = document.getElementById("feedbackSuccessState");
  const submitBtn = document.getElementById("feedbackSubmitBtn");

  function openFeedback() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    form.hidden = false;
    successState.hidden = true;
    form.reset();
    charCount.textContent = "0";
    statusEl.textContent = "";
    textarea.focus();
  }

  function closeFeedback() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  btn?.addEventListener("click", openFeedback);
  closeBtn?.addEventListener("click", closeFeedback);
  cancelBtn?.addEventListener("click", closeFeedback);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeFeedback();
  });

  textarea?.addEventListener("input", () => {
    charCount.textContent = textarea.value.length;
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = form.querySelector("input[name=feedbackType]:checked")?.value || "general";
    const message = textarea.value.trim();
    if (!message) return;

    submitBtn.disabled = true;
    statusEl.textContent = "Sending…";
    statusEl.className = "form-status";

    try {
      // Get the live session JWT — the anon key won't pass auth.getUser() in the Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error("Not authenticated");

      const res = await fetch(FEEDBACK_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          type,
          message,
          username: currentProfile?.username || null,
          url: window.location.href,
          user_agent: navigator.userAgent,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.hidden = true;
      successState.hidden = false;
      setTimeout(() => closeFeedback(), 2500);
    } catch (err) {
      console.error("[Feedback]", err);
      statusEl.textContent = "Couldn't send — please try again.";
      statusEl.className = "form-status form-status-error";
      submitBtn.disabled = false;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay?.hidden) closeFeedback();
  });
}

// 7. Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Check for shared wishlist URL first — if detected, show the public
  // read-only view and skip the entire authenticated app flow.
  const isSharedView = await maybeShowSharedWishlist();
  if (isSharedView) return;

  setupSplashScreen();
  setupEvents();
  setupOnboarding();
  setupProfile();
  setupRoom();
  setupAllTagInputs();
  setupAllFreeListInputs();
  setupLandingPage();
  setupAuth();
  setupSpotify();
  setupFeedback();
  startHeaderNowPlayingPolling();
});
