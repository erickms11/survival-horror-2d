// src/player.js - Player Entity with 4-Direction WASD, Collision, and Flashlight
import { Bullet } from './bullet.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14; // Circle collision radius
    this.baseSpeed = 160; // Pixels per second
    this.sprintSpeed = 230;
    this.speed = this.baseSpeed;

    this.angle = 0; // Facing angle in radians
    this.flashlightAngle = 0;
    this.flashlightRange = 290;
    this.flashlightBeamAngle = (68 * Math.PI) / 180; // Cone spread
    this.ambientRadius = 85; // Radial ambient vision around player

    // Stamina system for sprint
    this.stamina = 100;
    this.maxStamina = 100;
    this.isSprinting = false;

    // Inventory & Equipment
    this.keys = new Set();
    this.hasWeapon = false;
    this.ammo = 0;
    this.maxAmmo = 6;
    this.shootCooldown = 0;
    this.shootCooldownMax = 0.4;
    this.justPickedWeapon = false;
    this.justPickedAmmo = false;

    this.escaped = false;
    this.isAlive = true;

    // Movement state
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
    this.walkAnimTimer = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.stamina = this.maxStamina;
    this.keys.clear();
    this.hasWeapon = false;
    this.ammo = 0;
    this.shootCooldown = 0;
    this.justPickedWeapon = false;
    this.justPickedAmmo = false;
    this.escaped = false;
    this.isAlive = true;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.flashlightAngle = 0;
  }

  shoot() {
    if (!this.isAlive || this.escaped) return null;
    if (!this.hasWeapon) return null;
    if (this.shootCooldown > 0) return null;

    if (this.ammo <= 0) {
      this.shootCooldown = 0.3;
      return { dryClick: true };
    }

    this.ammo--;
    this.shootCooldown = this.shootCooldownMax;

    // Calculate muzzle coordinates (gun held in right hand)
    const forwardX = Math.cos(this.flashlightAngle);
    const forwardY = Math.sin(this.flashlightAngle);
    const rightX = -Math.sin(this.flashlightAngle);
    const rightY = Math.cos(this.flashlightAngle);

    const muzzleX = this.x + forwardX * 22 + rightX * 6;
    const muzzleY = this.y + forwardY * 22 + rightY * 6;

    const bullet = new Bullet(muzzleX, muzzleY, this.flashlightAngle);
    return {
      bullet,
      muzzleX,
      muzzleY,
    };
  }

  handleInput(input, mousePos) {
    if (!this.isAlive || this.escaped) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    let dx = 0;
    let dy = 0;

    if (input.isDown('KeyW') || input.isDown('ArrowUp')) dy -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) dy += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) dx -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.SQRT2;
      dx /= len;
      dy /= len;
    }

    // Sprint handling
    const wantsSprint = (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) && (dx !== 0 || dy !== 0);
    if (wantsSprint && this.stamina > 5) {
      this.isSprinting = true;
      this.speed = this.sprintSpeed;
    } else {
      this.isSprinting = false;
      this.speed = this.baseSpeed;
    }

    this.vx = dx * this.speed;
    this.vy = dy * this.speed;
    this.isMoving = dx !== 0 || dy !== 0;

    // Aim flashlight towards mouse if available, else direction of motion
    if (mousePos && mousePos.active) {
      this.flashlightAngle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
      this.angle = this.flashlightAngle;
    } else if (this.isMoving) {
      this.angle = Math.atan2(dy, dx);
      this.flashlightAngle = this.angle;
    }
  }

  update(dt, map, audio) {
    if (!this.isAlive || this.escaped) return;

    // Stamina drain and regen
    if (this.isSprinting && this.isMoving) {
      this.stamina = Math.max(0, this.stamina - dt * 28);
      if (this.stamina <= 0) {
        this.isSprinting = false;
        this.speed = this.baseSpeed;
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 18);
    }

    // Walking animation timer & footsteps
    if (this.isMoving) {
      this.walkAnimTimer += dt * (this.isSprinting ? 12 : 8);
      if (audio && Math.sin(this.walkAnimTimer) > 0.95 && !this.stepped) {
        audio.playFootstep();
        this.stepped = true;
      } else if (Math.sin(this.walkAnimTimer) <= 0.8) {
        this.stepped = false;
      }
    }

    // Cooldown decrement
    if (this.shootCooldown > 0) {
      this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    }

    // Collision detection with sliding on X and Y axes independently
    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    // Try moving X first
    if (!map.checkCircleSolidCollision(nextX, this.y, this.radius)) {
      this.x = nextX;
    }

    // Try moving Y second
    if (!map.checkCircleSolidCollision(this.x, nextY, this.radius)) {
      this.y = nextY;
    }

    // Check key pickups
    for (const key of map.keys) {
      if (!key.collected) {
        const dist = Math.hypot(this.x - key.x, this.y - key.y);
        if (dist < this.radius + 24) {
          key.collected = true;
          this.keys.add(key.id);
          if (audio) audio.playKeyPickup();

          // If all 3 keys collected, unlock the door
          if (this.keys.size >= 3 && map.exitDoor) {
            map.exitDoor.isOpen = true;
            if (audio) audio.playDoorUnlock();
          }
        }
      }
    }

    // Check weapon pickup
    if (map.weapon && !map.weapon.collected) {
      const dist = Math.hypot(this.x - map.weapon.x, this.y - map.weapon.y);
      if (dist < this.radius + 24) {
        map.weapon.collected = true;
        this.hasWeapon = true;
        this.ammo = map.weapon.ammo || 6;
        this.justPickedWeapon = true;
        if (audio) audio.playKeyPickup();
      }
    }

    // Check ammo box pickups
    if (map.ammoBoxes) {
      for (const box of map.ammoBoxes) {
        if (!box.collected) {
          const dist = Math.hypot(this.x - box.x, this.y - box.y);
          if (dist < this.radius + 22) {
            box.collected = true;
            this.ammo = Math.min(this.maxAmmo * 2, this.ammo + box.amount);
            this.justPickedAmmo = true;
            if (audio) audio.playKeyPickup();
          }
        }
      }
    }

    // Check exit door collision / win condition
    if (map.exitDoor && map.exitDoor.isOpen) {
      const exitDist = Math.hypot(this.x - map.exitDoor.x, this.y - map.exitDoor.y);
      if (exitDist < this.radius + 24) {
        this.escaped = true;
        if (audio) audio.playVictory();
      }
    }
  }

  render(ctx) {
    if (!this.isAlive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Subtle walk bobbing
    const bob = this.isMoving ? Math.sin(this.walkAnimTimer) * 2 : 0;

    // Flashlight casing held in left hand
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(8, -9, 10, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(17, -9, 2.5, 4);

    // If weapon equipped, draw revolver in right hand
    if (this.hasWeapon) {
      // Gun barrel
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, 5, 12, 3);
      // Gun cylinder
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 4, 5, 5);
      // Gun grip
      ctx.fillStyle = '#78350f';
      ctx.fillRect(3, 7, 4, 5);
    } else {
      // Flashlight right hand accessory
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(8, 6, 8, 4);
    }

    // Hands
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(8, 8, 4, 0, Math.PI * 2);
    ctx.arc(8, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Body / Shoulders (Dark Green / Brown survivor jacket)
    ctx.fillStyle = '#263a29';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#152418';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Head
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.arc(bob, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Cap
    ctx.fillStyle = '#1e1b18';
    ctx.beginPath();
    ctx.arc(bob - 1, 0, 6.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    ctx.restore();
  }
}
