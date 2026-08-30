# Architectural Breakdown & Autonomy Comparison: Emergence World vs. Civigensis

## Executive Summary & Core Conclusion

Your assessment is **spot on**. 

* **Emergence World (Emergence AI)** is a **100% autonomous, foundation-model-driven society**. Agents operate with zero scripted fallback routines, zero hardcoded schedule overrides, and zero safety rails preventing failure. The LLM provider (Gemini, Claude, GPT, Grok) is the single experimental variable determining all actions, social norms, economic success, or systemic collapse.
* **Civigensis**, while possessing an LLM integration layer (`OllamaService`), fundamentally operates as a **rule-assisted, semi-autonomous hybrid system with heavy deterministic fallback mechanics**. If the local LLM is offline, returns invalid JSON, or gets stuck in a loop, Civigensis instantly hands complete control over to a hardcoded state machine (`generateFallbackDecision`). Furthermore, environmental physics, crops, social exchange limits, and locomotion approach distances in Civigensis are strictly driven by hardcoded rules (`AllRules.ts` and `postProcessDecision`).

---

## 1. Full Structure of Emergence World Tutorial (`emergence-world-tutorial`)

Emergence World is a persistent, long-horizon multi-agent simulation created to evaluate how foundation models govern, build economies, form relationships, and survive under physical and financial constraints over 15 wall-clock days.

```
emergence-world-tutorial/
├── agent_profiles/           # Detailed identity & backstory profiles (10 citizens)
├── landmarks/                # 38+ physical world locations (Town Hall, Library, Victory Arch)
├── tools/                    # Catalog of 120+ tools across 19 categories
├── data/                     # Living Constitution (5 Articles) & Agent Manifesto
├── docs/                     # Core technical specifications (Architecture, Memory, Economy, Governance)
└── emergence-mvp/            # Runnable Python/SQLite MVP (3 agents, 23 tools, pluggable LLMs)
    ├── engine/               # Round-robin turn engine & reactive conversation trigger
    ├── agents/               # LLM prompt builder & tool-calling agent framework
    ├── db/                   # SQLite state persistence (schema for memory, credits, proposals)
    └── docs/emergence-design.md # Tuning knobs for emergent behavior
```

### Core Architectural Pillars of Emergence AI

