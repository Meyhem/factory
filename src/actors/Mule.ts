
import { Actor, Engine, Vector, Color, Text, Font, FontUnit, vec } from 'excalibur';
import { Inventory } from '../core/Inventory';
import { LogisticsBroker, TransportJob } from '../systems/LogisticsBroker';
import { Factory } from './Factory';
import { GridSystem } from '../systems/GridSystem';

export enum MuleState {
    IDLE = 'idle',
    MOVING_TO_SOURCE = 'moving_to_source',
    LOADING = 'loading',
    MOVING_TO_TARGET = 'moving_to_target',
    UNLOADING = 'unloading',
}

export class Mule extends Actor {
    public inventory: Inventory;
    public capacitor: number = 0; // future energy?

    private currentState: MuleState = MuleState.IDLE;
    private currentJob: TransportJob | null = null;
    private targetActor: Actor | null = null;
    private moveTimer: number = 0;
    private moveInterval: number = 200; // ms per tile
    private path: Vector[] = [];
    private debugText: Text;

    constructor(name: string, capacity: number) {
        super({
            name,
            width: 32,
            height: 32,
            color: Color.Yellow
        });
        this.inventory = new Inventory(capacity);

        this.debugText = new Text({
            text: '',
            font: new Font({ size: 10, unit: FontUnit.Px, family: 'monospace', color: Color.White })
        });

        const labelActor = new Actor({ pos: vec(0, -20) });
        labelActor.graphics.use(this.debugText);
        this.addChild(labelActor);
    }

    onPostUpdate(engine: Engine, delta: number) {
        this.debugText.text = `${this.name}\n${this.currentState}\nInv: ${this.inventory.currentTotalMass}g`;
    }

    onInitialize(engine: Engine) {
        // Snap to grid
        const grid = GridSystem.getInstance();
        grid.snapToGrid(this);
    }

    update(engine: Engine, delta: number) {
        super.update(engine, delta);

        switch (this.currentState) {
            case MuleState.IDLE:
                this.findJob(engine);
                break;
            case MuleState.MOVING_TO_SOURCE:
            case MuleState.MOVING_TO_TARGET:
                this.handleMovement(delta);
                break;
            case MuleState.LOADING:
                this.handleLoading();
                break;
            case MuleState.UNLOADING:
                this.handleUnloading();
                break;
        }
    }

    private handleMovement(delta: number) {
        this.moveTimer += delta;
        if (this.moveTimer < this.moveInterval) return;
        this.moveTimer = 0;

        const grid = GridSystem.getInstance();

        // 1. Check Arrival First (Pre-emptive)
        if (this.targetActor) {
            const targetGrid = grid.toGrid(this.targetActor.pos);
            const myGrid = grid.toGrid(this.pos);

            const neighbors = grid.getNeighbors(myGrid);
            const isNeighbor = neighbors.some(n => n.equals(targetGrid));
            const isOnTarget = myGrid.equals(targetGrid);

            if (isNeighbor || isOnTarget) {
                // Arrived
                if (this.currentState === MuleState.MOVING_TO_SOURCE) {
                    this.currentState = MuleState.LOADING;
                } else {
                    this.currentState = MuleState.UNLOADING;
                }
                this.path = []; // Clear path
                return;
            }
        }

        // 2. Pathfind if empty
        if (this.path.length === 0) {
            if (!this.targetActor) return;

            const targetGrid = grid.toGrid(this.targetActor.pos);
            const myGrid = grid.toGrid(this.pos);

            const newPath = grid.findPath(myGrid, targetGrid);
            if (newPath && newPath.length > 1) {
                // Remove start node
                newPath.shift();
                this.path = newPath;
            } else {
                // Determine if we are failing because target is unreachable or just blocked?
                // Log only occasionally?
                return;
            }
        }

        // 3. Move
        if (this.path.length > 0) {
            const nextGridPos = this.path[0];

            // Special Check: If next step is the Target itself, and we are not 'isOnTarget' (checked above),
            // then we are Neighbor (checked above?).
            // If we reached here, 'isNeighbor' is False.
            // So 'nextGridPos' cannot be 'targetGrid' unless we are diagonal? 
            // Neighbors logic handles NESW. 
            // If path expects diagonal? No, grid neighbors are NESW.

            // If nextGridPos is occupied, we must wait.
            // UNLESS it is the target?
            // If it is the target, we should have triggered 'isNeighbor'.
            // So if we are here, nextGridPos is NOT target (or isNeighbor failed).
            // But if pathfinder included target as last step, and we are 1 step away...
            // isNeighbor should be true.

            // Edge Case: Diagonals?
            // GridSystem.getNeighbors is up/down/left/right.
            // findPath uses getNeighbors.
            // so path is orthogonal.
            // So if we are adjacent, we are Neighbors.

            if (grid.isOccupied(nextGridPos)) {
                // Blocked by something else?
                return;
            }

            // Step
            this.path.shift();

            // Update Occupancy
            const currentGridPos = grid.toGrid(this.pos);
            grid.setOccupancy(currentGridPos, null); // Clear old
            grid.setOccupancy(nextGridPos, this);    // Set new

            this.pos = grid.toWorld(nextGridPos);
        }
    }

