# CiviGenis — Persistent Animation Memory Registry

> Centralized, persistent animation knowledge system registering every animation asset available under `public/assets/animations/`.

## Executive Summary & Totals

| Metric | Count / Value |
| :--- | :--- |
| **Total animations** | **77** |
| **Total packs** | **3** |
| **Total farming animations** | **25** |
| **Total injured animations** | **20** |
| **Total locomotion animations** | **3** |
| **Total social animations** | **14** |
| **Total survival animations** | **6** |
| **Total interaction animations** | **1** |
| **Total swimming animations** | **2** |
| **Total transition animations** | **5** |
| **Total currently used animations** | **8** |
| **Total unused-but-available animations** | **69** |

## Pack Breakdown

| Pack Name | Animations Count |
| :--- | :--- |
| **Root** | 32 |
| **Farming Pack** | 25 |
| **Male Injured Pack** | 20 |

## Action System Mapping Matrix

High-level AI Intention Actions map to the following registered animation IDs/files in Animation Memory:

| High-Level Action | Registered Animations (Variants) |
| :--- | :--- |
| `EXPRESS` | `Agreeing`, `Clapping`, `Laughing`, `Pointing-back`, `Pointing`, `Shaking Head No`, `Thankful` |
| `IDLE` | `Breathing Idle` |
| `DRINK` | `Drinking`, `Sitting Drinking` |
| `FALL` | `Fall Flat` |
| `CARRY` | `box idle`, `box turn (2)`, `box turn`, `box walk arc`, `holding idle`, `holding turn left`, `holding turn right`, `holding walk` |
| `MILK_COW` | `cow milking` |
| `PLANT_CROP` | `dig and plant seeds`, `plant a plant`, `plant tree` |
| `KNEEL` | `kneeling idle` |
| `HARVEST_CROP` | `pick fruit (2)`, `pick fruit (3)`, `pick fruit`, `pull plant (2)`, `pull plant` |
| `WATER_CROP` | `watering`, `Treading Water` |
| `WHEELBARROW_WORK` | `wheelbarrow dump`, `wheelbarrow idle`, `wheelbarrow walk (2)`, `wheelbarrow walk turn (2)`, `wheelbarrow walk turn`, `wheelbarrow walk` |
| `SLEEP` | `Laying Sleeping`, `Sleeping Idle` |
| `INJURED_ACTION` | `injured backwards turn left`, `injured backwards turn right`, `injured standing jump`, `injured turn left`, `injured turn right`, `injured wave idle` |
| `INJURED_IDLE` | `injured hurting idle`, `injured idle`, `injured stumble idle` |
| `INJURED_RUN` | `injured run backwards left turn`, `injured run backwards right turn`, `injured run backwards`, `injured run jump`, `injured run left turn`, `injured run right turn`, `injured run` |
| `GO_TO` | `injured run backwards left turn`, `injured run backwards right turn`, `injured run backwards`, `injured run jump`, `injured run left turn`, `injured run right turn`, `injured run`, `injured walk backwards`, `injured walk left turn`, `injured walk right turn`, `injured walk`, `Running Tired`, `Running`, `Walking` |
| `INJURED_WALK` | `injured walk backwards`, `injured walk left turn`, `injured walk right turn`, `injured walk` |
| `REST` | `Male Sitting Pose` |
| `SIT` | `Male Sitting Pose` |
| `GREETING` | `Quick Formal Bow`, `Standing Greeting`, `Waving` |
| `RUN` | `Running Tired`, `Running` |
| `MISC_ACTION` | `Shaking Hands 2` |
| `TALK` | `Sitting Talking`, `Talking-1`, `Talking-2`, `Talking` |
| `STAND_UP` | `Stand Up`, `Stand Up_from_chair`, `Standing Up (1)`, `Standing Up_from_fall` |
| `SWIM` | `Swimming` |
| `THROW` | `Throw Object` |
| `WALK` | `Walking` |

---

## Complete Animation Registry (All Discovered Animations)

### 1. Agreeing

- **ID**: `agreeing`
- **File**: `Agreeing.fbx`
- **Pack**: `Root`
- **Name**: Agreeing
- **Description**: Character animation: Agreeing
- **Category**: `SOCIAL`
- **Tags**: `social`, `express`, `agreeing`, `root`
- **Action Mappings**: `EXPRESS`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `4.7s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `clapping`, `laughing`, `pointing_back`, `pointing`, `shaking_head_no`, `thankful`

### 2. Breathing Idle

- **ID**: `breathing_idle`
- **File**: `Breathing Idle.fbx`
- **Pack**: `Root`
- **Name**: Breathing Idle
- **Description**: Character animation: Breathing Idle
- **Category**: `SURVIVAL`
- **Tags**: `survival`, `idle`, `breathing`, `root`
- **Action Mappings**: `IDLE`
- **Character States**: `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `9.93s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: *None*

### 3. Clapping

- **ID**: `clapping`
- **File**: `Clapping.fbx`
- **Pack**: `Root`
- **Name**: Clapping
- **Description**: Character animation: Clapping
- **Category**: `SOCIAL`
- **Tags**: `social`, `express`, `clapping`, `root`
- **Action Mappings**: `EXPRESS`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.17s`
- **FPS**: `30`
- **Root Motion**: `false` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `agreeing`, `laughing`, `pointing_back`, `pointing`, `shaking_head_no`, `thankful`

### 4. Drinking

- **ID**: `drinking`
- **File**: `Drinking.fbx`
- **Pack**: `Root`
- **Name**: Drinking
- **Description**: Character animation: Drinking
- **Category**: `SURVIVAL`
- **Tags**: `survival`, `drink`, `drinking`, `root`
- **Action Mappings**: `DRINK`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `8.87s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `sitting_drinking`

### 5. Fall Flat

- **ID**: `fall_flat`
- **File**: `Fall Flat.fbx`
- **Pack**: `Root`
- **Name**: Fall Flat
- **Description**: Character animation: Fall Flat
- **Category**: `TRANSITION`
- **Tags**: `transition`, `fall`, `flat`, `root`
- **Action Mappings**: `FALL`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`TRANSITION`)
- **Duration**: `2.53s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: *None*

