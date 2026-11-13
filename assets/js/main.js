(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const opening = document.querySelector(".opening");
  function updateOpeningLayout() {
    document.documentElement.style.setProperty("--header-height", header.getBoundingClientRect().height + "px");
    opening.style.setProperty("--opening-gutter", opening.getBoundingClientRect().left + "px");
  }
  updateOpeningLayout();
  window.addEventListener("resize", updateOpeningLayout);
  if ("ResizeObserver" in window) new ResizeObserver(updateOpeningLayout).observe(header);

  const cursorMotion = window.matchMedia("(hover: hover) and (pointer: fine)");
  const cursor = document.createElement("div");
  cursor.className = "cursor-halo";
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(cursor);
  let cursorTargetX = window.innerWidth / 2;
  let cursorTargetY = window.innerHeight / 2;
  let cursorX = cursorTargetX;
  let cursorY = cursorTargetY;
  let cursorFrame = null;
  function animateCursor() {
    if (!cursorMotion.matches) {
      cursorFrame = null;
      return;
    }
    cursorX += (cursorTargetX - cursorX) * .18;
    cursorY += (cursorTargetY - cursorY) * .18;
    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";
    cursorFrame = requestAnimationFrame(animateCursor);
  }
  function startCursorAnimation() {
    if (cursorFrame === null && cursorMotion.matches) cursorFrame = requestAnimationFrame(animateCursor);
  }
  startCursorAnimation();

  document.addEventListener("pointermove", event => {
    if (!cursorMotion.matches || event.pointerType === "touch") return;
    cursorTargetX = event.clientX;
    cursorTargetY = event.clientY;
    cursor.classList.add("is-visible");
    const target = event.target instanceof Element ? event.target : null;
    cursor.classList.toggle("is-interactive", Boolean(target?.closest("a, button, input, select, textarea, summary")));
  }, { passive: true });
  function hideCursor() { cursor.classList.remove("is-visible"); }
  document.documentElement.addEventListener("pointerleave", hideCursor);
  window.addEventListener("blur", hideCursor);
  cursorMotion.addEventListener("change", () => {
    hideCursor();
    startCursorAnimation();
  });
  document.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));

  const colorEggs = document.querySelectorAll(".site-easter-egg");
  const colorPalettes = ["burgundy", "tidal", "iris", "grove"];
  let currentPalette = 0;
  colorEggs.forEach(egg => {
    egg.addEventListener("click", () => {
      currentPalette = (currentPalette + 1) % colorPalettes.length;
      document.documentElement.dataset.theme = colorPalettes[currentPalette];
      document.dispatchEvent(new Event("portfolio-theme-change"));
      egg.classList.remove("is-popped");
      void egg.offsetWidth;
      egg.classList.add("is-popped");
    });
  });
  let backgroundScrollFrame = null;
  function moveBackgroundArtifacts() {
    backgroundScrollFrame = null;
    document.querySelectorAll("[data-depth]").forEach(egg => {
      const depth = Number(egg.dataset.depth);
      egg.style.setProperty("--scroll-shift", window.scrollY * depth + "px");
    });
  }
  window.addEventListener("scroll", () => {
    if (backgroundScrollFrame !== null) return;
    backgroundScrollFrame = requestAnimationFrame(moveBackgroundArtifacts);
  }, { passive: true });
  moveBackgroundArtifacts();
  document.querySelector("#scroll-top").addEventListener("click", event => {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  const atom = document.querySelector(".hero-orbit");
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  const atomControllers = [];
  function createAtomController(element, velocityScale) {
    const bounds = element.getBoundingClientRect();
    const controller = {
      element,
      x: bounds.left,
      y: bounds.top,
      velocityX: (Math.random() - .5) * velocityScale,
      velocityY: (Math.random() - .5) * velocityScale,
      gravityAngle: Math.random() * Math.PI * 2,
      gravityTimer: 0
    };
    atomControllers.push(controller);
  }
  createAtomController(atom, .7);
  const summonedAtoms = [];
  document.querySelector('[data-action="summon-atom"]').addEventListener("click", () => {
    const summoned = atom.cloneNode(true);
    summoned.classList.add("summoned-atom");
    summoned.style.left = 8 + Math.random() * 76 + "vw";
    summoned.style.top = 10 + Math.random() * 72 + "vh";
    summoned.style.right = "auto";
    atom.parentElement.append(summoned);
    summonedAtoms.push(summoned);
    createAtomController(summoned, .55);
    if (summonedAtoms.length > 3) {
      const removedAtom = summonedAtoms.shift();
      removedAtom.remove();
      const removedControllerIndex = atomControllers.findIndex(controller => controller.element === removedAtom);
      if (removedControllerIndex !== -1) atomControllers.splice(removedControllerIndex, 1);
    }
  });
  window.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;
    pointerX = event.clientX;
    pointerY = event.clientY;
  });
  let previousAtomTime = performance.now();
  function animateAtom(time) {
    const delta = Math.min((time - previousAtomTime) / 16.67, 2);
    previousAtomTime = time;
    for (let firstIndex = 0; firstIndex < atomControllers.length; firstIndex++) {
      for (let secondIndex = firstIndex + 1; secondIndex < atomControllers.length; secondIndex++) {
        const first = atomControllers[firstIndex];
        const second = atomControllers[secondIndex];
        const firstElement = first.element;
        const secondElement = second.element;
        const firstCenterX = first.x + firstElement.offsetWidth / 2;
        const firstCenterY = first.y + firstElement.offsetHeight / 2;
        const secondCenterX = second.x + secondElement.offsetWidth / 2;
        const secondCenterY = second.y + secondElement.offsetHeight / 2;
        const distanceX = secondCenterX - firstCenterX;
        const distanceY = secondCenterY - firstCenterY;
        const distance = Math.max(Math.hypot(distanceX, distanceY), 1);
        const repulsionRadius = 300;
        if (distance >= repulsionRadius) continue;
        const repulsion = (1 - distance / repulsionRadius) * .05 * delta;
        const forceX = distanceX / distance * repulsion;
        const forceY = distanceY / distance * repulsion;
        first.velocityX -= forceX;
        first.velocityY -= forceY;
        second.velocityX += forceX;
        second.velocityY += forceY;
      }
    }
    atomControllers.forEach(controller => {
      const element = controller.element;
      controller.gravityTimer -= delta;
      if (controller.gravityTimer <= 0) {
        controller.gravityAngle = Math.random() * Math.PI * 2;
        controller.gravityTimer = 90 + Math.random() * 180;
      }
      controller.velocityX += Math.cos(controller.gravityAngle) * .012 * delta;
      controller.velocityY += Math.sin(controller.gravityAngle) * .012 * delta;
      const atomCenterX = controller.x + element.offsetWidth / 2;
      const atomCenterY = controller.y + element.offsetHeight / 2;
      controller.velocityX += (pointerX - atomCenterX) * .00012 * delta;
      controller.velocityY += (pointerY - atomCenterY) * .00012 * delta;
      controller.velocityX *= .995;
      controller.velocityY *= .995;
      controller.x += controller.velocityX * delta;
      controller.y += controller.velocityY * delta;
      if (controller.x <= 0 || controller.x >= window.innerWidth - element.offsetWidth) {
        controller.x = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, controller.x));
        controller.velocityX *= -.82;
      }
      if (controller.y <= 0 || controller.y >= window.innerHeight - element.offsetHeight) {
        controller.y = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, controller.y));
        controller.velocityY *= -.82;
      }
      element.style.left = controller.x + "px";
      element.style.top = controller.y + "px";
      element.style.right = "auto";
    });
    requestAnimationFrame(animateAtom);
  }
  requestAnimationFrame(animateAtom);

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
    if (!window.Typed) return;
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
  const portrait = document.querySelector(".portrait");
  const portraitMotion = window.matchMedia("(hover: hover) and (pointer: fine)");
  function resetPortrait() {
    portrait.style.removeProperty("--portrait-tilt-x");
    portrait.style.removeProperty("--portrait-tilt-y");
    portrait.style.removeProperty("--portrait-light-x");
    portrait.style.removeProperty("--portrait-light-y");
    portrait.classList.remove("is-tilting");
  }
  portrait.addEventListener("pointermove", event => {
    if (!portraitMotion.matches || event.pointerType === "touch") return;
    const bounds = portrait.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    portrait.style.setProperty("--portrait-tilt-x", (3 - y * 6) + "deg");
    portrait.style.setProperty("--portrait-tilt-y", (x * 6 - 3) + "deg");
    portrait.style.setProperty("--portrait-light-x", (x * 100) + "%");
    portrait.style.setProperty("--portrait-light-y", (y * 100) + "%");
    portrait.classList.add("is-tilting");
  });
  portrait.addEventListener("pointerleave", resetPortrait);
  portraitMotion.addEventListener("change", resetPortrait);

  let touchStart = null;
  document.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") return;
    touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }, { passive: true });
  document.addEventListener("pointercancel", () => { touchStart = null; }, { passive: true });
  document.addEventListener("pointerup", event => {
    if (event.pointerType !== "touch" || !touchStart || touchStart.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y);
    touchStart = null;
    if (distance > 10 || !Element.prototype.animate) return;
    if (event.target.closest("a, button, input, select, textarea, video")) return;
    const photo = event.target.closest(".portrait-image");
    if (photo) {
      photo.animate([
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.025)", filter: "brightness(1.12)" },
        { transform: "scale(1)", filter: "brightness(1)" }
      ], { duration: 550, easing: "ease-in-out" });
      return;
    }
    const text = event.target.closest("main h1, main h2, main h3, main p, main figcaption, main dt, main dd, .skill-group li, .tools li");
    if (!text) return;
    text.animate([
      { transform: "translateY(0) rotate(0deg)" },
      { transform: "translateY(-4px) rotate(-0.6deg)" },
      { transform: "translateY(0) rotate(0deg)" }
    ], { duration: 450, easing: "ease-in-out" });
  }, { passive: true });

  if (!("IntersectionObserver" in window) || !Element.prototype.animate) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      observer.unobserve(target);
      // Animate only on arrival. Content remains visible without JavaScript.
      if (target === portrait) portrait.classList.add("has-arrived");
      target.animate([
        { opacity: 0, transform: "translateY(24px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], {
        duration: 650,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      });
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(
    ".hero-copy > *, .about-copy, .portrait, " +
    ".section-heading, .skills, .project, .learning, #contact > h2, .contact"
  ).forEach(element => observer.observe(element));


})();
