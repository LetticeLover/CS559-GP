import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
  }
  addScore() {
    this.game.state.score += this.score;
  }
}

export class Goblin extends Enemy {
  static Stats = {
    maxHealth: 50,
    damage: 1,
    baseSpeed: 5,
    score: 5,
  }
  constructor(waypoints, wave, game) {
    super(waypoints, game);
    this.maxHealth = Goblin.Stats.maxHealth * wave/2;
    this.speed = Goblin.Stats.baseSpeed * Math.exp(wave/7);
    this.damage = Goblin.Stats.damage;
    this.score = Goblin.Stats.score;
    if (game.state.difficulty === 'easy') {
      this.maxHealth /= 2;
      this.speed /= 3;
      this.score /= 5;
    }
    console.log(game.state.difficulty);
    if (game.state.difficulty === 'hard') {
      this.maxHealth *= 2;
      this.speed *= 1.5;
      this.damage *= 2;
      this.score *= 5;
    }
    this.health = this.maxHealth;
    this.material = new THREE.MeshStandardMaterial({ color: 0x0fa92f });
    this.createMesh();
  }
  createMesh() {
    const protoGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 10, 20, 1);
    this.position.y = 1.5;
    this.protoMesh = new THREE.Mesh(protoGeometry, this.material);
    this.protoMesh.position.copy(this.position);
    this.fancyMesh = this.protoMesh;
    this.game.scene.add(this.protoMesh);
    const loader = new GLTFLoader();
    loader.load(
      "./models/goblin/scene.gltf",
      (gltf) => {
        this.fancyMesh = gltf.scene;
        this.fancyMesh.scale.set(25, 25, 25);
        this.fancyMesh.position.copy(this.position);
        if (this.game.renderMode === 'fancy') {
          this.game.scene.remove(this.protoMesh);
          this.game.scene.add(this.fancyMesh);
        }
      },
      function(xhr) {
      },
      function(error) {
        console.log(error);
      }
    );
  }
}

export class Ogre extends Enemy {
  static Stats = {
    maxHealth: 200,
    damage: 5,
    baseSpeed: 2,
    score: 15,
  }
  constructor(waypoints, wave, game) {
    super(waypoints, game);
    this.maxHealth = Ogre.Stats.maxHealth * wave/2;
    this.speed = Ogre.Stats.baseSpeed * Math.exp(wave/10);
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
    this.health = this.maxHealth;
    this.material = new THREE.MeshStandardMaterial({ color: 0x5a9c39 });
    this.createMesh();
  }
  createMesh() {
    const geometry = new THREE.CapsuleGeometry(1, 2, 10, 20, 1);
    this.position.y = 2;
    this.protoMesh = new THREE.Mesh(geometry, this.material);
    this.protoMesh.position.copy(this.position);
    this.fancyMesh = this.protoMesh;
    this.game.scene.add(this.protoMesh);
    const loader = new GLTFLoader();
    loader.load(
      "./models/ogre/scene.gltf",
      (gltf) => {
        this.fancyMesh = new THREE.Group();
        const mesh = gltf.scene;
        mesh.scale.set(0.25, 0.25, 0.25);
        mesh.rotation.y = -Math.PI/2;
        this.fancyMesh.position.copy(this.position);
        this.fancyMesh.add(mesh);
        if (this.game.renderMode === 'fancy') {
          this.game.scene.remove(this.protoMesh);
          this.game.scene.add(this.fancyMesh);
        }
      },
      function(xhr) {
      },
      function(error) {
        console.log(error);
      }
    );
  }
}
