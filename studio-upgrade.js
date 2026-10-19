/* MASSYNE / Studio upgrade: functional brief + lightweight original-video reel. */
(() => {
  "use strict";

  // CONTACT — a transparent, backend-free email handoff. Do not pretend an email was sent.
  const form = document.getElementById("project-brief");
  const feedback = document.getElementById("brief-feedback");
  const copyButton = document.getElementById("copy-brief");
  const recipient = "aazizimassine@gmail.com";
  const buildBrief = () => {
    if (!form || !form.reportValidity()) return null;
    const fields = new FormData(form);
    const read = name => String(fields.get(name) || "").trim();
    return {
      subject: "New creative project inquiry — " + read("type"),
      body: [
        "Hello MASSYNE,",
        "",
        "I'd like to discuss a creative project.",
        "",
        "Name: " + read("name"),
        "Email: " + read("email"),
        "Project type: " + read("type"),
        "Estimated budget: " + (read("budget") || "Not specified"),
        "Timeline: " + (read("timeline") || "Flexible"),
        "Reference: " + (read("reference") || "Not provided"),
        "",
        "PROJECT DESCRIPTION",
        read("message"),
        "",
        "— Sent from the MASSYNE portfolio brief composer"
      ].join("\n")
    };
  };
  const note = text => { if (feedback) feedback.textContent = text; };
  form?.addEventListener("submit", event => {
    event.preventDefault();
    const brief = buildBrief();
    if (!brief) return;
    const target = "mailto:" + recipient +
      "?subject=" + encodeURIComponent(brief.subject) +
      "&body=" + encodeURIComponent(brief.body);
    note("Opening your email application. Review the message and press Send there.");
    window.location.href = target;
  });
  copyButton?.addEventListener("click", async () => {
    const brief = buildBrief();
    if (!brief) return;
    const text = "TO: " + recipient + "\nSUBJECT: " + brief.subject + "\n\n" + brief.body;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("No clipboard API");
      await navigator.clipboard.writeText(text);
      note("Brief copied. Paste it into an email to " + recipient + ".");
    } catch (_) {
      // Manual copy fallback: show the complete composed brief, preselect it for Ctrl+C.
      const output = document.getElementById("brief-output");
      if (output) {
        output.hidden = false;
        output.value = text;
        output.focus();
        output.select();
        note("Clipboard permission unavailable. Press Ctrl+C (or Copy on mobile) to copy the selected brief.");
      } else {
        note("Clipboard unavailable. Use the email button instead.");
      }
    }
  });

  // SHOWREEL — stitched at play time from the site's existing six MP4s, up to 5s each.
  // User-initiated; no heavy third-party video libraries, no fabricated video file.
  const reel = document.getElementById("showreel-player");
  const open = document.getElementById("showreel-play");
  if (!reel || !open) return;
  // Keep the clips independently of the removed six-player motion grid.
  const clips = Array.from({length:6}, (_, i) => `images/optimized/motion${i + 1}.mp4`);
  const indicators = Array.from(document.querySelectorAll("[data-reel-index]"));
  const prev = document.getElementById("reel-prev");
  const next = document.getElementById("reel-next");
  const toggle = document.getElementById("reel-toggle");
  const mute = document.getElementById("reel-mute");
  const state = document.getElementById("showreel-state");
  const maxPerClip = 5;
  let active = 0;
  let initialized = false;
  let completed = false;
  let switching = false;

  const status = message => { if (state) state.textContent = message; };
  const refresh = () => {
    indicators.forEach((button, i) => {
      if (i === active) button.setAttribute("aria-current","step");
      else button.removeAttribute("aria-current");
      button.classList.toggle("is-complete", initialized && i < active);
    });
    if (toggle) {
      toggle.textContent = reel.paused ? "PLAY ▶" : "PAUSE Ⅱ";
      toggle.setAttribute("aria-label", reel.paused ? "Play showreel" : "Pause showreel");
    }
    if (mute) {
      mute.textContent = reel.muted ? "SOUND OFF" : "SOUND ON";
      mute.setAttribute("aria-label", reel.muted ? "Unmute showreel" : "Mute showreel");
    }
  };
  const play = async () => {
    try {
      await reel.play();
      open.hidden = true;
      status("PLAYING / STUDY " + String(active + 1).padStart(2,"0") + " OF " + clips.length);
      refresh();
    } catch (_) {
      status("Playback could not start. Please press PLAY again.");
      refresh();
    }
  };
  const choose = (index, autoplay) => {
    if (!clips.length) {
      status("Motion clips are unavailable.");
      return;
    }
    switching = true;
    active = (index + clips.length) % clips.length;
    completed = false;
    initialized = true;
    reel.pause();
    reel.src = clips[active];
    reel.preload = "auto";
    reel.load();
    switching = false;
    open.hidden = true;
    status("READY / STUDY " + String(active + 1).padStart(2,"0") + " OF " + clips.length);
    refresh();
    if (autoplay) void play();
  };
  const complete = () => {
    reel.pause();
    completed = true;
    open.hidden = false;
    open.querySelector("strong").textContent = "REPLAY THE SHOWREEL";
    status("FINISHED / SIX ORIGINAL MOTION STUDIES");
    refresh();
  };
  const advance = () => {
    if (active >= clips.length - 1) complete();
    else choose(active + 1,true);
  };
  const start = () => {
    if (!clips.length) { status("No video clips found.");return; }
    if (!initialized || completed) choose(0,true);
    else void play();
  };
  open.addEventListener("click",start);
  toggle?.addEventListener("click", () => {
    if (!initialized || completed) {start();return;}
    if (reel.paused) void play(); else reel.pause();
    refresh();
  });
  prev?.addEventListener("click", () => choose(active - 1,true));
  next?.addEventListener("click", () => choose(active + 1,true));
  indicators.forEach((button,i)=>button.addEventListener("click",()=>choose(i,true)));
  mute?.addEventListener("click", () => {
    reel.muted = !reel.muted;
    refresh();
  });
  reel.addEventListener("timeupdate", () => {
    if (!switching && initialized && !completed && reel.currentTime >= maxPerClip) advance();
  });
  reel.addEventListener("ended", () => {
    if (!switching && initialized && !completed) advance();
  });
  reel.addEventListener("pause",refresh);
  reel.addEventListener("play",refresh);
  reel.addEventListener("error", () => {
    if (initialized && !completed) {
      status("This clip could not load. Try NEXT.");
      reel.pause();
    }
  });
  document.querySelectorAll(".motion-grid video").forEach(video =>
    video.addEventListener("play",()=>{if (!reel.paused) reel.pause()})
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !reel.paused) reel.pause();
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting && !reel.paused) reel.pause();
    }, {threshold:.03});
    observer.observe(document.querySelector(".studio-showreel"));
  }
  refresh();
})();