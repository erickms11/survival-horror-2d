// src/lighting.js - Global Darkness & Dynamic Flashlight Vision Cone System

export class LightingSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Off-screen canvas for the darkness mask
    if (typeof document !== 'undefined') {
      this.maskCanvas = document.createElement('canvas');
      this.maskCanvas.width = width;
      this.maskCanvas.height = height;
      this.maskCtx = this.maskCanvas.getContext('2d');
    } else {
      this.maskCanvas = null;
      this.maskCtx = null;
    }

    // Flashlight flicker and dust particles
    this.flickerTime = 0;
    this.flickerAmount = 1;
    this.particles = [];
    this.initParticles(35);

    // Admin full lighting toggle
    this.adminLightsOn = false;
  }

  toggleAdminLights() {
    this.adminLightsOn = !this.adminLightsOn;
    return this.adminLightsOn;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.maskCanvas.width = width;
    this.maskCanvas.height = height;
  }

  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }
  }

  update(dt) {
    this.flickerTime += dt * 8;
    // Occasional subtle micro-flicker (1% random chance of brief dip, plus smooth sine wave)
    const baseSine = Math.sin(this.flickerTime) * 0.03;
    const randomDip = Math.random() < 0.015 ? -0.12 : 0;
    this.flickerAmount = 1 + baseSine + randomDip;

    // Update floating dust motes
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }
  }

  render(mainCtx, player, enemy, keys) {
    // If Admin Lights are ON, bypass darkness completely to reveal full map!
    if (this.adminLightsOn) {
      mainCtx.save();

      // Soft ambient daylight / house lighting
      mainCtx.fillStyle = 'rgba(255, 245, 220, 0.04)';
      mainCtx.fillRect(0, 0, this.width, this.height);

      // Debug: Draw enemy detection radius ring
      if (enemy) {
        const isChasing = enemy.state === 'Perseguição';
        mainCtx.strokeStyle = isChasing ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.4)';
        mainCtx.lineWidth = 1.5;
        mainCtx.setLineDash([6, 6]);
        mainCtx.beginPath();
        mainCtx.arc(enemy.x, enemy.y, enemy.detectionRadius, 0, Math.PI * 2);
        mainCtx.stroke();
        mainCtx.setLineDash([]);

        // Label above enemy
        mainCtx.fillStyle = isChasing ? '#fca5a5' : '#fde68a';
        mainCtx.font = '10px monospace';
        mainCtx.textAlign = 'center';
        mainCtx.fillText(`[${enemy.state}]`, enemy.x, enemy.y - enemy.radius - 8);
      }

      // Draw subtle flashlight cone guide so the player can still see their aim
      const px = player.x;
      const py = player.y;
      const pAngle = player.flashlightAngle;
      const pRange = player.flashlightRange;
      const halfBeam = player.flashlightBeamAngle / 2;
      mainCtx.strokeStyle = 'rgba(255, 255, 200, 0.25)';
      mainCtx.lineWidth = 1;
      mainCtx.beginPath();
      mainCtx.moveTo(px, py);
      mainCtx.arc(px, py, pRange, pAngle - halfBeam, pAngle + halfBeam);
      mainCtx.closePath();
      mainCtx.stroke();

      mainCtx.restore();
      return;
    }

    const ctx = this.maskCtx;

    // 1. Reset darkness mask to pitch black
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 2, 4, 0.985)'; // Pitch black darkness
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Carve out vision using 'destination-out'
    ctx.globalCompositeOperation = 'destination-out';

    const px = player.x;
    const py = player.y;
    const pAngle = player.flashlightAngle;
    const pRange = player.flashlightRange * this.flickerAmount;
    const halfBeam = player.flashlightBeamAngle / 2;

    // A. 360° Ambient Vision immediately around the player
    const ambientRadius = player.ambientRadius * this.flickerAmount;
    const ambientGrad = ctx.createRadialGradient(px, py, 4, px, py, ambientRadius);
    ambientGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    ambientGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.85)');
    ambientGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.35)');
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = ambientGrad;
    ctx.beginPath();
    ctx.arc(px, py, ambientRadius, 0, Math.PI * 2);
    ctx.fill();

    // B. Directional Flashlight Cone
    const coneGrad = ctx.createRadialGradient(px, py, 12, px, py, pRange);
    coneGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    coneGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.95)');
    coneGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
    coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, pRange, pAngle - halfBeam, pAngle + halfBeam);
    ctx.closePath();
    ctx.fill();

    // C. Soft glow cutout for uncollected keys (so they glint in the darkness)
    if (keys) {
      for (const k of keys) {
        if (!k.collected) {
          const dist = Math.hypot(px - k.x, py - k.y);
          // If in range or player facing roughly towards it, show subtle glint
          if (dist < pRange + 30) {
            const keyGrad = ctx.createRadialGradient(k.x, k.y, 2, k.x, k.y, 24);
            keyGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
            keyGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
            ctx.fillStyle = keyGrad;
            ctx.beginPath();
            ctx.arc(k.x, k.y, 24, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 3. Draw the darkness mask on top of the main canvas
    mainCtx.save();
    mainCtx.drawImage(this.maskCanvas, 0, 0);

    // 4. Volumetric Light Beam Tint (gives the flashlight beam realistic atmospheric haze)
    mainCtx.globalCompositeOperation = 'screen';
    const hazeGrad = mainCtx.createRadialGradient(px, py, 10, px, py, pRange);
    hazeGrad.addColorStop(0, 'rgba(255, 250, 220, 0.08)');
    hazeGrad.addColorStop(0.5, 'rgba(240, 235, 200, 0.03)');
    hazeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    mainCtx.fillStyle = hazeGrad;
    mainCtx.beginPath();
    mainCtx.moveTo(px, py);
    mainCtx.arc(px, py, pRange, pAngle - halfBeam, pAngle + halfBeam);
    mainCtx.closePath();
    mainCtx.fill();

    // Dust motes illuminated inside the light cone
    mainCtx.fillStyle = 'rgba(255, 255, 230, 0.4)';
    for (const p of this.particles) {
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < pRange) {
        const ang = Math.atan2(p.y - py, p.x - px);
        let diff = Math.abs(ang - pAngle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        if (diff < halfBeam || d < ambientRadius) {
          mainCtx.beginPath();
          mainCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          mainCtx.fill();
        }
      }
    }

    // 5. Enemy's Piercing Eyes in the Dark
    // Even when enveloped in darkness, the enemy's glowing eyes cut through the dark
    if (enemy) {
      mainCtx.globalCompositeOperation = 'source-over';
      const eyePulse = Math.sin(enemy.eyePulseTimer) * 0.25 + 0.75;
      const isChasing = enemy.state === 'Perseguição';
      const eyeColor = isChasing ? `rgba(239, 68, 68, ${eyePulse})` : 'rgba(245, 158, 11, 0.75)';

      mainCtx.save();
      mainCtx.translate(enemy.x, enemy.y);
      mainCtx.rotate(enemy.angle);

      // Red eye glow
      const glowGrad = mainCtx.createRadialGradient(8, 0, 1, 8, 0, 14);
      glowGrad.addColorStop(0, isChasing ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.3)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mainCtx.fillStyle = glowGrad;
      mainCtx.beginPath();
      mainCtx.arc(8, 0, 14, 0, Math.PI * 2);
      mainCtx.fill();

      // Sharp pupils
      mainCtx.fillStyle = eyeColor;
      mainCtx.beginPath();
      mainCtx.arc(8, -5, 2.5, 0, Math.PI * 2);
      mainCtx.arc(8, 5, 2.5, 0, Math.PI * 2);
      mainCtx.fill();

      mainCtx.restore();
    }

    // 6. Cinematic Vignette on outer frame
    mainCtx.globalCompositeOperation = 'multiply';
    const vignetteGrad = mainCtx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.35,
      this.width / 2,
      this.height / 2,
      this.width * 0.65
    );
    vignetteGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    vignetteGrad.addColorStop(1, 'rgba(10, 10, 15, 0.85)');
    mainCtx.fillStyle = vignetteGrad;
    mainCtx.fillRect(0, 0, this.width, this.height);

    mainCtx.restore();
  }
}
