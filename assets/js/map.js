/* FB Code LLC — the process map. A visitor's map lives in their browser only:
   local storage for the working copy, the URL fragment for a shared link.
   Loads after site.js, which provides Str and Motion. */

const MAP_KEY = "fbcode-map";
const MAP_HASH = "m";
const MAP_NAME_MAX = 60;
const MAP_UNIT_MAX = 24;
const MAP_STEPS_MAX = 12;
const MAP_RUNS_MAX = 100000;
const HOUR_MIN = 60;
const DAY_MIN = 1440;

const WORK_OPTIONS = [
  [1, "1 min"], [2, "2 min"], [5, "5 min"], [10, "10 min"],
  [15, "15 min"], [30, "30 min"], [60, "1 hour"], [120, "2 hours"],
];
const WAIT_OPTIONS = [
  [0, "No wait"], [15, "15 min"], [60, "1 hour"], [240, "4 hours"],
  [1440, "1 day"], [2880, "2 days"], [10080, "1 week"],
];

const BY_HAND = "By hand";
const AUTOMATIC = "Automatic";
const NEW_STEP = {name: "New step", byHand: true, minutes: 5, wait: 0};

const EXAMPLE_MAP = {
  unit: "order",
  runs: 40,
  steps: [
    {name: "Order comes in", byHand: false, minutes: 0, wait: 0},
    {name: "Copied into the order system", byHand: true, minutes: 10, wait: 60},
    {name: "Approved by a manager", byHand: true, minutes: 5, wait: 1440},
    {name: "Re-keyed into invoicing", byHand: true, minutes: 10, wait: 240},
    {name: "Confirmation sent", byHand: true, minutes: 5, wait: 0},
  ],
};

/* The bar keeps every segment visible, so a five-minute step next to a one-day
   wait still shows. */
const BAR_FLOOR_PCT = 1.5;
const TWEEN_MS = 420;

function cloneMap(map){
  return {
    unit: map.unit,
    runs: map.runs,
    steps: map.steps.map((step) => Object.assign({}, step)),
  };
}

function allowed(options, value, fallback){
  const number = Number(value);
  return options.some(([option]) => option === number) ? number : fallback;
}

/* Anything read back from storage or a link is treated as untrusted input. */
function cleanMap(raw){
  if(!raw || !Array.isArray(raw.steps) || raw.steps.length === 0){
    return null;
  }

  const steps = raw.steps.slice(0, MAP_STEPS_MAX).map((step) => {
    const byHand = Boolean(step && step.byHand);
    return {
      name: String((step && step.name) || "").slice(0, MAP_NAME_MAX),
      byHand: byHand,
      minutes: byHand ? allowed(WORK_OPTIONS, step.minutes, NEW_STEP.minutes) : 0,
      wait: allowed(WAIT_OPTIONS, step && step.wait, 0),
    };
  });

  const runs = Math.round(Number(raw.runs));
  return {
    unit: String(raw.unit || "").slice(0, MAP_UNIT_MAX),
    runs: Number.isFinite(runs) ? Math.min(MAP_RUNS_MAX, Math.max(1, runs)) : 1,
    steps: steps,
  };
}

