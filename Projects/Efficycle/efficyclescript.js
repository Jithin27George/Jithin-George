import * as THREE         from "three";
import { OrbitControls }  from "jsm/controls/OrbitControls.js";
import { GLTFLoader }     from "jsm/loaders/GLTFLoader.js";

// 1️⃣ Grab the container
const container = document.getElementById("viewer");

// 2️⃣ Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x121212);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// 3️⃣ Scene & Camera
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.set(0, 1, 1.75);

// 3.a) Save the initial camera state
const initialCamPos    = camera.position.clone();
const initialCamQuat   = camera.quaternion.clone();

// 4️⃣ Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const initialTarget = controls.target.clone();

// only allow rotation
controls.enableZoom = false;
controls.enablePan  = false;

// 5️⃣ Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(10,10,10);
scene.add(dir);

// 6️⃣ Load your GLB
let model = null;
new GLTFLoader().load("Efficycle2019.gltf",
  gltf => {
    model = gltf.scene;
    scene.add(model);

    // auto‐scale & center
    const box    = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale  = 2 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
  },
  undefined,
  err => console.error("Model load error:", err)
);

// 7️⃣ Resize logic
function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// 8️⃣ Auto‐rotate with resume after 10 s
let userInteracted = false;
let resumeTimer    = null;

controls.addEventListener("start", () => {
  userInteracted = true;
  clearTimeout(resumeTimer);
});

controls.addEventListener("end", () => {
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => {
    // 8.a) Restore camera & target to initial state
    camera.position.copy(initialCamPos);
    camera.quaternion.copy(initialCamQuat);
    controls.target.copy(initialTarget);
    controls.update();    // ensure the controls pick up the restored values

    // 8.b) Now resume auto‐rotation
    userInteracted = false;
  }, 1000); // 10 seconds
});

// 9️⃣ Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (model && !userInteracted) {
    model.rotation.y += 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();
