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
  const whatsappNumber = "212659377324";
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

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity() || submit.disabled) return;

    const fields = new FormData(form);
    const rating = String(fields.get("rating") || "");
    const name = String(fields.get("name") || "Visitor").trim() || "Visitor";
    const feedback = String(fields.get("feedback") || "").trim();
    const message = [
      "Portfolio feedback — MASSYNE",
      `Rating: ${rating}/5`,
      `Name: ${name}`,
      "",
      feedback
    ].join("\n");
    const target = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    if (status) status.textContent = "WhatsApp is opening with your feedback. Review it and press Send.";
    const opened = window.open(target, "_blank");
    if (opened) opened.opener = null;
    else window.location.href = target;
  });
})();