### 6. box idle

- **ID**: `farming_pack_box_idle`
- **File**: `Farming Pack/box idle.fbx`
- **Pack**: `Farming Pack`
- **Name**: box idle
- **Description**: Farming action: Character performs box idle
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `box`, `idle`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `6.3s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_turn_2`, `farming_pack_box_turn`, `farming_pack_box_walk_arc`, `farming_pack_holding_idle`, `farming_pack_holding_turn_left`, `farming_pack_holding_turn_right`, `farming_pack_holding_walk`

### 7. box turn (2)

- **ID**: `farming_pack_box_turn_2`
- **File**: `Farming Pack/box turn (2).fbx`
- **Pack**: `Farming Pack`
- **Name**: box turn (2)
- **Description**: Farming action: Character performs box turn (2)
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `box`, `turn`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.17s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_idle`, `farming_pack_box_turn`, `farming_pack_box_walk_arc`, `farming_pack_holding_idle`, `farming_pack_holding_turn_left`, `farming_pack_holding_turn_right`, `farming_pack_holding_walk`

### 8. box turn

- **ID**: `farming_pack_box_turn`
- **File**: `Farming Pack/box turn.fbx`
- **Pack**: `Farming Pack`
- **Name**: box turn
- **Description**: Farming action: Character performs box turn
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `box`, `turn`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.53s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_idle`, `farming_pack_box_turn_2`, `farming_pack_box_walk_arc`, `farming_pack_holding_idle`, `farming_pack_holding_turn_left`, `farming_pack_holding_turn_right`, `farming_pack_holding_walk`

### 9. box walk arc

- **ID**: `farming_pack_box_walk_arc`
- **File**: `Farming Pack/box walk arc.fbx`
- **Pack**: `Farming Pack`
- **Name**: box walk arc
- **Description**: Farming action: Character performs box walk arc
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `box`, `walk`, `arc`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.23s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_idle`, `farming_pack_box_turn_2`, `farming_pack_box_turn`, `farming_pack_holding_idle`, `farming_pack_holding_turn_left`, `farming_pack_holding_turn_right`, `farming_pack_holding_walk`

### 10. cow milking

- **ID**: `farming_pack_cow_milking`
- **File**: `Farming Pack/cow milking.fbx`
- **Pack**: `Farming Pack`
- **Name**: cow milking
- **Description**: Farming action: Character performs cow milking
- **Category**: `FARMING`
- **Tags**: `farming`, `milk`, `cow`, `milking`, `farming_pack`
- **Action Mappings**: `MILK_COW`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `4.53s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: *None*

### 11. dig and plant seeds

- **ID**: `farming_pack_dig_and_plant_seeds`
- **File**: `Farming Pack/dig and plant seeds.fbx`
- **Pack**: `Farming Pack`
- **Name**: dig and plant seeds
- **Description**: Farming action: Character performs dig and plant seeds
- **Category**: `FARMING`
- **Tags**: `farming`, `plant`, `crop`, `dig`, `and`, `seeds`, `farming_pack`
- **Action Mappings**: `PLANT_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `2s`
- **FPS**: `30`
- **Root Motion**: `false` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: `farming_pack_plant_a_plant`, `farming_pack_plant_tree`

### 12. holding idle

- **ID**: `farming_pack_holding_idle`
- **File**: `Farming Pack/holding idle.fbx`
- **Pack**: `Farming Pack`
- **Name**: holding idle
- **Description**: Farming action: Character performs holding idle
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `holding`, `idle`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `6s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_idle`, `farming_pack_box_turn_2`, `farming_pack_box_turn`, `farming_pack_box_walk_arc`, `farming_pack_holding_turn_left`, `farming_pack_holding_turn_right`, `farming_pack_holding_walk`

### 13. holding turn left

- **ID**: `farming_pack_holding_turn_left`
- **File**: `Farming Pack/holding turn left.fbx`
- **Pack**: `Farming Pack`
- **Name**: holding turn left
- **Description**: Farming action: Character performs holding turn left
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `holding`, `turn`, `left`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.2s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_idle`, `farming_pack_box_turn_2`, `farming_pack_box_turn`, `farming_pack_box_walk_arc`, `farming_pack_holding_idle`, `farming_pack_holding_turn_right`, `farming_pack_holding_walk`

### 14. holding turn right

- **ID**: `farming_pack_holding_turn_right`
- **File**: `Farming Pack/holding turn right.fbx`
- **Pack**: `Farming Pack`
- **Name**: holding turn right
- **Description**: Farming action: Character performs holding turn right
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `holding`, `turn`, `right`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.3s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_idle`, `farming_pack_box_turn_2`, `farming_pack_box_turn`, `farming_pack_box_walk_arc`, `farming_pack_holding_idle`, `farming_pack_holding_turn_left`, `farming_pack_holding_walk`

### 15. holding walk

- **ID**: `farming_pack_holding_walk`
- **File**: `Farming Pack/holding walk.fbx`
- **Pack**: `Farming Pack`
- **Name**: holding walk
- **Description**: Farming action: Character performs holding walk
- **Category**: `FARMING`
- **Tags**: `farming`, `carry`, `holding`, `walk`, `farming_pack`
- **Action Mappings**: `CARRY`
- **Character States**: `FARMING`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.37s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_box_idle`, `farming_pack_box_turn_2`, `farming_pack_box_turn`, `farming_pack_box_walk_arc`, `farming_pack_holding_idle`, `farming_pack_holding_turn_left`, `farming_pack_holding_turn_right`

