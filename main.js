import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";
import vertexSimulationShader from "./shaders/vertexSimulation.glsl";
import fragmentSimulationShader from "./shaders/fragmentSimulation.glsl";
import testTexture from "./test.png";
import texture1 from "./logo.png";
import texture2 from "./seatreasure.png";
import GUI from "lil-gui";

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.size = 1024;
    this.count = this.size * this.size;
    this.container = options.dom;
    this.scene = new THREE.Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      10
    );
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.raycster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.setupSettings();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    Promise.all([
      this.createDataTextureFromImage(texture1),
      this.createDataTextureFromImage(texture2),
    ]).then((textures) => {
      this.data1 = textures[0];
      this.data2 = textures[1];
      this.mouseEvents();
      this.setupResize();
      this.addObjects();
      this.setupFBO();
      this.render();
    });
  }

  async createDataTextureFromImage(url) {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    const canvasSize = 600;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvasSize, canvasSize);
    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      const x = Math.floor((i / 4) % canvasSize) / canvasSize - 0.5;
      const y = 0.5 - Math.floor(i / 4 / canvasSize) / canvasSize;
      if (imageData.data[i] < 5) {
        pixels.push({ x, y });
      }
    }

    const data = new Float32Array(this.count * 4);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const index = i * this.size + j;
        let randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
        if (Math.random() < 0.05) {
          randomPixel = {
            x: 3 * (Math.random() - 0.5),
            y: 3 * (Math.random() - 0.5),
          };
        }
        data[index * 4] = randomPixel.x + (Math.random() - 0.5) * 0.01;
        data[index * 4 + 1] = randomPixel.y + (Math.random() - 0.5) * 0.01;
        data[index * 4 + 2] = (Math.random() - 0.5) * 0.01;
        data[index * 4 + 3] = (Math.random() - 0.5) * 0.01;
      }
    }

    const texture = new THREE.DataTexture(
      data,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    return texture;
  }
  mouseEvents() {
    this.testMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial()
    );

    window.addEventListener("mousemove", (e) => {
      this.pointer.x = (e.clientX / this.width) * 2 - 1;
      this.pointer.y = -(e.clientY / this.height) * 2 + 1;
      this.raycster.setFromCamera(this.pointer, this.camera);

      const intersects = this.raycster.intersectObjects([this.testMesh]);
      if (intersects.length > 0) {
        const { point } = intersects[0];
        this.simulationMaterial.uniforms.uMouse.value = point;
      }
    });
  }
  addObjects() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.count * 3);
    const uvs = new Float32Array(this.count * 2);
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const index = i * this.size + j;

        positions[3 * index] = j / this.size - 0.5;
        positions[3 * index + 1] = i / this.size - 0.5;
        positions[3 * index + 2] = 0;
        uvs[2 * index] = j / (this.size - 1);
        uvs[2 * index + 1] = i / (this.size - 1);
      }
    }
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        // uTexture: { value: new THREE.TextureLoader().load(testTexture) },
        uTexture: { value: null },
        uImage: { value: new THREE.TextureLoader().load(texture2) },
      },
      depthTest: false,
      depthWrite: false,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  render() {
    this.time += 0.05;

    this.material.uniforms.time.value = this.time;
    this.material.uniforms.needsUpdate = true;

    this.simulationMaterial.uniforms.time.value = this.time;
    this.simulationMaterial.uniforms.needsUpdate = true;

    this.renderer.setRenderTarget(this.rendererTargetFBO);
    this.renderer.render(this.sceneFBO, this.cameraFBO);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    const temp = this.rendererTargetFBO;
    this.rendererTargetFBO = this.rendererTargetFBO1;
    this.rendererTargetFBO1 = temp;

    this.material.uniforms.uTexture.value = this.rendererTargetFBO.texture;
    this.simulationMaterial.uniforms.uCurrentPositions.value =
      this.rendererTargetFBO1.texture;

    window.requestAnimationFrame(this.render.bind(this));
  }
  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  setupFBO() {
    this.sceneFBO = new THREE.Scene();
    this.cameraFBO = new THREE.OrthographicCamera(-1, 1, 1, -1, -2, 2);
    this.cameraFBO.position.z = 1;
    this.cameraFBO.lookAt(0, 0, 0);
    const geometryFBO = new THREE.PlaneGeometry(2, 2, 2, 2);
    this.simulationMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCurrentPositions: { value: this.data1 },
        uOriginalPositions: { value: this.data1 },
        uOriginalPositions1: { value: this.data2 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        progress: { value: 0 },
        time: { value: 0 },
      },
      vertexShader: vertexSimulationShader,
      fragmentShader: fragmentSimulationShader,
    });
    this.simulationMesh = new THREE.Mesh(geometryFBO, this.simulationMaterial);
    this.sceneFBO.add(this.simulationMesh);

    this.rendererTargetFBO = new THREE.WebGLRenderTarget(this.size, this.size, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    });

    this.rendererTargetFBO1 = new THREE.WebGLRenderTarget(
      this.size,
      this.size,
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      }
    );
  }

  setupSettings() {
    this.settings = {
      progress: 0,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange(() => {
      this.simulationMaterial.uniforms.progress.value = this.settings.progress;
    });
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