function encodeMap(map){
  const compact = [map.unit, map.runs, map.steps.map((step) => [step.name, step.byHand ? 1 : 0, step.minutes, step.wait])];
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeMap(text){
  try{
    const binary = window.atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const compact = JSON.parse(new TextDecoder().decode(bytes));
    return cleanMap({
      unit: compact[0],
      runs: compact[1],
      steps: compact[2].map((step) => ({name: step[0], byHand: step[1] === 1, minutes: step[2], wait: step[3]})),
    });
  }catch(error){
    return null;
  }
}

const MapStore = {
  load(){
    try{
      const raw = window.localStorage.getItem(MAP_KEY);
      return Str.blank(raw) ? null : cleanMap(JSON.parse(raw));
    }catch(error){
      return null;
    }
  },
  save(map){
    try{
      window.localStorage.setItem(MAP_KEY, JSON.stringify(map));
    }catch(error){
      /* Private browsing can refuse writes; the map still works for this page. */
    }
  },
  clear(){
    try{
      window.localStorage.removeItem(MAP_KEY);
    }catch(error){
      /* Nothing to clear. */
    }
  },
  fromHash(){
    const match = window.location.hash.match(new RegExp(`[#&]${MAP_HASH}=([^&]+)`));
    return match ? decodeMap(match[1]) : null;
  },
  link(map){
    return `${new URL("map", document.baseURI).href}#${MAP_HASH}=${encodeMap(map)}`;
  },
};

function fmtSpan(min){
  if(min < HOUR_MIN){
    return `${min} min`;
  }
  const hours = Math.floor(min / HOUR_MIN);
  const rest = min % HOUR_MIN;
  if(min < DAY_MIN){
    return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
  }
  const days = Math.floor(min / DAY_MIN);
  const dayHours = Math.floor((min % DAY_MIN) / HOUR_MIN);
  return dayHours > 0 ? `${days} d ${dayHours} h` : `${days} d`;
}

/* Weekly effort is read in working hours, never in days. */
function fmtHours(min){
  const hours = Math.floor(min / HOUR_MIN);
  const rest = Math.round(min % HOUR_MIN);
  if(hours === 0){
    return `${rest} min`;
  }
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

function unitOf(map){
  return Str.blank(map.unit) ? "item" : map.unit.trim();
}

function stepName(step, index){
  return Str.blank(step.name) ? `Step ${index + 1}` : step.name.trim();
}

function summarise(map){
  let handsMin = 0;
  let waitMin = 0;
  let manual = 0;
  let worst = null;
  const parts = [];

  map.steps.forEach((step, index) => {
    if(step.wait > 0){
      waitMin += step.wait;
      parts.push({kind: "wait", size: step.wait});
      if(worst === null || step.wait > worst.wait){
        worst = {wait: step.wait, name: stepName(step, index)};
      }
    }
    if(step.byHand){
      manual += 1;
      handsMin += step.minutes;
      if(step.minutes > 0){
        parts.push({kind: "work", size: step.minutes});
      }
    }
  });

  const totalMin = handsMin + waitMin;
  const spare = 100 - BAR_FLOOR_PCT * parts.length;
  parts.forEach((part) => {
    part.pct = BAR_FLOOR_PCT + (spare * part.size) / totalMin;
  });

  return {
    handsMin: handsMin,
    waitMin: waitMin,
    totalMin: totalMin,
    weekMin: handsMin * map.runs,
    manual: manual,
    count: map.steps.length,
    worst: worst,
    parts: parts,
  };
}

/* Segments are updated in place so their widths animate between states. */
function paintBar(bar, sum){
  const segments = Array.from(bar.querySelectorAll("i"));
  let runner = bar.querySelector(".bar-runner");

  if(!runner){
    runner = document.createElement("b");
    runner.className = "bar-runner";
    runner.setAttribute("aria-hidden", "true");
    bar.appendChild(runner);
  }

  sum.parts.forEach((part, index) => {
    let segment = segments[index];
    if(!segment){
      segment = document.createElement("i");
      bar.insertBefore(segment, runner);
    }
    segment.className = `bar-${part.kind}`;
    segment.style.width = `${part.pct.toFixed(2)}%`;
  });
  segments.slice(sum.parts.length).forEach((segment) => segment.remove());

  runner.hidden = sum.parts.length === 0;
  bar.classList.toggle("is-empty", sum.parts.length === 0);
  bar.setAttribute("aria-label", barLabel(sum));
}

function barLabel(sum){
  return `Of ${fmtSpan(sum.totalMin)} end to end, ${fmtSpan(sum.handsMin)} is someone working and ${fmtSpan(sum.waitMin)} is waiting.`;
}

function insightOf(sum){
  if(sum.waitMin === 0){
    return "Nothing waits. All of the time is hands-on.";
  }
  return `The work is ${fmtSpan(sum.handsMin)}. The waiting is ${fmtSpan(sum.waitMin)}.`;
}

function longestOf(sum){
  if(sum.worst === null){
    return "Add a wait to a step to see where the time goes.";
  }
  return `Longest wait: ${fmtSpan(sum.worst.wait)}, before “${sum.worst.name}”.`;
}

function mapAsText(map){
  const sum = summarise(map);
  const unit = unitOf(map);
  const lines = [
    `One ${unit}, ${map.runs} a week.`,
    `${sum.manual} of ${sum.count} steps by hand, ${fmtHours(sum.weekMin)} a week hands-on, ${fmtSpan(sum.totalMin)} end to end.`,
  ];
  map.steps.forEach((step, index) => {
    const work = step.byHand ? `${BY_HAND.toLowerCase()}, ${fmtSpan(step.minutes)}` : AUTOMATIC.toLowerCase();
    const wait = step.wait > 0 ? `, waits ${fmtSpan(step.wait)} first` : "";
    lines.push(`${index + 1}. ${stepName(step, index)} (${work}${wait})`);
  });
  return lines.join("\n");
}

function setText(root, selector, value){
  root.querySelectorAll(selector).forEach((el) => {
    el.textContent = value;
  });
}

function tweenNumber(el, to, format){
  const from = Number(el.dataset.value);
  el.dataset.value = String(to);

  if(!Number.isFinite(from) || from === to || Motion.reduced()){
    el.textContent = format(to);
    return;
  }

  const start = performance.now();
  const tick = (now) => {
    if(Number(el.dataset.value) !== to){
      return;
    }
    const t = Math.min(1, (now - start) / TWEEN_MS);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(Math.round(from + (to - from) * eased));
    if(t < 1){
      window.requestAnimationFrame(tick);
    }
  };
  window.requestAnimationFrame(tick);
}

function optionsHtml(options, selected){
  return options.map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("");
}

function stepRowHtml(step, index, single){
  const number = String(index + 1).padStart(2, "0");
  const position = index + 1;
  return `
    <li class="mp-step${step.byHand ? " is-hand" : ""}" data-index="${index}">
      <span class="num">${number}</span>
      <input class="mp-name" type="text" value="${Str.escape(step.name)}" maxlength="${MAP_NAME_MAX}" placeholder="Name this step" aria-label="Step ${position} name" data-field="name">
      <button class="mp-who" type="button" aria-pressed="${step.byHand}" aria-label="Step ${position} is done ${step.byHand ? "by hand" : "automatically"}. Switch." data-action="toggle"><span>${step.byHand ? BY_HAND : AUTOMATIC}</span></button>
      <label class="mp-sel"><span>Hands-on</span><select data-field="minutes" aria-label="Step ${position} hands-on time"${step.byHand ? "" : " disabled"}>${step.byHand ? optionsHtml(WORK_OPTIONS, step.minutes) : "<option>None</option>"}</select></label>
      <label class="mp-sel"><span>Waits first</span><select data-field="wait" aria-label="Step ${position} waiting time before it starts">${optionsHtml(WAIT_OPTIONS, step.wait)}</select></label>
      <button class="mp-remove" type="button" aria-label="Remove step ${position}" data-action="remove"${single ? " disabled" : ""}>×</button>
    </li>`;
}

function renderResult(root, map){
  const sum = summarise(map);
  const unit = unitOf(map);

  root.querySelectorAll("[data-map-week]").forEach((el) => tweenNumber(el, sum.weekMin, fmtHours));
  setText(root, "[data-map-week-line]", `${fmtSpan(sum.handsMin)} per ${unit} × ${map.runs} a week`);
  setText(root, "[data-map-manual]", `${sum.manual} of ${sum.count}`);
  setText(root, "[data-map-cycle]", fmtSpan(sum.totalMin));
  setText(root, "[data-map-cycle-line]", `end to end, per ${unit}`);
  setText(root, "[data-map-bar-title]", `Where one ${unit} spends its time`);
  setText(root, "[data-map-insight]", insightOf(sum));
  setText(root, "[data-map-longest]", longestOf(sum));
  setText(root, "[data-map-unit]", unit);
  setText(root, "[data-map-runs]", String(map.runs));
  setText(root, "[data-map-wait]", fmtSpan(sum.waitMin));

  root.querySelectorAll("[data-map-bar]").forEach((bar) => paintBar(bar, sum));
}

function initMapper(){
  const root = document.querySelector("[data-mapper]");
  if(!root){
    return;
  }

  const list = root.querySelector("[data-map-steps]");
  const unitInput = root.querySelector("[data-map-unit-input]");
  const runsInput = root.querySelector("[data-map-runs-input]");
  const addButton = root.querySelector("[data-map-add]");
  const note = root.querySelector("[data-map-note]");

  const saved = MapStore.load();
  let map = saved || cloneMap(EXAMPLE_MAP);
  let own = saved !== null;

  const paint = () => {
    renderResult(root, map);
    root.classList.toggle("is-own", own);
    if(note){
      note.textContent = own ? "Saved in this browser only. Nothing is sent until you send it." : "This is an example. Change it to one process you run.";
    }
    document.dispatchEvent(new CustomEvent("fbcode:map", {detail: own ? map : null}));
  };

  const drawSteps = () => {
    list.innerHTML = map.steps.map((step, index) => stepRowHtml(step, index, map.steps.length === 1)).join("");
    addButton.disabled = map.steps.length >= MAP_STEPS_MAX;
  };

  const commit = () => {
    own = true;
    MapStore.save(map);
    paint();
  };

  const stepAt = (el) => {
    const row = el.closest("[data-index]");
    return row ? Number(row.getAttribute("data-index")) : -1;
  };

  unitInput.value = map.unit;
  runsInput.value = String(map.runs);
  drawSteps();
  paint();
  root.classList.add("is-ready");

  unitInput.addEventListener("input", () => {
    map.unit = unitInput.value.slice(0, MAP_UNIT_MAX);
    commit();
  });

  runsInput.addEventListener("input", () => {
    const runs = Math.round(Number(runsInput.value));
    map.runs = Number.isFinite(runs) ? Math.min(MAP_RUNS_MAX, Math.max(1, runs)) : 1;
    commit();
  });

  list.addEventListener("input", (event) => {
    const index = stepAt(event.target);
    const field = event.target.getAttribute("data-field");
    if(index < 0 || field === null){
      return;
    }
    map.steps[index][field] = field === "name" ? event.target.value : Number(event.target.value);
    commit();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if(!button){
      return;
    }
    const index = stepAt(button);
    const action = button.getAttribute("data-action");

    if(action === "toggle"){
      const step = map.steps[index];
      step.byHand = !step.byHand;
      step.minutes = step.byHand ? NEW_STEP.minutes : 0;
      drawSteps();
      commit();
      list.querySelector(`[data-index="${index}"] [data-action="toggle"]`).focus();
      return;
    }

    if(action === "remove" && map.steps.length > 1){
      map.steps.splice(index, 1);
      drawSteps();
      commit();
      const next = list.querySelector(`[data-index="${Math.min(index, map.steps.length - 1)}"] .mp-name`);
      next.focus();
    }
  });

  addButton.addEventListener("click", () => {
    if(map.steps.length >= MAP_STEPS_MAX){
      return;
    }
    map.steps.push(Object.assign({}, NEW_STEP));
    drawSteps();
    commit();
    const name = list.querySelector("li:last-child .mp-name");
    name.focus();
    name.select();
  });

  root.querySelector("[data-map-reset]").addEventListener("click", () => {
    map = cloneMap(EXAMPLE_MAP);
    own = false;
    MapStore.clear();
    unitInput.value = map.unit;
    runsInput.value = String(map.runs);
    drawSteps();
    paint();
  });
}

function docRowsHtml(map){
  return map.steps.map((step, index) => `
    <tr${step.byHand ? ' class="is-hand"' : ""}>
      <td class="num">${String(index + 1).padStart(2, "0")}</td>
      <th scope="row">${Str.escape(stepName(step, index))}</th>
      <td>${step.byHand ? BY_HAND : AUTOMATIC}</td>
      <td>${step.byHand ? fmtSpan(step.minutes) : "—"}</td>
      <td>${step.wait > 0 ? fmtSpan(step.wait) : "—"}</td>
    </tr>`).join("");
}

function lookFirstHtml(map, sum){
  const unit = Str.escape(unitOf(map));
  const items = [];

  if(sum.worst !== null){
    items.push(`The longest wait is <strong>${fmtSpan(sum.worst.wait)}</strong>, before “${Str.escape(sum.worst.name)}”. Start by asking what the ${unit} is waiting for there.`);
  }
  if(sum.manual > 0){
    items.push(`<strong>${sum.manual} of ${sum.count}</strong> steps are done by hand, <strong>${fmtHours(sum.weekMin)}</strong> a week between them. Ask which of them only move information from one place to another.`);
  }
  if(sum.waitMin > sum.handsMin){
    items.push(`One ${unit} takes <strong>${fmtSpan(sum.totalMin)}</strong>, of which <strong>${fmtSpan(sum.handsMin)}</strong> is work. The rest is the ${unit} sitting still.`);
  }
  if(items.length === 0){
    items.push("Nothing here waits and nothing is done by hand. Add the steps that happen outside the system.");
  }
  return items.map((item) => `<li>${item}</li>`).join("");
}

function initMapDoc(){
  const root = document.querySelector("[data-map-doc]");
  if(!root){
    return;
  }

  const shared = MapStore.fromHash();
  const saved = MapStore.load();
  const map = shared || saved || cloneMap(EXAMPLE_MAP);
  const sum = summarise(map);
  const unit = unitOf(map);
  const first = stepName(map.steps[0], 0);
  const last = stepName(map.steps[map.steps.length - 1], map.steps.length - 1);

  let source = "example";
  if(shared){
    source = "shared";
  }else if(saved){
    source = "own";
  }
  root.setAttribute("data-source", source);

  setText(root, "[data-doc-title]", map.steps.length > 1 ? `One ${unit}, from “${first}” to “${last}”` : `One ${unit}: “${first}”`);
  setText(root, "[data-doc-date]", new Date().toLocaleDateString(undefined, {year: "numeric", month: "long", day: "numeric"}));
  setText(root, "[data-doc-volume]", `${map.runs} a week`);
  root.querySelector("[data-doc-rows]").innerHTML = docRowsHtml(map);
  root.querySelector("[data-doc-look]").innerHTML = lookFirstHtml(map, sum);
  renderResult(root, map);

  root.querySelectorAll("[data-doc-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  root.querySelectorAll("[data-doc-copy]").forEach((button) => {
    const label = button.textContent;
    button.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(MapStore.link(map));
        button.textContent = "Link copied";
      }catch(error){
        window.location.hash = `${MAP_HASH}=${encodeMap(map)}`;
        button.textContent = "Link is in the address bar";
      }
      window.setTimeout(() => {
        button.textContent = label;
      }, 2400);
    });
  });

  /* Editing or sending a shared map makes it this visitor's working copy. */
  root.querySelectorAll("[data-doc-adopt]").forEach((link) => {
    link.addEventListener("click", () => {
      if(source !== "example"){
        MapStore.save(map);
      }
    });
  });
}

