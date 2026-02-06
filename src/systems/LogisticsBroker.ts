
import { Actor } from 'excalibur';

export interface TransportTask {
    id: string;
    sourceId: string;
    targetId: string;
    productId: string;
    massRequested: number;
    massReserved: number;
}

export class LogisticsBroker {
    private static instance: LogisticsBroker;
    private tasks: Map<string, TransportTask> = new Map();
    private nextTaskId: number = 0;

    private constructor() { }

    public static getInstance(): LogisticsBroker {
        if (!LogisticsBroker.instance) {
            LogisticsBroker.instance = new LogisticsBroker();
        }
        return LogisticsBroker.instance;
    }

    public requestTransport(sourceId: string, targetId: string, productId: string, mass: number): string {
        const id = `task-${this.nextTaskId++}`;
        const task: TransportTask = {
            id,
            sourceId,
            targetId,
            productId,
            massRequested: mass,
            massReserved: 0
        };
        this.tasks.set(id, task);
        console.log(`[Broker] Created task ${id}: Move ${mass}g of ${productId} from ${sourceId} to ${targetId}`);
        return id;
    }

    public getAvailableTask(capacity: number): TransportTask | null {
        // Find a task where we can contribute
        // Simple FIFO or priority logic
        for (const task of this.tasks.values()) {
            const remainingNeeded = task.massRequested - task.massReserved;
            if (remainingNeeded > 0) { // Any contribution helps, or enforce >= capacity?
                // Logic: if remaining needed is very small, maybe ignore if < min_carry?
                // For now, take anything.
                return task;
            }
        }
        return null;
    }

    public reserveCapacity(taskId: string, amount: number): boolean {
        const task = this.tasks.get(taskId);
        if (!task) return false;

        const remaining = task.massRequested - task.massReserved;
        const reserved = Math.min(remaining, amount);

        if (reserved <= 0) return false;

        task.massReserved += reserved;
        console.log(`[Broker] Reserved ${reserved}g on task ${taskId}. Progress: ${task.massReserved}/${task.massRequested}`);
        return true;
    }

    public completeTaskChunk(taskId: string, amount: number) {
        // In a real system we might deduct from requested or just verify delivery
        // simplified: if reserved == requested and all delivered, remove task.
        // For now, we keep tasks until explicitly cleared or we can deduct massRequested?
        // Better: Factories cancel/complete tasks when satisfied.
        // But let's assume the broker manages lifecycle for now.

        const task = this.tasks.get(taskId);
        if (!task) return;

        // Re-eval if we need to decrement anything. 
        // If the task is "move 1000g", and we moved 500g, do we lower requested?
        // Usually "requested" is the goal. "reserved" tracks promises. "delivered" tracks reality.

        // Let's rely on the Factory to cancel the task if its input is full, 
        // or the Sender to cancel if empty.
    }

    public removeTask(taskId: string) {
        this.tasks.delete(taskId);
    }
}
