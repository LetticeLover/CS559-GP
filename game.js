import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as Towers from "./towers.js";
import * as Enemies from "./enemies.js";
import * as Projectiles from "./projectiles.js";

export class Game {
  static groundMats = {
    prototype: new THREE.MeshStandardMaterial({ color: 0x2d5016, side: THREE.DoubleSide }), 
    fancy: new THREE.MeshStandardMaterial({ color: 0x228b22, side: THREE.DoubleSide, roughness: 0.8 }),
  }
  static pathMats = {
    prototype: new THREE.MeshStandardMaterial({ color: 0x4a4a4a }),
    fancy: new THREE.MeshStandardMaterial({ color: 0x8b4513 }),
  }

  waypoints = [
    new THREE.Vector3(-18, 0.5, -10),
    new THREE.Vector3(-10, 0.5, -10),
    new THREE.Vector3(-10, 0.5, 0),
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0, 0.5, 10),
    new THREE.Vector3(10, 0.5, 10),
    new THREE.Vector3(10, 0.5, 0),
    new THREE.Vector3(18, 0.5, 0)
  ];

  constructor(renderer, lives = 20, startingCurrency = 150, difficulty = 'normal') {
    this.state = {
      lives: lives,
      currency: startingCurrency,
      wave: 1,
      score: 0,
      difficulty: difficulty,
      paused: false,
      gameOver: false,
    }
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();
    this.renderMode = 'prototype';
    this.initScene();
    this.initGame();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-25, 25, 25, -25, 0.1, 1000);
    this.camera.position.set(10, 20, 25);
    this.camera.lookAt(0, 0, 0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    }
    

    this.scene.background = new THREE.Color(this.renderMode === 'prototype' ? 0x87ceeb : 0x1a1a2e);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(40, 40);
    const groundMaterial = this.renderMode === 'prototype' ? Game.groundMats.prototype : Game.groundMats.fancy;
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotateX(-Math.PI/2);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.pathSegments = [];
    const pathMaterial = this.renderMode === 'prototype' ? Game.pathMats.prototype : Game.pathMats.fancy;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const start = this.waypoints[i];
      const end = this.waypoints[i + 1];
      const distance = start.distanceTo(end);
      const pathGeometry = new THREE.BoxGeometry(distance, 0.2, 2);
      const pathSegment = new THREE.Mesh(pathGeometry, pathMaterial);

      // place segment halfway between start and end
      pathSegment.position.copy(start).lerp(end, 0.5);
      const angle = Math.atan2(end.z - start.z, end.x - start.x);
      pathSegment.rotation.y = angle;
      this.scene.add(pathSegment);
      this.pathSegments.push(pathSegment);
    }

    const startGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
    const startMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const startMarker = new THREE.Mesh(startGeometry, startMaterial);
    startMarker.position.copy(this.waypoints[0]);
    this.scene.add(startMarker);

    const endGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
    const endMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const endMarker = new THREE.Mesh(endGeometry, endMaterial);
    endMarker.position.copy(this.waypoints[this.waypoints.length - 1]);
    this.scene.add(endMarker);
  }

  swapRenderMode() {
    if (this.renderMode === 'fancy') {
      this.renderMode = 'prototype';
      this.ground.material = Game.groundMats.prototype;
      this.pathSegments.forEach(segment => {
        segment.material = Game.pathMats.prototype;
      });
      this.towers.forEach(tower => {
        this.scene.remove(tower.fancyTower);
        this.scene.add(tower.protoTower);
      });
      this.enemies.forEach(enemy => {
        this.scene.remove(enemy.fancyMesh);
        this.scene.add(enemy.protoMesh);
      });
    } else if (this.renderMode === 'prototype') {
      this.renderMode = 'fancy';
      this.ground.material = Game.groundMats.fancy;
      this.pathSegments.forEach(segment => {
        segment.material = Game.pathMats.fancy;
      });
      this.towers.forEach(tower => {
        this.scene.remove(tower.protoTower);
        this.scene.add(tower.fancyTower);
      });
      this.enemies.forEach(enemy => {
        this.scene.remove(enemy.protoMesh);
        this.scene.add(enemy.fancyMesh);
      });
    }
  }

  initGame() {
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.enemySpawnTimer = 0;
    this.enemiesSpawned = 0;
    this.enemiesPerWave = 10;
    this.selectedTowerType = Towers.Types.BASIC;
  }

  onMouseClick(mousePos) {
    this.raycaster.setFromCamera(mousePos, this.camera);
    const intersects = this.raycaster.intersectObject(this.ground);
    if (intersects.length > 0) {
      const point = intersects[0].point;

      let onPath = false;
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        const start = this.waypoints[i];
        const end = this.waypoints[i + 1];
        const distance = new THREE.Vector3(point.x, 0.0, point.z)
          .distanceTo(new THREE.Vector3((start.x + end.x) / 2, 0.0, (start.z + end.z) / 2));
        if (distance < 2) {
          onPath = true;
          break;
        }
      }

      if (!onPath) {
        let cost;
        switch (this.selectedTowerType) {
          case Towers.Types.BASIC:
            cost = Towers.Basic.Stats.cost;
            if (this.state.currency >= cost) {
              this.state.currency -= cost;
              const newTower = new Towers.Basic(new THREE.Vector3(point.x, 0.0, point.z), this);
              this.towers.push(newTower);
              if (this.renderMode === 'prototype') {
                this.scene.add(newTower.protoTower);
              } else {
                this.scene.add(newTower.fancyTower);
              }
            }
            break;
          case Towers.Types.RANGER:
            cost = Towers.Ranger.Stats.cost;
            if (this.state.currency >= cost) {
              this.state.currency -= cost;
              const newTower = new Towers.Ranger(new THREE.Vector3(point.x, 0.0, point.z), this);
              this.towers.push(newTower);
              if (this.renderMode === 'prototype') {
                this.scene.add(newTower.protoTower);
              } else {
                this.scene.add(newTower.fancyTower);
              }
            }
            break;
        }
      }
    }
  }

  onMouseMove(mouse) {
    const prevCirc = this.scene.getObjectByName('range circle');
    if (prevCirc) {
      this.scene.remove(prevCirc);
    }
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.ground);
    if (intersects.length > 0) {
      const point = intersects[0].point;

      let onPath = false;
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        const start = this.waypoints[i];
        const end = this.waypoints[i + 1];
        const distance = new THREE.Vector3(point.x, 0.0, point.z)
          .distanceTo(new THREE.Vector3((start.x + end.x) / 2, 0.0, (start.z + end.z) / 2));
        if (distance < 2) {
          onPath = true;
          break;
        }
      }
      if (!onPath) {
        let range;
        switch (this.selectedTowerType) {
          case Towers.Types.BASIC:
            range = Towers.Basic.Stats.range;
            break;
          case Towers.Types.RANGER:
            range = Towers.Ranger.Stats.range;
            break;
        }
        const geometry = new THREE.CircleGeometry(range);
        const material = new THREE.MeshStandardMaterial({ color: 0xadd836, transparent: true, opacity: 0.4 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(point);
        mesh.position.y += 0.25;
        mesh.rotation.x = -Math.PI/2;
        mesh.name = 'range circle'
        this.scene.add(mesh);
      }
    }

  }

  spawnEnemy() {
    let enemy;
    if (Math.random() > 0.75) {
      enemy = new Enemies.Ogre(this.waypoints, this.state.wave, this);
    } else {
      enemy = new Enemies.Goblin(this.waypoints, this.state.wave, this);
    }
    this.enemies.push(enemy);
    this.enemiesSpawned++;
    this.enemySpawnTimer = 0;
  }

  step(delta) {
    if (this.state.paused || this.state.gameOver) {
      return;
    }

    this.enemySpawnTimer += delta;
    if (this.enemiesSpawned < this.enemiesPerWave && this.enemySpawnTimer > 1/(Math.log(0.15 * this.state.wave + 1))) {
      this.spawnEnemy();
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.waypointIndex < this.waypoints.length) {
        enemy.step(delta);
      } else {
        this.scene.remove(enemy.protoMesh);
        this.scene.remove(enemy.fancyMesh);
        this.enemies.splice(i, 1);
        this.state.lives -= enemy.damage;
        if (this.state.lives <= 0) {
          this.state.gameOver = true;
          return;
        }
      }

      if (enemy.material) {
        const healthPercent = enemy.health / enemy.maxHealth;
        enemy.material.color.setHSL(healthPercent * 0.3, 1.0, 0.5);
      }
    }

    this.towers.forEach(tower => {
      tower.step(delta, this.enemies);
      const projectiles = tower.projectiles;
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        if (proj.target && this.enemies.includes(proj.target)) {
          proj.step(delta);
          if (proj.position.distanceTo(proj.target.position) < 0.1) {
            console.log("proj hit!");
            proj.target.health -= proj.damage;
            if (proj.target.health <= 0) {
              const enemyIndex = this.enemies.findIndex(e => e === proj.target);
              proj.target.addScore();
              this.enemies.splice(enemyIndex, 1);
              this.scene.remove(proj.target.protoMesh);
              this.scene.remove(proj.target.fancyMesh);
            }
            this.scene.remove(proj.mesh);
            tower.projectiles.splice(i, 1);
          }
        } else {
          this.scene.remove(proj.mesh);
          tower.projectiles.splice(i, 1);
        }
      }
    });

    if (this.enemiesSpawned >= this.enemiesPerWave && this.enemies.length == 0 && !this.state.gameOver) {
      this.enemiesSpawned = 0;
      this.enemiesPerWave += 3;
      this.state.wave++;
      this.score += 100;
      this.state.currency += 50;
    }
  }
}
