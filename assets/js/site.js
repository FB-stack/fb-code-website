/* FB Code LLC — site behaviour. Set the two values in SITE before going live. */

const SITE = {
  contactEmail: "",
  formEndpoint: "",
};

const Str = {
  blank(value){
    return value === null || value === undefined || String(value).trim().length === 0;
  },
  notBlank(value){
    return !Str.blank(value);
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

/* Pointer parallax on the hero mark. Translation only — the mark is never
   rotated or mirrored, and it never moves on its own. */
function initHeroParallax(){
  const hero = document.querySelector(".hero");
  const mark = hero ? hero.querySelector(".hero-art") : null;
  if(!hero || !mark){
    return;
  }
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    return;
  }
  if(!window.matchMedia("(hover: hover) and (pointer: fine)").matches){
    return;
  }

  const set = (x, y) => {
    mark.style.setProperty("--mx", x.toFixed(3));
    mark.style.setProperty("--my", y.toFixed(3));
  };

  hero.addEventListener("pointermove", (event) => {
    const box = hero.getBoundingClientRect();
    set((event.clientX - box.left) / box.width - 0.5, (event.clientY - box.top) / box.height - 0.5);
  });

  hero.addEventListener("pointerleave", () => set(0, 0));
}

/* The red spotlight on cards follows the pointer via --x/--y. */
function initSpotlight(){
  if(!window.matchMedia("(hover: hover) and (pointer: fine)").matches){
    return;
  }
  document.querySelectorAll(".card, .service-row").forEach((el) => {
    el.addEventListener("pointermove", (event) => {
      const box = el.getBoundingClientRect();
      el.style.setProperty("--x", `${event.clientX - box.left}px`);
      el.style.setProperty("--y", `${event.clientY - box.top}px`);
    });
  });
}

function initReveal(){
  const targets = document.querySelectorAll(".reveal");
  if(targets.length === 0){
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced || !("IntersectionObserver" in window)){
    targets.forEach((el) => {
      el.classList.add("is-in");
      el.classList.remove("stagger");
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add("is-in");
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

function mailtoFallback(form, payload){
  if(Str.blank(SITE.contactEmail)){
    setStatus(form, "This form has no destination yet — set contactEmail or formEndpoint in assets/js/site.js.", true);
    return;
  }

  const body = Object.entries(payload)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Project enquiry — " + (payload.company || payload.name))}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
  setStatus(form, "Opening your email client with the message ready to send.", false);
}

async function postToEndpoint(form, payload){
  const submit = form.querySelector("[type=submit]");
  const original = submit ? submit.innerHTML : "";

  if(submit){
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    submit.textContent = "Sending…";
  }

  try{
    const response = await fetch(SITE.formEndpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json", Accept: "application/json"},
      body: JSON.stringify(payload),
    });

    if(!response.ok){
      throw new Error(`Request failed with ${response.status}`);
    }

    form.reset();
    setStatus(form, "Message sent. You will hear back from an engineer within one business day.", false);
  }catch(error){
    setStatus(form, "That did not send. Email us directly and we will pick it up.", true);
  }finally{
    if(submit){
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submit.innerHTML = original;
    }
  }
}

function initForm(){
  const form = document.querySelector("[data-contact-form]");
  if(!form){
    return;
  }

  form.querySelectorAll("[data-required]").forEach((input) => {
    input.addEventListener("input", () => clearFieldError(input));
  });

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

    if(Str.notBlank(SITE.formEndpoint)){
      postToEndpoint(form, payload);
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
initHeroParallax();
initSpotlight();
initReveal();
initForm();
initYear();
