const ownerLogin = document.querySelector("#ownerLogin");
const ownerPassword = document.querySelector("#ownerPassword");
const loginMessage = document.querySelector("#loginMessage");

ownerLogin?.addEventListener("submit", async event => {
  event.preventDefault();

  const password = ownerPassword.value;
  const submitButton = ownerLogin.querySelector('button[type="submit"]');

  if (!password) {
    loginMessage.textContent = "Enter the private password.";
    ownerPassword.focus();
    return;
  }

  submitButton.disabled = true;
  loginMessage.textContent = "Checking access…";

  try {
    const response = await fetch("/api/maintenance-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Access denied.");
    }

    loginMessage.textContent = "Access granted. Opening portfolio…";
    window.location.replace("/");
  } catch (error) {
    loginMessage.textContent = error.message || "Unable to verify access.";
    ownerPassword.select();
  } finally {
    submitButton.disabled = false;
  }
});
