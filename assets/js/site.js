/* FB Code LLC — site behaviour. The contact form posts to its own action URL. */

const SITE = {
  contactEmail: "",
};

const Str = {
  blank(value){
    return value === null || value === undefined || String(value).trim().length === 0;
  },
  notBlank(value){
    return !Str.blank(value);
  },
  escape(value){
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },
};

const Motion = {
  reduced(){
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },
  finePointer(){
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Must match the nth-child delays and --t-slow in site.css. */
const STAGGER_STEP_MS = 70;
const REVEAL_MS = 500;

const THEME_KEY = "fbcode-theme";
const THEME_COLOR = {dark: "#08080A", light: "#ECF1F5"};
/* Must match the .theme-switching transition duration in site.css. */
const THEME_SWITCH_MS = 340;

const SEND_FAILED = "That did not send. Check your connection and try again.";

const SENT_CLASS = "is-sent";
const SENT_MESSAGE = "Message sent. You will hear back from an engineer within one business day.";

/* A section counts as current while it crosses a band in the upper part of the viewport. */
const SPY_MARGIN = "-30% 0px -60% 0px";

const NEED_PARAM = "need";

/* map.js fills these two hidden fields when a visitor's process map is attached.
   They are folded into the message itself, so the map arrives wherever the message does. */
const MAP_FIELD = "process_map";
const MAP_LINK_FIELD = "process_map_link";
const MESSAGE_FIELD = "details";

/* Cloudflare Turnstile. The site key lives on the [data-captcha] slot in contact.html;
   an empty key leaves the check off. */
const CAPTCHA_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const CAPTCHA_FIELD = "cf-turnstile-response";
const CAPTCHA_FULL_WIDTH = 300;
const CAPTCHA_TRIGGERS = ["focusin", "pointerdown", "input"];
const CAPTCHA_PENDING = "The spam check above the button has not finished. Give it a moment, then send again.";
const CAPTCHA_FAILED = "The spam check could not load. Check your connection, or allow challenges.cloudflare.com, and reload.";

const STEP_KEYS = {ArrowLeft: -1, ArrowRight: 1};

const IN_CLASS = "is-in";
const WORDS_CLASS = "words";
const OFFSCREEN = "-999px";
const MAGNET_PULL = 0.22;
const TILT_DEG = 5;
const SPOT_SELECTOR = ".spot, .cta .wrap";
const SPLIT_SELECTOR = "main :is(h1, h2):not([data-no-split]), main [data-split]";
const HEADING_TAG = /^H[1-6]$/;

function initMobileNav(){
  const button = document.querySelector("[data-menu-button]");
  const panel = document.querySelector("[data-menu-panel]");
  if(!button || !panel){
    return;
  }

  const close = () => {
    panel.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  };

  button.addEventListener("click", () => {
    const open = panel.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(open));
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if(event.key === "Escape"){
      close();
    }
  });

  window.matchMedia("(min-width:900px)").addEventListener("change", (event) => {
    if(event.matches){
      close();
    }
  });
}

/* Drop .stagger once the cascade has played, so its transition-delay stops
   holding up each card's own hover transition. */
function settleStagger(el){
  if(!el.classList.contains("stagger")){
    return;
  }
  const last = Math.max(0, el.children.length - 1);
  window.setTimeout(() => el.classList.remove("stagger"), last * STAGGER_STEP_MS + REVEAL_MS + 80);
}

function currentTheme(){
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme, buttons){
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);

  const meta = document.querySelector("meta[name=theme-color]");
  if(meta){
    meta.setAttribute("content", THEME_COLOR[theme]);
  }

  const next = theme === "light" ? "dark" : "light";
  buttons.forEach((button) => {
    button.setAttribute("aria-label", `Switch to ${next} theme`);
    button.setAttribute("title", `Switch to ${next} theme`);
    button.setAttribute("aria-pressed", String(theme === "light"));
  });
}

