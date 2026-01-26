using System;

namespace Factory.Cli;

class Program
{
    static void Main()
    {
        var market = new Market();
        var engine = new Engine(market);

        // Sample iron smelting recipe: 2 IronOre -> 1 IronIngot in 10 ticks
        var ironInput = new Inventory();
        ironInput.Add(ProductType.IronOre, 2.0);
        ironInput.Add(ProductType.Energy, 5.0);
        var ironOutput = new Inventory();
        ironOutput.Add(ProductType.IronIngot, 1.0);
        var ironRecipe = new Recipe(ironInput, ironOutput, 10);

        var ironFactory = new Factory { CurrentRecipe = ironRecipe, Credits = 5000 };
        ironFactory.InputInventory.Add(ProductType.IronOre, 20.0);
        engine.AddFactory(ironFactory);

        // Energy producer: produces 5 Energy every 5 ticks
        var energyInput = new Inventory();
        var energyOutput = new Inventory();
        energyOutput.Add(ProductType.Energy, 5.0);
        var energyRecipe = new Recipe(energyInput, energyOutput, 5);
        var energyFactory = new Factory { CurrentRecipe = energyRecipe, Credits = 5000 };
        engine.AddFactory(energyFactory);

        Console.WriteLine("Starting simulation...");
        engine.Run(30);

        Console.WriteLine("\nSimulation complete.");
        Console.WriteLine($"Final tick: {engine.GlobalTick}");
        Console.WriteLine($"Iron Factory Credits: {ironFactory.Credits:F2}");
        Console.WriteLine($"Iron Ore left: {ironFactory.InputInventory.GetAmount(ProductType.IronOre):F1}");
        Console.WriteLine($"Iron Ingots produced: {ironFactory.OutputInventory.GetAmount(ProductType.IronIngot):F1}");
    }
}