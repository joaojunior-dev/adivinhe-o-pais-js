// script.js

let selectedCountry = null;
let score = 0;

const map = L.map("map").setView([0, 0], 2);
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    attribution: "© OpenStreetMap contributors & CartoDB",
  }
).addTo(map);

let countryLayer = null;

const input = document.getElementById("guess-input");
const button = document.getElementById("guess-button");
const messageEl = document.getElementById("message");
const modalMessageEl = document.getElementById("modal-message");
const scoreEl = document.getElementById("score");
const overlayEl = document.getElementById("overlay");
const gameControlsEl = document.getElementById("game-controls");
const modalTitleEl = document.getElementById("modal-title");

const successSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
);
const errorSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
);

const translations = {
  Afghanistan: "Afeganistão",
  Albania: "Albânia",
  Algeria: "Argélia",
  Angola: "Angola",
  Argentina: "Argentina",
  Armenia: "Armênia",
  Australia: "Austrália",
  Austria: "Áustria",
  Azerbaijan: "Azerbaijão",
  Bahamas: "Bahamas",
  Bangladesh: "Bangladesh",
  Belarus: "Bielorrússia",
  Belgium: "Bélgica",
  Belize: "Belize",
  Benin: "Benin",
  Bhutan: "Butão",
  Bolivia: "Bolívia",
  "Bosnia and Herz.": "Bósnia e Herzegovina",
  Botswana: "Botsuana",
  Brazil: "Brasil",
  Brunei: "Brunei",
  Bulgaria: "Bulgária",
  "Burkina Faso": "Burkina Faso",
  Burundi: "Burundi",
  Cambodia: "Camboja",
  Cameroon: "Camarões",
  Canada: "Canadá",
  "Central African Rep.": "República Centro-Africana",
  Chad: "Chade",
  Chile: "Chile",
  China: "China",
  Colombia: "Colômbia",
  Congo: "Congo",
  "Dem. Rep. Congo": "República Democrática do Congo",
  "Costa Rica": "Costa Rica",
  Croatia: "Croácia",
  Cuba: "Cuba",
  Cyprus: "Chipre",
  "Czech Rep.": "República Tcheca",
  Denmark: "Dinamarca",
  Djibouti: "Djibuti",
  "Dominican Rep.": "República Dominicana",
  Ecuador: "Equador",
  Egypt: "Egito",
  "El Salvador": "El Salvador",
  "Eq. Guinea": "Guiné Equatorial",
  Eritrea: "Eritreia",
  Estonia: "Estônia",
  Ethiopia: "Etiópia",
  "Falkland Is.": "Ilhas Malvinas",
  Fiji: "Fiji",
  Finland: "Finlândia",
  France: "França",
  Gabon: "Gabão",
  Gambia: "Gâmbia",
  Georgia: "Geórgia",
  Germany: "Alemanha",
  Ghana: "Gana",
  Greece: "Grécia",
  Greenland: "Groenlândia",
  Guatemala: "Guatemala",
  Guinea: "Guiné",
  "Guinea-Bissau": "Guiné-Bissau",
  Guyana: "Guiana",
  Haiti: "Haiti",
  Honduras: "Honduras",
  Hungary: "Hungria",
  Iceland: "Islândia",
  India: "Índia",
  Indonesia: "Indonésia",
  Iran: "Irã",
  Iraq: "Iraque",
  Ireland: "Irlanda",
  Israel: "Israel",
  Italy: "Itália",
  "Ivory Coast": "Costa do Marfim",
  "Côte d'Ivoire": "Costa do Marfim",
  Jamaica: "Jamaica",
  Japan: "Japão",
  Jordan: "Jordânia",
  Kazakhstan: "Cazaquistão",
  Kenya: "Quênia",
  Korea: "Coreia do Sul",
  "Dem. Rep. Korea": "Coreia do Norte",
  Kuwait: "Kuwait",
  Kyrgyzstan: "Quirguistão",
  Laos: "Laos",
  Latvia: "Letônia",
  Lebanon: "Líbano",
  Lesotho: "Lesoto",
  Liberia: "Libéria",
  Libya: "Líbia",
  Lithuania: "Lituânia",
  Luxembourg: "Luxemburgo",
  Macedonia: "Macedônia do Norte",
  "North Macedonia": "Macedônia do Norte",
  Madagascar: "Madagascar",
  Malawi: "Malawi",
  Malaysia: "Malásia",
  Mali: "Mali",
  Mauritania: "Mauritânia",
  Mexico: "México",
  Moldova: "Moldávia",
  Mongolia: "Mongólia",
  Montenegro: "Montenegro",
  Morocco: "Marrocos",
  Mozambique: "Moçambique",
  Myanmar: "Mianmar",
  Namibia: "Namíbia",
  Nepal: "Nepal",
  Netherlands: "Holanda",
  "New Caledonia": "Nova Caledônia",
  "New Zealand": "Nova Zelândia",
  Nicaragua: "Nicarágua",
  Niger: "Níger",
  Nigeria: "Nigéria",
  Norway: "Noruega",
  Oman: "Omã",
  Pakistan: "Paquistão",
  Palestine: "Palestina",
  "West Bank": "Cisjordânia",
  Panama: "Panamá",
  "Papua New Guinea": "Papua Nova Guiné",
  Paraguay: "Paraguai",
  Peru: "Peru",
  Philippines: "Filipinas",
  Poland: "Polônia",
  Portugal: "Portugal",
  "Puerto Rico": "Porto Rico",
  Qatar: "Catar",
  Romania: "Romênia",
  "Russian Federation": "Rússia",
  Russia: "Rússia",
  Rwanda: "Ruanda",
  "Saudi Arabia": "Arábia Saudita",
  Senegal: "Senegal",
  Serbia: "Sérvia",
  "Sierra Leone": "Serra Leoa",
  Slovakia: "Eslováquia",
  Slovenia: "Eslovênia",
  "Solomon Is.": "Ilhas Salomão",
  Somalia: "Somália",
  "South Africa": "África do Sul",
  "S. Sudan": "Sudão do Sul",
  Spain: "Espanha",
  "Sri Lanka": "Sri Lanka",
  Sudan: "Sudão",
  Suriname: "Suriname",
  Swaziland: "Essuatíni",
  Sweden: "Suécia",
  Switzerland: "Suíça",
  Syria: "Síria",
  "Syrian Arab Republic": "Síria",
  Taiwan: "Taiwan",
  Tajikistan: "Tajiquistão",
  Tanzania: "Tanzânia",
  "United Rep. of Tanzania": "Tanzânia",
  Thailand: "Tailândia",
  "Timor-Leste": "Timor-Leste",
  Togo: "Togo",
  Trinidad: "Trinidad e Tobago",
  "Trinidad and Tobago": "Trinidad e Tobago",
  Tunisia: "Tunísia",
  Turkey: "Turquia",
  Turkmenistan: "Turcomenistão",
  Uganda: "Uganda",
  Ukraine: "Ucrânia",
  "United Arab Emirates": "Emirados Árabes Unidos",
  "United Kingdom": "Reino Unido",
  "United States of America": "Estados Unidos",
  Uruguay: "Uruguai",
  Uzbekistan: "Uzbequistão",
  Vanuatu: "Vanuatu",
  Venezuela: "Venezuela",
  Vietnam: "Vietnã",
  Yemen: "Iêmen",
  Zambia: "Zâmbia",
  Zimbabwe: "Zimbábue",
};

