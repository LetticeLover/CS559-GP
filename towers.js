import * as THREE from "three";
import { Projectile } from "./projectiles.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export const Types = {
  BASIC: 'basic',
  RANGER: 'ranger',
  FARM: 'farm',
  NONE: 'none',
}

const loader = new GLTFLoader();
let barnModel;
loader.load(
  './models/barn/scene.gltf',
  function (gltf) {
    barnModel = gltf.scene;
    barnModel.scale.set(0.005, 0.005, 0.005);
  },
  undefined,
  function (error) {
    console.error('Error occured while loading barn model');
    console.error(error);
  }
);

class Tower {
    constructor(position, game) {
    this.position = position.clone();
    this.game = game;
    this.target = null;
    this.shootTimer = 0;
    this.projectiles = [];
  }
  step(delta, enemies) {
    this.shootTimer += delta;

    this.target = null;
    let closestDist = Infinity;
    enemies.forEach(enemy => {
      const dist = this.position.distanceTo(enemy.position);
      if (dist < this.range && dist < closestDist) {
        this.target = enemy;
        closestDist = dist;
      }
    });

    if (this.target) {
      const angle = Math.atan2(
        this.target.position.x - this.position.x,
        this.target.position.z - this.position.z
      );
      this.fancyBarrel.rotation.y = angle;
      this.protoBarrel.rotation.y = angle;

      if (this.shootTimer > this.shootInterval) {
        const newProj = new Projectile(this.position, this.target, this.damage, this.projSpeed);
        this.projectiles.push(newProj);
        this.game.scene.add(newProj.mesh);
        this.shootTimer = 0;
      }
    }
  }
}

export class Basic extends Tower {
  static Materials = {
    prototype: new THREE.MeshStandardMaterial({ color: 0x4169e1 }),
    fancy: new THREE.MeshStandardMaterial({ color: 0x4169e1, metalness: 0.5, roughness: 0.3 }),
  }
  static Stats = {
    cost: 50,
    shootInterval: 0.2,
    damage: 10,
    range: 4,
    projectileSpeed: 20,
  }
  constructor(position, game) {
    super(position, game);
    this.position.y += 0.5;
    this.type = Types.BASIC;
    this.damage = Basic.Stats.damage;
    this.range = Basic.Stats.range;
    this.shootInterval = Basic.Stats.shootInterval;
    this.projSpeed = Basic.Stats.projectileSpeed;
    this.createMeshes();
  }
  createMeshes() {
    const protoBaseGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    const protoBarrelGeometry = new THREE.BoxGeometry(0.8, 0.5, 1.2);
    const protoMaterial = Basic.Materials.prototype;
    const protoBase = new THREE.Mesh(protoBaseGeometry, protoMaterial);
    const protoBarrel = new THREE.Mesh(protoBarrelGeometry, protoMaterial);
    protoBarrel.position.y = 0.75;
    this.protoBarrel = protoBarrel;
    this.protoTower = new THREE.Group();
    this.protoTower.position.copy(this.position);
    this.protoTower.add(protoBase);
    this.protoTower.add(protoBarrel);

    const fancyBaseGeometry = new THREE.CylinderGeometry(0.8, 1, 1, 8);
    const fancyBarrelGeometry = new THREE.BoxGeometry(0.6, 0.4, 1);
    const fancyMaterial = Basic.Materials.fancy;
    const fancyBase = new THREE.Mesh(fancyBaseGeometry, fancyMaterial);
    const fancyBarrel = new THREE.Mesh(fancyBarrelGeometry, fancyMaterial);
    fancyBarrel.position.y = 0.7;
    this.fancyBarrel = fancyBarrel;
    this.fancyTower = new THREE.Group();
    this.fancyTower.position.copy(this.position);
    this.fancyTower.add(fancyBase);
    this.fancyTower.add(fancyBarrel);
  }
}

export class Ranger extends Tower {
  static Materials = {
    prototype: new THREE.MeshStandardMaterial({ color: 0xff6347 }),
    fancy: new THREE.MeshStandardMaterial({ color: 0xff6347, metalness: 0.5, roughness: 0.3 }),
  }
  static Stats = {
    cost: 75,
    shootInterval: 1,
    damage: 25,
    range: 10,
    projectileSpeed: 25,
  }
  constructor(position, game) {
    super(position, game);
    this.position.y += 0.5;
    this.type = Types.RANGER;
    this.damage = Ranger.Stats.damage;
    this.range = Ranger.Stats.range;
    this.shootInterval = Ranger.Stats.shootInterval;
    this.projSpeed = Ranger.Stats.projectileSpeed;
    this.createMeshes();
  }
  createMeshes() {
    const protoBaseGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    const protoBarrelGeometry = new THREE.BoxGeometry(0.8, 0.5, 1.2);
    const protoMaterial = Ranger.Materials.prototype;
    const protoBase = new THREE.Mesh(protoBaseGeometry, protoMaterial);
    const protoBarrel = new THREE.Mesh(protoBarrelGeometry, protoMaterial);
    protoBarrel.position.y = 0.75;
    this.protoBarrel = protoBarrel;
    this.protoTower = new THREE.Group();
    this.protoTower.position.copy(this.position);
    this.protoTower.add(protoBase);
    this.protoTower.add(protoBarrel);

    const fancyBaseGeometry = new THREE.CylinderGeometry(0.8, 1, 1, 8);
    const fancyBarrelGeometry = new THREE.BoxGeometry(0.6, 0.4, 1);
    const fancyMaterial = Ranger.Materials.fancy;
    const fancyBase = new THREE.Mesh(fancyBaseGeometry, fancyMaterial);
    const fancyBarrel = new THREE.Mesh(fancyBarrelGeometry, fancyMaterial);
    fancyBarrel.position.y = 0.7;
    this.fancyBarrel = fancyBarrel;
    this.fancyTower = new THREE.Group();
    this.fancyTower.position.copy(this.position);
    this.fancyTower.add(fancyBase);
    this.fancyTower.add(fancyBarrel);
  }
}

export class Farm {
  static Stats = {
    cost: 100,
    shootInterval: 17.5,
    range: 1
  }
  constructor(position, game) {
    this.position = position.clone();
    this.position.y += 0.5;
    this.game = game;
    this.type = Types.FARM;
    this.range = Farm.Stats.range;
    this.shootInterval = Farm.Stats.shootInterval;
    this.shootTimer = 0;
    this.projectiles = [];
    this.createMeshes()
  }
  createMeshes() {
    const geometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x964b00 });
    this.protoTower = new THREE.Mesh(geometry, material);
    this.protoTower.position.copy(this.position);
    this.fancyTower = SkeletonUtils.clone(barnModel);
    this.fancyTower.position.copy(this.position);
    this.fancyTower.position.y -= 0.5;
    if (this.game.renderMode === 'fancy') {
      this.game.scene.add(this.fancyTower);
    } else {
      this.game.scene.add(this.protoTower);
    }
  }
  step(delta, enemies) {
    this.shootTimer += delta;
    if (this.shootTimer > this.shootInterval) {
      this.game.state.currency += 25;
      this.shootTimer = 0;
    }
  }
}
