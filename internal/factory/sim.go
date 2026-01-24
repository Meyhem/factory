package factory

import "fmt"

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
		name := fmt.Sprintf("f%d", i+1)
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