function normalize(str) {
  if (typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function showModal() {
  if (overlayEl) overlayEl.style.display = "block";
  if (gameControlsEl) gameControlsEl.style.display = "flex";
  if (input) {
    input.value = "";
    input.focus();
  }
  if (modalMessageEl) modalMessageEl.textContent = "";
  if (modalTitleEl && selectedCountry) {
    modalTitleEl.textContent = "Qual o nome deste país?";
  }
}

function hideModal() {
  if (overlayEl) overlayEl.style.display = "none";
  if (gameControlsEl) gameControlsEl.style.display = "none";
  if (input) input.value = "";

  if (selectedCountry && countryLayer) {
    countryLayer.resetStyle();
  }
  selectedCountry = null;
}

fetch(
  "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson"
)
  .then((res) => res.json())
  .then((data) => {
    countryLayer = L.geoJSON(data, {
      style: {
        weight: 0.5,
        color: "#555",
        fillOpacity: 0.1,
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          if (selectedCountry && selectedCountry.layer) {
            try {
              countryLayer.resetStyle(selectedCountry.layer);
            } catch (e) {
              countryLayer.resetStyle();
            }
          }
          selectedCountry = feature;
          selectedCountry.layer = layer;
          highlightCountry(layer);
          messageEl.textContent = "";
          showModal();
        });
      },
    }).addTo(map);
  })
  .catch((err) => {
    console.error("Erro ao carregar dados dos países:", err);
    if (messageEl)
      messageEl.textContent =
        "Erro ao carregar o mapa. Tente recarregar a página.";
  });

