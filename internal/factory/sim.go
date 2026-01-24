package factory

import (
	"encoding/json"
	"fmt"
	"os"
)

func TickAll(factories []*Factory, conns []Connection) {
	// 1. Transfers: Output -> Input (all items)
	for _, conn := range conns {
		from := conn.From
		to := conn.To
		for typ := range from.OutputInv {
			from.OutputInv.TransferTo(&to.InputInv, typ)
		}
	}

	// 2. Recipes
	for _, f := range factories {
		if f.Recipe == nil {
			continue
		}
		if f.Progress == 0 {
			if f.InputInv.ContainsAtLeastAll(f.Recipe.Inputs) {
				f.InputInv.RemoveAll(f.Recipe.Inputs)
				f.Progress = 1
			}
		} else {
			f.Progress++
			if f.Progress >= f.Recipe.Ticks {
				f.OutputInv.AddAll(f.Recipe.Outputs)
				f.Progress = 0
			}
		}
	}
}

func PrintAll(factories []*Factory) string {
	if len(factories) == 0 {
		return ""
	}
	out := "Factory    | InputInv                  | OutputInv                | Progress\n"
	out += "-----------|---------------------------|--------------------------|---------\n"
	for i, f := range factories {
		name := f.Name
		if name == "" {
			name = fmt.Sprintf("f%d", i+1)
		}
		inStr := f.InputInv.String()
		outStr := f.OutputInv.String()
		var prog string
		if f.Recipe == nil {
			prog = "-"
		} else {
			prog = fmt.Sprintf("%d/%d", f.Progress, f.Recipe.Ticks)
		}
		line := fmt.Sprintf("%-10s | %-25s | %-25s | %s\n", name, inStr, outStr, prog)
		out += line
	}
	return out
}

func LoadFactoriesFromJSON(path string) ([]*Factory, []Connection, int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, 0, err
	}
	var procs []ProcessJSON
	if err := json.Unmarshal(data, &procs); err != nil {
		return nil, nil, 0, err
	}
	numProcesses := len(procs)
	var factories []*Factory
	var conns []Connection
	for _, proc := range procs {
		if len(proc.Stages) == 0 {
			continue
		}
		stageFactories := make([]*Factory, 0, len(proc.Stages))
		for _, stage := range proc.Stages {
			f := &Factory{
				Name:      stage.Name,
				InputInv:  Inventory{},
				OutputInv: Inventory{},
				Recipe:    RecipeFromStage(stage),
			}
			stageFactories = append(stageFactories, f)
			factories = append(factories, f)
		}
		for j := 0; j < len(stageFactories)-1; j++ {
			conns = append(conns, Connection{
				From: stageFactories[j],
				To:   stageFactories[j+1],
			})
		}
	}
	return factories, conns, numProcesses, nil
}
