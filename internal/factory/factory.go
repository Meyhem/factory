package factory

type Factory struct {
	Name      string
	InputInv  Inventory
	OutputInv Inventory
	Recipe    *Recipe
	Progress  uint64
}

type Connection struct {
	From, To *Factory
}
