// Footer star field: the Mad Makers hero dot grid, drawn as the footer ✦ in Frieren gold.
// Invisible at rest; the cursor leaves a fluid wake of lit stars that settles back.
const vertexSource = `
attribute vec4 a_particle;
attribute float a_seed;
uniform vec2 u_resolution;
uniform float u_dpr;
varying float v_alpha;
varying float v_size;
varying float v_activity;
varying float v_seed;
void main() {
  gl_Position = vec4(a_particle.xy / u_resolution * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
  v_size = 10.0 * u_dpr * a_particle.w;
  gl_PointSize = v_size;
  v_activity = smoothstep(0.0, 0.48, a_particle.z);
  v_alpha = mix(0.012, 0.84, smoothstep(0.0, 1.0, v_activity));
  v_seed = a_seed;
}`;
const fragmentSource = `
precision highp float;
varying float v_alpha;
varying float v_size;
varying float v_activity;
varying float v_seed;
float grain(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec2 uv = abs(gl_PointCoord - 0.5) * 2.0;
  // Astroid-like four-pointed star, like the footer glyph: long points, pinched waist.
  float d = pow(uv.x, 0.52) + pow(uv.y, 0.52) - 1.0;
  float aa = 2.2 / v_size;
  float ink = 1.0 - smoothstep(-aa, aa, d);
  // Seeded per dot and in dot-local pixels: the grain travels with the material.
  vec2 seed = vec2(v_seed * 0.173, v_seed * 0.317);
  float tooth = grain(floor(gl_PointCoord * v_size) + seed);
  float pigment = grain(seed);
  float activity = clamp(v_activity + (pigment - 0.5) * 0.065 * v_activity, 0.0, 1.0);
  float alpha = ink * v_alpha * (1.0 - tooth * 0.14 * v_activity);
  // The gesture's intensity carries the gradient through the displaced dots.
  // Screen-blended under the veil: saturate the gold so it survives the mix.
  vec3 gold = mix(vec3(0.62, 0.40, 0.10), vec3(0.95, 0.66, 0.22),
    smoothstep(0.0, 0.55, activity));
  gold = mix(gold, vec3(1.0, 0.86, 0.52), smoothstep(0.80, 1.0, activity));
  gold *= 1.0 + ((tooth - 0.5) * 0.12 + (pigment - 0.5) * 0.08) * v_activity;
  vec3 color = mix(vec3(0.62, 0.58, 0.5), gold, smoothstep(0.0, 0.12, activity));
  gl_FragColor = vec4(color * alpha, alpha);
}`;

