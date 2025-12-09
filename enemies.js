import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";


function drawHealthBar(canvas, context, texture, healthPercent) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = `hsl(${healthPercent * 0.3 * 360}, 100%, 50%)`; 
  context.fillRect(1, 1, (canvas.width - 2) * healthPercent, canvas.height - 2);
  texture.needsUpdate = true;
}

const loader = new GLTFLoader();
let goblinModel;
let ogreModel;
loader.load(
  './models/goblin/scene.gltf',
  function (gltf) {
    goblinModel = gltf.scene;
    goblinModel.scale.set(25, 25, 25);
  },
  undefined,
  function (error) {
    console.error('Error occured while loading goblin model');
    console.error(error);
  }
);
loader.load(
  './models/ogre/scene.gltf',
  function (gltf) {
    ogreModel = new THREE.Group();
    const model = gltf.scene;
    model.rotation.y = -Math.PI/2;
    ogreModel.add(model);
    ogreModel.scale.set(0.25, 0.25, 0.25);
  },
  undefined,
  function (error) {
    console.error('Error occured while loading ogre model');
    console.error(error);
  }
);

class Enemy {
  constructor(waypoints, game) {
    this.waypoints = waypoints;
    this.position = waypoints[0].clone();
    this.waypointIndex = 1;
    this.game = game;
  }
  step(delta) {
    const target = this.waypoints[this.waypointIndex];
    target.y = this.position.y;
    const direction = new THREE.Vector3().subVectors(target, this.position).normalize();
    this.position.add(direction.multiplyScalar(this.speed * delta));
    const angle = Math.atan2(direction.x, direction.z);
    this.protoMesh.position.copy(this.position);
    this.protoMesh.rotation.y = angle;
    if (this.fancyMesh) {
      this.fancyMesh.position.copy(this.position);
      this.fancyMesh.rotation.y = angle;
    }
    if (this.position.distanceTo(target) < 0.25) {
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        //handled in game.js
        return;
      }
    }
    drawHealthBar(this.canvas, this.context, this.healthBarTexture, this.health / this.maxHealth);
  }
  addScore() {
    this.game.state.score += this.score;
  }
}

export class Goblin extends Enemy {
  static Stats = {
    maxHealth: 50,
    damage: 1,
    baseSpeed: 2.5,
    score: 5,
  }
  constructor(waypoints, wave, game) {
    super(waypoints, game);
    this.maxHealth = Goblin.Stats.maxHealth * wave/2;
    this.speed = Goblin.Stats.baseSpeed * Math.exp(wave/10);
    this.damage = Goblin.Stats.damage;
    this.score = Goblin.Stats.score;
    if (game.state.difficulty === 'easy') {
      this.maxHealth /= 2;
      this.speed /= 3;
      this.score /= 5;
    }
    if (game.state.difficulty === 'hard') {
      this.maxHealth *= 2;
      this.speed *= 1.5;
      this.damage *= 2;
      this.score *= 5;
    }
    this.speed = Math.min(this.speed, 18);
    this.health = this.maxHealth;
    this.material = new THREE.MeshStandardMaterial({ color: 0x0fa92f });
    this.createMesh();
  }
  createMesh() {
    const protoGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 10, 20, 1);
    this.position.y = 1.5;
    this.protoMesh = new THREE.Mesh(protoGeometry, this.material);
    this.protoMesh.position.copy(this.position);
    this.fancyMesh = SkeletonUtils.clone(goblinModel);
    this.fancyMesh.position.copy(this.position);
    if (this.game.renderMode === 'fancy') {
      this.game.scene.add(this.fancyMesh);
    } else {
      this.game.scene.add(this.protoMesh);
    }
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 32;
    this.context = this.canvas.getContext('2d');
    this.healthBarTexture = new THREE.CanvasTexture(this.canvas);
    const healthBarMaterial = new THREE.SpriteMaterial({ map: this.healthBarTexture });
    this.healthBarSprite = new THREE.Sprite(healthBarMaterial);
    this.healthBarSprite.position.set(0, 0.125, 0);
    this.healthBarSprite.scale.set(1/20, 1/35, 1/20);
    this.fancyMesh.add(this.healthBarSprite);
  }
}

export class Ogre extends Enemy {
  static Stats = {
    maxHealth: 200,
    damage: 5,
    baseSpeed: 1,
    score: 15,
  }
  constructor(waypoints, wave, game) {
    super(waypoints, game);
    this.maxHealth = Ogre.Stats.maxHealth * wave/2;
    this.speed = Ogre.Stats.baseSpeed * Math.exp(wave/15);
    this.damage = Ogre.Stats.damage;
    this.score = Ogre.Stats.score;
    if (game.state.difficulty === 'easy') {
      this.maxHealth /= 2;
      this.speed /= 3;
      this.score /= 5;
    }
    if (game.state.difficulty === 'hard') {
      this.maxHealth *= 2;
      this.speed *= 1.5;
      this.damage *= 2;
      this.score *= 5;
    }
    this.speed = Math.min(this.speed, 12);
    this.health = this.maxHealth;
    this.material = new THREE.MeshStandardMaterial({ color: 0x5a9c39 });
    this.createMesh();
  }
  createMesh() {
    const geometry = new THREE.CapsuleGeometry(1, 2, 10, 20, 1);
    this.position.y = 2;
    this.protoMesh = new THREE.Mesh(geometry, this.material);
    this.protoMesh.position.copy(this.position);
    this.fancyMesh = SkeletonUtils.clone(ogreModel);
    this.fancyMesh.position.copy(this.position);
    if (this.game.renderMode === 'fancy') {
      this.game.scene.add(this.fancyMesh);
    } else {
      this.game.scene.add(this.protoMesh);
    }
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 32;
    this.context = this.canvas.getContext('2d');
    this.healthBarTexture = new THREE.CanvasTexture(this.canvas);
    const healthBarMaterial = new THREE.SpriteMaterial({ map: this.healthBarTexture });
    this.healthBarSprite = new THREE.Sprite(healthBarMaterial);
    this.healthBarSprite.position.set(0, 20, 0);
    this.healthBarSprite.scale.set(10, 4, 10);
    this.fancyMesh.add(this.healthBarSprite);
  }
}
