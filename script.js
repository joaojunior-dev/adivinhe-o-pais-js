// script.js
let selectedCountry = null;
let score = 0;
let highScore = 0;
let hideModalTimeoutId = null;
let hideFindFeedbackModalTimeoutId = null;
let countryData = {};

let map = null;
let countryLayer = null;
let currentMapTileLayer = null;
// let currentMapTheme = "light"; // Removido - tema fixo
let currentGameMode = null;
let availableCountriesForFindMode = [];
let targetCountry = null;

const startScreen = document.getElementById("start-screen");
const guessNameButton = document.getElementById("start-guess-name-button");
const findCountryButton = document.getElementById("start-find-country-button");
const gameContainer = document.getElementById("game-container");

let input, button, messageEl, modalMessageEl, scoreEl, highScoreDisplayEl;
let overlayEl, gameControlsEl, modalTitleEl, restartButton, loadingIndicator;
// themeToggleButton; // Removido
let findCountryPromptEl, findCountryNameEl, findCountryFlagEl, backToMenuButton;

let findCountryFeedbackModalEl,
  findFeedbackTitleEl,
  findFeedbackMessageEl,
  findFeedbackCorrectInfoEl,
  findFeedbackCorrectNameEl,
  findFeedbackCorrectFlagEl,
  findNextCountryButtonEl,
  findTryAgainButtonEl,
  findGiveUpButtonEl;

const successSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
);
const errorSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
);

// Simplificado para usar apenas o tema claro por padrão
const tileLayerData = {
  // Renomeado de tileLayersData e simplificado
  url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  attribution: "© OpenStreetMap contributors & CartoDB",
};

