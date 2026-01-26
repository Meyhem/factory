using System;
using System.Collections.Generic;

namespace Factory.Cli;

public class Engine
{
    public List<Factory> Factories { get; } = new();
    public List<Factory> Consumers { get; } = new();
    public Market Market { get; }
    public int GlobalTick { get; private set; } = 0;

    public Engine(Market market)
    {
        Market = market;
    }

    public void AddFactory(Factory factory) => Factories.Add(factory);
    public void AddConsumer(Factory consumer) => Consumers.Add(consumer);

    public void Run(int numTicks)
    {
        for (int t = 0; t < numTicks; t++)
        {
            // 1. Factories generate orders
            foreach (var f in Factories)
                f.GenerateOrders(Market);

            // 2. Market matches orders
            Market.ProcessOrders();

            // 3. Factories execute production ticks
            foreach (var f in Factories)
                f.Tick();

            GlobalTick++;

            Console.WriteLine($"Tick {GlobalTick}: Simulation step complete.");
        }
    }
}