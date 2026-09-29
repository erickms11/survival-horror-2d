// src/player.js - Player Entity with 4-Direction WASD, Collision, and Flashlight

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

    // Inventory
    this.keys = new Set();
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
    this.escaped = false;
    this.isAlive = true;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.flashlightAngle = 0;
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
        if (dist < this.radius + 16) {
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

    // Check exit door collision / win condition
    if (map.exitDoor && map.exitDoor.isOpen) {
      const exitDist = Math.hypot(this.x - map.exitDoor.x, this.y - map.exitDoor.y);
      if (exitDist < this.radius + 18) {
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

    // Flashlight casing held in right hand
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(8, 6, 12, 5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(19, 6, 3, 5);

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