### 16. kneeling idle

- **ID**: `farming_pack_kneeling_idle`
- **File**: `Farming Pack/kneeling idle.fbx`
- **Pack**: `Farming Pack`
- **Name**: kneeling idle
- **Description**: Farming action: Character performs kneeling idle
- **Category**: `FARMING`
- **Tags**: `farming`, `kneel`, `kneeling`, `idle`, `farming_pack`
- **Action Mappings**: `KNEEL`
- **Character States**: `FARMING`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `4.27s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: *None*

### 17. pick fruit (2)

- **ID**: `farming_pack_pick_fruit_2`
- **File**: `Farming Pack/pick fruit (2).fbx`
- **Pack**: `Farming Pack`
- **Name**: pick fruit (2)
- **Description**: Farming action: Character performs pick fruit (2)
- **Category**: `FARMING`
- **Tags**: `farming`, `harvest`, `crop`, `pick`, `fruit`, `farming_pack`
- **Action Mappings**: `HARVEST_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `6.2s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_pick_fruit_3`, `farming_pack_pick_fruit`, `farming_pack_pull_plant_2`, `farming_pack_pull_plant`

### 18. pick fruit (3)

- **ID**: `farming_pack_pick_fruit_3`
- **File**: `Farming Pack/pick fruit (3).fbx`
- **Pack**: `Farming Pack`
- **Name**: pick fruit (3)
- **Description**: Farming action: Character performs pick fruit (3)
- **Category**: `FARMING`
- **Tags**: `farming`, `harvest`, `crop`, `pick`, `fruit`, `farming_pack`
- **Action Mappings**: `HARVEST_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `7.1s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_pick_fruit_2`, `farming_pack_pick_fruit`, `farming_pack_pull_plant_2`, `farming_pack_pull_plant`

### 19. pick fruit

- **ID**: `farming_pack_pick_fruit`
- **File**: `Farming Pack/pick fruit.fbx`
- **Pack**: `Farming Pack`
- **Name**: pick fruit
- **Description**: Farming action: Character performs pick fruit
- **Category**: `FARMING`
- **Tags**: `farming`, `harvest`, `crop`, `pick`, `fruit`, `farming_pack`
- **Action Mappings**: `HARVEST_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `8s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: `farming_pack_pick_fruit_2`, `farming_pack_pick_fruit_3`, `farming_pack_pull_plant_2`, `farming_pack_pull_plant`

### 20. plant a plant

- **ID**: `farming_pack_plant_a_plant`
- **File**: `Farming Pack/plant a plant.fbx`
- **Pack**: `Farming Pack`
- **Name**: plant a plant
- **Description**: Farming action: Character performs plant a plant
- **Category**: `FARMING`
- **Tags**: `farming`, `plant`, `crop`, `farming_pack`
- **Action Mappings**: `PLANT_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `7.57s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_dig_and_plant_seeds`, `farming_pack_plant_tree`

### 21. plant tree

- **ID**: `farming_pack_plant_tree`
- **File**: `Farming Pack/plant tree.fbx`
- **Pack**: `Farming Pack`
- **Name**: plant tree
- **Description**: Farming action: Character performs plant tree
- **Category**: `FARMING`
- **Tags**: `farming`, `plant`, `crop`, `tree`, `farming_pack`
- **Action Mappings**: `PLANT_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `9.27s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_dig_and_plant_seeds`, `farming_pack_plant_a_plant`

### 22. pull plant (2)

- **ID**: `farming_pack_pull_plant_2`
- **File**: `Farming Pack/pull plant (2).fbx`
- **Pack**: `Farming Pack`
- **Name**: pull plant (2)
- **Description**: Farming action: Character performs pull plant (2)
- **Category**: `FARMING`
- **Tags**: `farming`, `harvest`, `crop`, `pull`, `plant`, `farming_pack`
- **Action Mappings**: `HARVEST_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `4.73s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_pick_fruit_2`, `farming_pack_pick_fruit_3`, `farming_pack_pick_fruit`, `farming_pack_pull_plant`

### 23. pull plant

- **ID**: `farming_pack_pull_plant`
- **File**: `Farming Pack/pull plant.fbx`
- **Pack**: `Farming Pack`
- **Name**: pull plant
- **Description**: Farming action: Character performs pull plant
- **Category**: `FARMING`
- **Tags**: `farming`, `harvest`, `crop`, `pull`, `plant`, `farming_pack`
- **Action Mappings**: `HARVEST_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `4.67s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_pick_fruit_2`, `farming_pack_pick_fruit_3`, `farming_pack_pick_fruit`, `farming_pack_pull_plant_2`

### 24. watering

- **ID**: `farming_pack_watering`
- **File**: `Farming Pack/watering.fbx`
- **Pack**: `Farming Pack`
- **Name**: watering
- **Description**: Farming action: Character performs watering
- **Category**: `FARMING`
- **Tags**: `farming`, `water`, `crop`, `watering`, `farming_pack`
- **Action Mappings**: `WATER_CROP`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `5.6s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: `treading_water`

### 25. wheelbarrow dump

