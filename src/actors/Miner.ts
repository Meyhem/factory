
import { Engine, Color } from 'excalibur';
import { GridSystem } from '../systems/GridSystem';
import { Factory, FactoryState } from './Factory';
import { PRODUCTS, Recipe } from '../data/registry';
import { LogisticsBroker } from '../systems/LogisticsBroker';
import { AmountOfProduct } from '../core/AmountOfProduct';

export class Miner extends Factory {
    private resourceType: string;
    private productionRate: number; // grams per tick

    constructor(name: string, resourceType: string, productionRate: number) {
        super(name, 0, 10000); // No input capacity, large output
        this.resourceType = resourceType;
        this.productionRate = productionRate;
        this.color = Color.Red; // Default to red for miners

        // Fake recipe
        this.activeRecipe = {
            id: `mining_${resourceType}`,
            inputs: [],
            outputs: [new AmountOfProduct(resourceType, productionRate)],
            durationTicks: 60 // e.g. every 60 ticks produces X
        };
    }

    onInitialize(engine: Engine) {
        // Snap to grid
        const grid = GridSystem.getInstance();
        grid.snapToGrid(this);
        grid.setOccupancy(grid.toGrid(this.pos), this);

        // Register Supply
        const broker = LogisticsBroker.getInstance();
        broker.registerSupplier(this.name, this.resourceType);
    }
}
