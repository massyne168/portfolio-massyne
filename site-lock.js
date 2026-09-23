/* Client-side preview gate. Keep all access-screen behavior scoped here. */
(() => {
  const lock = document.querySelector("#siteLock");
  const form = document.querySelector("#siteLockForm");
  const input = document.querySelector("#siteLockPassword");
  const message = document.querySelector("#siteLockMessage");
  if (!lock || !form || !input || !message) return;

  const root = document.documentElement;
  const key = "massyne_site_unlocked";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const siblings = [...document.body.children].filter(element => element !== lock && !["SCRIPT", "STYLE"].includes(element.tagName));
  const previousInert = new Map(siblings.map(element => [element, element.inert]));
  let unlocking = false;

  if (root.classList.contains("site-locked")) {
    siblings.forEach(element => { element.inert = true; });
  }

  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    message.textContent = "";
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (unlocking) return;
    if (input.value !== "MASSYNE") {
      message.textContent = "Incorrect access code. Please try again.";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      input.select();
      return;
    }

    unlocking = true;
    message.textContent = "Access granted.";
    input.removeAttribute("aria-invalid");
    try { localStorage.setItem(key, "yes"); } catch (error) {
      // Still allow access for this visit when storage is unavailable.
    }
    // Consume the reset flag so reloading after entry remembers access.
    const url = new URL(window.location.href);
    if (url.searchParams.has("lock")) {
      url.searchParams.delete("lock");
      try { history.replaceState(history.state, "", url); } catch (error) { /* Optional URL cleanup. */ }
    }
    lock.classList.add("is-unlocking");
    window.setTimeout(() => {
      root.classList.remove("site-locked");
      lock.classList.remove("is-unlocking");
      siblings.forEach(element => { element.inert = previousInert.get(element); });
      input.value = "";
      const destination = document.querySelector(".site-header a, main a, main button");
      destination?.focus({ preventScroll: true });
    }, reducedMotion.matches ? 0 : 800);
  });
})();
