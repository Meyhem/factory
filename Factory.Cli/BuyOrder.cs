namespace Factory.Cli;

public class BuyOrder
{
    public ProductType Product { get; }
    public double Quantity { get; set; }
    public double PricePerUnit { get; }
    public Factory Owner { get; }

    public BuyOrder(ProductType product, double quantity, double pricePerUnit, Factory owner)
    {
        Product = product;
        Quantity = quantity;
        PricePerUnit = pricePerUnit;
        Owner = owner;
    }
}