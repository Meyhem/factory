package factory

import (
	"fmt"
	"sort"
	"strings"
)

type ItemType string

const (
	IronOre ItemType = "IronOre"
	Coal    ItemType = "Coal"
	Steel   ItemType = "Steel"
	Slag    ItemType = "Slag"
)

func FormatQuantity(q uint64) string {
	if q == 0 {
		return "0g"
	}
	unit := "g"
	if q >= 1_000_000_000_000 {
		q /= 1_000_000_000_000
		unit = "Mt"
	} else if q >= 1_000_000_000 {
		q /= 1_000_000_000
		unit = "kt"
	} else if q >= 1_000_000 {
		q /= 1_000_000
		unit = "t"
	} else if q >= 1000 {
		q /= 1000
		unit = "kg"
	}
	return fmt.Sprintf("%d%s", q, unit)
}

type Inventory map[ItemType]uint64

func (inv Inventory) String() string {
	if len(inv) == 0 {
		return ""
	}
	parts := make([]string, 0, len(inv))
	for typ, qty := range inv {
		parts = append(parts, fmt.Sprintf("%s: %s", typ, FormatQuantity(qty)))
	}
	sort.Strings(parts)
	return strings.Join(parts, ", ")
}

func (inv *Inventory) Add(typ ItemType, qty uint64) {
	(*inv)[typ] += qty
}

func (inv *Inventory) Remove(typ ItemType, qty uint64) error {
	if c := (*inv)[typ]; c < qty {
		return fmt.Errorf("insufficient %s (have %d, need %d)", typ, c, qty)
	}
	(*inv)[typ] -= qty
	if (*inv)[typ] == 0 {
		delete(*inv, typ)
	}
	return nil
}

func (inv Inventory) Count(typ ItemType) uint64 {
	return inv[typ]
}

func (inv Inventory) Contains(typ ItemType) bool {
	return inv.Count(typ) > 0
}

func (inv Inventory) ContainsAtLeast(typ ItemType, qty uint64) bool {
	return inv.Count(typ) >= qty
}

func (inv *Inventory) TransferTo(target *Inventory, typ ItemType) uint64 {
	amt := inv.Count(typ)
	if amt > 0 {
		target.Add(typ, amt)
		delete(*inv, typ)
	}
	return amt
}

func (inv *Inventory) AddAll(amt Inventory) {
	for typ, qty := range amt {
		inv.Add(typ, qty)
	}
}

func (inv *Inventory) RemoveAll(amt Inventory) error {
	for typ, qty := range amt {
		if err := inv.Remove(typ, qty); err != nil {
			return err
		}
	}
	return nil
}

func (inv Inventory) ContainsAtLeastAll(amt Inventory) bool {
	for typ, qty := range amt {
		if !inv.ContainsAtLeast(typ, qty) {
			return false
		}
	}
	return true
}

func (inv *Inventory) Clear() {
	for typ := range *inv {
		delete(*inv, typ)
	}
}

type Recipe struct {
	Inputs  Inventory
	Outputs Inventory
	Ticks   uint64
}

var MiningIron = &Recipe{
	Inputs:  Inventory{},
	Outputs: Inventory{IronOre: 1_000_000_000}, // 1t
	Ticks:   20,
}

var MiningCoal = &Recipe{
	Inputs:  Inventory{},
	Outputs: Inventory{Coal: 500_000_000}, // 0.5t
	Ticks:   15,
}

var Smelting = &Recipe{
	Inputs: Inventory{
		IronOre: 1_000_000_000, // 1t
		Coal:    200_000_000,   // 0.2t
	},
	Outputs: Inventory{
		Steel: 800_000_000, // 0.8t
		Slag:  200_000_000, // 0.2t
	},
	Ticks: 100,
}

type ProcessJSON struct {
	Name   string      `json:"name"`
	Stages []StageJSON `json:"stages"`
}

type StageJSON struct {
	Name    string   `json:"name"`
	Stage   int      `json:"stage"`
	Inputs  []string `json:"inputs"`
	Outputs []string `json:"outputs"`
}

const (
	DefaultQty   uint64 = 1_000_000_000
	DefaultTicks uint64 = 50
)

func RecipeFromStage(stage StageJSON) *Recipe {
	inputs := Inventory{}
	for _, input := range stage.Inputs {
		name := strings.TrimSpace(input)
		inputs[ItemType(name)] = DefaultQty
	}
	outputs := Inventory{}
	for _, output := range stage.Outputs {
		name := strings.TrimSpace(output)
		outputs[ItemType(name)] = DefaultQty
	}
	return &Recipe{
		Inputs:  inputs,
		Outputs: outputs,
		Ticks:   DefaultTicks,
	}
}
