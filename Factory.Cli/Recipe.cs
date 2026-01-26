namespace Factory.Cli;

public class Recipe
{
    public Inventory InputRequirements { get; }
    public Inventory OutputResults { get; }
    public int TicksToComplete { get; }

    public Recipe(Inventory inputs, Inventory outputs, int ticks)
    {
        InputRequirements = inputs ?? new Inventory();
        OutputResults = outputs ?? new Inventory();
        TicksToComplete = ticks;
    }
}