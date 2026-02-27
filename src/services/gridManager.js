import { GRID, WAYPOINTS } from '../config/constants.js'

/**
 * GridManager — manages the 20x15 tile grid.
 * Marks path cells as unbuildable, tracks tower placements.
 */
export class GridManager {
    constructor(scene) {
        this.scene = scene
        this.cols = GRID.COLS
        this.rows = GRID.ROWS
        this.tileSize = GRID.TILE_SIZE

        // 2D array: 0 = buildable, 1 = path, 2 = tower placed
        this.grid = this.createEmptyGrid()

        // Precise allowed zones base on user coordinates
        this.allowedZones = [
            { c: 2, r: 5, w: 18, h: 2 },   // Zone 1: Top
            { c: 2, r: 7, w: 5, h: 10 },   // Zone 2: Left Vertical
            { c: 2, r: 17, w: 18, h: 3 },  // Zone 3: Bottom
            { c: 11, r: 11, w: 11, h: 3 }  // Zone 4: Middle Island
        ]

        this.markPathCells()
    }

    createEmptyGrid() {
        const grid = []
        for (let row = 0; row < this.rows; row++) {
            grid[row] = []
            for (let col = 0; col < this.cols; col++) {
                grid[row][col] = 0
            }
        }
        return grid
    }

    /**
     * Walk along each path segment and mark all tiles it passes through.
     * Uses Bresenham-like stepping along the waypoint segments.
     */
    markPathCells() {
        for (let i = 0; i < WAYPOINTS.length - 1; i++) {
            const from = WAYPOINTS[i]
            const to = WAYPOINTS[i + 1]

            const colFrom = Math.floor(from.x / this.tileSize)
            const rowFrom = Math.floor(from.y / this.tileSize)
            const colTo = Math.floor(to.x / this.tileSize)
            const rowTo = Math.floor(to.y / this.tileSize)

            // horizontal segment (mark 2 tiles wide)
            if (rowFrom === rowTo) {
                const minCol = Math.max(0, Math.min(colFrom, colTo))
                const maxCol = Math.min(this.cols - 1, Math.max(colFrom, colTo))
                for (let c = minCol; c <= maxCol; c++) {
                    for (let offset = 0; offset <= 1; offset++) {
                        this.setCellSafe(rowFrom + offset, c, 1)
                    }
                }
            }

            // vertical segment (mark 2 tiles wide)
            if (colFrom === colTo) {
                const minRow = Math.max(0, Math.min(rowFrom, rowTo))
                const maxRow = Math.min(this.rows - 1, Math.max(rowFrom, rowTo))
                for (let r = minRow; r <= maxRow; r++) {
                    for (let offset = 0; offset <= 1; offset++) {
                        this.setCellSafe(r, colFrom + offset, 1)
                    }
                }
            }
        }
    }

    setCellSafe(row, col, value) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col] = value
        }
    }

    /** 
     * Check if a 2x2 area is free to build on.
     * Must be entirely within the custom red-marked allowed zones.
     */
    canBuild(col, row) {
        // Must fit a 2x2 footprint
        if (col < 0 || col + 1 >= this.cols || row < 0 || row + 1 >= this.rows) return false

        const points = [
            { c: col, r: row },
            { c: col + 1, r: row },
            { c: col, r: row + 1 },
            { c: col + 1, r: row + 1 }
        ]

        for (const p of points) {
            // 1. Must be buildable (0)
            if (this.grid[p.r][p.c] !== 0) return false

            // 2. Must be within at least one allowed zone
            const inZone = this.allowedZones.some(z =>
                p.c >= z.c && p.c < z.c + z.w &&
                p.r >= z.r && p.r < z.r + z.h
            )
            if (!inZone) return false
        }

        return true
    }

    /** Mark 2x2 area as occupied by a tower */
    placeTower(col, row) {
        this.grid[row][col] = 2
        this.grid[row][col + 1] = 2
        this.grid[row + 1][col] = 2
        this.grid[row + 1][col + 1] = 2
    }

    /** Free 2x2 area when tower is sold */
    removeTower(col, row) {
        this.grid[row][col] = 0
        this.grid[row][col + 1] = 0
        this.grid[row + 1][col] = 0
        this.grid[row + 1][col + 1] = 0
    }

    /** Convert pixel coords to grid col/row */
    pixelToGrid(px, py) {
        return {
            col: Math.floor(px / this.tileSize),
            row: Math.floor(py / this.tileSize),
        }
    }

    /** Convert grid col/row to pixel center */
    gridToPixel(col, row) {
        return {
            x: col * this.tileSize + this.tileSize / 2,
            y: row * this.tileSize + this.tileSize / 2,
        }
    }

    /** Draw grid overlay — subtle lines + path highlight */
    drawGrid() {
        const g = this.scene.add.graphics().setDepth(1)

        // grid lines
        g.lineStyle(1, 0x00ff88, 0.2)
        for (let col = 0; col <= this.cols; col++) {
            g.lineBetween(col * this.tileSize, 0, col * this.tileSize, this.rows * this.tileSize)
        }
        for (let row = 0; row <= this.rows; row++) {
            g.lineBetween(0, row * this.tileSize, this.cols * this.tileSize, row * this.tileSize)
        }

        /*
        // Visualize CURRENT allowed zones in red (semi-transparent)
        const azg = this.scene.add.graphics().setDepth(2)
        azg.fillStyle(0xff0000, 0.15)
        azg.lineStyle(2, 0xff0000, 0.5)
        for (const zone of this.allowedZones) {
            azg.fillRect(zone.c * this.tileSize, zone.r * this.tileSize, zone.w * this.tileSize, zone.h * this.tileSize)
            azg.strokeRect(zone.c * this.tileSize, zone.r * this.tileSize, zone.w * this.tileSize, zone.h * this.tileSize)
        }
        */

        // path cells highlighted
        const pg = this.scene.add.graphics().setDepth(3)
        pg.fillStyle(0x00ff88, 0.06)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col] === 1) {
                    pg.fillRect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize)
                }
            }
        }
    }
}
