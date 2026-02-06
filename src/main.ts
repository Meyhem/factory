
import { Engine, DisplayMode, Color } from 'excalibur';
import { Miner } from './actors/Miner';
import { Factory } from './actors/Factory';
import { Mule } from './actors/Mule';
import { RECIPES, PRODUCTS } from './data/registry';
import { LogisticsBroker } from './systems/LogisticsBroker';

const game = new Engine({
    width: 800,
    height: 600,
    displayMode: DisplayMode.Fixed,
    backgroundColor: Color.fromHex('#1a1a1a') // Dark industrial background
});

// Setup Game
game.start().then(() => {
    console.log("Industrial Sim Started");

    // 1. Create Iron Mine
    const ironMine = new Miner("IronMine", PRODUCTS.IRON_ORE, 10); // 10g per tick
    ironMine.pos.setTo(100, 300);
    ironMine.color = Color.fromHex('#AA5555'); // Rust
    game.add(ironMine);

    // 2. Create Coal Mine
    const coalMine = new Miner("CoalMine", PRODUCTS.COAL, 5);
    coalMine.pos.setTo(100, 500);
    coalMine.color = Color.fromHex('#333333'); // Dark Coal
    game.add(coalMine);

    // 3. Create Steel Mill
    const steelMill = new Factory("SteelMill", 5000, 5000);
    steelMill.pos.setTo(600, 400);
    steelMill.activeRecipe = RECIPES.STEEL_PRODUCTION;
    steelMill.color = Color.fromHex('#AAAAAA'); // Steel Color
    game.add(steelMill);

    // 4. Create Mules
    for (let i = 0; i < 3; i++) {
        const mule = new Mule(`Mule_${i}`, 200); // 200g capacity
        // Spawn at different rows to avoid overlap
        mule.pos.setTo(400, 300 + (i * 32));
        game.add(mule);
    }

    // Broker is singleton, auto-instantiated
    const broker = LogisticsBroker.getInstance();

    // Simulation Loop (Hack: factories need to be ticked)
    // In real excalibur, we'd use a Timer or the update loop.
    // For now, let's hook into postUpdate or just rely on Actor.update calling tick() 
    // BUT Factory.ts currently has a `tick()` method that isn't called by update automatically.
    // I should fix Factory.ts or call it here.

    // Better: Make Factory and Miner call tick() in their update()
    // I'll leave Factory as is and add a System or Timer to tick them.

    game.on('postupdate', () => {
        // Tick moved to internal update loop
        // Just monitoring here if needed
    });
});