function attachHtml(map, sum){
  const unit = Str.escape(unitOf(map));
  const rows = [
    ["Process", `One ${unit}, ${map.runs} a week`],
    ["Steps", `${sum.count}, of which ${sum.manual} by hand`],
    ["Hands-on work", `${fmtHours(sum.weekMin)} a week`],
    ["End to end", `${fmtSpan(sum.totalMin)} per ${unit}`],
  ];
  if(sum.worst !== null){
    rows.push(["Longest wait", `${fmtSpan(sum.worst.wait)}, before “${Str.escape(sum.worst.name)}”`]);
  }
  return rows.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join("");
}

function hiddenField(form, name, value){
  let input = form.querySelector(`input[name="${name}"]`);
  if(Str.blank(value)){
    if(input){
      input.remove();
    }
    return;
  }
  if(!input){
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }
  input.value = value;
}

function initMapAttach(){
  const root = document.querySelector("[data-map-attach]");
  const form = document.querySelector("[data-contact-form]");
  if(!root || !form){
    return;
  }

  const page = document.documentElement;
  const submit = form.querySelector("[data-submit-label]");
  const plainLabel = submit ? submit.textContent : "";

  const attach = (map) => {
    const attached = map !== null;
    page.classList.toggle("has-map", attached);
    hiddenField(form, "process_map", attached ? mapAsText(map) : "");
    hiddenField(form, "process_map_link", attached ? MapStore.link(map) : "");
    if(submit){
      submit.textContent = attached ? "Send map and brief" : plainLabel;
    }
    if(attached){
      const sum = summarise(map);
      root.querySelector("[data-attach-rows]").innerHTML = attachHtml(map, sum);
      root.querySelectorAll("[data-map-bar]").forEach((bar) => paintBar(bar, sum));
    }
  };

  attach(MapStore.load());

  root.querySelectorAll("[data-attach-remove]").forEach((button) => {
    button.addEventListener("click", () => attach(null));
  });
}

