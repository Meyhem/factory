Implementation Plan: Industrial Simulation Engine
1. Refined Domain Model
Inventory Class

Updated to handle recipe validation and internal storage management.

    Properties: Dictionary<ProductType, double> Items.

    Methods:

        Add(ProductType type, double quantity)

        Remove(ProductType type, double quantity)

        TransferTo(Inventory target, ProductType type, double quantity)

        ContainsAll(Inventory requirements): Returns true if every product in the requirements exists in the current inventory at equal or greater quantity.

        Consume(Inventory requirements): Subtracts the quantities defined in the requirement inventory from the local state.

Recipe Class

    InputRequirements: Inventory

    OutputResults: Inventory

    TicksToComplete: int

2. Factory Logic (Single-Threaded Actor)

Factories operate as state machines driven by the global tick.

    States: Idle, Producing.

    Tick Execution Logic:

        Check Status: If RemainingTicks > 0, decrement and return.

        Completion: If RemainingTicks == 0 and production was active, move items from internal buffer to OutputInventory.

        Initiation: If InputInventory.ContainsAll(CurrentRecipe.InputRequirements):

            Invoke InputInventory.Consume(CurrentRecipe.InputRequirements).

            Set RemainingTicks = CurrentRecipe.TicksToComplete.

        Market Interaction: Generate BuyOrder for missing inputs and SellOrder for available outputs based on current Credits.

3. Market System (Deterministic)

Uses a standard List<Order> for matching. No concurrency overhead.
Price Discovery Algorithm

Prices are adjusted per tick based on the delta between supply and demand.
Pt+1​=Pt​×(1+clamp(Demand+SupplyDemand−Supply​,−0.1,0.1))
Order Matching

    Collect all SellOrders and BuyOrders.

    Sort SellOrders by price (ascending).

    Sort BuyOrders by price (descending).

    Execute trades where BuyPrice >= SellPrice until liquidity is exhausted.

    Clear remaining orders or carry over to next tick.

4. Simulation Execution Loop

The Engine class executes the following sequence in a single thread:
C#

while (simulating) {
    // 1. Factories evaluate needs and post orders
    foreach (var f in factories) f.GenerateOrders(market);

    // 2. Market matches orders and updates prices
    market.ProcessOrders();

    // 3. Factories execute production ticks
    foreach (var f in factories) f.Tick();

    // 4. Consumer factories remove final products from the system
    foreach (var c in consumers) c.Consume(market);

    globalTick++;
}

5. Inventory Implementation Details
C#

public class Inventory {
    public Dictionary<ProductType, double> Items { get; } = new();

    public bool ContainsAll(Inventory requirements) {
        foreach (var req in requirements.Items) {
            if (Items.GetValueOrDefault(req.Key) < req.Value) return false;
        }
        return true;
    }

    public void Consume(Inventory requirements) {
        foreach (var req in requirements.Items) {
            Items[req.Key] -= req.Value;
        }
    }

    // Standard Add/Remove/Transfer methods follow
}