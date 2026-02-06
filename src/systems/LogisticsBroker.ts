
import { Actor, Vector } from 'excalibur';
import { GridSystem } from './GridSystem';

export interface Box {
    id: string; // Actor ID
    productId: string;
    amount: number;
}

export interface Demand {
    consumerId: string;
    productId: string;
    amountNeeded: number;
}

export interface TransportJob {
    sourceId: string;
    targetId: string;
    productId: string;
    amount: number;
}

export class LogisticsBroker {
    private static instance: LogisticsBroker;

    // Suppliers: Map<Product, ActorIDs[]>
    private suppliers: Map<string, Set<string>> = new Map();

    // Demands: Map<Product, Demand[]>
    // Or just a list of demands? Keyed by consumer?
    // Let's store list of demands per product for easier matching
    private demands: Map<string, Demand[]> = new Map();

    private constructor() { }

    public static getInstance(): LogisticsBroker {
        if (!LogisticsBroker.instance) {
            LogisticsBroker.instance = new LogisticsBroker();
        }
        return LogisticsBroker.instance;
    }

    public registerSupplier(actorId: string, productId: string) {
        if (!this.suppliers.has(productId)) {
            this.suppliers.set(productId, new Set());
        }
        this.suppliers.get(productId)?.add(actorId);
        // console.log(`[Broker] Registered supplier ${actorId} for ${productId}`);
    }

    public postDemand(consumerId: string, productId: string, amount: number) {
        if (amount <= 0) return;

        if (!this.demands.has(productId)) {
            this.demands.set(productId, []);
        }

        const productDemands = this.demands.get(productId)!;

        // Update existing demand or add new
        const existing = productDemands.find(d => d.consumerId === consumerId);
        if (existing) {
            existing.amountNeeded = amount;
        } else {
            productDemands.push({
                consumerId,
                productId,
                amountNeeded: amount
            });
            console.log(`[Broker] New demand from ${consumerId}: ${amount}g of ${productId}`);
        }
    }

    public clearDemand(consumerId: string, productId: string) {
        const productDemands = this.demands.get(productId);
        if (productDemands) {
            const idx = productDemands.findIndex(d => d.consumerId === consumerId);
            if (idx >= 0) {
                productDemands.splice(idx, 1);
                // console.log(`[Broker] Cleared demand for ${consumerId} (${productId})`);
            }
        }
    }

    // Find the best job for a Mule at specific position with capacity
    // Cost = (Dist Mule to Source) + (Dist Source to Target)
    public getBestTransportJob(mulePos: Vector, capacity: number, engine: any): TransportJob | null {
        let bestJob: TransportJob | null = null;
        let bestScore = Infinity;

        const grid = GridSystem.getInstance();
        const muleGrid = grid.toGrid(mulePos);

        // Iterate over all products that have demands
        for (const [productId, demands] of this.demands.entries()) {
            if (demands.length === 0) continue;

            // Check if we have suppliers for this product
            const suppliers = this.suppliers.get(productId);
            if (!suppliers || suppliers.size === 0) continue;

            for (const demand of demands) {
                // Determine target actor (Consumer)
                // We need actual Actor object positions for distance.
                // Assuming we can pass Engine or check Scene to find actors?
                // For MVP, lets assume we can look them up via EntityManager if passed, 
                // OR we trust the ID is valid and look it up globally?
                // Excalibur doesn't have a global "getById" without the scene.
                // WE PASSED `engine: any` for now.

                const targetActor = engine.currentScene.world.entityManager.getByName(demand.consumerId)[0] as Actor;
                if (!targetActor) continue;

                // For each supplier
                for (const supplyId of suppliers) {
                    const sourceActor = engine.currentScene.world.entityManager.getByName(supplyId)[0] as Actor;
                    if (!sourceActor) continue;

                    // Must verify Source actually HAS the product Right Now? 
                    // Or assume it produces it?
                    // Ideally we check inventory. But `Supplier` registration implies capability.
                    // Let's assume capability for now. We can add availability check later (check Inventory mass > 0).
                    // Ideally: `if (sourceActor.outputInventory.getAmount(productId) < 10) continue;`
                    // Accessing `.outputInventory` requires casting to Factory/Miner.

                    const sourceGrid = grid.toGrid(sourceActor.pos);
                    const targetGrid = grid.toGrid(targetActor.pos);

                    // Distances (Manhattan)
                    const distMuleToSource = Math.abs(sourceGrid.x - muleGrid.x) + Math.abs(sourceGrid.y - muleGrid.y);
                    const distSourceToTarget = Math.abs(targetGrid.x - sourceGrid.x) + Math.abs(targetGrid.y - sourceGrid.y);

                    const distance = distMuleToSource + distSourceToTarget;

                    // Heuristic: Distance - (Demand * 0.1)
                    // This favors higher demand tasks when distances are similar.
                    // 1000g demand reduces score by 100 "distance units".
                    const score = distance - (demand.amountNeeded * 0.1);

                    if (score < bestScore) {
                        bestScore = score;
                        bestJob = {
                            sourceId: supplyId,
                            targetId: demand.consumerId,
                            productId: productId,
                            amount: Math.min(capacity, demand.amountNeeded) // Planned amount
                        };
                    }
                }
            }
        }

        return bestJob;
    }
}