- **ID**: `farming_pack_wheelbarrow_dump`
- **File**: `Farming Pack/wheelbarrow dump.fbx`
- **Pack**: `Farming Pack`
- **Name**: wheelbarrow dump
- **Description**: Farming action: Character performs wheelbarrow dump
- **Category**: `FARMING`
- **Tags**: `farming`, `wheelbarrow`, `work`, `dump`, `farming_pack`
- **Action Mappings**: `WHEELBARROW_WORK`
- **Character States**: `FARMING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `6.23s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_wheelbarrow_idle`, `farming_pack_wheelbarrow_walk_2`, `farming_pack_wheelbarrow_walk_turn_2`, `farming_pack_wheelbarrow_walk_turn`, `farming_pack_wheelbarrow_walk`

### 26. wheelbarrow idle

- **ID**: `farming_pack_wheelbarrow_idle`
- **File**: `Farming Pack/wheelbarrow idle.fbx`
- **Pack**: `Farming Pack`
- **Name**: wheelbarrow idle
- **Description**: Farming action: Character performs wheelbarrow idle
- **Category**: `FARMING`
- **Tags**: `farming`, `wheelbarrow`, `work`, `idle`, `farming_pack`
- **Action Mappings**: `WHEELBARROW_WORK`
- **Character States**: `FARMING`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.5s`
- **FPS**: `30`
- **Root Motion**: `false` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_wheelbarrow_dump`, `farming_pack_wheelbarrow_walk_2`, `farming_pack_wheelbarrow_walk_turn_2`, `farming_pack_wheelbarrow_walk_turn`, `farming_pack_wheelbarrow_walk`

### 27. wheelbarrow walk (2)

- **ID**: `farming_pack_wheelbarrow_walk_2`
- **File**: `Farming Pack/wheelbarrow walk (2).fbx`
- **Pack**: `Farming Pack`
- **Name**: wheelbarrow walk (2)
- **Description**: Farming action: Character performs wheelbarrow walk (2)
- **Category**: `FARMING`
- **Tags**: `farming`, `wheelbarrow`, `work`, `walk`, `farming_pack`
- **Action Mappings**: `WHEELBARROW_WORK`
- **Character States**: `FARMING`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.97s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_wheelbarrow_dump`, `farming_pack_wheelbarrow_idle`, `farming_pack_wheelbarrow_walk_turn_2`, `farming_pack_wheelbarrow_walk_turn`, `farming_pack_wheelbarrow_walk`

### 28. wheelbarrow walk turn (2)

- **ID**: `farming_pack_wheelbarrow_walk_turn_2`
- **File**: `Farming Pack/wheelbarrow walk turn (2).fbx`
- **Pack**: `Farming Pack`
- **Name**: wheelbarrow walk turn (2)
- **Description**: Farming action: Character performs wheelbarrow walk turn (2)
- **Category**: `FARMING`
- **Tags**: `farming`, `wheelbarrow`, `work`, `walk`, `turn`, `farming_pack`
- **Action Mappings**: `WHEELBARROW_WORK`
- **Character States**: `FARMING`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.07s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_wheelbarrow_dump`, `farming_pack_wheelbarrow_idle`, `farming_pack_wheelbarrow_walk_2`, `farming_pack_wheelbarrow_walk_turn`, `farming_pack_wheelbarrow_walk`

### 29. wheelbarrow walk turn

- **ID**: `farming_pack_wheelbarrow_walk_turn`
- **File**: `Farming Pack/wheelbarrow walk turn.fbx`
- **Pack**: `Farming Pack`
- **Name**: wheelbarrow walk turn
- **Description**: Farming action: Character performs wheelbarrow walk turn
- **Category**: `FARMING`
- **Tags**: `farming`, `wheelbarrow`, `work`, `walk`, `turn`, `farming_pack`
- **Action Mappings**: `WHEELBARROW_WORK`
- **Character States**: `FARMING`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.07s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_wheelbarrow_dump`, `farming_pack_wheelbarrow_idle`, `farming_pack_wheelbarrow_walk_2`, `farming_pack_wheelbarrow_walk_turn_2`, `farming_pack_wheelbarrow_walk`

### 30. wheelbarrow walk

- **ID**: `farming_pack_wheelbarrow_walk`
- **File**: `Farming Pack/wheelbarrow walk.fbx`
- **Pack**: `Farming Pack`
- **Name**: wheelbarrow walk
- **Description**: Farming action: Character performs wheelbarrow walk
- **Category**: `FARMING`
- **Tags**: `farming`, `wheelbarrow`, `work`, `walk`, `farming_pack`
- **Action Mappings**: `WHEELBARROW_WORK`
- **Character States**: `FARMING`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.97s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `farming_pack_wheelbarrow_dump`, `farming_pack_wheelbarrow_idle`, `farming_pack_wheelbarrow_walk_2`, `farming_pack_wheelbarrow_walk_turn_2`, `farming_pack_wheelbarrow_walk_turn`

### 31. Laughing

- **ID**: `laughing`
- **File**: `Laughing.fbx`
- **Pack**: `Root`
- **Name**: Laughing
- **Description**: Character animation: Laughing
- **Category**: `SOCIAL`
- **Tags**: `social`, `express`, `laughing`, `root`
- **Action Mappings**: `EXPRESS`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `9.77s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `agreeing`, `clapping`, `pointing_back`, `pointing`, `shaking_head_no`, `thankful`

### 32. Laying Sleeping

- **ID**: `laying_sleeping`
- **File**: `Laying Sleeping.fbx`
- **Pack**: `Root`
- **Name**: Laying Sleeping
- **Description**: Character animation: Laying Sleeping
- **Category**: `SURVIVAL`
- **Tags**: `survival`, `sleep`, `laying`, `sleeping`, `root`
- **Action Mappings**: `SLEEP`
- **Character States**: `SLEEPING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.7s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `sleeping_idle`

### 33. injured backwards turn left

