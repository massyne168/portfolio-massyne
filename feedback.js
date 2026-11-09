/* MASSYNE / compact portfolio feedback form. */
(() => {
  "use strict";

  const panel = document.getElementById("portfolio-feedback");
  const form = document.getElementById("portfolio-feedback-form");
  const status = document.getElementById("feedback-status");
  const submit = form?.querySelector("button[type='submit']");
  const contact = document.getElementById("contact");
  const main = document.getElementById("top");
  const footer = document.querySelector(".footer-reveal-shell");
  const mobileQuery = window.matchMedia("(max-width: 850px)");
  const recipient = "aazizimassine@gmail.com";
  const railOpeners = [...document.querySelectorAll("[data-feedback-open]")];

  if (!panel || !form || !submit) return;
  if (railOpeners.length) panel.classList.add("has-rail-opener");

  const placePanel = () => {
    if (mobileQuery.matches && contact) {
      panel.classList.add("is-inline-mobile");
      panel.open = true;
      const footerInContact = footer?.parentElement === contact ? footer : null;
      contact.insertBefore(panel, footerInContact);
      return;
    }

    panel.classList.remove("is-inline-mobile");
    panel.open = false;
    if (main?.parentElement) main.after(panel);
  };
  placePanel();
  mobileQuery.addEventListener("change", placePanel);

  const ratingInputs = [...form.querySelectorAll("input[name='rating']")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncRailOpeners = () => railOpeners.forEach(button => button.setAttribute("aria-expanded", String(panel.open)));
  railOpeners.forEach(button => button.addEventListener("click", () => {
    if (mobileQuery.matches) {
      panel.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
      return;
    }

    panel.open = !panel.open;
    syncRailOpeners();
    if (panel.open) ratingInputs[0]?.focus({ preventScroll: true });
  }));
  panel.addEventListener("toggle", syncRailOpeners);

  const paintRating = () => {
    const value = Number(ratingInputs.find(input => input.checked)?.value || 0);
    ratingInputs.forEach(input => input.closest("label")?.classList.toggle("is-active", Number(input.value) <= value));
  };
  ratingInputs.forEach(input => input.addEventListener("change", paintRating));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity() || submit.disabled) return;

    const fields = new FormData(form);
    const payload = {
      _subject: "Portfolio feedback — MASSYNE",
      _template: "table",
      _honey: String(fields.get("_honey") || ""),
      rating: String(fields.get("rating") || ""),
      name: String(fields.get("name") || "Visitor").trim() || "Visitor",
      feedback: String(fields.get("feedback") || "").trim()
    };

    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    if (status) status.textContent = "Sending your feedback…";

    try {
      const response = await fetch("https://formsubmit.co/ajax/" + recipient, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const accepted = response.ok && (result.success === true || result.success === "true");

      if (!accepted) {
        const activation = /activat|confirm/i.test(String(result.message || ""));
        if (status) status.textContent = activation
          ? "Email delivery needs one-time inbox activation. Please email me directly using the link below."
          : "Feedback could not be delivered. Please email me directly using the link below.";
        return;
      }

      form.reset();
      paintRating();
      if (status) status.textContent = "Thanks — your feedback was sent privately.";
    } catch (_) {
      if (status) status.textContent = "Could not connect to the email service. Please email me directly using the link below.";
    } finally {
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
    }
  });
})();
