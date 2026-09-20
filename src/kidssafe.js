import L from "https://code4sabae.github.io/leaflet-mjs/leaflet.mjs";
import { Geo3x3 } from "https://geo3x3.com/Geo3x3.js";
import { CSV } from "https://js.sabae.cc/CSV.js";
import { QRCode } from "https://code4fukui.github.io/qr-code/qr-code.js";
import { fetchImage } from "https://js.sabae.cc/fetchImage.js";

const ICON_SIZE = 42;
const LAYER_CONFIG_URL = "./data/layers.csv";
const ICON_BASE_URL = "./assets/icons/";
const HIDDEN_FIELDS = new Set(["Geo3x3", "geo3x3", "lat", "lng", "icon", "emoji"]);

const makeElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const getPosition = (data) => {
  const geo3x3 = Geo3x3.decode(data.Geo3x3 || data.geo3x3);
  if (geo3x3) return [geo3x3.lat, geo3x3.lng];
  const lat = Number.parseFloat(data.lat);
  const lng = Number.parseFloat(data.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

const sizeCache = {};
const getImageSize = async (url) => {
  if (sizeCache[url]) return sizeCache[url];
  const image = await fetchImage(url);
  const ratio = Math.min(ICON_SIZE / image.width, ICON_SIZE / image.height);
  const size = {
    width: Math.max(24, image.width * ratio),
    height: Math.max(24, image.height * ratio),
  };
  sizeCache[url] = size;
  return size;
};

const makePopup = (data) => {
  const card = makeElement("section", "place-card");
  const entries = Object.entries(data).filter(
    ([key, value]) => !HIDDEN_FIELDS.has(key) && value !== undefined && value !== "",
  );
  const titleEntry = entries.shift();
  if (titleEntry) card.appendChild(makeElement("h2", "place-card__title", titleEntry[1]));

  for (const [label, value] of entries) {
    const row = makeElement("div", "place-card__row");
    row.appendChild(makeElement("span", "place-card__label", label));
    const content = makeElement("span", "place-card__value");
    if (/^https?:\/\//.test(value)) {
      const link = makeElement("a", "place-card__link", "詳細を見る");
      link.href = value;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      content.appendChild(link);
    } else {
      content.textContent = value;
    }
    row.appendChild(content);
    card.appendChild(row);
  }
  return card;
};

const makeEmojiIcon = (emoji, label) =>
  L.divIcon({
    className: "map-emoji-marker",
    html: `<span role="img" aria-label="${label}">${emoji}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 42],
    popupAnchor: [0, -38],
  });

const makeImageIcon = async (filename) => {
  const url = ICON_BASE_URL + filename;
  const size = await getImageSize(url);
  return L.icon({
    iconUrl: url,
    iconRetinaUrl: url,
    iconSize: [size.width, size.height],
    iconAnchor: [size.width / 2, size.height],
    popupAnchor: [0, -size.height],
  });
};

const addLink = (parent, text, url) => {
  const link = makeElement("a", "menu-link", text);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  parent.appendChild(link);
};

export const showKidsSafe = (city, area, githubLink) => {
  const leafletStyle = document.createElement("link");
  leafletStyle.rel = "stylesheet";
  leafletStyle.href = "https://code4sabae.github.io/leaflet-mjs/leaflet.css";
  document.head.appendChild(leafletStyle);
  leafletStyle.onload = () => init(city, area, githubLink);
};

const init = async (city, area, githubLink) => {
  document.title = `${city} ${area} こども安全マップ`;
  document.body.replaceChildren();

  const app = makeElement("main", "app");
  document.body.appendChild(app);

  const header = makeElement("header", "app-header");
  const menuButton = makeElement("button", "icon-button menu-button");
  menuButton.type = "button";
  menuButton.setAttribute("aria-label", "メニューを開く");
  menuButton.innerHTML = '<span aria-hidden="true">☰</span>';
  const heading = makeElement("div", "app-heading");
  heading.appendChild(makeElement("strong", "app-title", "こども安全マップ"));
  heading.appendChild(makeElement("span", "app-subtitle", `${city} ${area}`));
  header.append(menuButton, heading);
  app.appendChild(header);

  const mapElement = makeElement("div", "map");
  mapElement.id = "map";
  app.appendChild(mapElement);
  const status = makeElement("div", "map-status", "安全情報を読み込んでいます…");
  status.setAttribute("role", "status");
  app.appendChild(status);
  const filters = makeElement("nav", "layer-filters");
  filters.setAttribute("aria-label", "地図に表示する情報");
  app.appendChild(filters);
  const locationButton = makeElement("button", "location-button", "⌖ 現在地");
  locationButton.type = "button";
  app.appendChild(locationButton);

  const backdrop = makeElement("div", "drawer-backdrop");
  const drawer = makeElement("aside", "drawer");
  drawer.setAttribute("aria-hidden", "true");
  const drawerHeader = makeElement("div", "drawer-header");
  const drawerHeading = makeElement("div");
  drawerHeading.appendChild(makeElement("strong", "drawer-title", "地図の見かた"));
  drawerHeading.appendChild(makeElement("p", "drawer-caption", "見たい情報を選んで、場所をタップしてください。"));
  const closeButton = makeElement("button", "icon-button close-button", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "メニューを閉じる");
  drawerHeader.append(drawerHeading, closeButton);
  drawer.appendChild(drawerHeader);

  const drawerContent = makeElement("div", "drawer-content");
  const guide = makeElement("section", "guide-card");
  guide.appendChild(makeElement("h2", "guide-title", "子ども注意ポイント"));
  guide.appendChild(makeElement("p", "guide-text", "車が多い道、見通しの悪い交差点、暗い道、水路や崖、人通りの少ない場所などを地域で共有します。"));
  const guideList = makeElement("ul", "guide-list");
  ["🚗 車・自転車が多い", "👀 見通しが悪い", "🌙 暗い・人通りが少ない", "🌊 水路・川・崖が近い", "🏃 飛び出しに注意"].forEach(
    (item) => guideList.appendChild(makeElement("li", "", item)),
  );
  guide.appendChild(guideList);
  drawerContent.appendChild(guide);

  const links = makeElement("section", "drawer-section");
  links.appendChild(makeElement("h2", "drawer-section-title", "データと共有"));
  addLink(links, "GitHubでデータを見る・編集する ↗", githubLink);
  const qr = new QRCode();
  qr.className = "share-qr";
  links.appendChild(qr);
  drawerContent.appendChild(links);
  drawer.appendChild(drawerContent);
  app.append(backdrop, drawer);

  const openDrawer = () => {
    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    closeButton.focus();
  };
  const closeDrawer = () => {
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    menuButton.focus();
  };
  menuButton.addEventListener("click", openDrawer);
  closeButton.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  const map = L.map(mapElement, { zoomControl: false });
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    maxZoom: 21,
    maxNativeZoom: 18,
  }).addTo(map);

  const positions = [];
  const config = CSV.toJSON(await CSV.fetch(LAYER_CONFIG_URL));
  for (const layerConfig of config) {
    const records = CSV.toJSON(await CSV.fetch(layerConfig.fn));
    const layer = L.layerGroup().addTo(map);
    let markerCount = 0;

    for (const record of records) {
      const position = getPosition(record);
      if (!position) continue;
      let icon;
      const emoji = record.emoji || layerConfig.emoji;
      if (emoji) {
        icon = makeEmojiIcon(emoji, layerConfig.name);
      } else if (record.icon || layerConfig.icon) {
        try {
          icon = await makeImageIcon(record.icon || layerConfig.icon);
        } catch (error) {
          console.warn("アイコンを読み込めませんでした", error);
        }
      }
      const marker = L.marker(position, icon ? { icon } : {});
      marker.bindPopup(makePopup(record), { maxWidth: 320 });
      marker.addTo(layer);
      positions.push(position);
      markerCount += 1;
    }

    const filterButton = makeElement("button", "filter-chip is-active");
    filterButton.type = "button";
    filterButton.setAttribute("aria-pressed", "true");
    filterButton.innerHTML = `<span aria-hidden="true">${layerConfig.emoji || "●"}</span><span>${layerConfig.name}</span><small>${markerCount}</small>`;
    filterButton.addEventListener("click", () => {
      const isActive = filterButton.getAttribute("aria-pressed") === "true";
      filterButton.setAttribute("aria-pressed", String(!isActive));
      filterButton.classList.toggle("is-active", !isActive);
      if (isActive) map.removeLayer(layer);
      else map.addLayer(layer);
    });
    filters.appendChild(filterButton);
  }

  if (positions.length) map.fitBounds(positions, { padding: [56, 56], maxZoom: 16 });
  else map.setView([33.987, 134.366], 13);
  status.textContent = `${config.length}種類の安全情報を表示しています`;
  window.setTimeout(() => status.classList.add("is-hidden"), 2400);

  let currentPositionMarker;
  locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      status.textContent = "この端末では現在地を利用できません";
      status.classList.remove("is-hidden");
      return;
    }
    locationButton.disabled = true;
    locationButton.textContent = "確認中…";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPosition = [position.coords.latitude, position.coords.longitude];
        if (currentPositionMarker) currentPositionMarker.removeFrom(map);
        currentPositionMarker = L.circleMarker(currentPosition, {
          radius: 9,
          color: "#ffffff",
          weight: 4,
          fillColor: "#2563eb",
          fillOpacity: 1,
        }).addTo(map).bindPopup("現在地");
        map.setView(currentPosition, 16);
        locationButton.disabled = false;
        locationButton.textContent = "⌖ 現在地";
      },
      () => {
        status.textContent = "現在地を取得できませんでした。位置情報設定を確認してください。";
        status.classList.remove("is-hidden");
        locationButton.disabled = false;
        locationButton.textContent = "⌖ 現在地";
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
};
