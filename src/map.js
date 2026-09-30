// src/map.js - Grid Map and Tile Rendering System

export const TILE_SIZE = 48;

// Tile Definitions
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  KEY_1: 2,
  KEY_2: 3,
  KEY_3: 4,
  EXIT_DOOR: 5,
  OBSTACLE: 6, // Tables, crates, bookshelves
  WEAPON: 7,   // Antique Revolver
  AMMO: 8,     // Ammo box
};

// 24 columns x 18 rows haunted house layout
// 1 = Solid Wall, 0 = Floor, 6 = Solid Obstacle
// 5 = Exit Door (Foyer), 7 = Revolver (East Room), 8 = Ammo (Central Hall)
// Keys and Enemy spawn randomly from pools of valid room locations!
export const MAP_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 6, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 1, 0, 6, 6, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 6, 0, 6, 0, 1, 0, 6, 6, 0, 0, 6, 6, 0, 1, 0, 6, 0, 0, 6, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 6, 0, 6, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 6, 0, 0, 6, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 6, 6, 0, 0, 6, 0, 1, 0, 0, 0, 0, 1, 0, 6, 0, 6, 6, 0, 0, 1, 0, 1],
  [1, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 6, 0, 1, 0, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 6, 0, 0, 6, 0, 0, 6, 0, 0, 0, 0, 0, 6, 0, 0, 6, 0, 0, 6, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Pool of 12 atmospheric, 100% PRISTINE open floor spots for keys (0 obstacles in 3x3 box)
export const KEY_SPAWN_LOCATIONS = [
  { col: 4, row: 3, name: 'Quarto Noroeste' },
  { col: 3, row: 4, name: 'Aposento Superior Oeste' },
  { col: 6, row: 7, name: 'Corredor Oeste' },
  { col: 4, row: 13, name: 'Biblioteca Oeste' },
  { col: 3, row: 14, name: 'Depósito da Biblioteca' },
  { col: 22, row: 1, name: 'Quarto Nordeste' },
  { col: 17, row: 3, name: 'Aposento Leste' },
  { col: 22, row: 7, name: 'Sala de Estar Leste' },
  { col: 20, row: 10, name: 'Sala dos Espelhos' },
  { col: 21, row: 12, name: 'Armazém Leste' },
  { col: 8, row: 8, name: 'Galeria Central' },
  { col: 11, row: 15, name: 'Catacumbas do Sul' },
];

// Pool of 8 atmospheric, 100% PRISTINE open floor spots for the Revolver (0 obstacles in 3x3 box)
export const WEAPON_SPAWN_LOCATIONS = [
  { col: 22, row: 2, name: 'Gabinete Leste' },
  { col: 8, row: 1, name: 'Aposento Norte' },
  { col: 18, row: 4, name: 'Ala Leste Superior' },
  { col: 22, row: 5, name: 'Corredor Leste' },
  { col: 13, row: 8, name: 'Salão Central Leste' },
  { col: 22, row: 11, name: 'Sala dos Espelhos Fundo' },
  { col: 18, row: 14, name: 'Adega Subterrânea' },
  { col: 10, row: 16, name: 'Catacumba Sul Oeste' },
];

// Pool of 8 atmospheric, 100% PRISTINE open floor spots for Ammo boxes (0 obstacles in 3x3 box)
export const AMMO_SPAWN_LOCATIONS = [
  { col: 12, row: 1, name: 'Armário Superior' },
  { col: 22, row: 3, name: 'Quarto Leste' },
  { col: 15, row: 7, name: 'Entrada da Galeria' },
  { col: 10, row: 8, name: 'Centro da Mansão' },
  { col: 22, row: 8, name: 'Canto da Sala de Estar' },
  { col: 13, row: 12, name: 'Hall Sul' },
  { col: 20, row: 13, name: 'Depósito Leste' },
  { col: 12, row: 16, name: 'Catacumba Sul Leste' },
];

// Pool of 6 eerie spawn spots for the enemy far from player spawn
export const ENEMY_SPAWN_LOCATIONS = [
  { col: 17.5, row: 12.5, name: 'Aposento Leste' },
  { col: 3.5, row: 13.5, name: 'Santuário da Biblioteca' },
  { col: 21.5, row: 15.5, name: 'Fundo do Porão' },
  { col: 11.5, row: 15.5, name: 'Catacumbas do Sul' },
  { col: 20.5, row: 7.5, name: 'Sala dos Espelhos' },
  { col: 3.5, row: 5.5, name: 'Corredor Oeste' },
];

export class GameMap {
  constructor() {
    this.grid = JSON.parse(JSON.stringify(MAP_GRID));
    this.cols = this.grid[0].length;
    this.rows = this.grid.length;
    this.width = this.cols * TILE_SIZE;
    this.height = this.rows * TILE_SIZE;

    // Keys and Exit positions
    this.keys = [];
    this.exitDoor = null;
    this.playerSpawn = { x: 11.5 * TILE_SIZE, y: 3.5 * TILE_SIZE };
    this.enemySpawn = { x: 17.5 * TILE_SIZE, y: 12.5 * TILE_SIZE };

    this.initMapEntities();
  }

  initMapEntities() {
    this.keys = [];
    this.weapon = null;
    this.ammoBoxes = [];

    // 1. Pick a random spawn spot for the Enemy from the eerie locations pool
    const randEnemyLoc = ENEMY_SPAWN_LOCATIONS[Math.floor(Math.random() * ENEMY_SPAWN_LOCATIONS.length)];
    this.enemySpawn = {
      x: randEnemyLoc.col * TILE_SIZE,
      y: randEnemyLoc.row * TILE_SIZE,
      name: randEnemyLoc.name,
    };

    // 2. Pick 3 distinct random spawn spots for the Keys from the pristine floor pool
    const shuffledKeys = [...KEY_SPAWN_LOCATIONS].sort(() => Math.random() - 0.5);
    const chosenKeyLocs = [];
    for (let i = 0; i < shuffledKeys.length && chosenKeyLocs.length < 3; i++) {
      const loc = shuffledKeys[i];
      // Guarantee: Never spawn on solid obstacle or wall
      if (!this.isSolid(loc.col, loc.row)) {
        chosenKeyLocs.push(loc);
        this.keys.push({
          id: chosenKeyLocs.length,
          locationName: loc.name,
          gridX: loc.col,
          gridY: loc.row,
          x: (loc.col + 0.5) * TILE_SIZE,
          y: (loc.row + 0.5) * TILE_SIZE,
          collected: false,
          animTimer: Math.random() * Math.PI * 2,
        });
      }
    }

    // 3. Pick a random spawn spot for the Weapon (Revolver)
    const shuffledWeapons = [...WEAPON_SPAWN_LOCATIONS].sort(() => Math.random() - 0.5);
    for (const wLoc of shuffledWeapons) {
      // Ensure weapon does not conflict with chosen keys or solid tiles
      const conflict = chosenKeyLocs.some(k => k.col === wLoc.col && k.row === wLoc.row);
      if (!conflict && !this.isSolid(wLoc.col, wLoc.row)) {
        this.weapon = {
          gridX: wLoc.col,
          gridY: wLoc.row,
          x: (wLoc.col + 0.5) * TILE_SIZE,
          y: (wLoc.row + 0.5) * TILE_SIZE,
          collected: false,
          name: 'Revólver .38',
          ammo: 6,
          animTimer: 0,
          locationName: wLoc.name,
        };
        break;
      }
    }

    // 4. Pick random spawn spots for Ammo boxes (2 boxes per playthrough in distinct rooms)
    const shuffledAmmo = [...AMMO_SPAWN_LOCATIONS].sort(() => Math.random() - 0.5);
    const occupiedSpots = [...chosenKeyLocs];
    if (this.weapon) occupiedSpots.push({ col: this.weapon.gridX, row: this.weapon.gridY });

    for (const aLoc of shuffledAmmo) {
      if (this.ammoBoxes.length >= 2) break;
      const conflict = occupiedSpots.some(i => i.col === aLoc.col && i.row === aLoc.row);
      if (!conflict && !this.isSolid(aLoc.col, aLoc.row)) {
        occupiedSpots.push(aLoc);
        this.ammoBoxes.push({
          gridX: aLoc.col,
          gridY: aLoc.row,
          x: (aLoc.col + 0.5) * TILE_SIZE,
          y: (aLoc.row + 0.5) * TILE_SIZE,
          collected: false,
          amount: 6,
          animTimer: Math.random() * Math.PI,
          locationName: aLoc.name,
        });
      }
    }

    // 5. Scan grid for static elements (Exit door)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (tile === TILE.WEAPON || tile === TILE.AMMO) {
          // If any legacy weapon or ammo tile remained, clear it to floor
          this.grid[r][c] = TILE.FLOOR;
        } else if (tile === TILE.EXIT_DOOR) {
          this.exitDoor = {
            gridX: c,
            gridY: r,
            x: (c + 0.5) * TILE_SIZE,
            y: (r + 0.5) * TILE_SIZE,
            isOpen: false,
          };
        }
      }
    }
  }

  isSolid(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return true;
    }
    const val = this.grid[row][col];
    if (val === TILE.WALL || val === TILE.OBSTACLE) return true;
    if (val === TILE.EXIT_DOOR && (!this.exitDoor || !this.exitDoor.isOpen)) return true;
    return false;
  }

  // Check circle collision against solid tiles
  checkCircleSolidCollision(cx, cy, radius) {
    const minCol = Math.floor((cx - radius) / TILE_SIZE);
    const maxCol = Math.floor((cx + radius) / TILE_SIZE);
    const minRow = Math.floor((cy - radius) / TILE_SIZE);
    const maxRow = Math.floor((cy + radius) / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (this.isSolid(c, r)) {
          // Nearest point on AABB tile to circle center
          const nearestX = Math.max(c * TILE_SIZE, Math.min(cx, (c + 1) * TILE_SIZE));
          const nearestY = Math.max(r * TILE_SIZE, Math.min(cy, (r + 1) * TILE_SIZE));
          const dx = cx - nearestX;
          const dy = cy - nearestY;
          if (dx * dx + dy * dy < radius * radius) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Raycast between two points to check line of sight
  hasLineOfSight(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const step = 16;
    const steps = Math.ceil(dist / step);
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;

    for (let i = 1; i < steps; i++) {
      const cx = x1 + dx * i;
      const cy = y1 + dy * i;
      const col = Math.floor(cx / TILE_SIZE);
      const row = Math.floor(cy / TILE_SIZE);
      if (this.isSolid(col, row)) {
        return false;
      }
    }
    return true;
  }

  update(dt) {
    for (const key of this.keys) {
      if (!key.collected) {
        key.animTimer += dt * 3;
      }
    }
    if (this.weapon && !this.weapon.collected) {
      this.weapon.animTimer += dt * 3;
    }
    for (const ammo of this.ammoBoxes) {
      if (!ammo.collected) {
        ammo.animTimer += dt * 3;
      }
    }
  }

  render(ctx) {
    // 1. Draw Floor
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = this.grid[r][c];

        // Wooden floor planks
        ctx.fillStyle = ((r + c) % 2 === 0) ? '#1f1610' : '#1a120d';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Subtle plank lines
        ctx.strokeStyle = '#120d09';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + TILE_SIZE / 2);
        ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
        ctx.moveTo(x + TILE_SIZE, y);
        ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
        ctx.stroke();

        // Blood or scratch stains in select rooms
        if ((r === 7 && c === 3) || (r === 12 && c === 18) || (r === 15 && c === 21)) {
          ctx.fillStyle = 'rgba(90, 10, 10, 0.4)';
          ctx.beginPath();
          ctx.arc(x + 24, y + 24, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw Walls & Obstacles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = this.grid[r][c];

        if (tile === TILE.WALL) {
          // Brick Wall texture
          ctx.fillStyle = '#2d2e33';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Wall top highlight
          ctx.fillStyle = '#42454d';
          ctx.fillRect(x, y, TILE_SIZE, 6);

          // Wall bottom shadow
          ctx.fillStyle = '#17181c';
          ctx.fillRect(x, y + TILE_SIZE - 6, TILE_SIZE, 6);

          // Brick pattern
          ctx.strokeStyle = '#222327';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 8, TILE_SIZE - 4, (TILE_SIZE - 16) / 2);
          ctx.strokeRect(x + 2, y + 8 + (TILE_SIZE - 16) / 2, TILE_SIZE - 4, (TILE_SIZE - 16) / 2);

        } else if (tile === TILE.OBSTACLE) {
          // Heavy wooden furniture (bookshelf / antique chest)
          ctx.fillStyle = '#3a2215';
          ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

          ctx.fillStyle = '#543320';
          ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, 6);

          ctx.strokeStyle = '#1d1009';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

          // Cross bars on wooden crates/cabinets
          ctx.beginPath();
          ctx.moveTo(x + 6, y + 14);
          ctx.lineTo(x + TILE_SIZE - 6, y + TILE_SIZE - 6);
          ctx.stroke();

        } else if (tile === TILE.EXIT_DOOR) {
          // The Heavy Main Exit Door
          const isOpen = this.exitDoor && this.exitDoor.isOpen;
          if (isOpen) {
            // Open door revealing outside foggy moonlight
            ctx.fillStyle = '#2e493e';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(100, 255, 180, 0.4)';
            ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
            // "SAÍDA" text
            ctx.fillStyle = '#a8ffd2';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPE', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 3);
          } else {
            // Reinforced Iron Gate with 3 padlock icons
            ctx.fillStyle = '#1c1b18';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

            // Red padlock lock icon
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x + 24, y + 20, 7, Math.PI, 0);
            ctx.stroke();
            ctx.fillRect(x + 18, y + 20, 12, 12);
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 23, y + 24, 2, 4);

            // Label
            ctx.fillStyle = '#f87171';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('TRANCADA', x + 24, y + 42);
          }
        }
      }
    }

    // 3. Draw Collectible Keys with subtle floating shine
    for (const key of this.keys) {
      if (!key.collected) {
        const floatY = Math.sin(key.animTimer) * 4;
        const kx = key.x;
        const ky = key.y + floatY;

        // Eerie glowing aura around key
        const glow = ctx.createRadialGradient(kx, ky, 2, kx, ky, 18);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        glow.addColorStop(0.5, 'rgba(234, 179, 8, 0.3)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(kx, ky, 18, 0, Math.PI * 2);
        ctx.fill();

        // Draw Brass Key shape
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.5;

        // Key head (ring)
        ctx.beginPath();
        ctx.arc(kx - 4, ky, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Key hole
        ctx.fillStyle = '#1f1610';
        ctx.beginPath();
        ctx.arc(kx - 4, ky, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Key shaft and teeth
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(kx + 2, ky - 2, 10, 4);
        ctx.fillRect(kx + 8, ky + 2, 3, 4);
        ctx.fillRect(kx + 11, ky + 2, 2, 3);
      }
    }

    // 4. Draw Revolver Weapon on Floor
    if (this.weapon && !this.weapon.collected) {
      const floatY = Math.sin(this.weapon.animTimer) * 3;
      const wx = this.weapon.x;
      const wy = this.weapon.y + floatY;

      // Cyan / Metallic glint aura
      const glow = ctx.createRadialGradient(wx, wy, 2, wx, wy, 22);
      glow.addColorStop(0, 'rgba(147, 197, 253, 0.7)');
      glow.addColorStop(0.5, 'rgba(59, 130, 246, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(wx, wy, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(wx, wy);

      // Revolver shape
      // Barrel
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, -3, 14, 4);
      // Cylinder
      ctx.fillStyle = '#475569';
      ctx.fillRect(-4, -5, 6, 8);
      // Grip (wooden brown)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.lineTo(-10, 8);
      ctx.lineTo(-6, 9);
      ctx.lineTo(-2, 3);
      ctx.closePath();
      ctx.fill();
      // Trigger guard
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(-2, 2, 5, 4);

      ctx.restore();

      // Label
      ctx.fillStyle = '#bfdbfe';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('REVÓLVER', wx, wy + 18);
    }

    // 5. Draw Ammo Boxes on Floor
    for (const ammo of this.ammoBoxes) {
      if (!ammo.collected) {
        const floatY = Math.sin(ammo.animTimer) * 2.5;
        const ax = ammo.x;
        const ay = ammo.y + floatY;

        // Brass glow
        const glow = ctx.createRadialGradient(ax, ay, 2, ax, ay, 18);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ax, ay, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(ax, ay);

        // Ammo box crate (olive drab)
        ctx.fillStyle = '#3f4a36';
        ctx.fillRect(-8, -6, 16, 12);
        ctx.strokeStyle = '#22281d';
        ctx.lineWidth = 1;
        ctx.strokeRect(-8, -6, 16, 12);

        // Brass bullets visible on top
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-5, -4, 3, 7);
        ctx.fillRect(-1, -4, 3, 7);
        ctx.fillRect(3, -4, 3, 7);

        ctx.restore();

        // Label
        ctx.fillStyle = '#fef08a';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('+BALAS', ax, ay + 15);
      }
    }
  }
}
