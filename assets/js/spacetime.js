(() => {
  "use strict";

  // A lightweight interpretation of Codrops' Spacetime / Warp Drive study:
  // https://tympanus.net/Development/DecorativeBackgrounds/index2.html
  const canvas = document.querySelector(".spacetime-canvas");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return;

  const vertexSource = `
    attribute vec3 point;
    uniform vec2 resolution;
    uniform float time;
    uniform float pixelRatio;
    uniform float dotSize;
    uniform vec2 pointer;
    varying float depth;

    void main() {
      vec3 p = point;
      float wave = .5 + .5 * cos(time * .38 + p.y * 1.45);
      float expansion = mix(.035, 1.0, smoothstep(.12, .88, wave));
      p.xz *= expansion;
      float turn = time * .10 + pointer.x * .32;
      float c = cos(turn), s = sin(turn);
      p.xz = mat2(c, -s, s, c) * p.xz;
      float tilt = .19 + pointer.y * .20;
      c = cos(tilt); s = sin(tilt);
      p.yz = mat2(c, -s, s, c) * p.yz;
      float radius = min(resolution.x * .93, resolution.y * .70);
      gl_Position = vec4(p.x * radius * 2.0 / resolution.x, p.y * radius * 2.0 / resolution.y, 0.0, 1.0);
      depth = .5 + .5 * p.z;
      gl_PointSize = dotSize * pixelRatio * mix(.78, 1.18, depth);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec3 dotColor;
    varying float depth;
    void main() {
      float d = length(gl_PointCoord - vec2(.5));
      if (d > .5) discard;
      float edge = 1.0 - smoothstep(.30, .5, d);
      gl_FragColor = vec4(dotColor, edge * mix(.4, .75, depth));
    }
  `;

  function shader(type, source) {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
      gl.deleteShader(item);
      return null;
    }
    return item;
  }

  const vertex = shader(gl.VERTEX_SHADER, vertexSource);
  const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const mobile = window.matchMedia("(max-width: 600px)");
  const count = 4000;
  const points = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * i;
    points[i * 3] = Math.cos(angle) * ring;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = Math.sin(angle) * ring;
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  const pointLocation = gl.getAttribLocation(program, "point");
  gl.enableVertexAttribArray(pointLocation);
  gl.vertexAttribPointer(pointLocation, 3, gl.FLOAT, false, 0, 0);
  const uniforms = {};
  ["resolution", "time", "pixelRatio", "dotSize", "pointer", "dotColor"].forEach(name => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });
  let dotColor = [46 / 255, 51 / 255, 71 / 255];
  function updateDotColor() {
    const parts = getComputedStyle(document.documentElement).getPropertyValue("--dot-rgb").split(",").map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) dotColor = parts.map(value => value / 255);
  }
  updateDotColor();
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let width = 0;
  let height = 0;
  let dpr = 1;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
  let frame = 0;
  let visible = true;
  let started = 0;
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(bounds.width, 1);
    height = Math.max(bounds.height, 1);
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    updateAnimation();
  }
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
  else window.addEventListener("resize", resize);

  hero.addEventListener("pointermove", event => {
    if (reducedMotion.matches || event.pointerType === "touch") return;
    const bounds = hero.getBoundingClientRect();
    targetX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    targetY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { targetX = 0; targetY = 0; });

  function draw(now) {
    frame = 0;
    if (!visible || document.hidden || gl.isContextLost()) return;
    if (!started) started = now;
    if (!reducedMotion.matches) {
      pointerX += (targetX - pointerX) * .04;
      pointerY += (targetY - pointerY) * .04;
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.time, reducedMotion.matches ? 0 : (now - started) / 1000);
    gl.uniform1f(uniforms.pixelRatio, dpr);
    gl.uniform1f(uniforms.dotSize, mobile.matches ? 4.0 : 2.3);
    gl.uniform2f(uniforms.pointer, reducedMotion.matches ? 0 : pointerX, reducedMotion.matches ? 0 : pointerY);
    gl.uniform3fv(uniforms.dotColor, dotColor);
    gl.drawArrays(gl.POINTS, 0, count);
    if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
  }
  reducedMotion.addEventListener("change", () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    started = 0;
    targetX = targetY = pointerX = pointerY = 0;
    updateAnimation();
  });
  document.addEventListener("portfolio-theme-change", () => {
    updateDotColor();
    if (reducedMotion.matches) updateAnimation();
  });
  function updateAnimation() {
    if (visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    if ((!visible || document.hidden) && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      updateAnimation();
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", updateAnimation);
  canvas.addEventListener("webglcontextlost", () => {
    hero.classList.remove("has-spacetime");
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
  hero.classList.add("has-spacetime");
  updateAnimation();
})();