- **ID**: `male_injured_pack_injured_backwards_turn_left`
- **File**: `Male Injured Pack/injured backwards turn left.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured backwards turn left
- **Description**: Injured movement/state: Character performs injured backwards turn left
- **Category**: `INJURED`
- **Tags**: `injured`, `action`, `backwards`, `turn`, `left`, `male_injured_pack`
- **Action Mappings**: `INJURED_ACTION`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `0.73s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_backwards_turn_right`, `male_injured_pack_injured_standing_jump`, `male_injured_pack_injured_turn_left`, `male_injured_pack_injured_turn_right`, `male_injured_pack_injured_wave_idle`

### 34. injured backwards turn right

- **ID**: `male_injured_pack_injured_backwards_turn_right`
- **File**: `Male Injured Pack/injured backwards turn right.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured backwards turn right
- **Description**: Injured movement/state: Character performs injured backwards turn right
- **Category**: `INJURED`
- **Tags**: `injured`, `action`, `backwards`, `turn`, `right`, `male_injured_pack`
- **Action Mappings**: `INJURED_ACTION`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `0.7s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_backwards_turn_left`, `male_injured_pack_injured_standing_jump`, `male_injured_pack_injured_turn_left`, `male_injured_pack_injured_turn_right`, `male_injured_pack_injured_wave_idle`

### 35. injured hurting idle

- **ID**: `male_injured_pack_injured_hurting_idle`
- **File**: `Male Injured Pack/injured hurting idle.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured hurting idle
- **Description**: Injured movement/state: Character performs injured hurting idle
- **Category**: `INJURED`
- **Tags**: `injured`, `idle`, `hurting`, `male_injured_pack`
- **Action Mappings**: `INJURED_IDLE`
- **Character States**: `INJURED`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `6.03s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_idle`, `male_injured_pack_injured_stumble_idle`

### 36. injured idle

- **ID**: `male_injured_pack_injured_idle`
- **File**: `Male Injured Pack/injured idle.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured idle
- **Description**: Injured movement/state: Character performs injured idle
- **Category**: `INJURED`
- **Tags**: `injured`, `idle`, `male_injured_pack`
- **Action Mappings**: `INJURED_IDLE`
- **Character States**: `INJURED`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `9.33s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_hurting_idle`, `male_injured_pack_injured_stumble_idle`

### 37. injured run backwards left turn

- **ID**: `male_injured_pack_injured_run_backwards_left_turn`
- **File**: `Male Injured Pack/injured run backwards left turn.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured run backwards left turn
- **Description**: Injured movement/state: Character performs injured run backwards left turn
- **Category**: `INJURED`
- **Tags**: `injured`, `run`, `go`, `to`, `backwards`, `left`, `turn`, `male_injured_pack`
- **Action Mappings**: `INJURED_RUN`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.5s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`, `walking`

### 38. injured run backwards right turn

- **ID**: `male_injured_pack_injured_run_backwards_right_turn`
- **File**: `Male Injured Pack/injured run backwards right turn.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured run backwards right turn
- **Description**: Injured movement/state: Character performs injured run backwards right turn
- **Category**: `INJURED`
- **Tags**: `injured`, `run`, `go`, `to`, `backwards`, `right`, `turn`, `male_injured_pack`
- **Action Mappings**: `INJURED_RUN`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.53s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`, `walking`

### 39. injured run backwards

- **ID**: `male_injured_pack_injured_run_backwards`
- **File**: `Male Injured Pack/injured run backwards.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured run backwards
- **Description**: Injured movement/state: Character performs injured run backwards
- **Category**: `INJURED`
- **Tags**: `injured`, `run`, `go`, `to`, `backwards`, `male_injured_pack`
- **Action Mappings**: `INJURED_RUN`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.6s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`, `walking`

### 40. injured run jump

- **ID**: `male_injured_pack_injured_run_jump`
- **File**: `Male Injured Pack/injured run jump.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured run jump
- **Description**: Injured movement/state: Character performs injured run jump
- **Category**: `INJURED`
- **Tags**: `injured`, `run`, `go`, `to`, `jump`, `male_injured_pack`
- **Action Mappings**: `INJURED_RUN`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.73s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`, `walking`

### 41. injured run left turn

- **ID**: `male_injured_pack_injured_run_left_turn`
- **File**: `Male Injured Pack/injured run left turn.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured run left turn
- **Description**: Injured movement/state: Character performs injured run left turn
- **Category**: `INJURED`
- **Tags**: `injured`, `run`, `go`, `to`, `left`, `turn`, `male_injured_pack`
- **Action Mappings**: `INJURED_RUN`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.6s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`, `walking`

### 42. injured run right turn

- **ID**: `male_injured_pack_injured_run_right_turn`
- **File**: `Male Injured Pack/injured run right turn.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured run right turn
- **Description**: Injured movement/state: Character performs injured run right turn
- **Category**: `INJURED`
- **Tags**: `injured`, `run`, `go`, `to`, `right`, `turn`, `male_injured_pack`
- **Action Mappings**: `INJURED_RUN`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.63s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`, `walking`

### 43. injured run

- **ID**: `male_injured_pack_injured_run`
- **File**: `Male Injured Pack/injured run.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured run
- **Description**: Injured movement/state: Character performs injured run
- **Category**: `INJURED`
- **Tags**: `injured`, `run`, `go`, `to`, `male_injured_pack`
- **Action Mappings**: `INJURED_RUN`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.63s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`, `walking`

### 44. injured standing jump

- **ID**: `male_injured_pack_injured_standing_jump`
- **File**: `Male Injured Pack/injured standing jump.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured standing jump
- **Description**: Injured movement/state: Character performs injured standing jump
- **Category**: `INJURED`
- **Tags**: `injured`, `action`, `standing`, `jump`, `male_injured_pack`
- **Action Mappings**: `INJURED_ACTION`
- **Character States**: `INJURED`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.9s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_backwards_turn_left`, `male_injured_pack_injured_backwards_turn_right`, `male_injured_pack_injured_turn_left`, `male_injured_pack_injured_turn_right`, `male_injured_pack_injured_wave_idle`

### 45. injured stumble idle

