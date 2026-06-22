/** @typedef {{ psc_od: number, psc_do: number, zone: number, city?: string }} ZonyEntry */
/** @typedef {{ psc_od: number, psc_do: number, zone: number, okres?: string }} PscRange */

const CARRIER_WEIGHT_LIMITS_KG = {
  Raben: 5000,
  "Doprava na paletách": 3500,
};

let shippingData = null;

async function loadData() {
  const response = await fetch("data/shipping.json");
  if (!response.ok) {
    throw new Error("Nepodařilo se načíst data. Spusťte nejdříve export z Excelu.");
  }
  shippingData = await response.json();
}

/**
 * @param {number} psc
 * @param {ZonyEntry[]} entries
 */
function lookupZony(psc, entries) {
  for (const entry of entries) {
    if (psc >= entry.psc_od && psc <= entry.psc_do) {
      return entry;
    }
  }
  return null;
}

/**
 * @param {number} psc
 * @param {PscRange[]} ranges
 */
function lookupPscZone(psc, ranges) {
  for (const range of ranges) {
    if (psc >= range.psc_od && psc <= range.psc_do) {
      return range.zone;
    }
  }
  return null;
}

/**
 * @param {number} weight
 * @param {number[]} tiers
 */
function findWeightTier(weight, tiers) {
  for (const tier of tiers) {
    if (tier >= weight) {
      return tier;
    }
  }
  return tiers.length > 0 ? tiers[tiers.length - 1] : null;
}

/**
 * @param {number} weight
 * @param {number[]} limits
 */
function findWeightLimit(weight, limits) {
  for (const limit of limits) {
    if (weight <= limit) {
      return limit;
    }
  }
  return limits.length > 0 ? limits[limits.length - 1] : null;
}

function formatPrice(value) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizePsc(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 0) {
    return null;
  }
  if (digits.length > 5) {
    return null;
  }
  return parseInt(digits.padStart(5, "0"), 10);
}

function overWeightLimit(carrier, weight) {
  const limit = CARRIER_WEIGHT_LIMITS_KG[carrier];
  if (limit != null && weight > limit) {
    return {
      available: false,
      reason: `Max. tonáž ${limit.toLocaleString("cs-CZ")} kg`,
    };
  }
  return null;
}

function calculateRaben(psc, weight) {
  const overLimit = overWeightLimit("Raben", weight);
  if (overLimit) {
    return overLimit;
  }

  const { psc_ranges, weights, prices } = shippingData.raben;
  const zone = lookupPscZone(psc, psc_ranges);
  if (zone == null) {
    return { available: false, reason: "PSČ není v ceniku Raben" };
  }

  const tier = findWeightTier(weight, weights);
  if (tier == null) {
    return { available: false, reason: "Hmotnost mimo rozsah Raben" };
  }

  const price = prices[String(zone)]?.[String(tier)];
  if (price == null) {
    return { available: false, reason: "Cena není k dispozici" };
  }

  return {
    available: true,
    price,
    zone,
    tier,
    detail: `Zóna ${zone} · tarif do ${tier} kg`,
  };
}

function calculateDnp(psc, weight) {
  const overLimit = overWeightLimit("Doprava na paletách", weight);
  if (overLimit) {
    return overLimit;
  }

  const { psc_ranges, weights, prices } = shippingData.dnp;
  const range = psc_ranges.find((r) => psc >= r.psc_od && psc <= r.psc_do);
  if (!range) {
    return { available: false, reason: "PSČ není v ceniku DNP" };
  }

  const zone = range.zone;
  const tier = findWeightTier(weight, weights);
  if (tier == null) {
    return { available: false, reason: "Hmotnost mimo rozsah DNP" };
  }

  const price = prices[String(zone)]?.[String(tier)];
  if (price == null) {
    return { available: false, reason: "Cena není k dispozici" };
  }

  const okres = range.okres ? ` · ${range.okres}` : "";
  return {
    available: true,
    price,
    zone,
    tier,
    detail: `Zóna ${zone}${okres} · tarif do ${tier} kg`,
  };
}

function calculateVnitro(pasmo, weight) {
  const { weight_limits, prices } = shippingData.vnitro;
  const pasmoData = prices[String(pasmo)];
  if (!pasmoData) {
    return { available: false, reason: "Pásmo není v ceniku Vnitro" };
  }

  const limit = findWeightLimit(weight, weight_limits);
  if (limit == null) {
    return { available: false, reason: "Hmotnost mimo rozsah Vnitro" };
  }

  const limitKey = String(limit);
  const bracket = pasmoData[limitKey];
  if (!bracket || bracket.limit == null) {
    return { available: false, reason: "Cena není k dispozici" };
  }

  const limitLabel = limit >= 999999 ? "nad 12000 kg" : `do ${limit} kg`;
  const kmRange = pasmoData.km_range ? ` (${pasmoData.km_range} km)` : "";
  return {
    available: true,
    price: bracket.limit,
    minimum: bracket.minimum,
    zone: pasmo,
    tier: limit,
    detail: `Pásmo ${pasmo}${kmRange} · ${limitLabel}`,
  };
}

