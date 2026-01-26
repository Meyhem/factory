using System;
using System.Collections.Generic;

namespace Factory.Cli;

public enum FactoryState
{
    Idle,
    Producing
}

public class Factory
{
    public FactoryState State { get; private set; } = FactoryState.Idle;
    public Recipe? CurrentRecipe { get; set; }
    public int RemainingTicks { get; set; } = 0;
    public Inventory InputInventory { get; set; } = new();
    public Inventory OutputInventory { get; set; } = new();
    public Inventory ProductionBuffer { get; set; } = new();
    public double Credits { get; set; } = 1000.0;
    public string Name { get; set; } = "Unnamed";

    public void Tick()
    {
        if (State == FactoryState.Producing)
        {
            RemainingTicks--;
            if (RemainingTicks <= 0)
            {
                foreach (var kvp in ProductionBuffer.Items)
                {
                    OutputInventory.Add(kvp.Key, kvp.Value);
                }
                ProductionBuffer.Items.Clear();
                State = FactoryState.Idle;
                RemainingTicks = 0;
            }
            return;
        }

        if (CurrentRecipe != null && InputInventory.ContainsAll(CurrentRecipe.InputRequirements))
        {
            InputInventory.Consume(CurrentRecipe.InputRequirements);
            ProductionBuffer.Items.Clear();
            foreach (var kvp in CurrentRecipe.OutputResults.Items)
            {
                ProductionBuffer.Add(kvp.Key, kvp.Value);
            }
            RemainingTicks = CurrentRecipe.TicksToComplete;
            State = FactoryState.Producing;
        }
    }

    public void GenerateOrders(Market market)
    {
        if (CurrentRecipe == null) return;

        foreach (var req in CurrentRecipe.InputRequirements.Items)
        {
            double have = InputInventory.GetAmount(req.Key);
            double deficit = req.Value - have;
            if (deficit > 0 && Credits > 0)
            {
                double bidPrice = market.CurrentPrices[req.Key] * 1.05;
                var order = new BuyOrder(req.Key, deficit, bidPrice, this);
                market.PostBuyOrder(order);
            }
        }

        foreach (var outItem in OutputInventory.Items)
        {
            if (outItem.Value > 0)
            {
                double sellQty = Math.Min(outItem.Value * 0.5, outItem.Value);
                double askPrice = market.CurrentPrices[outItem.Key] * 0.95;
                var order = new SellOrder(outItem.Key, sellQty, askPrice, this);
                market.PostSellOrder(order);
            }
        }
    }
}
