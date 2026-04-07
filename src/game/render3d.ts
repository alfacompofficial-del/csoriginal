import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Player, Bot, Bullet, GameMap } from './types';

export class Renderer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private loader: GLTFLoader;
  private models: Map<string, THREE.Group> = new Map();
  private agentModels: Map<number | string, THREE.Group> = new Map();
  private mapModel?: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.loader = new GLTFLoader();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    this.loadModels();
  }

  private loadModels() {
    // Map
    this.loader.load('/models/dust2.glb', (gltf) => {
      this.mapModel = gltf.scene;
      this.mapModel.scale.set(10, 10, 10); // Adjust scale as needed
      this.scene.add(this.mapModel);
    });

    // Character models (cached)
    this.loader.load('/models/ctm_sas__cs2_agent_model.glb', (gltf) => {
      this.models.set('CT', gltf.scene);
    });
    this.loader.load('/models/phoenix__cs2_agent_model.glb', (gltf) => {
      this.models.set('T', gltf.scene);
    });
  }

  public render(player: Player, bots: Bot[], bullets: Bullet[], map: GameMap) {
    // Update Camera
    // Top-down-ish third person or first person?
    // Let's go with a follow camera for now.
    const camOffset = new THREE.Vector3(0, 400, 200);
    this.camera.position.x = player.pos.x;
    this.camera.position.y = camOffset.y;
    this.camera.position.z = player.pos.y + camOffset.z;
    this.camera.lookAt(player.pos.x, 0, player.pos.y);

    // Update Player Model
    this.updateAgentModel('player', player.pos, player.angle, player.team, player.alive);

    // Update Bot Models
    bots.forEach(bot => {
      this.updateAgentModel(bot.id, bot.pos, bot.angle, bot.team, bot.alive);
    });

    this.renderer.render(this.scene, this.camera);
  }

  private updateAgentModel(id: string | number, pos: {x: number, y: number}, angle: number, team: 'T' | 'CT', alive: boolean) {
    let model = this.agentModels.get(id);

    if (!alive) {
      if (model) {
        this.scene.remove(model);
        this.agentModels.delete(id);
      }
      return;
    }

    if (!model) {
      const baseModel = this.models.get(team);
      if (baseModel) {
        model = baseModel.clone();
        this.scene.add(model);
        this.agentModels.set(id, model);
      }
    }

    if (model) {
      model.position.set(pos.x, 0, pos.y);
      model.rotation.y = -angle + Math.PI / 2;
    }
  }

  public resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

