const SITE_PASSWORD = "MASSYNE2026";
const UNLOCK_KEY = "massyne_site_unlocked";
const siteLock = document.querySelector("#siteLock");
const siteLockForm = document.querySelector("#siteLockForm");
const siteLockPassword = document.querySelector("#siteLockPassword");
const siteLockMessage = document.querySelector("#siteLockMessage");

const unlockSite = () => {
  try {
    localStorage.setItem(UNLOCK_KEY, "yes");
  } catch (error) {
    // Access remains available for the current page when storage is blocked.
  }

  siteLock.classList.add("is-unlocking");
  window.setTimeout(() => {
    document.documentElement.classList.remove("site-locked");
    siteLock.classList.remove("is-unlocking");
  }, 220);
};

siteLockForm?.addEventListener("submit", event => {
  event.preventDefault();

  if (siteLockPassword.value === SITE_PASSWORD) {
    siteLockMessage.textContent = "";
    unlockSite();
    return;
  }

  siteLockMessage.textContent = "Incorrect password. Please try again.";
  siteLockPassword.select();
});

const siteLockDisclosure = document.querySelector("#siteLockDisclosure");
const siteLockAccess = document.querySelector("#siteLockAccess");

siteLockDisclosure?.addEventListener("click", () => {
  const expanded = siteLockDisclosure.getAttribute("aria-expanded") !== "true";
  siteLockDisclosure.setAttribute("aria-expanded", String(expanded));
  siteLockAccess.hidden = !expanded;
  siteLockDisclosure.querySelector(".site-lock-toggle").textContent = expanded ? "−" : "+";
  if (expanded) siteLockPassword.focus();
});
