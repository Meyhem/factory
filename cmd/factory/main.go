package main

import (
	"factory/internal/factory"
	"flag"
	"fmt"
)

func main() {
	ticks := flag.Uint64("ticks", 2000, "number of simulation ticks")
	interval := flag.Uint64("interval", 100, "print state every N ticks")
	flag.Parse()

	mine := &factory.Factory{
		InputInv:  make(factory.Inventory),
		OutputInv: make(factory.Inventory),
		Recipe:    factory.MiningIron,
	}
	coalMine := &factory.Factory{
		InputInv:  make(factory.Inventory),
		OutputInv: make(factory.Inventory),
		Recipe:    factory.MiningCoal,
	}
	smelt := &factory.Factory{
		InputInv:  make(factory.Inventory),
		OutputInv: make(factory.Inventory),
		Recipe:    factory.Smelting,
	}

	conns := []factory.Connection{
		{From: mine, To: smelt},
		{From: coalMine, To: smelt},
	}

	factories := []*factory.Factory{mine, coalMine, smelt}

	fmt.Println("Factory Simulation Started")

	for i := uint64(0); i < *ticks; i++ {
		factory.TickAll(factories, conns)
		if (i+1)%*interval == 0 || i == 0 {
			fmt.Printf("\nTick %d:\n", i+1)
			fmt.Print(factory.PrintAll(factories))
		}
	}

	fmt.Println("\nSimulation complete.")
}
