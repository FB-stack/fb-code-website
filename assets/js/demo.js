/* FB Code LLC — a working model of the access console. Demo doors, demo sites:
   nothing here is a client's data, and only the visitor's own clicks make events.
   Loads after site.js, which provides Motion. */

const DOOR_OPEN_MS = 2600;
const LOG_MAX = 7;
const FLY_MS = 520;
const OPEN_CLASS = "is-open";
const DENIED_CLASS = "is-denied";
const GRANTED = "Granted";
const DENIED = "Denied";
const REVOKED_DOOR = "Main entrance · Site A";

function clockText(){
  return new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false});
}

/* A dot travels from the door to the log, so the event is seen arriving. */
function flyDot(from, to, denied){
  if(Motion.reduced() || typeof from.animate !== "function"){
    return Promise.resolve();
  }

  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const dot = document.createElement("span");
  dot.className = denied ? "demo-dot is-denied" : "demo-dot";
  dot.style.left = `${a.left + a.width / 2}px`;
  dot.style.top = `${a.top + a.height / 2}px`;
  document.body.appendChild(dot);

  const dx = b.left + 24 - (a.left + a.width / 2);
  const dy = b.top + 24 - (a.top + a.height / 2);

  const flight = dot.animate([
    {transform: "translate(-50%, -50%) scale(.4)", opacity: 0},
    {transform: `translate(calc(-50% + ${dx * 0.4}px), calc(-50% + ${dy * 0.4 - 28}px)) scale(1.5)`, opacity: 1, offset: 0.4},
    {transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.6)`, opacity: 0.9},
  ], {duration: FLY_MS, easing: "cubic-bezier(.3,.6,.3,1)"});

  return flight.finished.then(() => dot.remove(), () => dot.remove());
}

function initDemo(root){
  const log = root.querySelector("[data-demo-log]");
  const empty = root.querySelector("[data-demo-empty]");
  const clock = root.querySelector("[data-demo-clock]");
  const count = {granted: 0, denied: 0, open: 0};
  const timers = new Map();

  const paintCounts = () => {
    root.querySelector("[data-demo-granted]").textContent = String(count.granted);
    root.querySelector("[data-demo-denied]").textContent = String(count.denied);
    root.querySelector("[data-demo-open]").textContent = String(count.open);
  };

  const addEvent = (door, by, result) => {
    const row = document.createElement("li");
    row.className = result === DENIED ? "demo-event is-denied" : "demo-event";

    const time = document.createElement("span");
    time.className = "num";
    time.textContent = clockText();

    const what = document.createElement("span");
    what.className = "demo-event-what";
    const strong = document.createElement("strong");
    strong.textContent = door;
    const detail = document.createElement("span");
    detail.textContent = by;
    what.append(strong, detail);

    const badge = document.createElement("span");
    badge.className = "demo-badge";
    badge.textContent = result;

    row.append(time, what, badge);
    log.prepend(row);
    while(log.children.length > LOG_MAX){
      log.lastElementChild.remove();
    }
    if(empty){
      empty.hidden = true;
    }
  };

  const setDoor = (button, open) => {
    button.classList.toggle(OPEN_CLASS, open);
    button.setAttribute("aria-pressed", String(open));
    button.querySelector("[data-door-state]").textContent = open ? "Open" : "Locked · tap to open";
  };

  root.querySelectorAll("[data-door]").forEach((button) => {
    button.addEventListener("click", () => {
      if(button.classList.contains(OPEN_CLASS)){
        return;
      }

      setDoor(button, true);
      count.open += 1;
      count.granted += 1;
      paintCounts();

      const tally = button.querySelector("[data-door-count]");
      tally.textContent = String(Number(tally.textContent) + 1);
      tally.hidden = false;

      flyDot(button, log, false).then(() => addEvent(button.getAttribute("data-door"), "Opened remotely by you", GRANTED));

      timers.set(button, window.setTimeout(() => {
        setDoor(button, false);
        count.open -= 1;
        paintCounts();
      }, DOOR_OPEN_MS));
    });
  });

  const deny = root.querySelector("[data-demo-deny]");
  if(deny){
    deny.addEventListener("click", () => {
      count.denied += 1;
      paintCounts();

      root.classList.remove(DENIED_CLASS);
      void root.offsetWidth;
      root.classList.add(DENIED_CLASS);

      flyDot(deny, log, true).then(() => addEvent(REVOKED_DOOR, "Revoked card presented", DENIED));
    });
  }

  if(clock){
    const tick = () => {
      clock.textContent = clockText();
    };
    tick();
    window.setInterval(tick, 1000);
  }

  paintCounts();
  root.classList.add("is-ready");
}

document.querySelectorAll("[data-demo]").forEach(initDemo);
