import { julieAIBrain, benAIBrain } from '../src/systems/ai/CitizenAIBrain';
import { AgentSession } from '../src/systems/ai/AgentSession';
import { MemoryManager } from '../src/systems/ai/MemoryManager';

async function runTestSequence() {
  console.log('=== RUNNING CIVIGENIS DYNAMIC MEMORY + EVENT-DRIVEN LLM ARCHITECTURE TEST ===\n');

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      testsFailed++;
    }
  }

  // Setup Julie Agent Session
  const memoryManager = new MemoryManager('julie');
  const julieSession = new AgentSession('julie', memoryManager);

  // Initialize Julie's working memory state with initial intention
  memoryManager.updateWorkingMemory({
    goal: 'Manage the village bakery, prepare fresh food, and explore the surrounding area',
    reason: 'Julie has prepared fresh bread and wants to sell it.',
    intention: 'Sell the freshly baked bread',
    immediate_behavior: 'Take the bread to the village market',
    target: 'village_center',
    next: 'Sell the bread',
    speech: "I'll head to the market to sell the freshly baked bread.",
  }, 'julies_farm');

  console.log('INITIAL STATE:');
  const initialWM = memoryManager.getWorkingMemory();
  console.log(`Goal: "${initialWM.goal}"`);
  console.log(`Intention: "${initialWM.intention}"`);
  console.log(`Behavior: "${initialWM.immediate_behavior}"`);
  console.log(`Target: "${initialWM.target}"`);
  console.log(`Next: "${initialWM.next}"`);
  console.log('--------------------------------------------------\n');

  // EVENT 1: "Village market center is closed."
  console.log('>>> TRIGGERING EVENT 1: "Village market center is closed."');
  const dec1 = await julieSession.processEvent('Village market center is closed.', 'julies_farm');
  assert(dec1 !== null, 'EVENT 1 triggered valid decision');
  assert(
    dec1?.immediate_behavior !== undefined && dec1?.target !== undefined,
    'EVENT 1 decision contains open-ended immediate_behavior and target'
  );
  console.log(`[DECISION 1 OUTPUT] Behavior: "${dec1?.immediate_behavior}", Target: "${dec1?.target}", Speech: "${dec1?.speech}"\n`);

  // EVENT 2: "Ben is at Ben's Farm."
  console.log('>>> TRIGGERING EVENT 2: "Ben is at Ben\'s Farm."');
  const dec2 = await julieSession.processEvent("Ben is at Ben's Farm.", 'julies_farm');
  assert(dec2 !== null, 'EVENT 2 triggered valid decision');
  console.log(`[DECISION 2 OUTPUT] Behavior: "${dec2?.immediate_behavior}", Target: "${dec2?.target}", Speech: "${dec2?.speech}"\n`);

  // EVENT 3: "Heavy rain has started."
  console.log('>>> TRIGGERING EVENT 3: "Heavy rain has started."');
  const dec3 = await julieSession.processEvent('Heavy rain has started.', 'julies_farm');
  assert(dec3 !== null, 'EVENT 3 triggered valid decision (Rain Interruption handling)');
  assert(
    dec3?.immediate_behavior.toLowerCase().includes('rain') ||
    dec3?.immediate_behavior.toLowerCase().includes('bakery') ||
    dec3?.immediate_behavior.toLowerCase().includes('dry') ||
    dec3?.immediate_behavior.toLowerCase().includes('indoor') ||
    dec3?.immediate_behavior.toLowerCase().includes('protect'),
    'EVENT 3 decision adapts to rain interruption naturally'
  );
  console.log(`[DECISION 3 OUTPUT] Behavior: "${dec3?.immediate_behavior}", Target: "${dec3?.target}", Speech: "${dec3?.speech}"\n`);

  // EVENT 4: "Ben has arrived at Julie's bakery."
  console.log('>>> TRIGGERING EVENT 4: "Ben has arrived at Julie\'s bakery."');
  const dec4 = await julieSession.processEvent("Ben has arrived at Julie's bakery.", 'julies_farm');
  assert(dec4 !== null, 'EVENT 4 triggered valid decision');
  console.log(`[DECISION 4 OUTPUT] Behavior: "${dec4?.immediate_behavior}", Target: "${dec4?.target}", Speech: "${dec4?.speech}"\n`);

  // EVENT 5: "The rain has stopped."
  console.log('>>> TRIGGERING EVENT 5: "The rain has stopped."');
  const dec5 = await julieSession.processEvent('The rain has stopped.', 'julies_farm');
  assert(dec5 !== null, 'EVENT 5 triggered valid decision');
  console.log(`[DECISION 5 OUTPUT] Behavior: "${dec5?.immediate_behavior}", Target: "${dec5?.target}", Speech: "${dec5?.speech}"\n`);

  // EVENT 6: "The village market has reopened."
  console.log('>>> TRIGGERING EVENT 6: "The village market has reopened."');
  const dec6 = await julieSession.processEvent('The village market has reopened.', 'julies_farm');
  assert(dec6 !== null, 'EVENT 6 triggered valid decision');
  console.log(`[DECISION 6 OUTPUT] Behavior: "${dec6?.immediate_behavior}", Target: "${dec6?.target}", Speech: "${dec6?.speech}"\n`);

  // Final Memory Integrity Check
  const finalWM = memoryManager.getWorkingMemory();
  const recentMemories = memoryManager.getRecentEpisodicMemories(10);
  assert(recentMemories.length >= 6, 'Episodic memory logged entries for all 6 events');
  console.log('FINAL WORKING MEMORY STATE:');
  console.log(`Goal: "${finalWM.goal}"`);
  console.log(`Intention: "${finalWM.intention}"`);
  console.log(`Immediate Behavior: "${finalWM.immediate_behavior}"`);
  console.log(`Target: "${finalWM.target}"`);
  console.log(`Next: "${finalWM.next}"`);
  console.log('--------------------------------------------------');

  console.log(`\n=== TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED ===`);
  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSequence().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
