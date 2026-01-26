using System.Collections.Generic;

namespace Factory.Cli;

public class Inventory
{
    public Dictionary<ProductType, double> Items { get; } = new();

    public Inventory(IEnumerable<KeyValuePair<ProductType, double>>? initialItems = null)
    {
        if (initialItems != null)
        {
            foreach (var kvp in initialItems)
            {
                Add(kvp.Key, kvp.Value);
            }
        }
    }

    public void Add(ProductType type, double quantity)
    {
        if (quantity <= 0) return;
        double current = GetAmount(type);
        Items[type] = current + quantity;
    }

    public void Remove(ProductType type, double quantity)
    {
        if (Items.TryGetValue(type, out double current) && current >= quantity)
        {
            Items[type] = current - quantity;
            if (Items[type] == 0)
                Items.Remove(type);
        }
    }

    public void TransferTo(Inventory target, ProductType type, double quantity)
    {
        Remove(type, quantity);
        target.Add(type, quantity);
    }

    public bool ContainsAll(Inventory requirements)
    {
        foreach (var req in requirements.Items)
        {
            if (!Items.TryGetValue(req.Key, out double amt) || amt < req.Value)
                return false;
        }
        return true;
    }

    public void Consume(Inventory requirements)
    {
        foreach (var req in requirements.Items)
        {
            Remove(req.Key, req.Value);
        }
    }

    public double GetAmount(ProductType type) => Items.TryGetValue(type, out double amt) ? amt : 0;
}