/* Once a visitor has a map of their own, every page says so. */
function initMapSignals(){
  const paint = (map) => {
    const own = map !== null;
    const sum = own ? summarise(map) : null;

    document.querySelectorAll("[data-map-chip]").forEach((chip) => {
      chip.hidden = !own;
      const text = chip.querySelector("[data-map-chip-text]");
      if(own && text){
        text.textContent = `Your map · ${fmtHours(sum.weekMin)}/wk`;
      }
    });

    document.querySelectorAll("[data-map-own]").forEach((el) => {
      el.hidden = !own;
      if(own){
        renderResult(el, map);
      }
    });
    document.querySelectorAll("[data-map-none]").forEach((el) => {
      el.hidden = own;
    });
  };

  paint(MapStore.load());
  document.addEventListener("fbcode:map", (event) => paint(event.detail));
}

/* Static figures elsewhere on the page follow whichever map is in play. */
function initMapMirror(){
  const mirrors = document.querySelectorAll("[data-map-mirror]");
  if(mirrors.length === 0){
    return;
  }

  const paint = (map) => {
    const shown = map || cloneMap(EXAMPLE_MAP);
    mirrors.forEach((el) => {
      renderResult(el, shown);
      const steps = el.querySelector("[data-mirror-steps]");
      if(steps){
        steps.innerHTML = shown.steps.map((step, index) => `<li${step.byHand ? ' class="is-hand"' : ""}><span>${Str.escape(stepName(step, index))}</span></li>`).join("");
      }
    });
  };

  paint(MapStore.load());
  document.addEventListener("fbcode:map", (event) => paint(event.detail));
}

initMapSignals();
initMapMirror();
initMapper();
initMapDoc();
initMapAttach();
