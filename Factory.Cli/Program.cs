using System;
using System.Linq;

namespace Factory.Cli;

class Program
{
    static void Main()
    {
        var market = new Market();
        var engine = new Engine(market);

                var ironRecipe = Recipes.IronSmelting();

        var ironFactory = new Factory { CurrentRecipe = ironRecipe, Name = "Iron Smelter", Credits = 5000 };
        ironFactory.InputInventory.Add(ProductType.IronOre, 20.0);
        engine.AddFactory(ironFactory);

                var energyRecipe = Recipes.EnergyProduction();
        var energyFactory = new Factory { CurrentRecipe = energyRecipe, Name = "Energy Plant", Credits = 5000 };
        engine.AddFactory(energyFactory);

        Console.WriteLine("Starting simulation...");
        engine.Run(30);

        Console.WriteLine("\nMarket state:");
        Console.WriteLine("{0,-12} | {1,6} | {2,7} | {3,7}", "Product", "Price", "Buy Qty", "Sell Qty");
        Console.WriteLine(new string('-', 12+1+6+1+7+1+7));
        foreach (ProductType p in Enum.GetValues<ProductType>())
        {
            double price = market.CurrentPrices[p];
            double buyQty = 0;
            if (market.BuyOrdersByProduct.TryGetValue(p, out var buys))
                buyQty = buys.Sum(o => o.Quantity);
            double sellQty = 0;
            if (market.SellOrdersByProduct.TryGetValue(p, out var sells))
                sellQty = sells.Sum(o => o.Quantity);
            Console.WriteLine("{0,-12} | {1,6:F2} | {2,7:F1} | {3,7:F1}", p, price, buyQty, sellQty);
        }

        Console.WriteLine("\nFactories status:");
        Console.WriteLine("{0,-12} | {1,-9} | {2,8:F0} | {3,6:F1} | {4,7:F1} | {5,9:F1}", "Name", "State", "Credits", "Ore", "Energy", "IronIngot");
        Console.WriteLine(new string('-', 12+1+9+1+8+1+6+1+7+1+9));
        var allFactories = engine.Factories.Concat(engine.Consumers).ToList();
        foreach (var f in allFactories)
        {
            Console.WriteLine("{0,-12} | {1,-9} | {2,8:F0} | {3,6:F1} | {4,7:F1} | {5,9:F1}",
                f.Name, f.State, f.Credits,
                f.InputInventory.GetAmount(ProductType.IronOre),
                f.InputInventory.GetAmount(ProductType.Energy),
                f.OutputInventory.GetAmount(ProductType.IronIngot));
        }

        Console.WriteLine("\nSimulation complete.");
        Console.WriteLine($"Final tick: {engine.GlobalTick}");
        Console.WriteLine($"Iron Factory Credits: {ironFactory.Credits:F2}");
        Console.WriteLine($"Iron Ore left: {ironFactory.InputInventory.GetAmount(ProductType.IronOre):F1}");
        Console.WriteLine($"Iron Ingots produced: {ironFactory.OutputInventory.GetAmount(ProductType.IronIngot):F1}");
    }
}