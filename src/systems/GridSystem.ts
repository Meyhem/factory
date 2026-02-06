
import { Actor, Vector, vec } from 'excalibur';

export const TILE_SIZE = 32;
export const GRID_WIDTH = 32; // 32x32 tiles
export const GRID_HEIGHT = 32;

export class GridSystem {
    private static instance: GridSystem;
    private grid: (Actor | null)[][]; // Occupancy grid: Actor or null

    private constructor() {
        this.grid = Array(GRID_WIDTH).fill(null).map(() => Array(GRID_HEIGHT).fill(null));
    }

    public static getInstance(): GridSystem {
        if (!GridSystem.instance) {
            GridSystem.instance = new GridSystem();
        }
        return GridSystem.instance;
    }

    // Convert world pixels to grid coords
    public toGrid(worldPos: Vector): Vector {
        return vec(
            Math.floor(worldPos.x / TILE_SIZE),
            Math.floor(worldPos.y / TILE_SIZE)
        );
    }

    // Convert grid coords to world pixels (center of tile)
    public toWorld(gridPos: Vector): Vector {
        return vec(
            gridPos.x * TILE_SIZE + TILE_SIZE / 2,
            gridPos.y * TILE_SIZE + TILE_SIZE / 2
        );
    }

    // Align an actor to the center of its tile
    public snapToGrid(actor: Actor) {
        const gridPos = this.toGrid(actor.pos);
        actor.pos = this.toWorld(gridPos);
    }

    // Check if a tile is occupied
    public isOccupied(gridPos: Vector): boolean {
        if (!this.isValid(gridPos)) return true; // Out of bounds is "occupied"
        return this.grid[gridPos.x][gridPos.y] !== null;
    }

    public setOccupancy(gridPos: Vector, actor: Actor | null) {
        if (!this.isValid(gridPos)) return;
        this.grid[gridPos.x][gridPos.y] = actor;
    }

    public isValid(gridPos: Vector): boolean {
        return gridPos.x >= 0 && gridPos.x < GRID_WIDTH &&
            gridPos.y >= 0 && gridPos.y < GRID_HEIGHT;
    }

    // Get neighbors (Up, Down, Left, Right)
    public getNeighbors(gridPos: Vector): Vector[] {
        const dirs = [vec(0, -1), vec(0, 1), vec(-1, 0), vec(1, 0)];
        const neighbors: Vector[] = [];

        for (const dir of dirs) {
            const next = gridPos.add(dir);
            if (this.isValid(next)) {
                neighbors.push(next);
            }
        }
        return neighbors;
    }

    // A* Pathfinding (Simplified for grid)
    public findPath(start: Vector, end: Vector): Vector[] | null {
        // Simple BFS for now since we don't have costs
        // Or A* if we want to be fancy. Let's do BFS for robustness first.

        const queue: { pos: Vector, path: Vector[] }[] = [{ pos: start, path: [start] }];
        const visited = new Set<string>();
        visited.add(this.key(start));

        while (queue.length > 0) {
            const { pos, path } = queue.shift()!;

            if (pos.equals(end)) {
                return path;
            }

            for (const neighbor of this.getNeighbors(pos)) {
                if (!visited.has(this.key(neighbor)) && !this.isOccupied(neighbor)) {
                    // Treat target as walkable if it's the destination?
                    // Depends: If target is a Factory, it IS occupied.
                    // So we must allow "End" node to be occupied if it's the interaction target.
                    // But for movement path, we can't step ON it.
                    // Refinement: Pathfind to *Adjacent* to target?
                    // Or allow checking occupancy except for End?

                    visited.add(this.key(neighbor));
                    queue.push({ pos: neighbor, path: [...path, neighbor] });
                } else if (neighbor.equals(end)) {
                    // Found it (even if occupied)
                    return [...path, neighbor];
                }
            }
        }
        return null;
    }

    private key(v: Vector): string {
        return `${v.x},${v.y}`;
    }
}