- **ID**: `male_injured_pack_injured_stumble_idle`
- **File**: `Male Injured Pack/injured stumble idle.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured stumble idle
- **Description**: Injured movement/state: Character performs injured stumble idle
- **Category**: `INJURED`
- **Tags**: `injured`, `idle`, `stumble`, `male_injured_pack`
- **Action Mappings**: `INJURED_IDLE`
- **Character States**: `INJURED`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `5.07s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_hurting_idle`, `male_injured_pack_injured_idle`

### 46. injured turn left

- **ID**: `male_injured_pack_injured_turn_left`
- **File**: `Male Injured Pack/injured turn left.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured turn left
- **Description**: Injured movement/state: Character performs injured turn left
- **Category**: `INJURED`
- **Tags**: `injured`, `action`, `turn`, `left`, `male_injured_pack`
- **Action Mappings**: `INJURED_ACTION`
- **Character States**: `INJURED`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `0.9s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_backwards_turn_left`, `male_injured_pack_injured_backwards_turn_right`, `male_injured_pack_injured_standing_jump`, `male_injured_pack_injured_turn_right`, `male_injured_pack_injured_wave_idle`

### 47. injured turn right

- **ID**: `male_injured_pack_injured_turn_right`
- **File**: `Male Injured Pack/injured turn right.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured turn right
- **Description**: Injured movement/state: Character performs injured turn right
- **Category**: `INJURED`
- **Tags**: `injured`, `action`, `turn`, `right`, `male_injured_pack`
- **Action Mappings**: `INJURED_ACTION`
- **Character States**: `INJURED`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `0.7s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_backwards_turn_left`, `male_injured_pack_injured_backwards_turn_right`, `male_injured_pack_injured_standing_jump`, `male_injured_pack_injured_turn_left`, `male_injured_pack_injured_wave_idle`

### 48. injured walk backwards

- **ID**: `male_injured_pack_injured_walk_backwards`
- **File**: `Male Injured Pack/injured walk backwards.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured walk backwards
- **Description**: Injured movement/state: Character performs injured walk backwards
- **Category**: `INJURED`
- **Tags**: `injured`, `walk`, `go`, `to`, `backwards`, `male_injured_pack`
- **Action Mappings**: `INJURED_WALK`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.67s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `running_tired`, `running`, `walking`

### 49. injured walk left turn

- **ID**: `male_injured_pack_injured_walk_left_turn`
- **File**: `Male Injured Pack/injured walk left turn.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured walk left turn
- **Description**: Injured movement/state: Character performs injured walk left turn
- **Category**: `INJURED`
- **Tags**: `injured`, `walk`, `go`, `to`, `left`, `turn`, `male_injured_pack`
- **Action Mappings**: `INJURED_WALK`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `2s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `running_tired`, `running`, `walking`

### 50. injured walk right turn

- **ID**: `male_injured_pack_injured_walk_right_turn`
- **File**: `Male Injured Pack/injured walk right turn.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured walk right turn
- **Description**: Injured movement/state: Character performs injured walk right turn
- **Category**: `INJURED`
- **Tags**: `injured`, `walk`, `go`, `to`, `right`, `turn`, `male_injured_pack`
- **Action Mappings**: `INJURED_WALK`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.83s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk`, `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `running_tired`, `running`, `walking`

### 51. injured walk

- **ID**: `male_injured_pack_injured_walk`
- **File**: `Male Injured Pack/injured walk.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured walk
- **Description**: Injured movement/state: Character performs injured walk
- **Category**: `INJURED`
- **Tags**: `injured`, `walk`, `go`, `to`, `male_injured_pack`
- **Action Mappings**: `INJURED_WALK`, `GO_TO`
- **Character States**: `INJURED`, `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.63s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `running_tired`, `running`, `walking`

### 52. injured wave idle

- **ID**: `male_injured_pack_injured_wave_idle`
- **File**: `Male Injured Pack/injured wave idle.fbx`
- **Pack**: `Male Injured Pack`
- **Name**: injured wave idle
- **Description**: Injured movement/state: Character performs injured wave idle
- **Category**: `INJURED`
- **Tags**: `injured`, `action`, `wave`, `idle`, `male_injured_pack`
- **Action Mappings**: `INJURED_ACTION`
- **Character States**: `INJURED`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `5.07s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_backwards_turn_left`, `male_injured_pack_injured_backwards_turn_right`, `male_injured_pack_injured_standing_jump`, `male_injured_pack_injured_turn_left`, `male_injured_pack_injured_turn_right`

### 53. Male Sitting Pose

- **ID**: `male_sitting_pose`
- **File**: `Male Sitting Pose.fbx`
- **Pack**: `Root`
- **Name**: Male Sitting Pose
- **Description**: Character animation: Male Sitting Pose
- **Category**: `SURVIVAL`
- **Tags**: `survival`, `rest`, `sit`, `male`, `sitting`, `pose`, `root`
- **Action Mappings**: `REST`, `SIT`
- **Character States**: `SITTING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `0.03s`
- **FPS**: `30`
- **Root Motion**: `false` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: *None*

### 54. Pointing-back

- **ID**: `pointing_back`
- **File**: `Pointing-back.fbx`
- **Pack**: `Root`
- **Name**: Pointing-back
- **Description**: Character animation: Pointing-back
- **Category**: `SOCIAL`
- **Tags**: `social`, `express`, `pointing`, `back`, `root`
- **Action Mappings**: `EXPRESS`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `3.6s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `agreeing`, `clapping`, `laughing`, `pointing`, `shaking_head_no`, `thankful`

### 55. Pointing

- **ID**: `pointing`
- **File**: `Pointing.fbx`
- **Pack**: `Root`
- **Name**: Pointing
- **Description**: Character animation: Pointing
- **Category**: `SOCIAL`
- **Tags**: `social`, `express`, `pointing`, `root`
- **Action Mappings**: `EXPRESS`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `2.77s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `agreeing`, `clapping`, `laughing`, `pointing_back`, `shaking_head_no`, `thankful`

