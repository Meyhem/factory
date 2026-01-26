namespace Factory.Cli;

public static class Recipes
{
    public static Recipe IronSmelting() => new Recipe(
        new Inventory(new Dictionary<ProductType, double> { [ProductType.IronOre] = 2, [ProductType.Energy] = 5 }),
        new Inventory(new Dictionary<ProductType, double> { [ProductType.IronIngot] = 1 }),
        10);

    public static Recipe EnergyProduction() => new Recipe(
        new Inventory(),
        new Inventory(new Dictionary<ProductType, double> { [ProductType.Energy] = 5 }),
        5);
}