    private findJob(engine: Engine) {
        // Ask broker for best job
        const broker = LogisticsBroker.getInstance();
        const job = broker.getBestTransportJob(this.pos, this.inventory.maxMassCapacity, engine);

        if (job) {
            this.currentJob = job;
            this.targetActor = engine.currentScene.world.entityManager.getByName(job.sourceId)[0] as Actor;

            if (this.targetActor) {
                this.currentState = MuleState.MOVING_TO_SOURCE;
                this.path = [];
                console.log(`[Mule ${this.name}] Accepted Job: ${job.amount}g ${job.productId} from ${job.sourceId} -> ${job.targetId}`);
            } else {
                console.error(`[Mule] Computed job source invalid: ${job.sourceId}`);
                this.currentJob = null;
            }
        }
    }

    private handleLoading() {
        if (!this.currentJob || !this.targetActor) {
            this.currentState = MuleState.IDLE;
            return;
        }

        const sourceFactory = this.targetActor as Factory;

        const available = sourceFactory.outputInventory.getAmount(this.currentJob.productId);
        const toTake = Math.min(available, this.inventory.remainingCapacity, this.currentJob.amount);

        // If 0, we still proceed? Or abort?
        // If we load 0, we carry 0 to target. Useful?
        // If source has 0, maybe we waited too long?
        // Let's proceed, maybe next time better.

        if (toTake > 0) {
            sourceFactory.outputInventory.transfer(this.inventory, this.currentJob.productId, toTake);
            console.log(`[Mule] Loaded ${toTake}g of ${this.currentJob.productId}`);
        } else {
            // console.log(`[Mule] Loaded 0g.`);
        }

        // Proceed to target
        this.targetActor = this.scene?.world.entityManager.getByName(this.currentJob.targetId)[0] as Actor;
        if (this.targetActor) {
            this.currentState = MuleState.MOVING_TO_TARGET;
            this.path = [];
        } else {
            console.error("Target missing");
            this.currentState = MuleState.IDLE;
        }
    }

    private handleUnloading() {
        if (!this.currentJob || !this.targetActor) {
            this.currentState = MuleState.IDLE;
            return;
        }

        const targetFactory = this.targetActor as Factory;
        const productId = this.currentJob.productId;
        const amount = this.inventory.getAmount(productId);

        if (amount > 0) {
            this.inventory.transfer(targetFactory.inputInventory, productId, amount);
            console.log(`[Mule] Unloaded ${amount}g`);
        }

        this.currentState = MuleState.IDLE;
        this.currentJob = null;
        this.targetActor = null;
        this.path = [];
    }
}
