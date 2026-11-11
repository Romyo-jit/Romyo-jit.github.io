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

  const colorEggs = document.querySelectorAll(".site-easter-egg");
  const reducedMotionQuery = reducedMotion;
  const colorPalettes = [
    { accent: "#79334d", highlight: "#f8c48c", warm: "#f3a294" },
    { accent: "#315c68", highlight: "#f4d06f", warm: "#e89b7b" },
    { accent: "#5b416b", highlight: "#f1c27d", warm: "#d99ac5" },
    { accent: "#2f5d50", highlight: "#f2c879", warm: "#e49a7a" }
  ];
  colorEggs.forEach(egg => {
    egg.addEventListener("click", () => {
      const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
      const root = document.documentElement;
      root.style.setProperty("--accent", palette.accent);
      root.style.setProperty("--highlight", palette.highlight);
      root.style.setProperty("--warm", palette.warm);
      egg.classList.remove("is-popped");
      void egg.offsetWidth;
      egg.classList.add("is-popped");
    });
  });
  let backgroundScrollFrame = null;
  function moveBackgroundArtifacts() {
    backgroundScrollFrame = null;
    if (reducedMotionQuery.matches) return;
    document.querySelectorAll(".site-easter-egg[data-depth]").forEach(egg => {
      const depth = Number(egg.dataset.depth);
      egg.style.setProperty("--scroll-shift", window.scrollY * depth + "px");
    });
  }
  window.addEventListener("scroll", () => {
    if (backgroundScrollFrame !== null) return;
    backgroundScrollFrame = requestAnimationFrame(moveBackgroundArtifacts);
  }, { passive: true });
  moveBackgroundArtifacts();

  const atom = document.querySelector(".hero-orbit");
  let atomDragging = false;
  let atomOffsetX = 0;
  let atomOffsetY = 0;
  const atomBounds = atom.getBoundingClientRect();
  let atomX = atomBounds.left;
  let atomY = atomBounds.top;
  let atomVelocityX = (Math.random() - .5) * .7;
  let atomVelocityY = (Math.random() - .5) * .7;
  let gravityAngle = Math.random() * Math.PI * 2;
  let gravityTimer = 0;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  atom.addEventListener("pointerdown", event => {
    const bounds = atom.getBoundingClientRect();
    atomDragging = true;
    atomX = bounds.left;
    atomY = bounds.top;
    atomOffsetX = event.clientX - bounds.left;
    atomOffsetY = event.clientY - bounds.top;
    atom.setPointerCapture(event.pointerId);
    atom.classList.add("is-dragging");
  });
  atom.addEventListener("pointermove", event => {
    if (!atomDragging) return;
    atomX = Math.max(0, Math.min(window.innerWidth - atom.offsetWidth, event.clientX - atomOffsetX));
    atomY = Math.max(0, Math.min(window.innerHeight - atom.offsetHeight, event.clientY - atomOffsetY));
    atom.style.left = atomX + "px";
    atom.style.top = atomY + "px";
    atom.style.right = "auto";
  });
  function stopAtomDragging(event) {
    if (!atomDragging) return;
    atomDragging = false;
    atomVelocityX = (Math.random() - .5) * 1.4;
    atomVelocityY = (Math.random() - .5) * 1.4;
    atom.releasePointerCapture?.(event.pointerId);
    atom.classList.remove("is-dragging");
  }
  atom.addEventListener("pointerup", stopAtomDragging);
  atom.addEventListener("pointercancel", stopAtomDragging);
  window.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;
    pointerX = event.clientX;
    pointerY = event.clientY;
  });
  let atomFrame;
  let previousAtomTime = performance.now();
  function animateAtom(time) {
    const delta = Math.min((time - previousAtomTime) / 16.67, 2);
    previousAtomTime = time;
    if (!reducedMotion.matches && !atomDragging) {
      gravityTimer -= delta;
      if (gravityTimer <= 0) {
        gravityAngle = Math.random() * Math.PI * 2;
        gravityTimer = 90 + Math.random() * 180;
      }
      atomVelocityX += Math.cos(gravityAngle) * .012 * delta;
      atomVelocityY += Math.sin(gravityAngle) * .012 * delta;
      const atomCenterX = atomX + atom.offsetWidth / 2;
      const atomCenterY = atomY + atom.offsetHeight / 2;
      atomVelocityX += (pointerX - atomCenterX) * .00012 * delta;
      atomVelocityY += (pointerY - atomCenterY) * .00012 * delta;
      atomVelocityX *= .995;
      atomVelocityY *= .995;
      atomX += atomVelocityX * delta;
      atomY += atomVelocityY * delta;
      if (atomX <= 0 || atomX >= window.innerWidth - atom.offsetWidth) {
        atomX = Math.max(0, Math.min(window.innerWidth - atom.offsetWidth, atomX));
        atomVelocityX *= -.82;
      }
      if (atomY <= 0 || atomY >= window.innerHeight - atom.offsetHeight) {
        atomY = Math.max(0, Math.min(window.innerHeight - atom.offsetHeight, atomY));
        atomVelocityY *= -.82;
      }
      atom.style.left = atomX + "px";
      atom.style.top = atomY + "px";
      atom.style.right = "auto";
    }
    atomFrame = requestAnimationFrame(animateAtom);
  }
  atomFrame = requestAnimationFrame(animateAtom);

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
      musicStatus.textContent = "";
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
        musicStatus.textContent = "";
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
  currentTrack = Math.floor(Math.random() * musicTracks.length);
  loadTrack(currentTrack, false);
  function startMusicAfterInteraction() {
    musicPlayer.play().then(() => {
      musicStatus.textContent = "";
      document.removeEventListener("click", startMusicAfterInteraction);
      document.removeEventListener("touchstart", startMusicAfterInteraction);
      document.removeEventListener("touchend", startMusicAfterInteraction);
    }).catch(() => {
      musicStatus.textContent = "";
    });
  }
  musicPlayer.play().catch(() => {
    musicStatus.textContent = "";
    document.addEventListener("click", startMusicAfterInteraction);
    document.addEventListener("touchstart", startMusicAfterInteraction, { passive: true });
    document.addEventListener("touchend", startMusicAfterInteraction, { passive: true });
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


  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    document.getAnimations().forEach(animation => animation.cancel());
    finishCounters();
  });
})();