function initTheme(){
  const buttons = Array.from(document.querySelectorAll("[data-theme-toggle]"));

  /* The inline head script has already set data-theme; this syncs the labels. */
  applyTheme(currentTheme(), buttons);

  const root = document.documentElement;
  let timer = null;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = currentTheme() === "light" ? "dark" : "light";

      root.classList.add("theme-switching");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.classList.remove("theme-switching"), THEME_SWITCH_MS);

      applyTheme(next, buttons);

      try{
        window.localStorage.setItem(THEME_KEY, next);
      }catch(error){
        /* Private browsing can refuse writes; the theme still applies for this page. */
      }
    });
  });
}

function initHeader(){
  const header = document.querySelector(".site-header");
  if(!header){
    return;
  }

  const update = () => header.classList.toggle("is-stuck", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, {passive: true});
}

/* The hero follows the pointer: the mark drifts (translation only — it is never
   rotated or mirrored), the grid brightens around it and lights red beneath it. */
function initHeroPointer(){
  if(Motion.reduced() || !Motion.finePointer()){
    return;
  }

  document.querySelectorAll(".hero, .page-hero").forEach((hero) => {
    const mark = hero.querySelector(".hero-art");

    hero.addEventListener("pointermove", (event) => {
      const box = hero.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;

      hero.style.setProperty("--px", `${x}px`);
      hero.style.setProperty("--py", `${y}px`);
      hero.style.setProperty("--gx", `${((x / box.width) * 100).toFixed(1)}%`);
      hero.style.setProperty("--gy", `${((y / box.height) * 100).toFixed(1)}%`);

      if(mark){
        mark.style.setProperty("--mx", (x / box.width - 0.5).toFixed(3));
        mark.style.setProperty("--my", (y / box.height - 0.5).toFixed(3));
      }
    });

    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--px", OFFSCREEN);
      hero.style.setProperty("--py", OFFSCREEN);
      hero.style.removeProperty("--gx");
      hero.style.removeProperty("--gy");
      if(mark){
        mark.style.setProperty("--mx", "0");
        mark.style.setProperty("--my", "0");
      }
    });
  });
}

function wrapWord(node, index){
  const word = document.createElement("span");
  word.className = "w";
  word.style.setProperty("--i", String(index));
  word.appendChild(node);
  return word;
}

/* Headings arrive a word at a time. The words are wrapped for the eye only:
   a heading keeps its full text as its accessible name. */
function splitHeading(heading){
  const named = HEADING_TAG.test(heading.tagName);
  const holder = document.createElement("span");
  let index = 0;

  Array.from(heading.childNodes).forEach((node) => {
    if(node.nodeType !== Node.TEXT_NODE){
      holder.appendChild(wrapWord(node.cloneNode(true), index));
      index += 1;
      return;
    }
    node.textContent.split(/(\s+)/).forEach((piece) => {
      if(piece.length === 0){
        return;
      }
      if(Str.blank(piece)){
        holder.appendChild(document.createTextNode(" "));
        return;
      }
      holder.appendChild(wrapWord(document.createTextNode(piece), index));
      index += 1;
    });
  });

  if(named){
    holder.setAttribute("aria-hidden", "true");
    heading.setAttribute("aria-label", heading.textContent.replace(/\s+/g, " ").trim());
  }
  heading.textContent = "";
  heading.appendChild(holder);
  heading.classList.add(WORDS_CLASS);
}

function initSplit(){
  if(Motion.reduced()){
    return;
  }

  document.querySelectorAll(SPLIT_SELECTOR).forEach((heading) => {
    splitHeading(heading);
    if(!heading.closest(".reveal")){
      window.requestAnimationFrame(() => heading.classList.add(IN_CLASS));
    }
  });
}