### 56. Quick Formal Bow

- **ID**: `quick_formal_bow`
- **File**: `Quick Formal Bow.fbx`
- **Pack**: `Root`
- **Name**: Quick Formal Bow
- **Description**: Character animation: Quick Formal Bow
- **Category**: `SOCIAL`
- **Tags**: `social`, `greeting`, `quick`, `formal`, `bow`, `root`
- **Action Mappings**: `GREETING`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `2.73s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `standing_greeting`, `waving`

### 57. Running Tired

- **ID**: `running_tired`
- **File**: `Running Tired.fbx`
- **Pack**: `Root`
- **Name**: Running Tired
- **Description**: Character animation: Running Tired
- **Category**: `LOCOMOTION`
- **Tags**: `locomotion`, `go`, `to`, `run`, `running`, `tired`, `root`
- **Action Mappings**: `GO_TO`, `RUN`
- **Character States**: `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `7s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running`, `walking`

### 58. Running

- **ID**: `running`
- **File**: `Running.fbx`
- **Pack**: `Root`
- **Name**: Running
- **Description**: Character animation: Running
- **Category**: `LOCOMOTION`
- **Tags**: `locomotion`, `go`, `to`, `run`, `running`, `root`
- **Action Mappings**: `GO_TO`, `RUN`
- **Character States**: `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `0.63s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `walking`

### 59. Shaking Hands 2

- **ID**: `shaking_hands_2`
- **File**: `Shaking Hands 2.fbx`
- **Pack**: `Root`
- **Name**: Shaking Hands 2
- **Description**: Character animation: Shaking Hands 2
- **Category**: `SOCIAL`
- **Tags**: `social`, `misc`, `action`, `shaking`, `hands`, `root`
- **Action Mappings**: `MISC_ACTION`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `4.37s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: *None*

### 60. Shaking Head No

- **ID**: `shaking_head_no`
- **File**: `Shaking Head No.fbx`
- **Pack**: `Root`
- **Name**: Shaking Head No
- **Description**: Character animation: Shaking Head No
- **Category**: `SOCIAL`
- **Tags**: `social`, `express`, `shaking`, `head`, `no`, `root`
- **Action Mappings**: `EXPRESS`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `1.8s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `agreeing`, `clapping`, `laughing`, `pointing_back`, `pointing`, `thankful`

### 61. Sitting Drinking

- **ID**: `sitting_drinking`
- **File**: `Sitting Drinking.fbx`
- **Pack**: `Root`
- **Name**: Sitting Drinking
- **Description**: Character animation: Sitting Drinking
- **Category**: `SURVIVAL`
- **Tags**: `survival`, `drink`, `sitting`, `drinking`, `root`
- **Action Mappings**: `DRINK`
- **Character States**: `SITTING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `15.2s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `drinking`

### 62. Sitting Talking

- **ID**: `sitting_talking`
- **File**: `Sitting Talking.fbx`
- **Pack**: `Root`
- **Name**: Sitting Talking
- **Description**: Character animation: Sitting Talking
- **Category**: `SOCIAL`
- **Tags**: `social`, `talk`, `sitting`, `talking`, `root`
- **Action Mappings**: `TALK`
- **Character States**: `SITTING`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `44.07s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `talking_1`, `talking_2`, `talking`

### 63. Sleeping Idle

- **ID**: `sleeping_idle`
- **File**: `Sleeping Idle.fbx`
- **Pack**: `Root`
- **Name**: Sleeping Idle
- **Description**: Character animation: Sleeping Idle
- **Category**: `SURVIVAL`
- **Tags**: `survival`, `sleep`, `sleeping`, `idle`, `root`
- **Action Mappings**: `SLEEP`
- **Character States**: `SLEEPING`, `IDLE`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `17.6s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `laying_sleeping`

### 64. Stand Up

- **ID**: `stand_up`
- **File**: `Stand Up.fbx`
- **Pack**: `Root`
- **Name**: Stand Up
- **Description**: Character animation: Stand Up
- **Category**: `TRANSITION`
- **Tags**: `transition`, `stand`, `up`, `root`
- **Action Mappings**: `STAND_UP`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`TRANSITION`)
- **Duration**: `8.27s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `stand_up_from_chair`, `standing_up_1`, `standing_up_from_fall`

### 65. Stand Up_from_chair

- **ID**: `stand_up_from_chair`
- **File**: `Stand Up_from_chair.fbx`
- **Pack**: `Root`
- **Name**: Stand Up_from_chair
- **Description**: Character animation: Stand Up_from_chair
- **Category**: `TRANSITION`
- **Tags**: `transition`, `stand`, `up`, `from`, `chair`, `root`
- **Action Mappings**: `STAND_UP`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`TRANSITION`)
- **Duration**: `4.83s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `stand_up`, `standing_up_1`, `standing_up_from_fall`

### 66. Standing Greeting

- **ID**: `standing_greeting`
- **File**: `Standing Greeting.fbx`
- **Pack**: `Root`
- **Name**: Standing Greeting
- **Description**: Character animation: Standing Greeting
- **Category**: `SOCIAL`
- **Tags**: `social`, `greeting`, `standing`, `root`
- **Action Mappings**: `GREETING`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `5.1s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `quick_formal_bow`, `waving`

### 67. Standing Up (1)

- **ID**: `standing_up_1`
- **File**: `Standing Up (1).fbx`
- **Pack**: `Root`
- **Name**: Standing Up (1)
- **Description**: Character animation: Standing Up (1)
- **Category**: `TRANSITION`
- **Tags**: `transition`, `stand`, `up`, `standing`, `root`
- **Action Mappings**: `STAND_UP`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`TRANSITION`)
- **Duration**: `11.4s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `stand_up`, `stand_up_from_chair`, `standing_up_from_fall`

