using System;
using System.Collections.Generic;
using System.Linq;

namespace Factory.Cli;

public class Market
{
    public Dictionary<ProductType, double> CurrentPrices { get; } = new();
    public Dictionary<ProductType, List<BuyOrder>> BuyOrdersByProduct { get; } = new();
    public Dictionary<ProductType, List<SellOrder>> SellOrdersByProduct { get; } = new();

    public Market()
    {
        foreach (ProductType p in Enum.GetValues<ProductType>())
        {
            CurrentPrices[p] = 1.0;
        }
    }

    public void PostBuyOrder(BuyOrder order)
    {
        if (!BuyOrdersByProduct.TryGetValue(order.Product, out var list))
        {
            list = new List<BuyOrder>();
            BuyOrdersByProduct[order.Product] = list;
        }
        list.Add(order);
    }

    public void PostSellOrder(SellOrder order)
    {
        if (!SellOrdersByProduct.TryGetValue(order.Product, out var list))
        {
            list = new List<SellOrder>();
            SellOrdersByProduct[order.Product] = list;
        }
        list.Add(order);
    }

    public void ProcessOrders()
    {
        // Order matching
        foreach (ProductType p in Enum.GetValues<ProductType>())
        {
            if (!BuyOrdersByProduct.TryGetValue(p, out var buys) || buys.Count == 0 ||
                !SellOrdersByProduct.TryGetValue(p, out var sells) || sells.Count == 0) continue;

            var sortedBuys = buys.OrderByDescending(o => o.PricePerUnit).ToList();
            var sortedSells = sells.OrderBy(o => o.PricePerUnit).ToList();

            int bi = 0, si = 0;
            while (bi < sortedBuys.Count && si < sortedSells.Count &&
                   sortedBuys[bi].PricePerUnit >= sortedSells[si].PricePerUnit)
            {
                double tradeQty = Math.Min(sortedBuys[bi].Quantity, sortedSells[si].Quantity);
                double tradePrice = sortedSells[si].PricePerUnit;

                // Execute trade
                sortedSells[si].Owner.Credits += tradeQty * tradePrice;
                sortedBuys[bi].Owner.Credits -= tradeQty * tradePrice;
                sortedSells[si].Owner.OutputInventory.TransferTo(sortedBuys[bi].Owner.InputInventory, p, tradeQty);

                sortedBuys[bi].Quantity -= tradeQty;
                sortedSells[si].Quantity -= tradeQty;

                if (sortedBuys[bi].Quantity <= 0) bi++;
                if (sortedSells[si].Quantity <= 0) si++;
            }

            // Retain unfilled orders
            BuyOrdersByProduct[p] = sortedBuys.Where(o => o.Quantity > 0).ToList();
            SellOrdersByProduct[p] = sortedSells.Where(o => o.Quantity > 0).ToList();
        }

        // Price discovery
        foreach (ProductType p in Enum.GetValues<ProductType>())
        {
            double totalDemand = 0;
            if (BuyOrdersByProduct.TryGetValue(p, out var buys))
                totalDemand = buys.Sum(o => o.Quantity);

            double totalSupply = 0;
            if (SellOrdersByProduct.TryGetValue(p, out var sells))
                totalSupply = sells.Sum(o => o.Quantity);

            double delta = totalDemand - totalSupply;
            double denom = totalDemand + totalSupply + 1e-9;
            double adjustment = Math.Clamp(delta / denom, -0.1, 0.1);
            CurrentPrices[p] *= (1 + adjustment);
        }
    }
}