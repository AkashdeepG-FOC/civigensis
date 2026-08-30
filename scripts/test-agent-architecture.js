import { IntentParser } from '../src/systems/ai/IntentParser.ts';
import { PlanEventMonitor } from '../src/systems/ai/PlanEventMonitor.ts';
import { PlanManager } from '../src/systems/ai/PlanManager.ts';
import { farmingWorldState } from '../src/systems/ai/FarmingWorldState.ts';
import { worldSimulationEngine } from '../src/systems/simulation/WorldSimulationEngine.ts';

console.log('=== RUNNING CIVIGENIS AUTONOMOUS AGENT ARCHITECTURE TESTS ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    testsFailed++;
  }
}

// TEST 1: Thin Intent Parser (No keyword-override heuristics)
console.log('--- TEST 1: Thin Intent Parser ---');
const rawResponse1 = JSON.stringify({
  intention: "My crops look dry, I should water them",
  capability: { action: "WATER_CROP", target: "wheat" }
});
const parsed1 = IntentParser.parse(rawResponse1);
assert(parsed1 !== null, 'Parses JSON response containing intention & capability');
assert(parsed1.intentionText === "My crops look dry, I should water them", 'Extracts natural intention string directly');
assert(parsed1.action === 'WATER_CROP' && parsed1.target === 'wheat', 'Unpacks action and target capability cleanly without keyword guessing');

const rawResponse2 = JSON.stringify({
  intention: "I want to inspect the village square",
  capability: { action: "INSPECT", target: "village_center" }
});
const parsed2 = IntentParser.parse(rawResponse2);
assert(parsed2.intentionText === "I want to inspect the village square", 'Preserves natural intention string');
assert(parsed2.action === 'INSPECT' && parsed2.target === 'village_center', 'Unpacks capability without transforming intent');

// TEST 2: Authoritative Reality Validation (Rejection of impossible actions)
console.log('\n--- TEST 2: Authoritative Reality Validation ---');
const planManager = new PlanManager();

// Setup plan for EAT when foodStock is 0
const benNeeds = farmingWorldState.getNeeds('ben');
benNeeds.hunger = 70;
benNeeds.foodStock = 0;
planManager.setPlan('Satisfy hunger with stored food', [{ step: 1, action: 'EAT', target: 'bens_house' }]);
let checkResult = PlanEventMonitor.validatePlan(planManager, 'ben');
assert(planManager.getCurrentPlan().plan.some(s => s.action === 'EAT' && s.status === 'INVALIDATED'), 'Validator invalidates EAT when foodStock is 0');

// TEST 3: Rain Event Invalidation (RAIN_STARTED invalidating WATER_CROP mid-travel)
console.log('\n--- TEST 3: Rain Event Invalidation ---');
planManager.reset();
planManager.setPlan('Water dry crops', [
  { step: 1, action: 'GO_TO', target: 'bens_farm' },
  { step: 2, action: 'WATER_CROP', target: 'wheat' }
]);

// Simulate RAIN_STARTED event
worldSimulationEngine.getState().weather.rainRate = 0.8; // Rain active
checkResult = PlanEventMonitor.validatePlan(planManager, 'ben');

assert(checkResult.isValid === false, 'Rain event invalidates manual watering intention');
assert(planManager.getCurrentPlan().plan.some(s => s.action === 'WATER_CROP' && s.status === 'INVALIDATED'), 'WATER_CROP step status transitions to INVALIDATED');

// Reset weather rain rate for subsequent tests
worldSimulationEngine.getState().weather.rainRate = 0.0;

// TEST 4: Intention vs Action Sub-step Separation (No looping)
console.log('\n--- TEST 4: Intention vs Action Sub-Step Separation ---');
planManager.reset();
planManager.setPlan('Irrigate wheat field', [
  { step: 1, action: 'GO_TO', target: 'bens_farm' },
  { step: 2, action: 'WATER_CROP', target: 'wheat' }
]);

// Step 1: GO_TO destination arrival
let step1 = planManager.getCurrentStep();
assert(step1.action === 'GO_TO' && step1.status === 'EXECUTING', 'Step 1 GO_TO sub-step is EXECUTING');

planManager.markCurrentStepCompleted(); // Ben arrives at farm -> GO_TO completed
let step2 = planManager.getCurrentStep();
assert(step2 !== null && step2.action === 'WATER_CROP', 'After GO_TO completed, step 2 WATER_CROP becomes active at destination (No immediate plan completion or auto-looping)');

// TEST 5: Minimal Safety-Oriented Fallback
console.log('\n--- TEST 5: Minimal Safety-Oriented Fallback ---');
import { benAIBrain } from '../src/systems/ai/CitizenAIBrain.ts';
const fallbackDecision = benAIBrain.agent.cognitionEngine.agentSession['generateAdaptiveFallbackDecision']('LLM offline', benAIBrain.agent.cognitionEngine.memoryManager.getWorkingMemory(), 'bens_farm');
assert(fallbackDecision !== null && fallbackDecision.immediate_behavior !== undefined, 'Minimal fallback generates open-ended adaptive fallback decision');


console.log(`\n=== TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED ===`);
if (testsFailed > 0) {
  process.exit(1);
}
