package main

import (
	"factory/internal/factory"
	"flag"
	"fmt"
	"os"
)

func main() {
	ticks := flag.Uint64("ticks", 2000, "number of simulation ticks")
	interval := flag.Uint64("interval", 100, "print state every N ticks")
	flag.Parse()

	factories, conns, numProcesses, err := factory.LoadFactoriesFromJSON("processes.json")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load processes.json: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Factory Simulation Started: %d factories in %d processes\n", len(factories), numProcesses)

	for i := uint64(0); i < *ticks; i++ {
		factory.TickAll(factories, conns)
		if (i+1)%*interval == 0 || i == 0 {
			fmt.Printf("\nTick %d:\n", i+1)
			fmt.Print(factory.PrintAll(factories))
		}
	}

	fmt.Println("\nSimulation complete.")
}
