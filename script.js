
(function() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* Renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  /* Scene + Camera */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.z = 60;

  /* Dot-matrix particle field */
  const COLS = 80, ROWS = 50;
  const COUNT = COLS * ROWS;
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);

  const spacingX = 1.6, spacingY = 1.3;
  const colBase = new THREE.Color('#818CF8'); // indigo-400
  const colDim  = new THREE.Color('#1e1b4b'); // very dark indigo

  for (let i = 0; i < COUNT; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    positions[i * 3]     = (col - COLS / 2) * spacingX;
    positions[i * 3 + 1] = (row - ROWS / 2) * spacingY;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    const t = Math.random();
    const c = colDim.clone().lerp(colBase, t * 0.35);
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    sizes[i] = Math.random() * 1.5 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

  /* Custom ShaderMaterial */
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uMouse:   { value: new THREE.Vector2(0, 0) },
      uOpacity: { value: 0.55 },
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vDist;
      uniform float uTime;
      uniform vec2  uMouse;

      void main(){
        vColor = color;
        vec3 pos = position;

        // breathing pulse
        float wave = sin(uTime * 0.5 + pos.x * 0.08 + pos.y * 0.06) * 0.5 + 0.5;
        pos.z += wave * 1.2;

        // pointer drift
        float dx = pos.x * 0.02 - uMouse.x;
        float dy = pos.y * 0.02 - uMouse.y;
        float influence = 1.0 / (dx*dx + dy*dy + 1.0);
        pos.x += uMouse.x * influence * 0.4;
        pos.y += uMouse.y * influence * 0.4;

        // depth fade
        vDist = length(pos.xy) / 60.0;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (60.0 / -mv.z) * (1.0 - vDist * 0.6);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3  vColor;
      varying float vDist;
      uniform float uOpacity;

      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if(d > 1.0) discard;
        float alpha = uOpacity * (1.0 - vDist * 0.8) * (1.0 - smoothstep(0.6, 1.0, d));
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* Ambient lighting (not needed for ShaderMaterial but consistent with spec) */
  scene.add(new THREE.AmbientLight(0x818CF8, 0.3));
  const dir = new THREE.DirectionalLight(0xffffff, 0.4);
  dir.position.set(10, 10, 10);
  scene.add(dir);

  /* Mouse */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', e => {
    mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* Resize */
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  /* Animate */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    mat.uniforms.uTime.value  = t;
    mat.uniforms.uMouse.value.set(mouse.x, mouse.y);
    points.rotation.y = t * 0.008;
    renderer.render(scene, camera);
  }
  animate();
})();


(function () {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, idx) => {
      if (e.isIntersecting) {
        const delay = (e.target.closest('.stats-row') || e.target.closest('.skills-grid') || e.target.closest('.projects-grid'))
          ? Array.from(e.target.parentElement.children).indexOf(e.target) * 80
          : 0;
        setTimeout(() => {
          e.target.classList.add('visible');
          // animate skill bars
          const bar = e.target.querySelector('.skill-bar-fill');
          if (bar) {
            setTimeout(() => {
              bar.style.width = bar.dataset.width + '%';
            }, 200);
          }
        }, delay);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));

  // Hero entrance — stagger on load
  const heroEls = document.querySelectorAll('#hero .reveal');
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 200 + i * 120);
  });
})();

function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.textContent = '✓ Message sent!';
  btn.style.background = '#059669';
  setTimeout(() => {
    btn.innerHTML = 'Send message <iconify-icon icon="solar:arrow-right-linear" width="14"></iconify-icon>';
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}

function toggleMenu() {
  // Basic mobile menu toggle — can be extended
  const links = document.querySelector('.nav-links');
  if (!links) return;
  if (links.style.display === 'flex') {
    links.style.display = '';
  } else {
    links.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:64px;left:0;right:0;background:rgba(2,6,23,0.95);padding:20px 32px;gap:16px;border-bottom:1px solid rgba(255,255,255,0.08);';
  }
}
