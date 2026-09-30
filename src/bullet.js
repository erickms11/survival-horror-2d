// src/bullet.js - Bullet Projectiles and Impact Particle Effects

export class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 680; // Pixels per second
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.radius = 3;
    this.distanceTraveled = 0;
    this.maxDistance = 520;
    this.active = true;
  }

  update(dt, map) {
    if (!this.active) return;

    const moveStepX = this.vx * dt;
    const moveStepY = this.vy * dt;
    const nextX = this.x + moveStepX;
    const nextY = this.y + moveStepY;

    // Check collision with walls
    if (map.checkCircleSolidCollision(nextX, nextY, this.radius)) {
      this.active = false;
      return { hit: 'wall', x: nextX, y: nextY };
    }

    this.x = nextX;
    this.y = nextY;
    this.distanceTraveled += Math.hypot(moveStepX, moveStepY);

    if (this.distanceTraveled >= this.maxDistance) {
      this.active = false;
    }

    return null;
  }

  render(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glowing bullet tracer
    const grad = ctx.createLinearGradient(-10, 0, 4, 0);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0)');
    grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.8)');
    grad.addColorStop(1, '#ffffff');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hot projectile core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnSparks(x, y, count = 8, color = '#fbbf24') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 3 + 2.5,
        size: Math.random() * 2.5 + 1,
        color,
      });
    }
  }

  spawnBloodOrMist(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 30;
      const isRed = Math.random() > 0.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 2 + 1.8,
        size: Math.random() * 3.5 + 1.5,
        color: isRed ? 'rgba(185, 28, 28, 0.9)' : 'rgba(30, 20, 25, 0.8)',
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
