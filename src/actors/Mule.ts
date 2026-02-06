
import { Actor, Engine, Vector, Color, Text, Font, FontUnit, vec } from 'excalibur';
import { Inventory } from '../core/Inventory';
import { LogisticsBroker, TransportTask } from '../systems/LogisticsBroker';
import { Factory } from './Factory';

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
    private currentTask: TransportTask | null = null;
    private targetActor: Actor | null = null;
    private speed: number = 100; // pixels per sec
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

    // Override graphics drawing to keep it simple, OR just use onPostDraw to draw text
    onPostDraw(ctx: CanvasRenderingContext2D, elapsed: number) {
        // Manual draw if needed, but let's try the Graphics way first.
        // Actually, assigning `this.graphics.use(this.debugText)` would hide the rectangle.
        // Let's use a child actor for text if we want to keep the rectangle, OR just draw in onPostDraw.
    }

    onInitialize(engine: Engine) {
        // setup visual
    }

    update(engine: Engine, delta: number) {
        super.update(engine, delta);

        switch (this.currentState) {
            case MuleState.IDLE:
                this.findTask();
                break;
            case MuleState.MOVING_TO_SOURCE:
                this.moveToTarget(delta);
                break;
            case MuleState.LOADING:
                this.handleLoading();
                break;
            case MuleState.MOVING_TO_TARGET:
                this.moveToTarget(delta);
                break;
            case MuleState.UNLOADING:
                this.handleUnloading();
                break;
        }
    }

    private findTask() {
        // Ask broker
        const broker = LogisticsBroker.getInstance();
        const task = broker.getAvailableTask(this.inventory.maxMassCapacity); // Passing cap as hint
        if (task) {
            // Reserve capacity
            if (broker.reserveCapacity(task.id, this.inventory.maxMassCapacity)) {
                this.currentTask = task;
                // Find source actor (In real game, we need a Scene or EntityManager to find Actor by ID)
                // For now, assuming we can find it via a global registry or passed in engine?
                // Hack: We need a global actor registry.
                this.targetActor = this.scene?.world.entityManager.getByName(task.sourceId)[0] as Actor;

                if (this.targetActor) {
                    this.currentState = MuleState.MOVING_TO_SOURCE;
                    console.log(`[Mule ${this.name}] Accepted task ${task.id}. Going to ${task.sourceId}`);
                } else {
                    console.error(`[Mule] Could not find actor ${task.sourceId}`);
                    this.currentTask = null; // abort
                }
            }
        }
    }

    private moveToTarget(delta: number) {
        if (!this.targetActor) return;

        const distance = this.pos.distance(this.targetActor.pos);
        if (distance < 5) {
            // Arrived
            if (this.currentState === MuleState.MOVING_TO_SOURCE) {
                this.currentState = MuleState.LOADING;
            } else {
                this.currentState = MuleState.UNLOADING;
            }
        } else {
            // Move
            const dir = this.targetActor.pos.sub(this.pos).normalize();
            this.pos = this.pos.add(dir.scale(this.speed * delta / 1000));
        }
    }

    private handleLoading() {
        if (!this.currentTask || !this.targetActor) {
            this.currentState = MuleState.IDLE;
            return;
        }

        const sourceFactory = this.targetActor as Factory;
        // Transfer from source output to mule inventory
        // We know productId from task
        // In real sim, we might take as much as reserved or available.

        // Check how much is there
        const available = sourceFactory.outputInventory.getAmount(this.currentTask.productId);
        const toTake = Math.min(available, this.inventory.remainingCapacity);

        if (toTake > 0) {
            sourceFactory.outputInventory.transfer(this.inventory, this.currentTask.productId, toTake);
            console.log(`[Mule] Loaded ${toTake}g of ${this.currentTask.productId}`);
        }

        // Proceed to target
        // Find target actor
        this.targetActor = this.scene?.world.entityManager.getByName(this.currentTask.targetId)[0] as Actor;
        if (this.targetActor) {
            this.currentState = MuleState.MOVING_TO_TARGET;
        } else {
            console.error("Target missing");
            this.currentState = MuleState.IDLE; // stuck
        }
    }

    private handleUnloading() {
        if (!this.currentTask || !this.targetActor) {
            this.currentState = MuleState.IDLE;
            return;
        }

        const targetFactory = this.targetActor as Factory;
        const productId = this.currentTask.productId;
        const amount = this.inventory.getAmount(productId);

        if (amount > 0) {
            this.inventory.transfer(targetFactory.inputInventory, productId, amount);
            console.log(`[Mule] Unloaded ${amount}g`);
        }

        this.currentState = MuleState.IDLE;
        this.currentTask = null;
        this.targetActor = null;
    }
}
