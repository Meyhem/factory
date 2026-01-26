namespace Factory.Cli;

public static class Recipes
{
    public static Recipe IronSmelting() => new Recipe(
        new Inventory(new KeyValuePair<ProductType, double>[] {
            new(ProductType.IronOre, 2),
            new(ProductType.Energy, 5)
        }),
        new Inventory(new KeyValuePair<ProductType, double>[] {
            new(ProductType.IronIngot, 1)
        }),
        10);

    public static Recipe EnergyProduction() => new Recipe(
        new Inventory(),
        new Inventory(new KeyValuePair<ProductType, double>[] {
            new(ProductType.Energy, 5)
        }),
        5);
}