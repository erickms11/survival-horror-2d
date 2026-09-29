// src/enemy.js - Enemy Entity with Finite State Machine ('Espera' and 'Perseguição')

export const ENEMY_STATE = {
  ESPERA: 'Espera',
  PERSEGUICAO: 'Perseguição',
};

export class Enemy {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.radius = 16;

    // Speeds
    this.patrolSpeed = 65;
    this.chaseSpeed = 135;
    this.speed = this.patrolSpeed;

    // State Machine
    this.state = ENEMY_STATE.ESPERA;
    this.angle = 0;

    // Detection Parameters
    this.detectionRadius = 240; // Max sight distance
    this.hearingRadius = 140; // Can hear player sprinting
    this.loseTargetTimer = 0;
    this.loseTargetDuration = 3.5; // Seconds without LOS before returning to 'Espera'

    // Patrol waypoints in the house
    this.patrolPoints = [
      { x: 17.5 * 48, y: 12.5 * 48 },
      { x: 17.5 * 48, y: 7.5 * 48 },
      { x: 11.5 * 48, y: 7.5 * 48 },
      { x: 6.5 * 48, y: 7.5 * 48 },
      { x: 6.5 * 48, y: 12.5 * 48 },
      { x: 11.5 * 48, y: 12.5 * 48 },
    ];
    this.currentPatrolIndex = 0;
    this.idleWaitTimer = 0;

    // Visual anim
    this.animTimer = 0;
    this.eyePulseTimer = 0;
  }

  reset(x, y) {
    this.x = x ?? this.startX;
    this.y = y ?? this.startY;
    this.state = ENEMY_STATE.ESPERA;
    this.speed = this.patrolSpeed;
    this.loseTargetTimer = 0;
    this.idleWaitTimer = 0;
    this.currentPatrolIndex = 0;
  }

  update(dt, player, map, audio) {
    if (!player.isAlive || player.escaped) return;

    this.animTimer += dt * 4;
    this.eyePulseTimer += dt * 6;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const hasLOS = map.hasLineOfSight(this.x, this.y, player.x, player.y);

    // ==========================================
    // State Machine Transitions
    // ==========================================
    if (this.state === ENEMY_STATE.ESPERA) {
      this.speed = this.patrolSpeed;

      // Condition 1: Player in direct line of sight within detection radius
      // Condition 2: Player is very close (creeping up)
      // Condition 3: Player is sprinting nearby (noise)
      const isVisible = hasLOS && distToPlayer < this.detectionRadius;
      const isAudible = player.isSprinting && player.isMoving && distToPlayer < this.hearingRadius;
      const isTooClose = distToPlayer < 95;

      if (isVisible || isAudible || isTooClose) {
        this.state = ENEMY_STATE.PERSEGUICAO;
        this.loseTargetTimer = 0;
        if (audio) {
          audio.playEnemyAlert();
          audio.setHeartbeatRate('fast');
        }
      }
    } else if (this.state === ENEMY_STATE.PERSEGUICAO) {
      this.speed = this.chaseSpeed;

      if (hasLOS) {
        this.loseTargetTimer = 0;
      } else {
        this.loseTargetTimer += dt;
        // If lost sight for too long or player is very far away, calm down back to 'Espera'
        if (this.loseTargetTimer >= this.loseTargetDuration || distToPlayer > 390) {
          this.state = ENEMY_STATE.ESPERA;
          this.loseTargetTimer = 0;
          if (audio) {
            audio.setHeartbeatRate('slow');
          }
        }
      }
    }

    // ==========================================
    // Movement Behavior based on current state
    // ==========================================
    let targetX = 0;
    let targetY = 0;

    if (this.state === ENEMY_STATE.PERSEGUICAO) {
      targetX = player.x;
      targetY = player.y;
    } else {
      // 'Espera': Patrol waypoint routine
      if (this.idleWaitTimer > 0) {
        this.idleWaitTimer -= dt;
        return; // Pause briefly at waypoint
      }

      const wp = this.patrolPoints[this.currentPatrolIndex];
      targetX = wp.x;
      targetY = wp.y;

      const distToWP = Math.hypot(targetX - this.x, targetY - this.y);
      if (distToWP < 24) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        this.idleWaitTimer = 1.5; // Wait 1.5s looking around
      }
    }

    // Move towards target
    const angleToTarget = Math.atan2(targetY - this.y, targetX - this.x);
    this.angle = angleToTarget;

    let moveX = Math.cos(angleToTarget) * this.speed * dt;
    let moveY = Math.sin(angleToTarget) * this.speed * dt;

    // Try moving along X
    const nextX = this.x + moveX;
    if (!map.checkCircleSolidCollision(nextX, this.y, this.radius)) {
      this.x = nextX;
    } else {
      // Wall slide attempt
      moveY += (Math.sin(this.animTimer) > 0 ? 1 : -1) * this.speed * dt * 0.5;
    }

    // Try moving along Y
    const nextY = this.y + moveY;
    if (!map.checkCircleSolidCollision(this.x, nextY, this.radius)) {
      this.y = nextY;
    } else {
      // Wall slide attempt
      moveX += (Math.cos(this.animTimer) > 0 ? 1 : -1) * this.speed * dt * 0.5;
    }

    // ==========================================
    // Attack / Catch Player
    // ==========================================
    if (distToPlayer < this.radius + player.radius - 2) {
      player.isAlive = false;
      if (audio) {
        audio.playJumpscare();
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const isChasing = this.state === ENEMY_STATE.PERSEGUICAO;

    // Dark shadowy mist body
    const shadowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 6);
    if (isChasing) {
      shadowGrad.addColorStop(0, 'rgba(40, 5, 5, 0.95)');
      shadowGrad.addColorStop(0.7, 'rgba(20, 2, 2, 0.85)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      shadowGrad.addColorStop(0, 'rgba(15, 15, 20, 0.95)');
      shadowGrad.addColorStop(0.7, 'rgba(8, 8, 12, 0.85)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
    ctx.fill();

    // Creepy jagged cloak / shroud
    ctx.fillStyle = isChasing ? '#180505' : '#0e0e12';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Claws / Arms outstretched when chasing
    if (isChasing) {
      ctx.fillStyle = '#2b0909';
      ctx.beginPath();
      // Left claw
      ctx.arc(12, -9, 4, 0, Math.PI * 2);
      // Right claw
      ctx.arc(12, 9, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Menacing glowing eyes
    const eyePulse = Math.sin(this.eyePulseTimer) * 0.3 + 0.7;
    const eyeColor = isChasing ? `rgba(239, 68, 68, ${eyePulse})` : 'rgba(245, 158, 11, 0.85)';
    const eyeGlowColor = isChasing ? 'rgba(220, 38, 38, 0.6)' : 'rgba(217, 119, 6, 0.4)';

    // Eye glow aura
    ctx.fillStyle = eyeGlowColor;
    ctx.beginPath();
    ctx.arc(8, -5, 4.5, 0, Math.PI * 2);
    ctx.arc(8, 5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Sharp glowing pupils
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(8, -5, 2, 0, Math.PI * 2);
    ctx.arc(8, 5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
