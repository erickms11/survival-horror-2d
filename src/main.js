// src/main.js - Game Loop, State Management, and UI Integration
import { GameMap } from './map.js';
import { Player } from './player.js';
import { Enemy, ENEMY_STATE } from './enemy.js';
import { LightingSystem } from './lighting.js';
import { SoundManager } from './audio.js';
import { ParticleSystem } from './bullet.js';

class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, active: false };

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Logical game dimensions
    this.width = 1152;
    this.height = 864;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.input = new InputManager();
    this.audio = new SoundManager();
    this.map = new GameMap();
    this.player = new Player(this.map.playerSpawn.x, this.map.playerSpawn.y);
    this.enemy = new Enemy(this.map.enemySpawn.x, this.map.enemySpawn.y);
    this.lighting = new LightingSystem(this.width, this.height);

    // Combat & Particles
    this.bullets = [];
    this.particles = new ParticleSystem();

    // States: 'TITLE', 'PLAYING', 'GAMEOVER', 'VICTORY'
    this.gameState = 'TITLE';

    // UI Toasts
    this.notificationText = 'Encontre as 3 chaves para destravar o portão.';
    this.notificationTimer = 5;

    // Time tracking
    this.lastTime = performance.now();
    this.startTime = 0;
    this.survivalTime = 0;

    // Shake effect for jumpscare
    this.screenShake = 0;

    this.setupListeners();
    this.setupMouseTracking();

    requestAnimationFrame((t) => this.loop(t));
  }

  setupListeners() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
    }

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartGame());
    }

    const adminLightsBtn = document.getElementById('adminLightsBtn');
    if (adminLightsBtn) {
      adminLightsBtn.addEventListener('click', () => this.toggleAdminLights());
    }

    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇 Mudo' : '🔊 Som Ligado';
        muteBtn.classList.toggle('muted', isMuted);
      });
    }

    window.addEventListener('keydown', (e) => {
      this.audio.init();
      this.audio.resume();

      if (e.code === 'KeyL') {
        this.toggleAdminLights();
      } else if (this.gameState === 'TITLE' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyW')) {
        this.startGame();
      } else if ((this.gameState === 'GAMEOVER' || this.gameState === 'VICTORY') && e.code === 'KeyR') {
        this.restartGame();
      } else if (this.gameState === 'PLAYING' && e.code === 'Space') {
        this.tryShoot();
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.audio.init();
      this.audio.resume();
      if (this.gameState === 'TITLE') {
        this.startGame();
      } else if (this.gameState === 'PLAYING' && e.button === 0) {
        this.tryShoot();
      }
    });
  }

  tryShoot() {
    if (this.gameState !== 'PLAYING') return;
    const res = this.player.shoot();
    if (!res) return;

    if (res.dryClick) {
      this.audio.playEmptyClick();
      this.showToast('⚠️ Sem munição! Encontre as caixas de balas pelo mapa.', 2);
      return;
    }

    if (res.bullet) {
      this.bullets.push(res.bullet);
      this.audio.playGunshot();
      this.lighting.triggerMuzzleFlash(res.muzzleX, res.muzzleY);
      this.screenShake = 0.28;
      this.particles.spawnSparks(res.muzzleX, res.muzzleY, 7, '#fef08a');
    }
  }

  toggleAdminLights() {
    const isOn = this.lighting.toggleAdminLights();
    const btn = document.getElementById('adminLightsBtn');
    if (btn) {
      btn.textContent = isOn ? '💡 Luzes: ON (Admin)' : '💡 Luzes: OFF';
      btn.classList.toggle('admin-active', isOn);
    }
    if (isOn) {
      this.showToast('💡 MODO ADMIN: Luzes acesas! Mapa revelado e raio do monstro visível.', 4);
    } else {
      this.showToast('🌑 MODO SURVIVAL: Escuridão reativada.', 3);
    }
  }

  setupMouseTracking() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.input.mouse.x = (e.clientX - rect.left) * scaleX;
      this.input.mouse.y = (e.clientY - rect.top) * scaleY;
      this.input.mouse.active = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.input.mouse.active = false;
    });
  }

  startGame() {
    this.audio.init();
    this.audio.resume();
    this.gameState = 'PLAYING';
    this.startTime = performance.now();
    this.showToast('Você está preso na residência. Encontre as 3 chaves douradas!');

    const titleScreen = document.getElementById('titleScreen');
    if (titleScreen) titleScreen.classList.add('hidden');
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    const victoryScreen = document.getElementById('victoryScreen');
    if (victoryScreen) victoryScreen.classList.add('hidden');
  }

  restartGame() {
    this.map = new GameMap();
    this.player.reset(this.map.playerSpawn.x, this.map.playerSpawn.y);
    this.enemy.reset(this.map.enemySpawn.x, this.map.enemySpawn.y);
    this.bullets = [];
    this.particles = new ParticleSystem();
    this.audio.setHeartbeatRate('slow');
    this.startGame();
  }

  showToast(text, duration = 4) {
    this.notificationText = text;
    this.notificationTimer = duration;
    const toastEl = document.getElementById('notificationToast');
    if (toastEl) {
      toastEl.textContent = text;
      toastEl.classList.remove('hidden');
      toastEl.classList.add('visible');
    }
  }

  loop(currentTime) {
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    if (dt > 0.1) dt = 0.1; // Clamp delta time

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.notificationTimer > 0) {
      this.notificationTimer -= dt;
      if (this.notificationTimer <= 0) {
        const toastEl = document.getElementById('notificationToast');
        if (toastEl) toastEl.classList.remove('visible');
      }
    }

    if (this.gameState === 'PLAYING') {
      const prevKeyCount = this.player.keys.size;

      // Handle Player Input & Physics
      this.player.handleInput(this.input, this.input.mouse);
      this.player.update(dt, this.map, this.audio);

      // Handle Key pickup notifications
      if (this.player.keys.size > prevKeyCount) {
        const count = this.player.keys.size;
        if (count < 3) {
          this.showToast(`Chave encontrada! (${count}/3 chaves coletadas)`);
        } else {
          this.showToast('Todas as 3 chaves reunidas! O portão da saída foi DESTRAVADO!', 6);
        }
      }

      // Handle Weapon & Ammo pickup notifications
      if (this.player.justPickedWeapon) {
        this.player.justPickedWeapon = false;
        this.showToast('🔫 REVÓLVER ENCONTRADO! [Clique com o mouse ou ESPAÇO para atirar. 3 tiros paralisam o monstro!]', 5);
      }
      if (this.player.justPickedAmmo) {
        this.player.justPickedAmmo = false;
        this.showToast(`💥 +6 Balas encontradas! Total: ${this.player.ammo}`, 3);
      }

      // Update Map animations
      this.map.update(dt);

      // Update Enemy
      const prevEnemyState = this.enemy.state;
      this.enemy.update(dt, this.player, this.map, this.audio);

      if (prevEnemyState === ENEMY_STATE.ESPERA && this.enemy.state === ENEMY_STATE.PERSEGUICAO) {
        this.showToast('A ENTIDADE VIU VOCÊ! CORRA!', 3);
        this.screenShake = 0.3;
      }

      // Update Bullets & Collisions
      for (const bullet of this.bullets) {
        const hit = bullet.update(dt, this.map);
        if (hit && hit.hit === 'wall') {
          this.particles.spawnSparks(hit.x, hit.y, 8, '#f59e0b');
        }

        // Check hit against enemy
        if (bullet.active) {
          const distToEnemy = Math.hypot(bullet.x - this.enemy.x, bullet.y - this.enemy.y);
          if (distToEnemy < this.enemy.radius + bullet.radius + 6) {
            bullet.active = false;
            this.particles.spawnBloodOrMist(bullet.x, bullet.y, 14);
            const dmg = this.enemy.takeDamage(bullet.angle);

            if (dmg.stunned) {
              this.audio.playEnemyStunned();
              this.showToast('⚡ A CRIATURA FOI PARALISADA! APROVEITE PARA ESCAPAR!', 4);
              this.screenShake = 0.45;
            } else {
              this.audio.playEnemyHurt();
              this.showToast(`🎯 Acerto no monstro! [${dmg.hitsTaken}/${dmg.hitsToStun} tiros para paralisar]`, 2.5);
            }
          }
        }
      }
      this.bullets = this.bullets.filter((b) => b.active);

      // Update Particles
      this.particles.update(dt);

      // Update Lighting particles and flicker
      this.lighting.update(dt);

      // Check Death / Game Over
      if (!this.player.isAlive) {
        this.gameState = 'GAMEOVER';
        this.screenShake = 0.7;
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
      }

      // Check Escape / Victory
      if (this.player.escaped) {
        this.gameState = 'VICTORY';
        const finalTime = ((performance.now() - this.startTime) / 1000).toFixed(1);
        const victoryTimeEl = document.getElementById('victoryTime');
        if (victoryTimeEl) victoryTimeEl.textContent = `${finalTime}s`;
        const victoryScreen = document.getElementById('victoryScreen');
        if (victoryScreen) victoryScreen.classList.remove('hidden');
      }

      // Update HUD elements
      this.updateHUD();
    }

    // Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 1.5);
    }
  }

  updateHUD() {
    // Keys Indicator
    for (let i = 1; i <= 3; i++) {
      const keySlot = document.getElementById(`keySlot${i}`);
      if (keySlot) {
        if (this.player.keys.has(i)) {
          keySlot.classList.add('collected');
        } else {
          keySlot.classList.remove('collected');
        }
      }
    }

    // Weapon & Ammo Indicator
    const weaponCard = document.getElementById('weaponHUD');
    const ammoCountEl = document.getElementById('ammoCount');
    if (weaponCard && ammoCountEl) {
      if (this.player.hasWeapon) {
        weaponCard.classList.add('equipped');
        ammoCountEl.textContent = `${this.player.ammo} / ${this.player.maxAmmo}`;
        if (this.player.ammo === 0) {
          weaponCard.classList.add('empty');
        } else {
          weaponCard.classList.remove('empty');
        }
      } else {
        weaponCard.classList.remove('equipped');
        ammoCountEl.textContent = 'Não Encontrada';
      }
    }

    // Stamina Bar
    const staminaFill = document.getElementById('staminaFill');
    if (staminaFill) {
      const pct = (this.player.stamina / this.player.maxStamina) * 100;
      staminaFill.style.width = `${pct}%`;
      if (pct < 20) {
        staminaFill.classList.add('exhausted');
      } else {
        staminaFill.classList.remove('exhausted');
      }
    }

    // Danger / Chase / Stun Alert Indicator
    const dangerHUD = document.getElementById('dangerAlert');
    const dangerText = document.getElementById('dangerText');
    if (dangerHUD && dangerText) {
      if (this.enemy.state === ENEMY_STATE.ATORDOADO) {
        dangerHUD.classList.add('active', 'stunned');
        dangerText.textContent = `⚡ CRIATURA PARALISADA! (${this.enemy.stunTimer.toFixed(1)}s)`;
      } else if (this.enemy.state === ENEMY_STATE.PERSEGUICAO) {
        dangerHUD.classList.add('active');
        dangerHUD.classList.remove('stunned');
        dangerText.textContent = '⚠️ ALERTA: ENTIDADE EM PERSEGUIÇÃO!';
      } else {
        dangerHUD.classList.remove('active', 'stunned');
      }
    }
  }

  render() {
    const ctx = this.ctx;

    ctx.save();

    // Screen shake on hit or jump scare
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 18;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 18;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Clear background
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render Map (Floor, Walls, Furniture, Keys, Locked Exit, Weapon, Ammo)
    this.map.render(ctx);

    // 3. Render Player
    this.player.render(ctx);

    // 4. Render Bullets & Particles
    for (const b of this.bullets) {
      b.render(ctx);
    }
    this.particles.render(ctx);

    // 5. Render Enemy
    this.enemy.render(ctx);

    // 6. Apply Global Darkness & Flashlight Lighting System
    this.lighting.render(ctx, this.player, this.enemy, this.map.keys);

    ctx.restore();
  }
}

// Boot game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
