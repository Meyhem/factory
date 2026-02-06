
export class Inventory {
    private storage: Map<string, number> = new Map();

    constructor(public maxMassCapacity: number) { }

    get currentTotalMass(): number {
        let total = 0;
        for (const mass of this.storage.values()) {
            total += mass;
        }
        return total;
    }

    get remainingCapacity(): number {
        return this.maxMassCapacity - this.currentTotalMass;
    }

    add(productId: string, mass: number): boolean {
        if (mass <= 0) return false;
        if (this.currentTotalMass + mass > this.maxMassCapacity) {
            return false;
        }

        const current = this.storage.get(productId) || 0;
        this.storage.set(productId, current + mass);
        return true;
    }

    remove(productId: string, mass: number): boolean {
        if (mass <= 0) return false;
        const current = this.storage.get(productId) || 0;
        if (current < mass) {
            return false;
        }

        this.storage.set(productId, current - mass);
        // Optional: cleanup 0 mass items? For now keep it simple.
        if (this.storage.get(productId) === 0) {
            this.storage.delete(productId);
        }
        return true;
    }

    transfer(target: Inventory, productId: string, mass: number): boolean {
        // Transactional: either fully works or fails
        if (this.remove(productId, mass)) {
            if (target.add(productId, mass)) {
                return true;
            } else {
                // Rollback
                this.add(productId, mass);
                return false;
            }
        }
        return false;
    }

    getAmount(productId: string): number {
        return this.storage.get(productId) || 0;
    }
}
