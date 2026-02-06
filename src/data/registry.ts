
import { AmountOfProduct } from '../core/AmountOfProduct';

export interface Recipe {
    id: string;
    inputs: AmountOfProduct[];
    outputs: AmountOfProduct[];
    durationTicks: number;
}

export const PRODUCTS = {
    IRON_ORE: 'iron_ore',
    COAL: 'coal',
    WATER: 'water',
    SLAG: 'slag',
    STEEL: 'steel',
    STEEL_V_PARTS: 'steel_v_parts',
    STEEL_C_PARTS: 'steel_c_parts',
};

export const RECIPES: Record<string, Recipe> = {
    STEEL_PRODUCTION: {
        id: 'steel_production',
        inputs: [
            new AmountOfProduct(PRODUCTS.IRON_ORE, 1000),
            new AmountOfProduct(PRODUCTS.COAL, 500),
            new AmountOfProduct(PRODUCTS.WATER, 200),
        ],
        outputs: [
            new AmountOfProduct(PRODUCTS.STEEL, 800),
            new AmountOfProduct(PRODUCTS.SLAG, 200),
        ],
        durationTicks: 100,
    },
};
