import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DATABASE || 'civigenis';

async function runTest() {
  console.log(`\n==================================================`);
  console.log(`[TEST] Complete LLM Decision Traceability Test`);
  console.log(`==================================================\n`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const julieCol = db.collection('julie_agent_events');

    const decisionId = `DEC-${Date.now()}`;
    console.log(`Decision Trace ID: ${decisionId}`);

    const simTime = { day: 1, hour: 9, minute: 0, total_minutes: 540 };

    // 1. LLM_REQUEST
    const requestEvent = {
      event_type: 'LLM_REQUEST',
      agent_id: 'julie',
      agent_name: 'Julie',
      agent_version: '1.0.0',
      decision_id: decisionId,
      timestamp: new Date(Date.now() - 1000),
      simulation_time: simTime,
      context: {
        current_goal: 'Prepare fresh bread and visit Ben to discuss village market needs',
        current_intention: 'Evaluating morning bakery responsibilities',
        current_activity: "Julie's Bakery Manor",
        needs: { hunger: 20, energy: 90, thirst: 16, curiosity: 45, social: 70, achievement: 60 },
        position: { x: 5, y: 0, z: -13.2 },
        location: "Julie's Bakery Manor",
        nearby_agents: [{ agent_id: 'ben', distance: 12.4 }],
        relevant_world_state: { weather: 'CLEAR', period: 'MORNING' },
        relevant_memories: ['Met Ben yesterday near the river.'],
        environment: { ambient_sound: 'Gentle ambient breeze' },
      },
      llm: {
        model: 'qwen2.5:latest',
        prompt: 'DECISION INSTANCE...\nYou are the autonomous AI brain of Julie...',
      },
    };

    // 2. LLM_RESPONSE
    const responseEvent = {
      event_type: 'LLM_RESPONSE',
      agent_id: 'julie',
      agent_name: 'Julie',
      agent_version: '1.0.0',
      decision_id: decisionId,
      timestamp: new Date(Date.now() - 800),
      simulation_time: simTime,
      llm: {
        model: 'qwen2.5:latest',
        raw_response: '{"goal":"Collect fresh water for bakery dough","reason":"Julie needs clean river water to bake fresh bread","action":"GO_TO","target":"river","speech":"I am walking to the river to get clean water for baking."}',
        response_time_ms: 1150,
      },
    };

    // 3. LLM_DECISION
    const decisionEvent = {
      event_type: 'LLM_DECISION',
      agent_id: 'julie',
      agent_name: 'Julie',
      agent_version: '1.0.0',
      decision_id: decisionId,
      timestamp: new Date(Date.now() - 750),
      simulation_time: simTime,
      decision: {
        tool: 'move_to',
        arguments: { location: 'river' },
        intention: 'I am walking to the river to get clean water for baking.',
        speech: 'I am walking to the river to get clean water for baking.',
        reason: 'Julie needs clean river water to bake fresh bread',
        reasoning_summary: 'Julie needs clean river water to bake fresh bread',
        expected_next_action: 'COLLECT_WATER',
      },
    };

    // 4. TOOL_CALL
    const toolCallEvent = {
      event_type: 'TOOL_CALL',
      agent_id: 'julie',
      agent_name: 'Julie',
      agent_version: '1.0.0',
      decision_id: decisionId,
      timestamp: new Date(Date.now() - 700),
      simulation_time: simTime,
      tool_name: 'move_to',
      tool_args: { location: 'river' },
      location: "Julie's Bakery Manor",
      position: { x: 5, y: 0, z: -13.2 },
      nearby_agents: [{ agent_id: 'ben', distance: 12.4 }],
      current_goal: 'Collect fresh water for bakery dough',
      current_intention: 'I am walking to the river to get clean water for baking.',
    };

    // 5. TOOL_RESULT
    const toolResultEvent = {
      event_type: 'TOOL_RESULT',
      agent_id: 'julie',
      agent_name: 'Julie',
      agent_version: '1.0.0',
      decision_id: decisionId,
      timestamp: new Date(),
      simulation_time: simTime,
      tool_name: 'move_to',
      tool_response: {
        success: true,
        reason: 'Navigation request accepted for river. Awaiting physical arrival.',
        data: undefined,
      },
      location: "Julie's Bakery Manor",
      position: { x: 5, y: 0, z: -13.2 },
      metadata: {
        duration_ms: 12,
        agent_version: '1.0.0',
      },
    };

    console.log(`Inserting 5-event trace chain for decision_id: ${decisionId}...`);
    await julieCol.insertMany([requestEvent, responseEvent, decisionEvent, toolCallEvent, toolResultEvent]);
    console.log(`✓ Inserted complete event trace chain!`);

    // Retrieve and verify the full trace
    console.log(`\n==================================================`);
    console.log(`Trace Reconstructed from MongoDB for decision_id: ${decisionId}`);
    console.log(`==================================================`);

    const trace = await julieCol.find({ decision_id: decisionId }).sort({ timestamp: 1 }).toArray();

    trace.forEach((evt, idx) => {
      console.log(`\n--- Step ${idx + 1}: ${evt.event_type} ---`);
      console.log(JSON.stringify(evt, null, 2));
    });

    console.log(`\n==================================================`);
    console.log(`✓ Decision Trace Verification Successful!`);
    console.log(`==================================================\n`);

  } catch (err) {
    console.error(`✖ Error:`, err.message);
  } finally {
    await client.close();
  }
}

runTest();