function highlightCountry(layer) {
  layer.setStyle({
    color: "#00b894",
    fillColor: "#55efc4",
    fillOpacity: 0.5,
  });
}

// Adiciona listener para a tecla Enter no campo de input
if (input) {
  input.addEventListener("keydown", function (event) {
    // Verifica se a tecla pressionada foi Enter e se o modal está visível
    if (event.key === "Enter" && gameControlsEl.style.display === "flex") {
      event.preventDefault(); // Impede o comportamento padrão do Enter (se houver)
      if (button) {
        button.click(); // Simula o clique no botão "Adivinhar"
      }
    }
  });
}

if (button) {
  button.addEventListener("click", () => {
    if (!selectedCountry || !selectedCountry.properties) {
      if (modalMessageEl)
        modalMessageEl.textContent = "Nenhum país selecionado!";
      if (messageEl)
        messageEl.textContent = "Clique em um país no mapa primeiro.";
      return;
    }

    const userGuessRaw = input.value;
    const userGuess = normalize(userGuessRaw);
    const englishName = selectedCountry.properties.name;
    const normalizedEnglishName = normalize(englishName);
    const portugueseName = translations[englishName];
    const normalizedPortugueseName = portugueseName
      ? normalize(portugueseName)
      : null;

    let isCorrect = false;
    if (userGuess === normalizedEnglishName) {
      isCorrect = true;
    } else {
      if (normalizedPortugueseName && userGuess === normalizedPortugueseName) {
        isCorrect = true;
      }
    }

    const displayNameForFeedback = portugueseName || englishName;

    if (isCorrect) {
      score++;
      if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
      if (modalMessageEl) {
        modalMessageEl.textContent = "Correto!";
        modalMessageEl.style.color =
          "#2ecc71"; /* Verde mais vibrante para acerto */
      }
      successSound.play();
    } else {
      if (modalMessageEl) {
        modalMessageEl.textContent = `Errado! O país era ${displayNameForFeedback}.`;
        modalMessageEl.style.color =
          "#e74c3c"; /* Vermelho mais vibrante para erro */
      }
      score = 0;
      if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
      errorSound.play();
    }

    setTimeout(() => {
      hideModal();
    }, 1500);
  });
} else {
  console.error("Botão de adivinhar não encontrado!");
}

if (overlayEl) {
  overlayEl.addEventListener("click", () => {
    hideModal();
    if (messageEl) messageEl.textContent = "Seleção cancelada.";
  });
}

if (!input) console.error("Campo de input não encontrado!");
if (!messageEl) console.error("Elemento de mensagem geral não encontrado!");
if (!modalMessageEl)
  console.error("Elemento de mensagem do modal não encontrado!");
if (!scoreEl) console.error("Elemento de pontuação não encontrado!");
if (!overlayEl) console.error("Elemento de overlay não encontrado!");
if (!gameControlsEl)
  console.error("Elemento gameControls (modal) não encontrado!");
