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
};

// 24 columns x 18 rows haunted house layout
// 1 = Solid Wall, 0 = Floor, 6 = Solid Obstacle
// 2 = Key 1 (Bedroom), 3 = Key 2 (Library), 4 = Key 3 (Basement/Storage)
// 5 = Exit Door (Foyer)
export const MAP_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 6, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 1, 0, 6, 6, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 6, 0, 6, 0, 1, 0, 6, 6, 0, 0, 6, 6, 0, 1, 0, 6, 0, 0, 6, 0, 0, 1],
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 6, 0, 6, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 6, 0, 0, 6, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 6, 6, 0, 0, 6, 0, 1, 0, 0, 0, 0, 1, 0, 6, 0, 6, 6, 0, 0, 1, 0, 1],
  [1, 0, 6, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 6, 0, 1, 0, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 1],
  [1, 0, 6, 0, 0, 6, 0, 0, 6, 0, 0, 0, 0, 0, 6, 0, 0, 6, 0, 0, 6, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (tile >= TILE.KEY_1 && tile <= TILE.KEY_3) {
          const keyId = tile - TILE.KEY_1 + 1;
          this.keys.push({
            id: keyId,
            gridX: c,
            gridY: r,
            x: (c + 0.5) * TILE_SIZE,
            y: (r + 0.5) * TILE_SIZE,
            collected: false,
            animTimer: Math.random() * Math.PI * 2,
          });
          // Replace key tile with floor so player can step through
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
  }
}
