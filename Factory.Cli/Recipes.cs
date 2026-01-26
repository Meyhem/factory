namespace Factory.Cli;

public static class Recipes
{
    public static Inventory IronInput()
    {
        var inv = new Inventory();
        inv.Add(ProductType.IronOre, 2);
        inv.Add(ProductType.Energy, 5);
        return inv;
    }

    public static Inventory IronOutput()
    {
        var inv = new Inventory();
        inv.Add(ProductType.IronIngot, 1);
        return inv;
    }

    public static Recipe IronSmelting() => new Recipe(IronInput(), IronOutput(), 10);

    public static Inventory EnergyOutput()
    {
        var inv = new Inventory();
        inv.Add(ProductType.Energy, 5);
        return inv;
    }

    public static Recipe EnergyProduction() => new Recipe(new Inventory(), EnergyOutput(), 5);
}