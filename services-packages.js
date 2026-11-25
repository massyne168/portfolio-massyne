/* MASSYNE — Package selection pre-fills #project-brief without interrupting native/panel navigation. */
(() => {
  "use strict";

  const triggers = document.querySelectorAll("[data-package-cta]");
  if (!triggers.length) return;

  const form = document.getElementById("project-brief");
  const typeSelect = document.getElementById("brief-type");
  const budgetSelect = document.getElementById("brief-budget");
  const timelineSelect = document.getElementById("brief-timeline");
  const nameInput = document.getElementById("brief-name");
  const feedback = document.getElementById("brief-feedback");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setSelectValue = (select, value) => {
    if (!select || !value) return false;
    const match = Array.from(select.options).some(opt => opt.value === value || opt.text === value);
    if (!match) return false;
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  triggers.forEach(trigger => {
    trigger.addEventListener("click", () => {
      const packageName = trigger.dataset.packageName || "Selected package";
      const packageType = trigger.dataset.packageType || "";
      const packageBudget = trigger.dataset.packageBudget || "";
      const packageTimeline = trigger.dataset.packageTimeline || "";

      setSelectValue(typeSelect, packageType);
      setSelectValue(budgetSelect, packageBudget);
      setSelectValue(timelineSelect, packageTimeline);

      if (feedback) {
        feedback.textContent = packageBudget
          ? `Selected: ${packageName} (${packageBudget}) — complete your details below.`
          : `Selected: ${packageName} — complete your details below.`;
      }

      if (form) {
        form.classList.remove("is-prefilled");
        void form.offsetWidth;
        form.classList.add("is-prefilled");
      }

      if (nameInput) {
        const delay = reducedMotion.matches ? 40 : 420;
        window.setTimeout(() => {
          if (document.body.contains(nameInput)) {
            nameInput.focus({ preventScroll: true });
          }
        }, delay);
      }
    });
  });
})();
