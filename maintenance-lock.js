/**
 * MASSYNE Liquid Glass Maintenance Lock Overlay
 * All classes prefixed with m-gate- for isolation
 * Passcode: "SALMA" (case-insensitive, trimmed)
 * Zero-flash implementation: body hidden immediately on page load
 */

(() => {
  "use strict";

  const STORAGE_KEY = "m-gate-unlocked";
  const CORRECT_PASSCODE = "salma";
  const PASSCODE = "SALMA";

  // Hide body immediately for zero-flash
  // This runs synchronously before DOMContentLoaded fires
  try {
    const body = document.body;
    if (body) {
      body.classList.add("m-gate-hidden");
    }
  } catch (_) {}

  // Check if already unlocked - synchronous check
  function isAlreadyUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch (_) {
      return false;
    }
  }

  // Show body and remove hidden class
  function revealBody() {
    try {
      const body = document.body;
      if (body) {
        body.classList.remove("m-gate-hidden");
        body.classList.add("m-gate-unlocked");
      }
    } catch (_) {}
  }

  // Create the overlay HTML
  function createMaintenanceOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "m-gate-maintenance";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "System Maintenance");
    overlay.tabIndex = -1;

    overlay.innerHTML = `
      <div class="m-gate-card" role="document" aria-describedby="m-gate-heading">
        <div class="m-gate-logo-container">
          <img
            class="m-gate-logo-image"
            src="https://pub-c78e3daeef5841a99f5ce6ad0ebd9fdf.r2.dev/images/optimized/flame-metal-logo-480.webp"
            alt="MASSYNE logo"
            width="120"
            height="60"
          />
          <div class="m-gate-wordmark">MASSYNE</div>
        </div>

        <div class="m-gate-badge" aria-hidden="true">SYSTEM MAINTENANCE</div>

        <h2 class="m-gate-heading" id="m-gate-heading">
          UPGRADING EXPERIENCE
        </h2>

        <p class="m-gate-subtitle">
          A quick security check to ensure smooth operations.
        </p>

        <form class="m-gate-form" id="m-gate-form" autocomplete="off">
          <label for="m-gate-password">ENTER PASSCODE</label>
          <div class="m-gate-input-wrapper">
            <input
              class="m-gate-password"
              type="password"
              id="m-gate-password"
              name="password"
              autocomplete="off"
              maxlength="20"
              spellcheck="false"
              aria-describedby="m-gate-error"
              placeholder="ENTER PASSCODE"
            />
            <button
              type="submit"
              class="m-gate-button"
              aria-label="Unlock system"
            >
              UNLOCK
            </button>
          </div>
          <div class="m-gate-error" id="m-gate-error" role="alert" aria-live="polite">
            ACCESS DENIED
          </div>
        </form>
      </div>
    `;

    return overlay;
  }

  // Lock the body scroll
  function lockBodyScroll() {
    document.documentElement.classList.add("m-gate-locked");
  }

  // Unlock and remove overlay
  function unlockSystem(overlay) {
    if (!overlay) return;

    // Save unlock state to sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch (_) {}

    // Add fade-out class for smooth transition
    const card = overlay.querySelector(".m-gate-card");
    if (card) {
      card.classList.add("m-gate-fade-out");
    }

    // Remove overlay after animation
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      document.documentElement.classList.remove("m-gate-locked");

      // Restore body scroll
      document.body.style.overflow = "";
      document.body.style.height = "";

      // Reveal body content
      revealBody();
    }, 350);
  }

  // Show error with shake animation
  function showError(passwordInput, errorElement) {
    errorElement.classList.add("is-visible");
    passwordInput.classList.add("m-gate-shake");
    passwordInput.focus();

    // Remove shake class after animation completes
    setTimeout(() => {
      passwordInput.classList.remove("m-gate-shake");
      errorElement.classList.remove("is-visible");
    }, 520);

    // Clear the input
    passwordInput.value = "";
  }

  // Show the lock immediately - always show on page load until unlocked
  function initMaintenanceLock() {
    // If already unlocked, reveal body and return
    if (isAlreadyUnlocked()) {
      revealBody();
      return;
    }

    // Add locked class to body/html
    lockBodyScroll();

    // Create and inject overlay
    const overlay = createMaintenanceOverlay();
    document.body.appendChild(overlay);

    // Get form elements
    const form = overlay.querySelector("#m-gate-form");
    const passwordInput = overlay.querySelector("#m-gate-password");
    const errorElement = overlay.querySelector("#m-gate-error");

    if (!form || !passwordInput || !errorElement) return;

    // Handle form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const enteredPassword = passwordInput.value.trim().toLowerCase();

      if (enteredPassword === CORRECT_PASSCODE) {
        unlockSystem(overlay);
      } else {
        showError(passwordInput, errorElement);
      }
    });

    // Handle Enter key press on input
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });

    // Handle Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.parentNode) {
        // Only allow escape if already unlocked (which it won't be, so ignore)
        // Or we can allow escape to skip - let's not allow that for security
      }
    }, { once: true });

    // Focus the password input after a short delay
    setTimeout(() => {
      passwordInput.focus();
    }, 100);
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMaintenanceLock);
  } else {
    initMaintenanceLock();
  }

  // Expose control functions
  window.MaintenanceGate = {
    lock() {
      if (!isAlreadyUnlocked() && !document.querySelector(".m-gate-maintenance")) {
        initMaintenanceLock();
      }
    },
    unlock() {
      const overlay = document.querySelector(".m-gate-maintenance");
      if (overlay) {
        try {
          sessionStorage.setItem(STORAGE_KEY, "true");
        } catch (_) {}
        unlockSystem(overlay);
      } else {
        // If no overlay, just reveal body
        revealBody();
      }
    },
    reset() {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      document.documentElement.classList.remove("m-gate-locked");
      document.body.classList.remove("m-gate-unlocked", "m-gate-hidden");
    }
  };

})();