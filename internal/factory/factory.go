package factory

type Factory struct {
	Progress  uint64
	Recipe    *Recipe
	InputInv  Inventory
	OutputInv Inventory
	Name      string
}

type Connection struct {
	From, To *Factory
}

func NewFactory(name string, recipe *Recipe) *Factory {
	f := &Factory{
		Name:      name,
		Progress:  0,
		InputInv:  make(Inventory),
		OutputInv: make(Inventory),
		Recipe:    recipe,
	}
	return f
}
