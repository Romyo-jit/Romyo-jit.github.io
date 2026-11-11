(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cursorMotion = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const cursor = document.createElement("div");
  cursor.className = "cursor-halo";
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(cursor);

  document.addEventListener("pointermove", event => {
    if (!cursorMotion.matches || event.pointerType === "touch") return;
    cursor.style.left = event.clientX + "px";
    cursor.style.top = event.clientY + "px";
    cursor.classList.add("is-visible");
    cursor.classList.toggle("is-interactive", Boolean(event.target.closest("a, button, input, select, textarea, summary")));
  }, { passive: true });
  function hideCursor() { cursor.classList.remove("is-visible"); }
  document.documentElement.addEventListener("pointerleave", hideCursor);
  window.addEventListener("blur", hideCursor);
  cursorMotion.addEventListener("change", hideCursor);
  document.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));

  const atom = document.querySelector(".hero-orbit");
  const atomToggle = document.querySelector(".atom-toggle");
  atomToggle.addEventListener("click", () => {
    const paused = atom.classList.toggle("is-paused");
    atomToggle.setAttribute("aria-pressed", String(paused));
    atomToggle.textContent = paused ? "Play atom" : "Pause atom";
  });

  const musicPlayer = document.querySelector("#music-player");
  const musicStatus = document.querySelector(".music-player-status");
  const musicTrackName = document.querySelector(".music-track-name");
  const musicProgress = document.querySelector("[data-music-progress]");
  const musicPlay = document.querySelector('[data-music-action="play"]');
  const currentTime = document.querySelector('[data-music-time="current"]');
  const durationTime = document.querySelector('[data-music-time="duration"]');
  const musicTracks = [
    "assets/songs/20%20min%20Lil%20uzi.mp3",
    "assets/songs/Money%20Longer.mp3",
    "assets/songs/XO%20Tour%20Llif3.mp3"
  ];
  let currentTrack = 0;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
  }

  function updateMusicControls() {
    musicPlay.textContent = musicPlayer.paused ? "▶" : "Ⅱ";
    musicPlay.setAttribute("aria-label", musicPlayer.paused ? "Play music" : "Pause music");
  }

  function getTrackTitle(source) {
    const filename = decodeURIComponent(source.split("/").pop() || source);
    return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function loadTrack(index, shouldPlay) {
    currentTrack = (index + musicTracks.length) % musicTracks.length;
    musicTrackName.textContent = getTrackTitle(musicTracks[currentTrack]);
    musicPlayer.src = musicTracks[currentTrack];
    musicPlayer.load();
    musicProgress.value = 0;
    currentTime.textContent = "0:00";
    durationTime.textContent = "0:00";
    if (!shouldPlay) return;
    musicPlayer.play().catch(() => {
      musicStatus.textContent = "Press play to start the music.";
    });
  }

  musicPlayer.addEventListener("error", () => {
    musicStatus.textContent = "The selected song could not be played.";
  });
  musicPlayer.addEventListener("loadedmetadata", () => {
    durationTime.textContent = formatTime(musicPlayer.duration);
  });
  musicPlayer.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(musicPlayer.currentTime);
    musicProgress.value = musicPlayer.duration ? (musicPlayer.currentTime / musicPlayer.duration) * 100 : 0;
  });
  musicPlayer.addEventListener("play", updateMusicControls);
  musicPlayer.addEventListener("pause", updateMusicControls);
  musicPlayer.addEventListener("ended", () => loadTrack(currentTrack + 1, true));
  musicPlay.addEventListener("click", () => {
    if (musicPlayer.paused) {
      musicPlayer.play().catch(() => {
        musicStatus.textContent = "Press play to start the music.";
      });
    } else {
      musicPlayer.pause();
    }
  });
  musicProgress.addEventListener("input", () => {
    if (musicPlayer.duration) musicPlayer.currentTime = (Number(musicProgress.value) / 100) * musicPlayer.duration;
  });
  document.querySelector('[data-music-action="previous"]').addEventListener("click", () => {
    loadTrack(currentTrack - 1, true);
  });
  document.querySelector('[data-music-action="next"]').addEventListener("click", () => {
    loadTrack(currentTrack + 1, true);
  });
  musicTrackName.textContent = getTrackTitle(musicTracks[currentTrack]);
  function startMusicAfterInteraction() {
    musicPlayer.play().then(() => {
      musicStatus.textContent = "";
    }).catch(() => {
      musicStatus.textContent = "Press play to start the music.";
    });
  }
  musicPlayer.play().catch(() => {
    musicStatus.textContent = "Tap anywhere to start the music.";
    document.addEventListener("pointerdown", startMusicAfterInteraction, { once: true });
  });

  const interest = document.querySelector(".typed-interest");
  let typing;

  function updateTyping() {
    typing?.destroy();
    typing = null;
    interest.textContent = "Programming, Photography, and Mathematics.";
    if (reducedMotion.matches || !window.Typed) return;
    interest.textContent = "";
    typing = new Typed(interest, {
      strings: ["Programming", "Photography", "Mathematics"],
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000,
      loop: true
    });
  }

  updateTyping();
  reducedMotion.addEventListener("change", updateTyping);

  const counters = [...document.querySelectorAll(".stats strong")].map(element => ({
    element,
    value: Number(element.textContent)
  }));
  let counterFrame;
  let countersStarted = false;

  function finishCounters() {
    cancelAnimationFrame(counterFrame);
    counters.forEach(({ element, value }) => { element.textContent = value; });
  }

  function animateCounters() {
    if (countersStarted) return;
    countersStarted = true;
    const start = performance.now();
    counters.forEach(({ element, value }) => element.setAttribute("aria-label", String(value)));

    function update(now) {
      const progress = Math.min((now - start) / 950, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counters.forEach(({ element, value }) => {
        element.textContent = Math.round(value * eased);
      });
      if (progress < 1) counterFrame = requestAnimationFrame(update);
    }
    counterFrame = requestAnimationFrame(update);
  }

  if (!("IntersectionObserver" in window) || !Element.prototype.animate) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      if (reducedMotion.matches) return;

      // Animate only on arrival. Content remains visible without JavaScript.
      target.animate([
        { opacity: 0, transform: "translateY(24px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], {
        duration: 650,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      });
      if (target.classList.contains("skills")) target.classList.add("skills-revealed");
      if (target.classList.contains("stats")) animateCounters();
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(
    ".hero-copy > *, .stats, .about-copy, .portrait, " +
    ".section-heading, .skills, .project, .learning, #contact > h2, .contact"
  ).forEach(element => observer.observe(element));


  const panel = document.querySelector(".learning");
  const panelHome = document.querySelector(".status-home");
  const landing = document.querySelector(".status-landing");
  const dropButton = document.querySelector(".drop-panel");
  const resetButton = document.querySelector(".reset-panel");
  let falling;
  dropButton.hidden = false;

  dropButton.addEventListener("click", async () => {
    if (dropButton.disabled || landing.contains(panel)) return;
    observer.unobserve(panel);
    panel.getAnimations().forEach(animation => animation.cancel());
    const start = panel.getBoundingClientRect();
    panelHome.style.minHeight = panelHome.offsetHeight + "px";
    panelHome.classList.add("is-empty");
    landing.hidden = false;
    landing.append(panel);
    dropButton.disabled = true;
    resetButton.disabled = true;
    const end = panel.getBoundingClientRect();
    const distance = start.top - end.top;
    panel.classList.add("is-falling");
    const destination = window.scrollY + end.top - 140;
    window.scrollTo({ top: destination, behavior: reducedMotion.matches ? "instant" : "smooth" });
    try {
      if (!reducedMotion.matches) {
        falling = panel.animate([
          { transform: "translateY(" + distance + "px)", offset: 0, easing: "cubic-bezier(.55, 0, 1, .45)" },
          { transform: "translateY(0)", offset: .65, easing: "ease-out" },
          { transform: "translateY(-45px)", offset: .79, easing: "ease-in" },
          { transform: "translateY(0)", offset: .9, easing: "ease-out" },
          { transform: "translateY(-10px)", offset: .95 },
          { transform: "translateY(0)", offset: 1 }
        ], { duration: 1400 });
        await falling.finished;
      }
    } catch {
      // Resizing or switching to reduced motion settles the panel immediately.
    } finally {
      falling = null;
      panel.classList.remove("is-falling");
      resetButton.disabled = false;
      dropButton.textContent = "Panel landed ↓";
      resetButton.focus({ preventScroll: true });
    }
  });

  resetButton.addEventListener("click", () => {
    if (resetButton.disabled) return;
    panelHome.append(panel);
    landing.hidden = true;
    panelHome.style.minHeight = "";
    panelHome.classList.remove("is-empty");
    dropButton.disabled = false;
    dropButton.textContent = "Drop this panel ↓";
    dropButton.scrollIntoView({ block: "center", behavior: reducedMotion.matches ? "instant" : "smooth" });
    dropButton.focus({ preventScroll: true });
  });
  window.addEventListener("resize", () => falling?.cancel());

  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    document.getAnimations().forEach(animation => animation.cancel());
    finishCounters();
  });
})();