function assignGameElementReferences() {
  input = document.getElementById("guess-input");
  button = document.getElementById("guess-button");
  messageEl = document.getElementById("message");
  modalMessageEl = document.getElementById("modal-message");
  scoreEl = document.getElementById("score");
  highScoreDisplayEl = document.getElementById("high-score-display");
  overlayEl = document.getElementById("overlay");
  gameControlsEl = document.getElementById("game-controls");
  modalTitleEl = document.getElementById("modal-title");
  restartButton = document.getElementById("restart-button");
  loadingIndicator = document.getElementById("loading-indicator");
  // themeToggleButton = document.getElementById("theme-toggle-button"); // Removido

  findCountryPromptEl = document.getElementById("find-country-prompt");
  findCountryNameEl = document.getElementById("find-country-name");
  findCountryFlagEl = document.getElementById("find-country-flag");
  backToMenuButton = document.getElementById("back-to-menu-button");

  findCountryFeedbackModalEl = document.getElementById(
    "find-country-feedback-modal"
  );
  findFeedbackTitleEl = document.getElementById("find-feedback-title");
  findFeedbackMessageEl = document.getElementById("find-feedback-message");
  findFeedbackCorrectInfoEl = document.getElementById(
    "find-feedback-correct-info"
  );
  findFeedbackCorrectNameEl = document.getElementById(
    "find-feedback-correct-name"
  );
  findFeedbackCorrectFlagEl = document.getElementById(
    "find-feedback-correct-flag"
  );

  findNextCountryButtonEl = document.getElementById("find-next-country-button");
  findTryAgainButtonEl = document.getElementById("find-try-again-button");
  findGiveUpButtonEl = document.getElementById("find-give-up-button");

  if (input) {
    input.addEventListener("keydown", function (event) {
      if (
        event.key === "Enter" &&
        gameControlsEl &&
        gameControlsEl.classList.contains("visible")
      ) {
        event.preventDefault();
        if (button && !button.disabled) button.click();
      }
    });
  }
  if (button) button.addEventListener("click", handleGuessName);
  if (overlayEl) overlayEl.addEventListener("click", handleOverlayClick);
  if (restartButton)
    restartButton.addEventListener("click", () => resetCurrentGameMode());
  // Listener para themeToggleButton removido
  if (backToMenuButton)
    backToMenuButton.addEventListener("click", goBackToMenu);

  if (findNextCountryButtonEl) {
    findNextCountryButtonEl.addEventListener("click", () => {
      hideFindCountryFeedbackModal();
      if (
        selectedCountry &&
        selectedCountry.layer &&
        (!targetCountry ||
          selectedCountry.properties.name !== targetCountry.englishName)
      ) {
        selectedCountry.layer.setStyle(
          getCountryDefaultStyle(selectedCountry.feature)
        );
      }
      selectedCountry = null;
      startFindCountryRound();
    });
  }

  if (findTryAgainButtonEl) {
    findTryAgainButtonEl.addEventListener("click", () => {
      hideFindCountryFeedbackModal();
      if (selectedCountry && selectedCountry.layer) {
        selectedCountry.layer.setStyle(
          getCountryDefaultStyle(selectedCountry.feature)
        );
      }
      if (messageEl && targetCountry) {
        messageEl.textContent = `Tente novamente localizar:`;
        messageEl.style.color = "#333";
      }
    });
  }

  if (findGiveUpButtonEl) {
    findGiveUpButtonEl.addEventListener("click", () => {
      if (
        findFeedbackCorrectInfoEl &&
        selectedCountry &&
        selectedCountry.properties
      ) {
        const clickedCountryEnglishName = selectedCountry.properties.name;
        const clickedCountryInfoFromData =
          countryData[clickedCountryEnglishName];
        let countryNameToDisplay = clickedCountryEnglishName;
        let flagUrlToDisplay = "";
        let flagAltText = `Bandeira de ${countryNameToDisplay}`;

        if (clickedCountryInfoFromData && clickedCountryInfoFromData.pt) {
          countryNameToDisplay = clickedCountryInfoFromData.pt;
          flagAltText = `Bandeira de ${countryNameToDisplay}`;
          if (clickedCountryInfoFromData.code) {
            flagUrlToDisplay = `https://flagcdn.com/w80/${clickedCountryInfoFromData.code.toLowerCase()}.png`;
          }
        }
        findFeedbackCorrectNameEl.textContent = countryNameToDisplay;
        findFeedbackCorrectFlagEl.src = flagUrlToDisplay;
        findFeedbackCorrectFlagEl.alt = flagUrlToDisplay ? flagAltText : "";
        findFeedbackCorrectInfoEl.style.display = "block";
        if (findFeedbackTitleEl)
          findFeedbackTitleEl.textContent = "Você Clicou em:";
        if (findFeedbackMessageEl)
          findFeedbackMessageEl.textContent = `Este é ${countryNameToDisplay}. O país alvo era outro.`;
      } else if (findFeedbackCorrectInfoEl) {
        findFeedbackCorrectNameEl.textContent = "Nenhum país específico";
        findFeedbackCorrectFlagEl.src = "";
        findFeedbackCorrectFlagEl.alt = "";
        findFeedbackCorrectInfoEl.style.display = "block";
        if (findFeedbackTitleEl) findFeedbackTitleEl.textContent = "Informação";
        if (findFeedbackMessageEl)
          findFeedbackMessageEl.textContent =
            "Não foi possível identificar o país clicado.";
      }
      if (findTryAgainButtonEl) findTryAgainButtonEl.style.display = "none";
      if (findGiveUpButtonEl) findGiveUpButtonEl.style.display = "none";
      if (findNextCountryButtonEl) {
        findNextCountryButtonEl.style.display = "inline-block";
        findNextCountryButtonEl.focus();
      }
    });
  }
  loadHighScore();
}

// function setMapTheme(themeName) { ... } // Função REMOVIDA

function getCountryDefaultStyle(feature) {
  return { weight: 0.5, color: "#555", fillOpacity: 0.1 };
}

function loadHighScore() {
  const storedHighScore = localStorage.getItem("geoGuessHighScore");
  highScore = storedHighScore ? parseInt(storedHighScore, 10) : 0;
  if (highScoreDisplayEl)
    highScoreDisplayEl.textContent = `Recorde: ${highScore}`;
}

function saveHighScore() {
  localStorage.setItem("geoGuessHighScore", highScore.toString());
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    saveHighScore();
    if (highScoreDisplayEl)
      highScoreDisplayEl.textContent = `Recorde: ${highScore}`;
  }
}

