Phase 1: Environment Initialization

    Directory Setup
    Bash

    mkdir mining-game && cd mining-game
    mkdir -p src/{core,actors,scenes,data,assets,systems}
    npm init -y

    Dependency Installation

        Core: npm install excalibur

        Build: npm install -D parcel typescript @types/node

    Configuration

        tsconfig.json: Set target to ESNext, module to ESNext, and enable experimentalDecorators.

        package.json: Add scripts:
        JSON

        "scripts": {
          "start": "parcel index.html",
          "build": "parcel build index.html"
        }

Phase 2: Project Structure
1. /src/core (Domain Logic)

Strictly TypeScript logic. No Excalibur dependencies.

    Product.ts: Product metadata (ID, mass-per-unit is replaced by mass-only logic).

    Inventory.ts: Mass-based storage management.

    Recipe.ts: Transformation logic (Massin​→Massout​).

    LogisticsBroker.ts: Supply/Demand priority queue and reservation ledger.

2. /src/actors (Excalibur Entities)

Visual and interactive representations.

    BaseUnit.ts: Extends ex.Actor. Common logic for autonomous units.

    Mule.ts: Logistics unit implementation.

    Factory.ts: Processor implementation.

    Miner.ts: Specialized Factory for raw extraction.

3. /src/data (Static Definitions)

    Products.ts: Registry of all product IDs.

    Recipes.ts: Registry of mass-to-mass conversion rules.

4. /src/systems (ECS/Global Logic)

    TickSystem.ts: Synchronizes game logic ticks across factories.

    InputHandler.ts: Manages factory placement and selection.

Phase 3: Initial Entry Point

index.html
HTML

<!DOCTYPE html>
<html>
<head><title>Mining Game</title></head>
<body>
    <canvas id="game"></canvas>
    <script src="./src/main.ts" type="module"></script>
</body>
</html>

src/main.ts
TypeScript

import * as ex from 'excalibur';

const game = new ex.Engine({
  canvasElementId: 'game',
  width: 800,
  height: 600,
  displayMode: ex.DisplayMode.FitScreen
});

game.start();

Phase 4: Implementation Sequence

    Define AmountOfProduct: Create the container for productId and mass.

    Define Inventory: Implement add, remove, and transfer based solely on mass capacity.

    Define LogisticsBroker: Implement the Task registry to prevent over-dispatching Mules.

    Implement Factory Logic: Process input mass to output mass over defined intervals.

    Visual Layer: Connect Factory and Mule logic to Excalibur Actors.