/* Cards with .spot get a red edge that follows the pointer. */
function initSpot(){
  if(!Motion.finePointer()){
    return;
  }

  document.addEventListener("pointermove", (event) => {
    const el = event.target instanceof Element ? event.target.closest(SPOT_SELECTOR) : null;
    if(!el){
      return;
    }
    const box = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${event.clientX - box.left}px`);
    el.style.setProperty("--sy", `${event.clientY - box.top}px`);
  }, {passive: true});
}

function initMagnet(){
  if(Motion.reduced() || !Motion.finePointer()){
    return;
  }

  document.querySelectorAll(".btn--signal").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const box = button.getBoundingClientRect();
      button.style.setProperty("--bx", `${((event.clientX - box.left - box.width / 2) * MAGNET_PULL).toFixed(1)}px`);
      button.style.setProperty("--by", `${((event.clientY - box.top - box.height / 2) * MAGNET_PULL).toFixed(1)}px`);
    });

    button.addEventListener("pointerleave", () => {
      button.style.removeProperty("--bx");
      button.style.removeProperty("--by");
    });
  });
}

function initTilt(){
  if(Motion.reduced() || !Motion.finePointer()){
    return;
  }

  document.querySelectorAll("[data-tilt]").forEach((el) => {
    el.addEventListener("pointermove", (event) => {
      const box = el.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      el.style.setProperty("--rx", `${(-y * 2 * TILT_DEG).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 2 * TILT_DEG).toFixed(2)}deg`);
    });

    el.addEventListener("pointerleave", () => {
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
    });
  });
}

function initSpy(){
  const links = Array.from(document.querySelectorAll("[data-spy-link]"));
  if(links.length === 0 || !("IntersectionObserver" in window)){
    return;
  }

  const setCurrent = (current) => {
    links.forEach((link) => {
      if(link === current){
        link.setAttribute("aria-current", "true");
        return;
      }
      link.removeAttribute("aria-current");
    });
  };

  const linkFor = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        setCurrent(linkFor.get(entry.target));
      }
    });
  }, {rootMargin: SPY_MARGIN});

  links.forEach((link) => {
    const target = document.getElementById(link.getAttribute("href").slice(1));
    if(target){
      linkFor.set(target, link);
      observer.observe(target);
    }
  });
}

function buildLightbox(){
  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-labelledby", "lightbox-title");
  dialog.innerHTML = `
    <div class="lightbox-bar">
      <span class="lightbox-title" id="lightbox-title"></span>
      <span class="lightbox-count num" aria-live="polite"></span>
      <button class="lightbox-btn" type="button" data-step="-1" aria-label="Previous screenshot">←</button>
      <button class="lightbox-btn" type="button" data-step="1" aria-label="Next screenshot">→</button>
      <button class="lightbox-btn" type="button" data-close aria-label="Close">×</button>
    </div>
    <div class="lightbox-scroll"><img alt=""></div>`;
  document.body.appendChild(dialog);

  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if(event.target === dialog){
      dialog.close();
    }
  });
  return dialog;
}

/* Screenshots open full size in a native dialog, which handles focus and Escape.
   The arrows and the arrow keys step through every screenshot on the page. */
function initZoom(){
  const triggers = Array.from(document.querySelectorAll("[data-zoom]"));
  if(triggers.length === 0 || typeof HTMLDialogElement === "undefined"){
    return;
  }

  const single = triggers.length < 2;
  let dialog = null;
  let current = 0;

  const show = (index) => {
    current = (index + triggers.length) % triggers.length;

    const trigger = triggers[current];
    const thumb = trigger.querySelector("img");
    const image = dialog.querySelector("img");
    image.src = trigger.getAttribute("data-zoom");
    image.alt = thumb ? thumb.alt : "";
    dialog.querySelector(".lightbox-title").textContent = trigger.getAttribute("data-zoom-title") || "";
    dialog.querySelector(".lightbox-count").textContent = `${current + 1} / ${triggers.length}`;
    dialog.querySelector(".lightbox-scroll").scrollTo(0, 0);
  };

  const build = () => {
    const built = buildLightbox();
    built.querySelector(".lightbox-count").hidden = single;

    built.querySelectorAll("[data-step]").forEach((button) => {
      button.hidden = single;
      button.addEventListener("click", () => show(current + Number(button.getAttribute("data-step"))));
    });

    built.addEventListener("keydown", (event) => {
      if(event.key in STEP_KEYS && !single){
        event.preventDefault();
        show(current + STEP_KEYS[event.key]);
      }
    });
    return built;
  };

  triggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => {
      dialog = dialog || build();
      show(index);
      dialog.showModal();
    });
  });
}

function initReveal(){
  const targets = document.querySelectorAll(".reveal");
  if(targets.length === 0){
    return;
  }

  if(Motion.reduced() || !("IntersectionObserver" in window)){
    targets.forEach((el) => {
      el.classList.add(IN_CLASS);
      el.classList.remove("stagger");
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add(IN_CLASS);
        observer.unobserve(entry.target);
        settleStagger(entry.target);
      }
    });
  }, {rootMargin: "0px 0px -8% 0px", threshold: 0.08});

  targets.forEach((el) => observer.observe(el));
}

function fieldOf(input){
  return input.closest(".field");
}

function showFieldError(input, message){
  const field = fieldOf(input);
  if(!field){
    return;
  }
  field.classList.add("has-error");
  const slot = field.querySelector(".field-error");
  if(slot){
    slot.textContent = message;
  }
  input.setAttribute("aria-invalid", "true");
}

function clearFieldError(input){
  const field = fieldOf(input);
  if(!field){
    return;
  }
  field.classList.remove("has-error");
  const slot = field.querySelector(".field-error");
  if(slot){
    slot.textContent = "";
  }
  input.removeAttribute("aria-invalid");
}

function validate(form){
  let firstBad = null;

  form.querySelectorAll("[data-required]").forEach((input) => {
    clearFieldError(input);

    if(Str.blank(input.value)){
      showFieldError(input, "Required");
      firstBad = firstBad || input;
      return;
    }

    if(input.type === "email" && !EMAIL_PATTERN.test(input.value.trim())){
      showFieldError(input, "Enter a valid email address");
      firstBad = firstBad || input;
    }
  });

  if(firstBad){
    firstBad.focus();
    return false;
  }
  return true;
}

function setStatus(form, message, isError){
  const status = form.querySelector(".form-status");
  if(!status){
    return;
  }
  status.textContent = message;
  status.classList.toggle("is-error", Boolean(isError));
  status.classList.add("is-visible");
}

function clearStatus(form){
  const status = form.querySelector(".form-status");
  if(status){
    status.textContent = "";
    status.classList.remove("is-visible", "is-error");
  }
}

function showSent(form){
  const done = form.querySelector("[data-form-done]");
  if(!done){
    setStatus(form, SENT_MESSAGE, false);
    return;
  }
  clearStatus(form);
  form.classList.add(SENT_CLASS);
  done.focus();
}

function mailtoFallback(form, payload){
  if(Str.blank(SITE.contactEmail)){
    setStatus(form, "This form has no destination yet — set the form action in contact.html, or contactEmail in assets/js/site.js.", true);
    return;
  }

  const body = Object.entries(payload)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Project enquiry — " + (payload.company || payload.name))}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
  setStatus(form, "Opening your email client with the message ready to send.", false);
}

async function postToEndpoint(form, endpoint, payload, captcha){
  const submit = form.querySelector("[type=submit]");
  const original = submit ? submit.innerHTML : "";

  if(submit){
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    submit.textContent = "Sending…";
  }

  try{
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => body.append(key, value));

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {Accept: "application/json"},
      body: body,
    });

    if(!response.ok){
      throw new Error(`Request failed with ${response.status}`);
    }

    form.reset();
    showSent(form);
  }catch(error){
    const direct = Str.notBlank(SITE.contactEmail) ? ` Or email ${SITE.contactEmail}.` : "";
    setStatus(form, SEND_FAILED + direct, true);
  }finally{
    /* A token is good for one attempt, sent or not. */
    captcha.reset();
    if(submit){
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submit.innerHTML = original;
    }
  }
}

/* The check is fetched only once someone starts on the form, so no other page,
   and no visit that never touches the form, calls Cloudflare. */
function initCaptcha(form){
  const slot = form.querySelector("[data-captcha]");
  const key = slot ? slot.getAttribute("data-sitekey") : "";
  const captcha = {
    enabled: Str.notBlank(key),
    reset(){},
  };
  if(!captcha.enabled){
    return captcha;
  }

  let widget = null;
  let requested = false;
  slot.hidden = false;

  captcha.reset = () => {
    if(widget !== null){
      window.turnstile.reset(widget);
    }
  };

  const load = () => {
    if(requested){
      return;
    }
    requested = true;

    const script = document.createElement("script");
    script.src = CAPTCHA_SCRIPT;
    script.async = true;
    script.addEventListener("load", () => {
      slot.textContent = "";
      widget = window.turnstile.render(slot, {
        sitekey: key,
        theme: currentTheme(),
        size: slot.clientWidth < CAPTCHA_FULL_WIDTH ? "compact" : "flexible",
      });
    });
    script.addEventListener("error", () => setStatus(form, CAPTCHA_FAILED, true));
    document.head.appendChild(script);
  };

  CAPTCHA_TRIGGERS.forEach((trigger) => form.addEventListener(trigger, load));
  return captcha;
}

/* Service pages link here with ?need=<slug>, which preselects the matching option. */
function initNeed(){
  const select = document.querySelector("[data-need-select]");
  if(!select){
    return;
  }

  const need = new URLSearchParams(window.location.search).get(NEED_PARAM);
  if(Str.blank(need)){
    return;
  }

  const option = Array.from(select.options).find((item) => item.getAttribute("data-need") === need);
  if(option){
    select.value = option.value;
  }
}

function foldMapIntoMessage(payload){
  if(Str.notBlank(payload[MAP_FIELD])){
    const lines = [payload[MESSAGE_FIELD], "", "PROCESS MAP, ATTACHED FROM THE SITE", payload[MAP_FIELD]];
    if(Str.notBlank(payload[MAP_LINK_FIELD])){
      lines.push("", `Reopen it: ${payload[MAP_LINK_FIELD]}`);
    }
    payload[MESSAGE_FIELD] = lines.join("\n");
  }
  delete payload[MAP_FIELD];
  delete payload[MAP_LINK_FIELD];
}

function initForm(){
  const form = document.querySelector("[data-contact-form]");
  if(!form){
    return;
  }

  /* Without JavaScript the browser validates and posts the form itself. */
  form.noValidate = true;

  const captcha = initCaptcha(form);

  form.querySelectorAll("[data-required]").forEach((input) => {
    input.addEventListener("input", () => clearFieldError(input));
  });

  const again = form.querySelector("[data-form-again]");
  if(again){
    again.addEventListener("click", () => {
      form.classList.remove(SENT_CLASS);
      form.querySelector("input").focus();
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const honeypot = form.querySelector("[name=_gotcha]");
    if(honeypot && Str.notBlank(honeypot.value)){
      return;
    }

    if(!validate(form)){
      return;
    }

    const payload = {};
    new FormData(form).forEach((value, key) => {
      if(key !== "_gotcha"){
        payload[key] = String(value).trim();
      }
    });

    foldMapIntoMessage(payload);

    if(captcha.enabled && Str.blank(payload[CAPTCHA_FIELD])){
      setStatus(form, CAPTCHA_PENDING, true);
      return;
    }

    const endpoint = form.getAttribute("action");
    if(Str.notBlank(endpoint)){
      clearStatus(form);
      postToEndpoint(form, endpoint, payload, captcha);
      return;
    }
    mailtoFallback(form, payload);
  });
}

function initYear(){
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

initTheme();
initMobileNav();
initHeader();
initHeroPointer();
initSplit();
initSpot();
initMagnet();
initTilt();
initSpy();
initZoom();
initReveal();
initNeed();
initForm();
initYear();
