namespace Factory.Cli;

public class SellOrder
{
    public ProductType Product { get; }
    public double Quantity { get; set; }
    public double PricePerUnit { get; }
    public Factory Owner { get; }

    public SellOrder(ProductType product, double quantity, double pricePerUnit, Factory owner)
    {
        Product = product;
        Quantity = quantity;
        PricePerUnit = pricePerUnit;
        Owner = owner;
    }
}