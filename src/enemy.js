// src/enemy.js - Enemy Entity with Finite State Machine ('Espera', 'Perseguição', and 'Atordoado')

export const ENEMY_STATE = {
  ESPERA: 'Espera',
  PERSEGUICAO: 'Perseguição',
  ATORDOADO: 'Atordoado',
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

    // Damage & Stun System (Gun does not kill, only stuns after 3 shots!)
    this.hitsTaken = 0;
    this.hitsToStun = 3;
    this.stunDuration = 6.0; // Seconds paralyzed
    this.stunTimer = 0;
    this.hurtFlashTimer = 0;

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
    this.hitsTaken = 0;
    this.stunTimer = 0;
    this.hurtFlashTimer = 0;
  }

  takeDamage(bulletAngle = 0) {
    this.hitsTaken++;
    this.hurtFlashTimer = 0.22;

    // Small recoil knockback away from bullet
    this.x += Math.cos(bulletAngle) * 10;
    this.y += Math.sin(bulletAngle) * 10;

    // If asleep/patrolling, taking a hit alerts the monster into chase
    if (this.state === ENEMY_STATE.ESPERA) {
      this.state = ENEMY_STATE.PERSEGUICAO;
    }

    // Check if stun threshold is reached
    if (this.hitsTaken >= this.hitsToStun) {
      this.state = ENEMY_STATE.ATORDOADO;
      this.stunTimer = this.stunDuration;
      this.speed = 0;
      return { stunned: true, hitsTaken: this.hitsTaken, hitsToStun: this.hitsToStun };
    }

    return { stunned: false, hitsTaken: this.hitsTaken, hitsToStun: this.hitsToStun };
  }

  update(dt, player, map, audio) {
    if (!player.isAlive || player.escaped) return;

    if (this.hurtFlashTimer > 0) {
      this.hurtFlashTimer -= dt;
    }

    // ==========================================
    // Stunned State Handler
    // ==========================================
    if (this.state === ENEMY_STATE.ATORDOADO) {
      this.speed = 0;
      this.stunTimer -= dt;

      if (this.stunTimer <= 0) {
        // Monster recovers from paralysis!
        this.hitsTaken = 0;
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        const hasLOS = map.hasLineOfSight(this.x, this.y, player.x, player.y);

        if (hasLOS && dist < this.detectionRadius) {
          this.state = ENEMY_STATE.PERSEGUICAO;
          if (audio) {
            audio.playEnemyAlert();
            audio.setHeartbeatRate('fast');
          }
        } else {
          this.state = ENEMY_STATE.ESPERA;
          if (audio) {
            audio.setHeartbeatRate('slow');
          }
        }
      }
      return; // Cannot move or attack while paralyzed!
    }

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

    const isStunned = this.state === ENEMY_STATE.ATORDOADO;
    const isChasing = this.state === ENEMY_STATE.PERSEGUICAO;

    // Slight shiver when stunned or hurt
    let renderX = this.x;
    let renderY = this.y;
    if (isStunned || this.hurtFlashTimer > 0) {
      renderX += (Math.random() - 0.5) * 4;
      renderY += (Math.random() - 0.5) * 4;
    }

    ctx.translate(renderX, renderY);
    ctx.rotate(this.angle);

    // Dark shadowy mist body
    const shadowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 6);
    if (this.hurtFlashTimer > 0) {
      // Hurt flash
      shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      shadowGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.85)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (isStunned) {
      // Stunned faded blue/gray
      shadowGrad.addColorStop(0, 'rgba(30, 41, 59, 0.9)');
      shadowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.8)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (isChasing) {
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
    ctx.fillStyle = this.hurtFlashTimer > 0 ? '#fee2e2' : (isStunned ? '#1e293b' : (isChasing ? '#180505' : '#0e0e12'));
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Claws / Arms outstretched when chasing
    if (isChasing && !isStunned) {
      ctx.fillStyle = '#2b0909';
      ctx.beginPath();
      ctx.arc(12, -9, 4, 0, Math.PI * 2);
      ctx.arc(12, 9, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes
    if (isStunned) {
      // Glazed pale gray eyes
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.beginPath();
      ctx.arc(8, -5, 2, 0, Math.PI * 2);
      ctx.arc(8, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Menacing glowing eyes
      const eyePulse = Math.sin(this.eyePulseTimer) * 0.3 + 0.7;
      const eyeColor = isChasing ? `rgba(239, 68, 68, ${eyePulse})` : 'rgba(245, 158, 11, 0.85)';
      const eyeGlowColor = isChasing ? 'rgba(220, 38, 38, 0.6)' : 'rgba(217, 119, 6, 0.4)';

      ctx.fillStyle = eyeGlowColor;
      ctx.beginPath();
      ctx.arc(8, -5, 4.5, 0, Math.PI * 2);
      ctx.arc(8, 5, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(8, -5, 2, 0, Math.PI * 2);
      ctx.arc(8, 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Stunned spinning stars / badge above enemy head
    if (isStunned) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Rotating stars
      const starTime = performance.now() / 250;
      for (let i = 0; i < 3; i++) {
        const starAng = starTime + (i * Math.PI * 2) / 3;
        const sx = Math.cos(starAng) * 20;
        const sy = Math.sin(starAng) * 8 - 14;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Paralyzed badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-45, -34, 90, 16);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(-45, -34, 90, 16);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PARALISADO ${this.stunTimer.toFixed(1)}s`, 0, -22);

      ctx.restore();
    } else if (this.hitsTaken > 0) {
      // Show hit counter pips above enemy (e.g. 1/3, 2/3)
      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
      ctx.fillRect(-20, -26, 40, 10);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(-20, -26, 40, 10);

      // Fill pips
      for (let i = 0; i < this.hitsToStun; i++) {
        ctx.fillStyle = i < this.hitsTaken ? '#ef4444' : '#374151';
        ctx.fillRect(-17 + i * 13, -24, 8, 6);
      }

      ctx.restore();
    }
  }
}
