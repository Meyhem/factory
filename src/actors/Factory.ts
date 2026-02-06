import { Actor, Engine, Color, Text, Font, FontUnit, Vector, vec } from 'excalibur';
import { Inventory } from '../core/Inventory';
import { Recipe, PRODUCTS } from '../data/registry';
import { LogisticsBroker } from '../systems/LogisticsBroker';
import { GridSystem } from '../systems/GridSystem';

export enum FactoryState {
    IDLE = 'idle',
    CONSUMING = 'consuming',
    PROCESSING = 'processing',
    PRODUCING = 'producing',
}

export class Factory extends Actor {
    public inputInventory: Inventory;
    public outputInventory: Inventory;
    public activeRecipe: Recipe | null = null;

    private currentState: FactoryState = FactoryState.IDLE;
    private tickCounter: number = 0;
    private debugText: Text;

    constructor(
        public name: string,
        inputCapacity: number,
        outputCapacity: number
    ) {
        super({ name, width: 40, height: 40, color: Color.Gray });
        this.inputInventory = new Inventory(inputCapacity);
        this.outputInventory = new Inventory(outputCapacity);

        this.debugText = new Text({
            text: '',
            font: new Font({ size: 10, unit: FontUnit.Px, family: 'monospace', color: Color.White })
        });

        const labelActor = new Actor({ pos: vec(0, -30) });
        labelActor.graphics.use(this.debugText);
        this.addChild(labelActor);
    }

    onPostUpdate(engine: Engine, delta: number) {
        this.debugText.text = `${this.name}\nIn: ${this.inputInventory.currentTotalMass}g\nOut: ${this.outputInventory.currentTotalMass}g\n${this.currentState}`;
    }

    onInitialize(engine: Engine) {
        // Snap to grid
        const grid = GridSystem.getInstance();
        grid.snapToGrid(this);
        grid.setOccupancy(grid.toGrid(this.pos), this);

        // Register Supply
        if (this.activeRecipe && this.activeRecipe.outputs.length > 0) {
            const broker = LogisticsBroker.getInstance();
            broker.registerSupplier(this.name, this.activeRecipe.outputs[0].productId);
        }
    }

    // Simplified tick-based update called by a robust TickManager or Engine update
    // But for now, we hook into Excalibur's update
    update(engine: Engine, delta: number) {
        super.update(engine, delta);
        this.tick();
    }

    public tick() {
        this.checkTaskGeneration();

        if (!this.activeRecipe) return;

        switch (this.currentState) {
            case FactoryState.IDLE:
                this.checkInputs();
                break;
            case FactoryState.CONSUMING:
                this.consumeInputs();
                break;
            case FactoryState.PROCESSING:
                this.processRecipe();
                break;
            case FactoryState.PRODUCING:
                this.produceOutputs();
                break;
        }
    }

    private checkTaskGeneration() {
        const broker = LogisticsBroker.getInstance();

        // 1. Demand Logic (Input)
        if (this.activeRecipe) {
            for (const input of this.activeRecipe.inputs) {
                const current = this.inputInventory.getAmount(input.productId);
                const capacity = this.inputInventory.maxMassCapacity;
                const threshold = capacity * 0.5; // low stock

                if (current < threshold) {
                    const needed = capacity - current;
                    // Post Demand
                    broker.postDemand(this.name, input.productId, needed);
                }
            }
        }
    }

    private checkInputs() {
        if (!this.activeRecipe) return;

        // Check if we have enough mass for all inputs
        for (const input of this.activeRecipe.inputs) {
            if (this.inputInventory.getAmount(input.productId) < input.mass) {
                return; // Not enough inputs
            }
        }

        // If we have all inputs, transition to consuming
        this.currentState = FactoryState.CONSUMING;
    }

    private consumeInputs() {
        if (!this.activeRecipe) return;

        // Double check (atomic validation ideally happened in checkInputs but good to be safe)
        for (const input of this.activeRecipe.inputs) {
            if (!this.inputInventory.remove(input.productId, input.mass)) {
                // Should not happen if check passed and no one else stole it
                this.currentState = FactoryState.IDLE;
                return;
            }
        }

        this.tickCounter = 0;
        this.currentState = FactoryState.PROCESSING;
    }

    private processRecipe() {
        if (!this.activeRecipe) return;

        this.tickCounter++;
        if (this.tickCounter >= this.activeRecipe.durationTicks) {
            this.currentState = FactoryState.PRODUCING;
        }
    }

    private produceOutputs() {
        if (!this.activeRecipe) return;

        // Check if output has capacity
        // For simplicity, we check if we can add ALL outputs. 
        // If partially full, we wait.
        let canFit = true;
        for (const output of this.activeRecipe.outputs) {
            if (this.outputInventory.currentTotalMass + output.mass > this.outputInventory.maxMassCapacity) {
                canFit = false;
                break;
            }
        }

        if (canFit) {
            for (const output of this.activeRecipe.outputs) {
                this.outputInventory.add(output.productId, output.mass);
            }
            this.currentState = FactoryState.IDLE;
        }
        // Else stay in PRODUCING state (blocked)
    }
}
