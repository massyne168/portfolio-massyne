(() => {
  "use strict";

  const accessScreen = document.getElementById("studio-access-screen");
  const accessForm = document.getElementById("studio-access-form");
  const accessCode = document.getElementById("studio-access-code");
  const accessMessage = document.getElementById("studio-access-message");
  const accessSubmit = accessForm?.querySelector('button[type="submit"]');
  const workspace = document.querySelector(".studio-frame");
  let dashboardLoaded = false;

  const setMessage = (message, isError = true) => {
    if (!accessMessage) return;
    accessMessage.textContent = message;
    accessMessage.classList.toggle("is-error", isError);
  };

  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error("The dashboard could not load. Refresh and try again."));
    document.body.append(script);
  });

  async function enterWorkspace() {
    if (dashboardLoaded) return;
    dashboardLoaded = true;
    accessScreen.hidden = true;
    workspace.hidden = false;
    try {
      await loadScript("/project-data.js");
      await loadScript("/studio.js");
    } catch (error) {
      dashboardLoaded = false;
      workspace.hidden = true;
      accessScreen.hidden = false;
      setMessage(error.message);
    }
  }

  async function requestSession(options = {}) {
    const response = await fetch("/api/studio-access", {
      cache: "no-store",
      credentials: "same-origin",
      ...options
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  accessForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const code = String(accessCode?.value || "").trim();
    if (!code) return setMessage("Enter your private access code.");
    if (accessSubmit) {
      accessSubmit.disabled = true;
      accessSubmit.textContent = "CHECKING CODE…";
    }
    setMessage("Checking your code…", false);
    try {
      const { response, data } = await requestSession({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      if (!response.ok || !data.authenticated) {
        if (response.status === 503) throw new Error("Studio access is not configured yet. Ask the site owner to finish setup.");
        throw new Error(data.message || "That code did not match. Try again.");
      }
      accessCode.value = "";
      await enterWorkspace();
    } catch (error) {
      setMessage(error.message || "Could not check the code. Please try again.");
    } finally {
      if (accessSubmit) {
        accessSubmit.disabled = false;
        accessSubmit.textContent = "ENTER THE STUDIO";
      }
    }
  });

  document.addEventListener("click", async event => {
    if (!event.target.closest("[data-studio-logout]")) return;
    const button = event.target.closest("[data-studio-logout]");
    button.disabled = true;
    try {
      await requestSession({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" })
      });
    } finally {
      window.location.reload();
    }
  });

  requestSession().then(({ response, data }) => {
    if (response.ok && data.authenticated) return enterWorkspace();
    if (response.status === 503 || data.configured === false) {
      setMessage("Private access is not available yet. Please contact the site owner.");
    }
    accessCode?.focus({ preventScroll: true });
  }).catch(() => {
    setMessage("Could not reach the access check. Please refresh and try again.");
  });
})();