function renderResults(results) {
  const grid = document.getElementById("results-grid");
  const bestNote = document.getElementById("best-note");
  grid.innerHTML = "";

  const available = results.filter((r) => r.available && r.price != null);
  const minPrice = available.length > 0 ? Math.min(...available.map((r) => r.price)) : null;

  for (const result of results) {
    const card = document.createElement("div");
    const isBest = result.available && result.price === minPrice && available.length > 0;
    card.className = "result-card" + (isBest ? " best" : "") + (result.available ? "" : " unavailable");

    const left = document.createElement("div");
    const name = document.createElement("div");
    name.className = "carrier-name";
    name.innerHTML = result.carrier + (isBest ? '<span class="best-badge">Nejlevnější</span>' : "");
    const detail = document.createElement("div");
    detail.className = "carrier-detail";
    detail.textContent = result.available ? result.detail : result.reason;
    left.appendChild(name);
    left.appendChild(detail);

    const priceWrap = document.createElement("div");
    priceWrap.className = "carrier-prices";

    if (result.available && result.carrier === "Vnitro") {
      const limitEl = document.createElement("div");
      limitEl.className = "carrier-price";
      limitEl.innerHTML =
        `<span class="price-label">Limit do CN</span> ${formatPrice(result.price)}`;
      priceWrap.appendChild(limitEl);

      if (result.minimum != null) {
        const minEl = document.createElement("div");
        minEl.className = "carrier-price minimum-price";
        minEl.innerHTML =
          `<span class="price-label">Minimum</span> ${formatPrice(result.minimum)}`;
        priceWrap.appendChild(minEl);
      }
    } else {
      const priceEl = document.createElement("div");
      priceEl.className = "carrier-price";
      priceEl.textContent = result.available ? formatPrice(result.price) : "—";
      priceWrap.appendChild(priceEl);
    }

    card.appendChild(left);
    card.appendChild(priceWrap);
    grid.appendChild(card);
  }

  if (minPrice != null && available.length > 1) {
    bestNote.textContent = `Nejlevnější doprava: ${available.find((r) => r.price === minPrice).carrier} za ${formatPrice(minPrice)} bez DPH.`;
    bestNote.classList.remove("hidden");
  } else {
    bestNote.classList.add("hidden");
  }

  document.getElementById("results").classList.remove("hidden");
}

function showError(message) {
  const el = document.getElementById("error");
  el.textContent = message;
  el.classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("info-panel").classList.add("hidden");
}

function hideError() {
  document.getElementById("error").classList.add("hidden");
}

function calculate() {
  hideError();

  if (!shippingData) {
    showError("Data nejsou načtena. Obnovte stránku.");
    return;
  }

  const psc = normalizePsc(document.getElementById("psc").value);
  const weight = parseFloat(document.getElementById("weight").value);

  if (psc == null) {
    showError("Zadejte platné PSČ (5 číslic).");
    return;
  }
  if (!weight || weight <= 0) {
    showError("Zadejte platnou hmotnost v kg (větší než 0).");
    return;
  }

  const zonyEntry = lookupZony(psc, shippingData.zony);
  if (!zonyEntry) {
    showError(`PSČ ${String(psc).padStart(5, "0")} nebylo nalezeno v seznamu zón.`);
    return;
  }

  document.getElementById("info-psc").textContent = String(psc).padStart(5, "0");
  document.getElementById("info-city").textContent = zonyEntry.city || "—";
  document.getElementById("info-pasmo").textContent = String(zonyEntry.zone);
  document.getElementById("info-panel").classList.remove("hidden");

  const results = [
    { carrier: "Raben", ...calculateRaben(psc, weight) },
    { carrier: "Doprava na paletách", ...calculateDnp(psc, weight) },
    { carrier: "Vnitro", ...calculateVnitro(zonyEntry.zone, weight) },
  ];

  renderResults(results);
}

function init() {
  document.getElementById("calc-btn").addEventListener("click", calculate);
  document.getElementById("psc").addEventListener("keydown", (e) => {
    if (e.key === "Enter") calculate();
  });
  document.getElementById("weight").addEventListener("keydown", (e) => {
    if (e.key === "Enter") calculate();
  });

  loadData().catch((err) => {
    showError(err.message);
  });
}

init();