### 68. Standing Up_from_fall

- **ID**: `standing_up_from_fall`
- **File**: `Standing Up_from_fall.fbx`
- **Pack**: `Root`
- **Name**: Standing Up_from_fall
- **Description**: Character animation: Standing Up_from_fall
- **Category**: `TRANSITION`
- **Tags**: `transition`, `stand`, `up`, `standing`, `from`, `fall`, `root`
- **Action Mappings**: `STAND_UP`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`TRANSITION`)
- **Duration**: `1.67s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `stand_up`, `stand_up_from_chair`, `standing_up_1`

### 69. Swimming

- **ID**: `swimming`
- **File**: `Swimming.fbx`
- **Pack**: `Root`
- **Name**: Swimming
- **Description**: Character animation: Swimming
- **Category**: `SWIMMING`
- **Tags**: `swimming`, `swim`, `root`
- **Action Mappings**: `SWIM`
- **Character States**: `SWIMMING`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `4.53s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: *None*

### 70. Talking-1

- **ID**: `talking_1`
- **File**: `Talking-1.fbx`
- **Pack**: `Root`
- **Name**: Talking-1
- **Description**: Character animation: Talking-1
- **Category**: `SOCIAL`
- **Tags**: `social`, `talk`, `talking`, `root`
- **Action Mappings**: `TALK`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `3.93s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `sitting_talking`, `talking_2`, `talking`

### 71. Talking-2

- **ID**: `talking_2`
- **File**: `Talking-2.fbx`
- **Pack**: `Root`
- **Name**: Talking-2
- **Description**: Character animation: Talking-2
- **Category**: `SOCIAL`
- **Tags**: `social`, `talk`, `talking`, `root`
- **Action Mappings**: `TALK`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `5.17s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `sitting_talking`, `talking_1`, `talking`

### 72. Talking

- **ID**: `talking`
- **File**: `Talking.fbx`
- **Pack**: `Root`
- **Name**: Talking
- **Description**: Character animation: Talking
- **Category**: `SOCIAL`
- **Tags**: `social`, `talk`, `talking`, `root`
- **Action Mappings**: `TALK`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `10.27s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `sitting_talking`, `talking_1`, `talking_2`

### 73. Thankful

- **ID**: `thankful`
- **File**: `Thankful.fbx`
- **Pack**: `Root`
- **Name**: Thankful
- **Description**: Character animation: Thankful
- **Category**: `SOCIAL`
- **Tags**: `social`, `express`, `thankful`, `root`
- **Action Mappings**: `EXPRESS`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `3s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `agreeing`, `clapping`, `laughing`, `pointing_back`, `pointing`, `shaking_head_no`

### 74. Throw Object

- **ID**: `throw_object`
- **File**: `Throw Object.fbx`
- **Pack**: `Root`
- **Name**: Throw Object
- **Description**: Character animation: Throw Object
- **Category**: `INTERACTION`
- **Tags**: `interaction`, `throw`, `object`, `root`
- **Action Mappings**: `THROW`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `4.87s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: *None*

### 75. Treading Water

- **ID**: `treading_water`
- **File**: `Treading Water.fbx`
- **Pack**: `Root`
- **Name**: Treading Water
- **Description**: Character animation: Treading Water
- **Category**: `SWIMMING`
- **Tags**: `swimming`, `water`, `crop`, `treading`, `root`
- **Action Mappings**: `WATER_CROP`
- **Character States**: `FARMING`, `SWIMMING`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `3s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: `farming_pack_watering`

### 76. Walking

- **ID**: `walking`
- **File**: `Walking.fbx`
- **Pack**: `Root`
- **Name**: Walking
- **Description**: Character animation: Walking
- **Category**: `LOCOMOTION`
- **Tags**: `locomotion`, `go`, `to`, `walk`, `walking`, `root`
- **Action Mappings**: `GO_TO`, `WALK`
- **Character States**: `LOCOMOTION`
- **Loop / Type**: `LOOP` (Continuous) (`LOOP`)
- **Duration**: `1.03s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_AND_USED`
- **Alternative / Variant Animations**: `male_injured_pack_injured_run_backwards_left_turn`, `male_injured_pack_injured_run_backwards_right_turn`, `male_injured_pack_injured_run_backwards`, `male_injured_pack_injured_run_jump`, `male_injured_pack_injured_run_left_turn`, `male_injured_pack_injured_run_right_turn`, `male_injured_pack_injured_run`, `male_injured_pack_injured_walk_backwards`, `male_injured_pack_injured_walk_left_turn`, `male_injured_pack_injured_walk_right_turn`, `male_injured_pack_injured_walk`, `running_tired`, `running`

### 77. Waving

- **ID**: `waving`
- **File**: `Waving.fbx`
- **Pack**: `Root`
- **Name**: Waving
- **Description**: Character animation: Waving
- **Category**: `GENERAL`
- **Tags**: `general`, `greeting`, `waving`, `root`
- **Action Mappings**: `GREETING`
- **Character States**: `ACTION`
- **Loop / Type**: `ONE_SHOT` (Single execution) (`ONE_SHOT`)
- **Duration**: `3.17s`
- **FPS**: `30`
- **Root Motion**: `true` (In-place movement optimized)
- **Skeleton**: Standard Humanoid Skeleton (Mixamo Compatible) (`65 bones parsed`)
- **Ben Compatibility**: `DIRECTLY_COMPATIBLE`
- **Julie Compatibility**: `REQUIRES_RETARGETING`
- **NPC Compatibility**: `DIRECTLY_COMPATIBLE`
- **Current Usage**: `AVAILABLE_NOT_CURRENTLY_USED`
- **Alternative / Variant Animations**: `quick_formal_bow`, `standing_greeting`
