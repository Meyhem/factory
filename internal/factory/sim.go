package factory

import (
	"fmt"
	"strings"
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
				if err := f.InputInv.RemoveAll(f.Recipe.Inputs); err != nil {
					panic(err)
				}
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
	maxName, maxIn, maxOut := 0, 0, 0
	for i, f := range factories {
		name := f.Name
		if name == "" {
			name = fmt.Sprintf("f%d", i+1)
		}
		inStr := f.InputInv.String()
		outStr := f.OutputInv.String()
		if len(name) > maxName {
			maxName = len(name)
		}
		if len(inStr) > maxIn {
			maxIn = len(inStr)
		}
		if len(outStr) > maxOut {
			maxOut = len(outStr)
		}
	}
	colWidth := maxName
	if maxIn > colWidth {
		colWidth = maxIn
	}
	if maxOut > colWidth {
		colWidth = maxOut
	}
	header := fmt.Sprintf("%-*s | %-*s | %-*s\n",
		colWidth, "Name",
		colWidth, "Input Inv",
		colWidth, "Output Inv")
	sep := strings.Repeat("-", colWidth) + " | " +
		strings.Repeat("-", colWidth) + " | " +
		strings.Repeat("-", colWidth) + "\n"
	lineFmt := fmt.Sprintf("%%-%ds | %%-%ds | %%-%ds\n",
		colWidth, colWidth, colWidth)
	out := header + sep
	for i, f := range factories {
		name := f.Name
		if name == "" {
			name = fmt.Sprintf("f%d", i+1)
		}
		inStr := f.InputInv.String()
		outStr := f.OutputInv.String()
		line := fmt.Sprintf(lineFmt, name, inStr, outStr)
		out += line
	}
	return out
}