export function createStarField(hero, canvas, signal) {
  const header = null;
  if (
    !matchMedia("(any-hover: hover) and (any-pointer: fine)").matches ||
    navigator.connection?.saveData
  )
    return () => {};
  let gl;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
  } catch {
    return () => {};
  }
  if (!gl) return () => {};
  const program = gl.createProgram();
  [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, index) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, index ? fragmentSource : vertexSource);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  });
  gl.bindAttribLocation(program, 0, "a_particle");
  gl.bindAttribLocation(program, 1, "a_seed");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.replaceWith(canvas.cloneNode(false));
    return () => {};
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
  gl.clearColor(0, 0, 0, 0);
  const resolution = gl.getUniformLocation(program, "u_resolution");
  const pixelRatio = gl.getUniformLocation(program, "u_dpr");
  const spacingX = 14,
    spacingY = 16,
    reach = 184;
  let flowX = 1,
    flowY = 0;
  const current = Array.from({ length: 16 }, () => ({ x: 0, y: 0 }));
  const history = [];
  const field = { strength: 0, pushX: 0, pushY: 0 };
  const active = new Set();
  const pulses = [];
  const PULSE_SPEED = 1100;
  let homes,
    positions,
    velocities,
    nextPositions,
    targets,
    pressures,
    alphas,
    exposure,
    burst,
    upload,
    cols = 0,
    rows = 0;
  let width = 0,
    height = 0,
    frame = 0,
    last = 0,
    force = 0;
  let mx = 0,
    my = 0,
    previousX = 0,
    previousY = 0,
    lastMove = -Infinity;
  let inside = false,
    visible = true,
    alive = true;

  // One continuous, tapered spine: a rounded bow and a single narrow wake.
  function sampleCurrent(x, y) {
    field.strength = field.pushX = field.pushY = 0;
    for (let i = 0; i < current.length - 1; i++) {
      const a = current[i],
        b = current[i + 1];
      const dx = b.x - a.x,
        dy = b.y - a.y,
        length2 = dx * dx + dy * dy;
      if (length2 < 0.25 && i > 0) continue;
      const t =
        length2 > 0.25
          ? Math.max(
              0,
              Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length2),
            )
          : 0;
      const qx = x - a.x - dx * t,
        qy = y - a.y - dy * t;
      const progress = (i + t) / (current.length - 1);
      const radius = 9 + 81 * Math.pow(1 - progress, 1.25);
      const distance = Math.hypot(qx, qy);
      const strength =
        Math.exp((-1.5 * distance * distance) / (radius * radius)) *
        Math.pow(1 - progress, 0.6);
      if (strength <= field.strength) continue;
      field.strength = strength;
      // Around the nose this is radial; along the body it splits to either side.
      const push = (strength * 52) / Math.max(distance, 1);
      field.pushX = qx * push;
      field.pushY = qy * push;
    }
    return field;
  }

  function render() {
    if (!alive || !homes || gl.isContextLost()) return;
    for (let id = 0; id < alphas.length; id++) {
      const at = id * 2,
        offset = id * 5;
      upload[offset] = positions[at];
      upload[offset + 1] = positions[at + 1];
      upload[offset + 2] = alphas[id];
      const distance2 = (homes[at] - mx) ** 2 + (homes[at + 1] - my) ** 2;
      // Stars on the wave front swell a little: the light rolls with the wave.
      upload[offset + 3] =
        1 + 0.1 * Math.exp(-distance2 / 4608) * force + burst[id] * 0.6;
      upload[offset + 4] = id;
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, upload);
    gl.drawArrays(gl.POINTS, 0, alphas.length);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    force = 0;
    inside = false;
    flowX = 1;
    flowY = 0;
    for (const id of active) {
      positions[id * 2] = homes[id * 2];
      positions[id * 2 + 1] = homes[id * 2 + 1];
      nextPositions[id * 2] = homes[id * 2];
      nextPositions[id * 2 + 1] = homes[id * 2 + 1];
      velocities[id * 2] =
        velocities[id * 2 + 1] =
        alphas[id] =
        exposure[id] =
        burst[id] =
          0;
    }
    active.clear();
    pulses.length = 0;
    render();
  }
  function draw(now) {
    frame = 0;
    if (!alive || signal.aborted || !visible || document.hidden) {
      stop();
      return;
    }
    const dt = Math.min((now - (last || now - 16.67)) / 1000, 0.05);
    last = now;
    const sx = mx - previousX,
      sy = my - previousY,
      length2 = sx * sx + sy * sy;
    const speed = Math.sqrt(length2) / Math.max(dt, 0.001);
    const target =
      inside && now - lastMove < 400
        ? 0.85 + 0.15 * Math.min(1, speed / 700)
        : 0;
    force +=
      (target - force) * (1 - Math.exp(-dt * (target > force ? 24 : 4.8)));
    if (length2 > 0.01) {
      const length = Math.sqrt(length2),
        follow = 1 - Math.exp(-dt * 16);
      flowX += (sx / length - flowX) * follow;
      flowY += (sy / length - flowY) * follow;
    }
    const headingLength = Math.hypot(flowX, flowY);
    const headingX = headingLength > 0.01 ? flowX / headingLength : 1;
    const headingY = headingLength > 0.01 ? flowY / headingLength : 0;
    // Resample the actual travelled path by distance, so slow strokes still have
    // a long tail and turns cannot create competing velocity-oriented lobes.
    if (
      inside &&
      (history.length === 0 ||
        Math.hypot(mx - history[0].x, my - history[0].y) >= 2)
    ) {
      history.unshift({ x: mx, y: my });
      if (history.length > 384) history.length = 384;
    }
    let segment = 0,
      traversed = 0;
    for (let i = 0; i < current.length; i++) {
      const desired = i * 44;
      while (segment < history.length - 2) {
        const distance = Math.hypot(
          history[segment + 1].x - history[segment].x,
          history[segment + 1].y - history[segment].y,
        );
        if (traversed + distance >= desired) break;
        traversed += distance;
        segment++;
      }
      const a = history[segment] || { x: mx, y: my },
        b = history[segment + 1] || a;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const t =
        distance > 0 ? Math.min(1, (desired - traversed) / distance) : 0;
      // Keep the head responsive while the longer tail carries turns with inertia.
      const follow =
        1 -
        Math.exp(-dt * (i === 0 ? 65 : 35 - (22 * i) / (current.length - 1)));
      current[i].x += (a.x + (b.x - a.x) * t - current[i].x) * follow;
      current[i].y += (a.y + (b.y - a.y) * t - current[i].y) * follow;
    }
    const steps = Math.max(1, Math.ceil(dt * 120)),
      step = dt / steps;
    if (force > 0.005) {
      let minX = Math.min(mx, previousX),
        maxX = Math.max(mx, previousX);
      let minY = Math.min(my, previousY),
        maxY = Math.max(my, previousY);
      for (const node of current) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      }
      const left = Math.max(0, Math.floor((minX - reach) / spacingX) - 1);
      const right = Math.min(
        cols - 1,
        Math.ceil((maxX + reach) / spacingX) + 1,
      );
      const top = Math.max(0, Math.floor((minY - reach) / spacingY));
      const bottom = Math.min(rows - 1, Math.ceil((maxY + reach) / spacingY));
      for (let row = top; row <= bottom; row++)
        for (let col = left; col <= right; col++) active.add(row * cols + col);
    }
    // Click impulse: a ring expands from the press point, kicks the stars outward and lights them.
    for (let k = pulses.length - 1; k >= 0; k--) {
      const pulse = pulses[k],
        age = (now - pulse.t) / 1000;
      // The wave runs until it has left the whole grid.
      const reach2 = Math.max(
        Math.hypot(pulse.x, pulse.y),
        Math.hypot(width - pulse.x, pulse.y),
        Math.hypot(pulse.x, height - pulse.y),
        Math.hypot(width - pulse.x, height - pulse.y),
      );
      const r1 = age * PULSE_SPEED,
        r0 = Math.max(0, r1 - PULSE_SPEED * dt - 2);
      if (r0 > reach2 + 40) {
        pulses.splice(k, 1);
        continue;
      }
      const left = Math.max(0, Math.floor((pulse.x - r1) / spacingX) - 1);
      const right = Math.min(cols - 1, Math.ceil((pulse.x + r1) / spacingX) + 1);
      const top = Math.max(0, Math.floor((pulse.y - r1) / spacingY) - 1);
      const bottom = Math.min(rows - 1, Math.ceil((pulse.y + r1) / spacingY) + 1);
      for (let row = top; row <= bottom; row++)
        for (let col = left; col <= right; col++) {
          const id = row * cols + col,
            at = id * 2;
          const dx = homes[at] - pulse.x,
            dy = homes[at + 1] - pulse.y,
            d = Math.hypot(dx, dy);
          if (d < r0 || d > r1) continue;
          // Light stays strong across the grid; the push eases off with distance.
          const fall = 0.45 + 0.55 * Math.exp(-d / 700);
          const kick = (420 * Math.exp(-d / 520) + 60) / Math.max(d, 1);
          velocities[at] += dx * kick;
          velocities[at + 1] += dy * kick;
          burst[id] = Math.max(burst[id], fall);
          active.add(id);
        }
    }
    // The current has a history: the leading edge turns before the rest of the material.
    for (const id of active) {
      const at = id * 2,
        hx = homes[at],
        hy = homes[at + 1];
      const flow = sampleCurrent(hx, hy);
      pressures[id] = flow.strength * 0.8 * force;
      targets[at] = flow.pushX * force * 0.45;
      targets[at + 1] = flow.pushY * force * 0.45;
    }
    // Coupled grid nodes yield to this current, rather than following a cursor silhouette.
    for (let n = 0; n < steps; n++) {
      for (const id of active) {
        const at = id * 2,
          hx = homes[at],
          hy = homes[at + 1];
        const px = positions[at],
          py = positions[at + 1];
        const ox = px - hx,
          oy = py - hy;
        let neighborX = 0,
          neighborY = 0,
          separationX = 0,
          separationY = 0,
          neighbors = 0;
        const col = id % cols;
        for (let side = 0; side < 4; side++) {
          const neighbor =
            side === 0
              ? col > 0
                ? id - 1
                : -1
              : side === 1
                ? col < cols - 1
                  ? id + 1
                  : -1
                : side === 2
                  ? id - cols
                  : id + cols;
          if (neighbor < 0 || neighbor >= alphas.length) continue;
          neighborX += positions[neighbor * 2] - homes[neighbor * 2];
          neighborY += positions[neighbor * 2 + 1] - homes[neighbor * 2 + 1];
          const nx = px - positions[neighbor * 2],
            ny = py - positions[neighbor * 2 + 1];
          const separation = Math.hypot(nx, ny);
          if (separation > 0.01 && separation < 12) {
            const repel = ((12 - separation) * 240) / separation;
            separationX += nx * repel;
            separationY += ny * repel;
          }
          neighbors++;
        }
        // Coupled springs carry the gesture into the surrounding rows and softly overshoot on return.
        const waveX = neighbors ? neighborX / neighbors - ox : 0;
        const waveY = neighbors ? neighborY / neighbors - oy : 0;
        // A round bow repels the actual moving points, like water around a head.
        // The separate, tapered spine keeps this bow attached to a single wake.
        const dx = px - current[0].x,
          dy = py - current[0].y;
        const distance = Math.hypot(dx, dy);
        const nx = distance > 0.1 ? dx / distance : -headingY;
        const ny = distance > 0.1 ? dy / distance : headingX;
        const magnetic = 7800 * Math.exp(-((distance / 62) ** 2)) * force;
        velocities[at] +=
          ((targets[at] - ox) * 95 +
            waveX * 65 +
            nx * magnetic +
            separationX -
            velocities[at] * 27) *
          step;
        velocities[at + 1] +=
          ((targets[at + 1] - oy) * 95 +
            waveY * 65 +
            ny * magnetic +
            separationY -
            velocities[at + 1] * 27) *
          step;
        nextPositions[at] = px + velocities[at] * step;
        nextPositions[at + 1] = py + velocities[at + 1] * step;
        // The wake keeps its light as the material gradually settles after a stroke.
        exposure[id] = Math.max(
          exposure[id] * Math.exp(-step * 1.05),
          pressures[id],
        );
      }
      for (const id of active) {
        positions[id * 2] = nextPositions[id * 2];
        positions[id * 2 + 1] = nextPositions[id * 2 + 1];
      }
    }
    for (const id of active) {
      const at = id * 2,
        px = positions[at],
        py = positions[at + 1];
      const displacement = Math.hypot(px - homes[at], py - homes[at + 1]);
      // Visibility follows the displaced dots through the same fluid footprint.
      // Ejected dots fade at its outside edge; there is no centre cutout or painted lens.
      const footprint = sampleCurrent(px, py).strength;
      const targetAlpha =
        Math.min(
          0.7,
          exposure[id] * 0.85 + Math.min(0.08, displacement * 0.004),
        ) * Math.min(1, footprint * 1.35);
      const lit = Math.max(targetAlpha, Math.min(0.84, burst[id]));
      burst[id] *= Math.exp(-dt * 8.5); // short glowing tail behind the front
      // Light snaps on as the front arrives, then eases off behind it.
      alphas[id] += (lit - alphas[id]) * (1 - Math.exp(-dt * (lit > alphas[id] ? 70 : 22)));
      if (
        exposure[id] < 0.003 &&
        burst[id] < 0.003 &&
        displacement < 0.025 &&
        Math.hypot(velocities[at], velocities[at + 1]) < 0.1 &&
        alphas[id] < 0.003
      ) {
        active.delete(id);
        positions[at] = homes[at];
        positions[at + 1] = homes[at + 1];
        velocities[at] = velocities[at + 1] = alphas[id] = exposure[id] = burst[id] = 0;
        continue;
      }
    }
    previousX = mx;
    previousY = my;
    render();
    if (active.size || force > 0.005 || pulses.length) wake();
    else last = 0;
  }
  function wake() {
    if (alive && !signal.aborted && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  const resize = new ResizeObserver(() => {
    if (!alive) return;
    stop();
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const headerBottom = header
      ? Math.max(0, header.getBoundingClientRect().bottom - rect.top)
      : 0;
    const dpr = Math.min(devicePixelRatio, 1.5, 2032 / Math.max(width, height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    cols = Math.ceil(width / spacingX) + 1;
    rows = Math.ceil(height / spacingY) + 1;
    homes = new Float32Array(cols * rows * 2);
    positions = new Float32Array(homes.length);
    velocities = new Float32Array(homes.length);
    nextPositions = new Float32Array(homes.length);
    targets = new Float32Array(homes.length);
    pressures = new Float32Array(cols * rows);
    alphas = new Float32Array(cols * rows);
    exposure = new Float32Array(cols * rows);
    burst = new Float32Array(cols * rows);
    upload = new Float32Array(cols * rows * 5);
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const at = (row * cols + col) * 2;
        // Horizontal rows alternate by half a cell to form a staggered pattern.
        homes[at] = col * spacingX + (row % 2 ? spacingX / 2 : 0);
        homes[at + 1] = row * spacingY;
      }
    positions.set(homes);
    nextPositions.set(homes);
    gl.bufferData(gl.ARRAY_BUFFER, upload.byteLength, gl.DYNAMIC_DRAW);
    gl.uniform2f(resolution, width, height);
    gl.uniform1f(pixelRatio, dpr);
    render();
  });
  resize.observe(hero);
  if (header) resize.observe(header);
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse" || !alive || !homes) return;
      const rect = hero.getBoundingClientRect();
      mx = event.clientX - rect.left;
      my = event.clientY - rect.top;
      if (!inside) {
        previousX = mx;
        previousY = my;
        history.length = 0;
        history.push({ x: mx, y: my });
        for (const node of current) {
          node.x = mx;
          node.y = my;
        }
      }
      inside = true;
      lastMove = performance.now();
      wake();
    },
    { signal, passive: true },
  );
  hero.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "touch" || !alive || !homes) return;
      const rect = hero.getBoundingClientRect();
      pulses.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        t: performance.now(),
      });
      if (pulses.length > 4) pulses.shift();
      wake();
    },
    { signal, passive: true },
  );
  hero.addEventListener(
    "pointerleave",
    () => {
      inside = false;
      wake();
    },
    { signal },
  );
  window.addEventListener(
    "scroll",
    () => {
      inside = false;
      wake();
    },
    { signal, passive: true },
  );
  window.addEventListener("blur", stop, { signal });
  document.addEventListener("visibilitychange", stop, { signal });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) stop();
  });
  observer.observe(hero);
  const dialogs = new MutationObserver(() => {
    if (document.querySelector("dialog[open]")) stop();
  });
  document
    .querySelectorAll("dialog")
    .forEach((dialog) =>
      dialogs.observe(dialog, { attributes: true, attributeFilter: ["open"] }),
    );
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      cleanup();
    },
    { signal },
  );
  function cleanup() {
    if (!alive) return;
    stop();
    alive = false;
    resize.disconnect();
    observer.disconnect();
    dialogs.disconnect();
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  return cleanup;
}
