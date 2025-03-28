// Scene setup
const scene = new THREE.Scene();
const fov = window.innerWidth < 600 ? 90 : 75; // Wider FOV on phones
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = true; // Enable panning for dragging
controls.enableZoom = true;
controls.minDistance = 1; // Closer zoom for small screens
controls.maxDistance = 500;
controls.rotateSpeed = 1; // Slower rotation for touch
controls.panSpeed = 0.8; // Smooth panning
controls.zoomSpeed = 1.2; // Smooth zooming

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = window.innerWidth < 600 ? 90 : 75; // Adjust FOV dynamically
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Stars
const starsGeo = new THREE.BufferGeometry();
const starsCount = 5000;
const starsPos = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount * 3; i++) starsPos[i] = (Math.random() - 0.5) * 2000;
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
scene.add(new THREE.Points(starsGeo, starsMat));

// Sun
const sunGeo = new THREE.SphereGeometry(0.5, 32, 32);
const sunMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);
const sunLight = new THREE.PointLight(0xffffff, 1, 1000);
sun.add(sunLight);

// Bodies data
const AU_SCALE = 5;
const bodies = {
    Mercury: { a: 0.387 * AU_SCALE, e: 0.2056, i: 7.00, Ω: 48.33, ω: 29.12, M0: 174.796, period: 87.97, day: 1407.6, color: 0xaaaaaa, size: (4879 / 12742) * 0.7, diameter: 4879, image: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg' },
    Venus: { a: 0.723 * AU_SCALE, e: 0.0068, i: 3.39, Ω: 76.68, ω: 54.85, M0: 50.115, period: 224.7, day: -5832.5, color: 0xffcc00, size: (12104 / 12742) * 0.7, diameter: 12104, image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Venus_from_Mariner_10.jpg' },
    Earth: { a: 1.000 * AU_SCALE, e: 0.0167, i: 0.00, Ω: 0.00, ω: 102.9, M0: 100.464, period: 365.25, day: 23.93, color: 0x0000ff, size: 0.7, diameter: 12742, image: 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg' },
    Mars: { a: 1.524 * AU_SCALE, e: 0.0934, i: 1.85, Ω: 49.56, ω: 286.5, M0: 19.373, period: 686.98, day: 24.62, color: 0xff0000, size: (6792 / 12742) * 0.7, diameter: 6792, image: 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg' },
    Jupiter: { a: 5.203 * AU_SCALE, e: 0.0484, i: 1.30, Ω: 100.5, ω: 273.9, M0: 20.020, period: 4332.59, day: 9.93, color: 0xffa500, size: (139820 / 12742) * 0.7, diameter: 139820, image: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg' },
    Saturn: { a: 9.537 * AU_SCALE, e: 0.0542, i: 2.49, Ω: 113.7, ω: 339.4, M0: 317.020, period: 10759.22, day: 10.66, color: 0xffff99, size: (116460 / 12742) * 0.5, diameter: 116460, image: 'https://cdn.esahubble.org/archives/images/wallpaper1/heic2312a.jpg' },
    Uranus: { a: 19.191 * AU_SCALE, e: 0.0472, i: 0.77, Ω: 74.00, ω: 97.86, M0: 142.238, period: 30687.15, day: -17.24, color: 0x00ffff, size: (50724 / 12742) * 0.7, diameter: 50724, image: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg' },
    Neptune: { a: 30.069 * AU_SCALE, e: 0.0086, i: 1.77, Ω: 131.8, ω: 276.3, M0: 256.225, period: 59800.0, day: 16.11, color: 0x000099, size: (49244 / 12742) * 0.7, diameter: 49244, image: 'https://images.nationalgeographic.org/image/upload/t_RL2_search_thumb/v1607339922/videos/posters/Neptune%20101.jpg' },
    Halley: { a: 17.834 * AU_SCALE, e: 0.967, i: 162.3, Ω: 58.42, ω: 111.3, M0: 38.38, period: 27739.5, day: 240, color: 0xffffff, size: 2.0, diameter: 11, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3_OcrRn2Rgeye4Qk-CWvAS8HaCMr-C-98iA&s' }
};

// Add mean motion
Object.values(bodies).forEach(body => body.n = (2 * Math.PI) / body.period);

// Create bodies
const bodyMeshes = {};
Object.entries(bodies).forEach(([name, data]) => {
    const geo = new THREE.SphereGeometry(data.size, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: data.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { name, ...data };
    scene.add(mesh);
    bodyMeshes[name] = mesh;

    // Orbit path
    const orbitPoints = [];
    for (let t = 0; t <= 360; t += 1) {
        const v = (t * Math.PI) / 180;
        const r = data.a * (1 - data.e * data.e) / (1 + data.e * Math.cos(v));
        const x = r * (Math.cos(data.Ω * Math.PI / 180) * Math.cos(v + data.ω * Math.PI / 180) - Math.sin(data.Ω * Math.PI / 180) * Math.sin(v + data.ω * Math.PI / 180) * Math.cos(data.i * Math.PI / 180));
        const y = r * (Math.sin(data.Ω * Math.PI / 180) * Math.cos(v + data.ω * Math.PI / 180) + Math.cos(data.Ω * Math.PI / 180) * Math.sin(v + data.ω * Math.PI / 180) * Math.cos(data.i * Math.PI / 180));
        const z = r * Math.sin(v + data.ω * Math.PI / 180) * Math.sin(data.i * Math.PI / 180);
        orbitPoints.push(new THREE.Vector3(x, y, z));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({ color: data.color, opacity: 0.3, transparent: true });
    scene.add(new THREE.Line(orbitGeo, orbitMat));

    // Saturn rings
    if (name === 'Saturn') {
        const ringGeo = new THREE.RingGeometry(5, 7, 31);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide, opacity: 0.8, transparent: true });
        const rings = new THREE.Mesh(ringGeo, ringMat);
        rings.rotation.x = Math.PI / 2;
        mesh.add(rings);
    }

    // Halley tail
    if (name === 'Halley') {
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = -Math.random() * 10;

            const t = -positions[i * 3 + 2] / 10;
            colors[i * 3] = (0x00 / 255) + (0x00 - 0x00) * t;
            colors[i * 3 + 1] = (0xb7 / 255) + (0x00 - 0xb7) * t;
            colors[i * 3 + 2] = (0xeb / 255) + (0x99 - 0xeb) * t;

            sizes[i] = 0.05 + Math.random() * 0.1;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
        });

        const particleSystem = new THREE.Points(particles, material);
        scene.add(particleSystem);
        bodyMeshes[name].tail = particleSystem;
    }
});

// Lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Camera
camera.position.set(0, 40, 80);
camera.lookAt(0, 0, 0);

// Time
let timeOffset = 0;
let timeMultiplier = 1;
const j2000 = new Date('2000-01-01T12:00:00Z');

function solveKepler(M, e) {
    let E = M;
    let delta = 1;
    while (Math.abs(delta) > 1e-6) {
        delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= delta;
    }
    return E;
}

function updatePositions() {
    const currentTime = new Date();
    const baseDaysSinceJ2000 = (currentTime - j2000) / (1000 * 60 * 60 * 24);
    const daysSinceJ2000 = baseDaysSinceJ2000 + timeOffset;
    const simulatedDate = new Date(currentTime.getTime() + timeOffset * 24 * 3600 * 1000);

    Object.entries(bodies).forEach(([name, data]) => {
        const M = (data.M0 * Math.PI / 180) + (data.n * daysSinceJ2000);
        const E = solveKepler(M, data.e);
        const v = 2 * Math.atan2(Math.sqrt(1 + data.e) * Math.sin(E / 2), Math.sqrt(1 - data.e) * Math.cos(E / 2));
        const r = data.a * (1 - data.e * Math.cos(E));

        const iRad = data.i * Math.PI / 180;
        const ΩRad = data.Ω * Math.PI / 180;
        const ωRad = data.ω * Math.PI / 180;

        const x = r * (Math.cos(ΩRad) * Math.cos(v + ωRad) - Math.sin(ΩRad) * Math.sin(v + ωRad) * Math.cos(iRad));
        const y = r * (Math.sin(ΩRad) * Math.cos(v + ωRad) + Math.cos(ΩRad) * Math.sin(v + ωRad) * Math.cos(iRad));
        const z = r * Math.sin(v + ωRad) * Math.sin(iRad);

        bodyMeshes[name].position.set(x, y, z);
        bodyMeshes[name].rotation.y += (2 * Math.PI) / (data.day / 24) / 60;

        if (name === 'Halley' && bodyMeshes[name].tail) {
            const tail = bodyMeshes[name].tail;
            tail.position.copy(bodyMeshes[name].position);
            const positions = tail.geometry.attributes.position.array;
            const time = performance.now() * 0.001;

            for (let i = 0; i < 500; i++) {
                positions[i * 3 + 2] -= 0.05 + Math.sin(time + i) * 0.02;
                positions[i * 3] += Math.cos(time + i) * 0.01;
                positions[i * 3 + 1] += Math.sin(time + i) * 0.01;

                if (positions[i * 3 + 2] < -10) {
                    positions[i * 3] = (Math.random() - 0.5) * 2;
                    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
                    positions[i * 3 + 2] = 0;
                }
            }
            tail.geometry.attributes.position.needsUpdate = true;
        }
    });

    const distance = bodyMeshes.Earth.position.distanceTo(bodyMeshes.Halley.position);
    document.getElementById('distance').innerText = `Earth-Halley Distance: ${distance.toFixed(2)} AU`;
    document.getElementById('current-date').innerText = `Date: ${simulatedDate.toLocaleString()}`;
}

// Animation
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    timeOffset += (deltaTime * timeMultiplier) / (24 * 3600);
    updatePositions();

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Click handling
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(Object.values(bodyMeshes));
    if (intersects.length > 0 && intersects[0].object.userData.name) {
        const planet = intersects[0].object.userData;
        document.getElementById('planet-name').innerText = planet.name;
        let details = `
            Diameter: ${planet.diameter} km
            Distance from Earth: ${bodyMeshes.Earth.position.distanceTo(bodyMeshes[planet.name].position).toFixed(2)} AU
            Orbital Period: ${planet.period.toFixed(2)} days
            Rotation Period: ${Math.abs(planet.day).toFixed(2)} hours
        `;
        if (planet.name === 'Halley') details += `\nNext Appearance: July 28, 2061`;
        document.getElementById('planet-details').innerText = details;
        document.getElementById('planet-portrait').style.background = `url(${planet.image})`;
        document.getElementById('planet-portrait').style.backgroundSize = 'cover';
        document.getElementById('planet-info').style.display = 'block';
    }
}

window.addEventListener('click', onClick);
document.getElementById('close-info').addEventListener('click', () => {
    document.getElementById('planet-info').style.display = 'none';
});

// Controls
document.getElementById('speed').addEventListener('input', (e) => {
    timeMultiplier = parseInt(e.target.value);
});

document.getElementById('time').addEventListener('input', (e) => {
    timeOffset = parseFloat(e.target.value);
    updatePositions();
});

document.getElementById('reset-time').addEventListener('click', () => {
    timeOffset = 0;
    document.getElementById('time').value = 0;
    updatePositions();
});

document.getElementById('zoom-in').addEventListener('click', () => {
    camera.position.multiplyScalar(0.9);
});

document.getElementById('zoom-out').addEventListener('click', () => {
    camera.position.multiplyScalar(1.1);
});

window.addEventListener('wheel', (e) => {
    camera.position.multiplyScalar(e.deltaY > 0 ? 1.1 : 0.9);
});