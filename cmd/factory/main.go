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

	ironMine := factory.NewFactory("Iron Mine", factory.MiningIron)
	coalMine := factory.NewFactory("Coal Mine", factory.MiningCoal)
	smelter := factory.NewFactory("Smelter", factory.Smelting)
	steelProc := factory.NewFactory("Steel Processor", factory.SteelProcessing)

	factories := []*factory.Factory{ironMine, coalMine, smelter, steelProc}
	conns := []factory.Connection{
		{From: ironMine, To: smelter},
		{From: coalMine, To: smelter},
		{From: smelter, To: steelProc},
	}

	for t := uint64(0); t < *ticks; t++ {
		factory.TickAll(factories, conns)
		if t%*interval == 0 {
			fmt.Print("\033[2J\033[H")
			fmt.Print(factory.PrintAll(factories))
			fmt.Println()
		}
	}
	fmt.Println("\nSimulation complete.")
}