function normalize(str) {
  if (typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function showGuessNameModal() {
  if (hideModalTimeoutId) clearTimeout(hideModalTimeoutId);
  hideModalTimeoutId = null;
  if (button) button.disabled = false;
  if (overlayEl) {
    overlayEl.style.display = "block";
    requestAnimationFrame(() => overlayEl.classList.add("visible"));
  }
  if (gameControlsEl) {
    gameControlsEl.style.display = "flex";
    gameControlsEl.classList.add("modal-base");
    requestAnimationFrame(() => gameControlsEl.classList.add("visible"));
  }
  if (input) {
    input.value = "";
    input.focus();
  }
  if (modalMessageEl) modalMessageEl.textContent = "";
  if (modalTitleEl && selectedCountry)
    modalTitleEl.textContent = "Qual o nome deste país?";
}

function hideGuessNameModal() {
  if (gameControlsEl) gameControlsEl.classList.remove("visible");
  if (
    overlayEl &&
    !(
      findCountryFeedbackModalEl &&
      findCountryFeedbackModalEl.classList.contains("visible")
    )
  ) {
    overlayEl.classList.remove("visible");
  }
  if (hideModalTimeoutId) clearTimeout(hideModalTimeoutId);
  hideModalTimeoutId = setTimeout(() => {
    if (
      overlayEl &&
      !(
        findCountryFeedbackModalEl &&
        findCountryFeedbackModalEl.classList.contains("visible")
      )
    )
      overlayEl.style.display = "none";
    if (gameControlsEl) gameControlsEl.style.display = "none";
    if (button) button.disabled = false;
    hideModalTimeoutId = null;
  }, 300);
  if (input) input.value = "";
}

function showFindCountryFeedbackModal(isCorrect, feedbackUserMessage) {
  if (hideFindFeedbackModalTimeoutId)
    clearTimeout(hideFindFeedbackModalTimeoutId);
  hideFindFeedbackModalTimeoutId = null;
  if (findFeedbackTitleEl)
    findFeedbackTitleEl.textContent = isCorrect ? "Correto!" : "Errado!";
  if (findFeedbackMessageEl) {
    findFeedbackMessageEl.textContent = feedbackUserMessage;
    findFeedbackMessageEl.style.color = isCorrect ? "#2ecc71" : "#e74c3c";
  }
  if (findFeedbackCorrectInfoEl)
    findFeedbackCorrectInfoEl.style.display = "none";
  if (isCorrect) {
    if (findTryAgainButtonEl) findTryAgainButtonEl.style.display = "none";
    if (findGiveUpButtonEl) findGiveUpButtonEl.style.display = "none";
    if (findNextCountryButtonEl) {
      findNextCountryButtonEl.style.display = "inline-block";
      findNextCountryButtonEl.focus();
    }
  } else {
    if (findTryAgainButtonEl) {
      findTryAgainButtonEl.style.display = "inline-block";
      findTryAgainButtonEl.focus();
    }
    if (findGiveUpButtonEl) findGiveUpButtonEl.style.display = "inline-block";
    if (findNextCountryButtonEl) findNextCountryButtonEl.style.display = "none";
  }
  if (overlayEl) {
    overlayEl.style.display = "block";
    requestAnimationFrame(() => overlayEl.classList.add("visible"));
  }
  if (findCountryFeedbackModalEl) {
    findCountryFeedbackModalEl.style.display = "flex";
    findCountryFeedbackModalEl.classList.add("modal-base");
    requestAnimationFrame(() =>
      findCountryFeedbackModalEl.classList.add("visible")
    );
  }
}

function hideFindCountryFeedbackModal() {
  if (findCountryFeedbackModalEl)
    findCountryFeedbackModalEl.classList.remove("visible");
  if (
    overlayEl &&
    !(gameControlsEl && gameControlsEl.classList.contains("visible"))
  ) {
    overlayEl.classList.remove("visible");
  }
  if (hideFindFeedbackModalTimeoutId)
    clearTimeout(hideFindFeedbackModalTimeoutId);
  hideFindFeedbackModalTimeoutId = setTimeout(() => {
    if (
      overlayEl &&
      !(gameControlsEl && gameControlsEl.classList.contains("visible"))
    )
      overlayEl.style.display = "none";
    if (findCountryFeedbackModalEl)
      findCountryFeedbackModalEl.style.display = "none";
    hideFindFeedbackModalTimeoutId = null;
  }, 300);
}

function resetCurrentGameMode() {
  score = 0;
  if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
  if (messageEl) messageEl.textContent = "Jogo reiniciado!";
  if (selectedCountry && selectedCountry.layer && countryLayer) {
    selectedCountry.layer.setStyle(
      getCountryDefaultStyle(selectedCountry.feature)
    );
  } else if (countryLayer) {
    countryLayer.setStyle(getCountryDefaultStyle);
  }
  selectedCountry = null;
  targetCountry = null;
  if (currentGameMode === "guessName") {
    if (input) input.value = "";
    if (gameControlsEl && gameControlsEl.classList.contains("visible"))
      hideGuessNameModal();
    else if (button) button.disabled = false;
    if (modalMessageEl) modalMessageEl.textContent = "";
    if (messageEl)
      messageEl.textContent = "Clique em um país para adivinhar o nome.";
  } else if (currentGameMode === "findCountry") {
    if (findCountryPromptEl) findCountryPromptEl.style.display = "none";
    if (
      findCountryFeedbackModalEl &&
      findCountryFeedbackModalEl.classList.contains("visible")
    )
      hideFindCountryFeedbackModal();
    startFindCountryRound();
  }
  loadHighScore();
}

function goBackToMenu() {
  if (gameContainer) gameContainer.style.display = "none";
  if (startScreen) startScreen.style.display = "flex";
  if (selectedCountry && selectedCountry.layer && countryLayer) {
    selectedCountry.layer.setStyle(
      getCountryDefaultStyle(selectedCountry.feature)
    );
  } else if (countryLayer) {
    countryLayer.setStyle(getCountryDefaultStyle);
  }
  selectedCountry = null;
  targetCountry = null;
  currentGameMode = null;
  if (gameControlsEl && gameControlsEl.classList.contains("visible"))
    hideGuessNameModal();
  else if (button) button.disabled = false;
  if (findCountryPromptEl) findCountryPromptEl.style.display = "none";
  if (
    findCountryFeedbackModalEl &&
    findCountryFeedbackModalEl.classList.contains("visible")
  ) {
    hideFindCountryFeedbackModal();
  }
  if (messageEl) messageEl.textContent = "";
}

async function loadCountryData() {
  try {
    const response = await fetch("country_data.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    countryData = await response.json();
    availableCountriesForFindMode = Object.keys(countryData).filter(
      (key) => countryData[key] && countryData[key].code && countryData[key].pt
    );
    console.log("Dados dos países carregados.");
  } catch (e) {
    console.error("Falha ao carregar country_data.json:", e);
    throw e;
  }
}

async function loadMapGeoJSON() {
  if (!map) {
    console.error("Mapa não inicializado.");
    return;
  }
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson"
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    countryLayer = L.geoJSON(data, {
      style: getCountryDefaultStyle,
      onEachFeature: (feature, layer) => {
        layer.on("click", () => handleMapClick(feature, layer));
      },
    }).addTo(map);
    console.log("Camada GeoJSON do mapa carregada.");
  } catch (e) {
    console.error("Falha ao carregar GeoJSON dos países:", e);
    throw e;
  }
}

function handleMapClick(feature, layer) {
  if (currentGameMode === "guessName") {
    if (selectedCountry && selectedCountry.layer && countryLayer) {
      try {
        selectedCountry.layer.setStyle(
          getCountryDefaultStyle(selectedCountry.feature)
        );
      } catch (e) {
        if (countryLayer) countryLayer.setStyle(getCountryDefaultStyle);
      }
    }
    selectedCountry = feature;
    selectedCountry.layer = layer;
    highlightCountry(layer);
    if (messageEl) messageEl.textContent = "";
    showGuessNameModal();
  } else if (currentGameMode === "findCountry") {
    if (!targetCountry) return;
    const clickedCountryName = feature.properties.name;
    selectedCountry = feature; // Armazena o país que o usuário CLICOU
    selectedCountry.layer = layer;
    let isGuessCorrect = clickedCountryName === targetCountry.englishName;
    if (isGuessCorrect) {
      score++;
      if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
      updateHighScore();
      successSound.play();
      highlightCountry(layer);
      showFindCountryFeedbackModal(true, "Você acertou! Mandou bem!");
    } else {
      score = 0;
      if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
      errorSound.play();
      showFindCountryFeedbackModal(
        false,
        "Ops, não é este! Você pode tentar novamente ou ver a resposta."
      );
    }
  }
}

async function initGameSession() {
  if (!map) {
    // Configura o mapa com o tema claro fixo
    currentMapTileLayer = L.tileLayer(tileLayerData.url, {
      attribution: tileLayerData.attribution,
    });
    map = L.map("map", {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 6,
      maxBounds: [
        [-85.0511, -180],
        [85.0511, 180],
      ],
      maxBoundsViscosity: 1.0,
      layers: [currentMapTileLayer], // Adiciona a camada de tiles na inicialização
    });
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  } else {
    // Se o mapa já existe, apenas garante que a camada de tiles correta está lá
    // (útil se initGameSession for chamado múltiplas vezes, embora não seja o fluxo atual)
    if (currentMapTileLayer) map.removeLayer(currentMapTileLayer);
    currentMapTileLayer = L.tileLayer(tileLayerData.url, {
      attribution: tileLayerData.attribution,
    }).addTo(map);
  }

  assignGameElementReferences();
  // Remoção da lógica de localStorage para tema e chamada a setMapTheme
  // document.body.classList.add(`map-theme-light`); // Garante a classe no body, se necessário para outros estilos

  if (loadingIndicator) loadingIndicator.style.display = "flex";
  try {
    await loadCountryData();
    await loadMapGeoJSON(); // Garante que os países sejam desenhados com o estilo padrão
    if (countryLayer) countryLayer.setStyle(getCountryDefaultStyle);

    if (currentGameMode === "guessName") {
      if (messageEl)
        messageEl.textContent = "Modo Adivinhe o Nome! Clique em um país.";
      if (findCountryPromptEl) findCountryPromptEl.style.display = "none";
      if (gameControlsEl) gameControlsEl.style.display = "none";
      if (findCountryFeedbackModalEl)
        findCountryFeedbackModalEl.style.display = "none";
    } else if (currentGameMode === "findCountry") {
      if (gameControlsEl) gameControlsEl.style.display = "none";
      if (findCountryFeedbackModalEl)
        findCountryFeedbackModalEl.style.display = "none";
      startFindCountryRound();
    }
  } catch (error) {
    console.error("Falha ao inicializar o jogo:", error);
    if (messageEl)
      messageEl.textContent = `Erro ao carregar dados: ${error.message}. Tente recarregar.`;
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = "none";
  }
}

function highlightCountry(layer) {
  // Cores fixas para o tema claro
  layer.setStyle({
    weight: 1.5,
    color: "#00b894", // Cor de borda para tema claro
    fillColor: "#55efc4", // Cor de preenchimento para tema claro
    fillOpacity: 0.6,
  });
}

function handleGuessName() {
  if (!selectedCountry || !selectedCountry.properties) {
    if (modalMessageEl) modalMessageEl.textContent = "Nenhum país selecionado!";
    if (button) button.disabled = false;
    return;
  }
  if (button) button.disabled = true;
  const userGuess = normalize(input.value);
  const englishName = selectedCountry.properties.name;
  const normalizedEnglishName = normalize(englishName);
  const countryInfo = countryData[englishName];
  const portugueseName = countryInfo ? countryInfo.pt : englishName;
  const normalizedPortugueseName = portugueseName
    ? normalize(portugueseName)
    : null;
  let isCorrect =
    userGuess === normalizedEnglishName ||
    (normalizedPortugueseName && userGuess === normalizedPortugueseName);
  const displayNameForFeedback = portugueseName || englishName;

  if (isCorrect) {
    score++;
    if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
    updateHighScore();
    if (modalMessageEl) {
      modalMessageEl.textContent = "Correto!";
      modalMessageEl.style.color = "#2ecc71";
    }
    successSound.play();
  } else {
    score = 0;
    if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
    if (modalMessageEl) {
      modalMessageEl.textContent = `Errado! O país era ${displayNameForFeedback}.`;
      modalMessageEl.style.color = "#e74c3c";
    }
    errorSound.play();
  }
  const layerToResetStyle = selectedCountry.layer;
  selectedCountry = null;
  if (layerToResetStyle && countryLayer)
    layerToResetStyle.setStyle(getCountryDefaultStyle());
  setTimeout(() => {
    hideGuessNameModal();
  }, 1500);
}

function handleOverlayClick() {
  if (gameControlsEl && gameControlsEl.classList.contains("visible")) {
    hideGuessNameModal();
  } else if (
    findCountryFeedbackModalEl &&
    findCountryFeedbackModalEl.classList.contains("visible")
  ) {
    hideFindCountryFeedbackModal();
    if (
      currentGameMode === "findCountry" &&
      targetCountry &&
      findTryAgainButtonEl.style.display === "inline-block"
    ) {
      if (messageEl) messageEl.textContent = `Tente novamente localizar:`;
    }
  }
  if (selectedCountry && selectedCountry.layer && countryLayer) {
    if (selectedCountry.layer !== (targetCountry && targetCountry.layer)) {
      selectedCountry.layer.setStyle(
        getCountryDefaultStyle(selectedCountry.feature)
      );
    }
  }
  if (
    messageEl &&
    currentGameMode === "guessName" &&
    !(gameControlsEl && gameControlsEl.classList.contains("visible"))
  )
    messageEl.textContent = "Seleção cancelada.";
}

function startFindCountryRound() {
  if (availableCountriesForFindMode.length === 0) {
    if (messageEl) messageEl.textContent = "Não há países disponíveis.";
    if (findCountryPromptEl) findCountryPromptEl.style.display = "none";
    return;
  }
  if (countryLayer) countryLayer.setStyle(getCountryDefaultStyle);
  selectedCountry = null;

  const randomIndex = Math.floor(
    Math.random() * availableCountriesForFindMode.length
  );
  const randomCountryEnglishName = availableCountriesForFindMode[randomIndex];
  const countryInfo = countryData[randomCountryEnglishName];

  if (!countryInfo || !countryInfo.pt || !countryInfo.code) {
    availableCountriesForFindMode.splice(randomIndex, 1);
    if (availableCountriesForFindMode.length > 0) startFindCountryRound();
    else if (messageEl)
      messageEl.textContent = "Erro: dados de países insuficientes.";
    return;
  }
  let targetFeature = null;
  if (countryLayer && countryLayer.eachLayer) {
    countryLayer.eachLayer((layer) => {
      if (layer.feature.properties.name === randomCountryEnglishName)
        targetFeature = layer.feature;
    });
  }
  targetCountry = {
    englishName: randomCountryEnglishName,
    portugueseName: countryInfo.pt,
    isoCode: countryInfo.code.toLowerCase(),
    feature: targetFeature,
    layer: countryLayer
      ? Object.values(countryLayer._layers).find(
          (l) => l.feature.properties.name === randomCountryEnglishName
        )
      : null,
  };
  if (findCountryPromptEl) findCountryPromptEl.style.display = "block";
  if (findCountryNameEl)
    findCountryNameEl.textContent = targetCountry.portugueseName;
  if (findCountryFlagEl) {
    findCountryFlagEl.src = `https://flagcdn.com/w80/${targetCountry.isoCode}.png`;
    findCountryFlagEl.alt = `Bandeira de ${targetCountry.portugueseName}`;
  }
  if (messageEl) {
    messageEl.textContent = `Localize no mapa:`;
    messageEl.style.color = "#333";
  }
  if (gameControlsEl && gameControlsEl.classList.contains("visible"))
    hideGuessNameModal();
  if (
    findCountryFeedbackModalEl &&
    findCountryFeedbackModalEl.classList.contains("visible")
  )
    hideFindCountryFeedbackModal();
  console.log("País a ser encontrado:", targetCountry.portugueseName);
}

document.addEventListener("DOMContentLoaded", () => {
  const initialHighScoreDisplay = document.getElementById("high-score-display");
  if (initialHighScoreDisplay) {
    const storedHighScore = localStorage.getItem("geoGuessHighScore");
    if (storedHighScore)
      initialHighScoreDisplay.textContent = `Recorde: ${parseInt(
        storedHighScore,
        10
      )}`;
  }
  if (startScreen && gameContainer && guessNameButton && findCountryButton) {
    startScreen.style.display = "flex";
    gameContainer.style.display = "none";
    guessNameButton.addEventListener("click", () => {
      currentGameMode = "guessName";
      startScreen.style.display = "none";
      gameContainer.style.display = "block";
      initGameSession();
    });
    findCountryButton.addEventListener("click", () => {
      currentGameMode = "findCountry";
      startScreen.style.display = "none";
      gameContainer.style.display = "block";
      initGameSession();
    });
  } else {
    console.error(
      "Elementos da tela de início ou botões de modo não encontrados!"
    );
    if (gameContainer) gameContainer.style.display = "block";
    currentGameMode = "guessName";
    initGameSession();
  }
});
