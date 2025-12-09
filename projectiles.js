import * as THREE from "three";

export class Projectile {
  static Material = new THREE.MeshStandardMaterial({ color: 0xffee8c });
  static Geometry = new THREE.SphereGeometry(0.15);
  constructor(startPos, target, damage, speed) {
    this.position = startPos.clone();
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.createMesh();
  }
  createMesh() {
    this.mesh = new THREE.Mesh(Projectile.Geometry, Projectile.Material);
  }
  step(delta) {
    const direction = new THREE.Vector3().subVectors(this.target.position, this.position).normalize();
    this.position.add(direction.multiplyScalar(this.speed * delta));
    this.mesh.position.copy(this.position);
  }
}