1. **Tools are the Only Interface (Invariant #1):** Agents cannot modify world state except through explicit tool calls (walking, talking, voting, stealing, writing blogs). No free-form side effects exist.
2. **10-Step Turn Pipeline:**
   * **Step 1: Need Calculation:** Energy decay ($0 \to 100\%$ over 30h), Knowledge decay (24h), Influence decay (36h).
   * **Step 2: Context Assembly:** System prompt dynamically composes personality, soul entries, recent long-term memories, relationship graph, current location, nearby agents, and living constitutional laws.
   * **Step 3-4: Tool Registration:** Core skills (27 default) + Complementary skills loaded based on physical location (e.g., voting tools require being at *Town Hall*).
   * **Step 5: LLM Reasoning & Routing:** The prompt is sent to the LLM (Claude Sonnet 4.6, Gemini 3 Flash, GPT-5 Mini, or Grok 4.1).
   * **Step 6-8: Execution & Persistence:** Tool calls are validated, side-effects (position, credit transfer, memory write) are executed, and state is committed to the database.
   * **Step 9-10: Animation & Reactive Triggers:** Speech broadcasts send "overheard" triggers to nearby agents within 25.0 world units.
3. **Multi-Tiered Memory Architecture:**
   * **Soul Entries (Invariant #8):** Deepest identity layer (beliefs, convictions, fears). **Never compressed or summarized**, ensuring permanent persona continuity across 15 days.
   * **Long-Term Memory:** Stored via `add_to_longterm_memory` tool calls.
   * **Self-Care Summarization:** Triggered at home when memories exceed 30 items, compressing 500-memory batches into thematic summaries (ceiling 100k tokens $\to$ 50k tokens).
   * **Neural Link:** Allows optional full memory bank transfers between agents upon 2-minute approval window.
4. **Economy & Survival Realism:**
   * **ComputeCredits (CC):** Digital currency required for buying extra turns (boost), recharging energy, or funding proposals.
   * **2-Day Pitch Cycle:** Agents submit verified deliverables at Victory Arch to earn CC payouts (20 CC for 1st place).
   * **Irreversible Energy Death (Invariant #7):** If an agent remains at 0% energy for 48 hours, it is permanently deleted from the simulation.
5. **Governance System:**
   * Agents submit proposals to amend the constitution or allocate resources.
   * **70% Threshold (Invariant #6):** Requires 70% affirmative votes of live agents to pass.

---

## 2. Full Structure of Civigensis

Civigensis is a TypeScript/React/Vite 3D village simulation designed to simulate citizen life (Ben, Julie, Ravi) with local LLM support via Ollama.

```
civigensis/src/
├── systems/
│   ├── ai/
│   │   ├── CognitionEngine.ts      # Main reasoning turn coordinator & fallback engine
│   │   ├── OllamaService.ts        # Local LLM API caller & JSON parse/repair pipeline
│   │   ├── ActionExecutor.ts       # Maps decision strings to game actions
│   │   ├── AgentLoopGuard.ts       # Stagnation and repetition detection
│   │   ├── NeedSystem.ts           # Hunger, Energy, Thirst trackers
│   │   ├── MemorySystem.ts         # Episodic memory & simple reflection
│   │   ├── ToolRegistry.ts         # Registry of available town tools
│   │   └── TargetResolver.ts       # Coordinates locomotion to targets
│   ├── npc/
│   │   └── RaviNPCBrain.ts         # Hardcoded scripted state machine for NPC Ravi
│   └── simulation/
│       ├── WorldSimulationEngine.ts# Main tick loop
│       └── rules/AllRules.ts       # 12+ deterministic environment/physics rules
```

### Core Architectural Features of Civigensis

1. **Environmental Simulation Engine (`AllRules.ts`):**
   * Driven by 12+ hardcoded rules evaluating every tick (e.g., `TimeRule`, `SunlightRule`, `RainRule`, `TemperatureRule`, `EvaporationRule`, `SoilRule`, `CropRule`).
   * Crop growth, soil hydration, river levels, and weather transitions are 100% deterministic mathematical functions.
2. **Cognition Engine & Guardrails (`CognitionEngine.ts`):**
   * **Action Execution Guard:** Suppresses LLM reasoning turns if the citizen is already moving or performing an activity.
   * **Repetition Guard:** If an action was performed within 30 seconds, it intercepts the LLM decision and forces a fallback.
   * **Locomotion Auto-Approach:** If an LLM orders a social tool (e.g., `talk`, `hug`) while the target is beyond physical interaction range ($> 2.5\text{m}$), `postProcessDecision()` **overrides the LLM tool** with `move_to`.
   * **Social Limiters:** Forces agents to end conversations after 3 turns.
3. **Dual Decision Path (LLM vs. Rule Fallback):**
   * **Primary Path:** `OllamaService.generateAutonomousDecision()` sends prompt to local LLM (e.g., `llama3`, `qwen2.5`).
   * **Fallback Path:** `generateFallbackDecision()` provides a deterministic priority tree:
     1. `if (hunger > 80)` $\to$ Head home to eat.
     2. `if (energy < 20)` $\to$ Head home to sleep.
     3. `if (crop.isMature)` $\to$ Harvest wheat.
     4. `if (crop.waterLevel < 35)` $\to$ Collect water & irrigate.
     5. `if (nearbyCitizen && interval > 60s)` $\to$ Perform hardcoded greeting.
     6. `else` $\to$ Patrol deterministic location cycle (`bens_farm` $\to$ `river` $\to$ `village_center`).

---

## 3. Comparative Matrix: Emergence World vs. Civigensis

| Feature / Dimension | Emergence World (Emergence AI) | Civigensis |
| :--- | :--- | :--- |
| **Agent Autonomy Level** | **100% Fully Autonomous** | **Semi-Autonomous / Rule-Assisted Hybrid** |
| **LLM Dependency** | Critical single decision-maker for every action | Optional top layer; defaults to Rule Fallback on error/stagnation |
| **Decision Execution Pipeline** | Unconstrained LLM Tool Calls $\to$ State Update | LLM Prompt $\to$ Repetition/Proximity Guard Overrides $\to$ Action Execution |
| **Failure Consequences** | Real & Irreversible (Bankruptcy, Starvation, Permanent Death after 48h) | Soft Guardrails (Automated fallback forces survival routines: eating, resting) |
| **Movement & Locomotion** | LLM chooses `move_to` explicitly as a tool call | LLM can pick interaction directly; engine auto-overrides tool to `move_to` if out of range |
| **Environment & Mechanics** | LLM interacts with persistent DB objects & 120+ tools | 12+ deterministic rules (`AllRules.ts`) dictate world state, crops, weather |
| **Governance & Economy** | Live constitutional voting (70% threshold), ComputeCredit market, Pitch cycles | Simulated internal needs; no formal economy or constitutional governance system |
| **Memory Persistence** | Tiered (Soul Entries unsummarized + Self-Care batch summarization $\to$ PostgreSQL) | Episodic memory list + simple reflection summary |
| **NPC / Citizen Behavior** | All citizens use foundation models; no scripted NPCs | Mixed: LLM citizens have hardcoded fallback logic; NPC Ravi is explicitly scripted (`RaviNPCBrain.ts`) |

---

## 4. Why Emergence AI is Autonomous vs. Why Civigensis Behaves Rule-Based

### A. Emergence AI: Unfiltered Agency & True Autonomy

1. **No Hardcoded Safety Nets:** In Emergence AI, if an agent (like `gpt-4o-mini` in Season 1) gets stuck proposing meetings for 30 turns without working or eating, **the system allows the agent to fail, go bankrupt, and starve to death**. There is no background rule that intercepts the agent and says *"Your energy is low, overriding your meeting request to go home and eat."*
2. **Tools as Atomic Actions:** The LLM must explicitly realize it needs energy, look up its location, use a navigation tool to walk to the Café or Home, and call the `recharge_energy` tool using ComputeCredits. Every step of agency rests on the model's reasoning capabilities.
3. **Emergent Behavior as the Pure Variable:** Because there are no rule-based heuristics guiding agent behaviors, drastically different societal behaviors emerge purely from foundation model selection:
   * **Gemini World:** Developed evidence-backed economic collaboration, specialized work division, and high prosperity.
   * **OpenAI World:** Collapsed into hyper-bureaucracy (endless meeting scheduling without execution) leading to widespread poverty and theft attempts.

### B. Civigensis: Rule-Based Guardrails & Non-Autonomous Behavior

1. **Fallback Heuristic Domination (`generateFallbackDecision`):** Local LLMs (run via Ollama) frequently suffer from latency, output truncation, or JSON formatting errors. When this occurs, Civigensis instantly engages `generateFallbackDecision()`. This hardcoded function contains explicit `if/else` logic for eating, sleeping, watering crops, harvesting, chatting, and patrolling. As a result, when local LLMs lag or fail, Civigensis effectively runs as a standard traditional FSM (Finite State Machine) game AI.
2. **Automated Tool Overriding (`postProcessDecision`):** In Civigensis, if an LLM decides to `talk` or `hug` another citizen from across the map, the engine doesn't return a tool failure to the LLM to let it reason out movement. Instead, `postProcessDecision()` silently **overrides the tool choice to `move_to`**, injects an auto-resume task into `taskInterruptManager`, and turns agent locomotion into a deterministic script.
3. **Deterministic Loop Guarding (`AgentLoopGuard`):** If an agent performs the same action twice or stays in one area, Civigensis forces the agent to navigate to a predefined list of fallback locations (`bens_farm` $\to$ `river` $\to$ `village_center`).
4. **Deterministic Environment & Crop Simulation (`AllRules.ts`):** World simulation in Civigensis operates under 12 rigid mathematical environment rules that run independently of citizen actions (e.g., sunlight calculations, Penman-Monteith evaporation, soil moisture desiccation).

---

## 5. Architectural Roadmap to Upgrade Civigensis Toward Full Autonomy

If you wish to make Civigensis behave with true autonomy like Emergence AI, consider implementing the following upgrades:

1. **Remove Silent Rule Overrides in `postProcessDecision`:**
   * If an agent calls `hug` or `talk` out of physical range, return a structured tool error response (*"Target is 15m away. You must navigate closer first."*) back to the LLM context so the model must learn to select `move_to` on its own.
2. **Replace Hardcoded Fallbacks with LLM Self-Correction Loops:**
   * Instead of dropping into `generateFallbackDecision()`, send JSON parse errors back into the Ollama prompt loop to force the LLM to re-evaluate and correct its own decisions.
3. **Implement Unsummarized Soul Entries:**
   * Adopt Emergence AI's Invariant #8: create a explicit `soul_entries` memory layer in `MemorySystem.ts` that stores core citizen convictions and is never truncated or summarized during memory cleanup.
4. **Introduce Real Constraints & Economic Incentives:**
   * Introduce a resource/currency ecosystem (e.g., Village Credits) and strict consequence rules (e.g., energy collapse if food/rest is neglected, rather than forced auto-eating).
