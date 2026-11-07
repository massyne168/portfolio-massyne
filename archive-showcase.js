/* Archive cards stay in a simple grid; script.js owns filtering and previews. */
(() => {
  "use strict";
  const grid = document.querySelector("#archive .archive-grid");
  if (!grid) return;
  grid.setAttribute("role", "group");
  grid.setAttribute("aria-label", "Archive artwork");
})();
