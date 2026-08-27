import fs from 'fs';
import path from 'path';

// Setup minimal browser globals for Three.js FBXLoader in Node
global.window = global.window || {};
global.document = global.document || {
  createElementNS: () => ({}),
  createElement: () => ({}),
};
global.ProgressEvent = class ProgressEvent {};
global.FileReader = class FileReader {};

const ANIM_DIR = path.resolve('public/assets/animations');
const OUTPUT_JSON_PATH = path.resolve('public/data/animation-memory.json');
const OUTPUT_TS_PATH = path.resolve('src/systems/animation/animationMemoryData.ts');

const CURRENTLY_USED_FILES = new Set([
  'Breathing Idle.fbx',
  'Walking.fbx',
  'Running.fbx',
  'Swimming.fbx',
  'Treading Water.fbx',
  'Farming Pack/watering.fbx',
  'Farming Pack/dig and plant seeds.fbx',
  'Farming Pack/pick fruit.fbx',
]);

function scanDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDir(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.fbx', '.glb', '.gltf'].includes(ext)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

function sanitizeId(relPath) {
  return relPath
    .replace(/\\/g, '/')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function deriveCategory(pack, name) {
  const lname = name.toLowerCase();
  if (pack === 'Farming Pack' || lname.includes('plant') || lname.includes('fruit') || lname.includes('watering') || lname.includes('wheelbarrow') || lname.includes('milking') || lname.includes('dig')) {
    return 'FARMING';
  }
  if (pack === 'Male Injured Pack' || lname.includes('injured') || lname.includes('limping') || lname.includes('pain') || lname.includes('hurting') || lname.includes('stumble')) {
    return 'INJURED';
  }
  if (lname.includes('swim') || lname.includes('tread')) {
    return 'SWIMMING';
  }
  if (lname.includes('walk') || lname.includes('run') || lname.includes('turn') || lname.includes('backwards') || lname.includes('jump')) {
    return 'LOCOMOTION';
  }
  if (lname.includes('talk') || lname.includes('greet') || lname.includes('bow') || lname.includes('wave') || lname.includes('laugh') || lname.includes('agree') || lname.includes('head no') || lname.includes('thankful') || lname.includes('pointing') || lname.includes('clapping') || lname.includes('hands')) {
    return 'SOCIAL';
  }
  if (lname.includes('sleep') || lname.includes('drink') || lname.includes('eat') || lname.includes('sitting') || lname.includes('pose')) {
    return 'SURVIVAL';
  }
  if (lname.includes('box') || lname.includes('holding') || lname.includes('throw')) {
    return 'INTERACTION';
  }
  if (lname.includes('fall') || lname.includes('stand up') || lname.includes('standing up')) {
    return 'TRANSITION';
  }
  return 'GENERAL';
}

function deriveActions(pack, name) {
  const lname = name.toLowerCase();
  const actions = [];

  if (lname.includes('pick fruit') || lname.includes('pull plant')) actions.push('HARVEST_CROP');
  else if (lname.includes('water')) actions.push('WATER_CROP');
  else if (lname.includes('plant') || lname.includes('dig')) actions.push('PLANT_CROP');
  else if (lname.includes('milking')) actions.push('MILK_COW');
  else if (lname.includes('wheelbarrow')) actions.push('WHEELBARROW_WORK');
  else if (lname.includes('box') || lname.includes('holding')) actions.push('CARRY');
  else if (lname.includes('kneeling')) actions.push('KNEEL');
  else if (lname.includes('injured walk')) actions.push('INJURED_WALK', 'GO_TO');
  else if (lname.includes('injured run')) actions.push('INJURED_RUN', 'GO_TO');
  else if (lname.includes('injured idle') || lname.includes('injured hurting') || lname.includes('injured stumble')) actions.push('INJURED_IDLE');
  else if (lname.includes('injured')) actions.push('INJURED_ACTION');
  else if (lname.includes('breathing idle') || lname === 'idle') actions.push('IDLE');
  else if (lname.includes('walking') || (lname.includes('walk') && !lname.includes('injured'))) actions.push('GO_TO', 'WALK');
  else if (lname.includes('running') || lname.includes('run')) actions.push('GO_TO', 'RUN');
  else if (lname.includes('swimming')) actions.push('SWIM');
  else if (lname.includes('treading water')) actions.push('TREAD_WATER');
  else if (lname.includes('talk')) actions.push('TALK');
  else if (lname.includes('greet') || lname.includes('waving') || lname.includes('bow')) actions.push('GREETING');
  else if (lname.includes('drink')) actions.push('DRINK');
  else if (lname.includes('sleep')) actions.push('SLEEP');
  else if (lname.includes('sitting') || lname.includes('pose')) actions.push('REST', 'SIT');
  else if (lname.includes('stand up') || lname.includes('standing up')) actions.push('STAND_UP');
  else if (lname.includes('fall')) actions.push('FALL');
  else if (lname.includes('agree') || lname.includes('disagree') || lname.includes('no') || lname.includes('thank') || lname.includes('clap') || lname.includes('laugh') || lname.includes('point')) actions.push('EXPRESS');
  else if (lname.includes('throw')) actions.push('THROW');
  else actions.push('MISC_ACTION');

  return Array.from(new Set(actions));
}

function deriveStates(pack, name, actions) {
  const lname = name.toLowerCase();
  const states = [];

  if (pack === 'Farming Pack' || actions.includes('HARVEST_CROP') || actions.includes('WATER_CROP') || actions.includes('PLANT_CROP')) {
    states.push('FARMING');
  }
  if (pack === 'Male Injured Pack' || lname.includes('injured')) {
    states.push('INJURED');
  }
  if (lname.includes('swim') || lname.includes('tread')) {
    states.push('SWIMMING');
  }
  if (lname.includes('sleep')) {
    states.push('SLEEPING');
  }
  if (lname.includes('sitting') || lname.includes('pose')) {
    states.push('SITTING');
  }
  if (lname.includes('walk') || lname.includes('run') || lname.includes('backwards')) {
    states.push('LOCOMOTION');
  }
  if (lname.includes('idle')) {
    states.push('IDLE');
  }
  if (states.length === 0) {
    states.push('ACTION');
  }
  return Array.from(new Set(states));
}

function deriveLoop(name) {
  const lname = name.toLowerCase();
  if (lname.includes('idle') || lname.includes('walk') || lname.includes('run') || lname.includes('swim') || lname.includes('tread') || lname.includes('holding walk') || lname.includes('wheelbarrow walk')) {
    return { loop: true, loopType: 'LOOP' };
  }
  if (lname.includes('stand up') || lname.includes('standing up') || lname.includes('fall')) {
    return { loop: false, loopType: 'TRANSITION' };
  }
  return { loop: false, loopType: 'ONE_SHOT' };
}

function deriveTags(pack, name, category, actions) {
  const tags = new Set([
    ...category.toLowerCase().split('_'),
    ...actions.flatMap((a) => a.toLowerCase().split('_')),
    ...name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' '),
  ]);
  if (pack) tags.add(pack.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  return Array.from(tags).filter((t) => t.length > 1);
}

function deriveDescription(name, category, pack) {
  const cleanName = name.replace(/\.[^/.]+$/, '');
  if (pack === 'Farming Pack') return `Farming action: Character performs ${cleanName.toLowerCase()}`;
  if (pack === 'Male Injured Pack') return `Injured movement/state: Character performs ${cleanName.toLowerCase()}`;
  return `Character animation: ${cleanName}`;
}

async function runScanner() {
  console.log('Starting CiviGenis Animation Scanner...');
  const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
  const loader = new FBXLoader();

  const filePaths = scanDir(ANIM_DIR);
  console.log(`Discovered ${filePaths.length} animation files in ${ANIM_DIR}`);

  const rawEntries = [];

  for (const filePath of filePaths) {
    const relPath = path.relative(ANIM_DIR, filePath).replace(/\\/g, '/');
    const pathParts = relPath.split('/');
    const pack = pathParts.length > 1 ? pathParts[0] : 'Root';
    const nameWithExt = pathParts[pathParts.length - 1];
    const name = nameWithExt.replace(/\.[^/.]+$/, '');
    const ext = path.extname(nameWithExt).toLowerCase();

    const id = sanitizeId(relPath);

    let duration = 2.0;
    let fps = 30;
    let trackCount = 0;
    let boneCount = 65;
    let rootMotion = false;
    let skeleton = 'Standard Humanoid Skeleton (Mixamo Compatible)';

    try {
      const buffer = fs.readFileSync(filePath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const fbxGroup = loader.parse(arrayBuffer, '');

      if (fbxGroup.animations && fbxGroup.animations.length > 0) {
        const clip = fbxGroup.animations[0];
        duration = parseFloat(clip.duration.toFixed(2));
        trackCount = clip.tracks.length;

        let maxHipsDisp = 0;
        clip.tracks.forEach((t) => {
          if (t.name.toLowerCase().includes('hips.position') || t.name.toLowerCase().includes('root.position')) {
            for (let i = 0; i < t.values.length; i += 3) {
              const d = Math.sqrt(t.values[i] ** 2 + t.values[i + 2] ** 2);
              if (d > maxHipsDisp) maxHipsDisp = d;
            }
          }
        });
        if (maxHipsDisp > 1.0) {
          rootMotion = true;
        }
      }

      let count = 0;
      fbxGroup.traverse((child) => {
        if (child.isBone || child.type === 'Bone') count++;
      });
      if (count > 0) boneCount = count;
    } catch (err) {
      console.warn(`Warning parsing metadata for ${relPath}:`, err.message);
    }

    const category = deriveCategory(pack, name);
    const actions = deriveActions(pack, name);
    const states = deriveStates(pack, name, actions);
    const { loop, loopType } = deriveLoop(name);
    const tags = deriveTags(pack, name, category, actions);
    const description = deriveDescription(name, category, pack);

    const isUsed = CURRENTLY_USED_FILES.has(relPath);
    const status = isUsed ? 'AVAILABLE_AND_USED' : 'AVAILABLE_NOT_CURRENTLY_USED';

    rawEntries.push({
      id,
      file: relPath,
      name,
      pack,
      category,
      description,
      actions,
      states,
      loop,
      loopType,
      rootMotion,
      duration,
      fps,
      trackCount,
      boneCount,
      skeleton,
      compatibleCharacters: ['Ben', 'Julie', 'NPC'],
      characterCompatibility: {
        Ben: 'DIRECTLY_COMPATIBLE',
        Julie: 'REQUIRES_RETARGETING',
        NPC: 'DIRECTLY_COMPATIBLE',
      },
      tags,
      status,
      variants: [],
    });
  }

  // Auto-link variants based on shared actions or name bases
  const actionGroups = {};
  rawEntries.forEach((entry) => {
    entry.actions.forEach((act) => {
      if (!actionGroups[act]) actionGroups[act] = [];
      actionGroups[act].push(entry.id);
    });
  });

  rawEntries.forEach((entry) => {
    const related = new Set();
    entry.actions.forEach((act) => {
      if (actionGroups[act]) {
        actionGroups[act].forEach((otherId) => {
          if (otherId !== entry.id) related.add(otherId);
        });
      }
    });
    entry.variants = Array.from(related);
  });

  // Calculate overall stats
  const stats = {
    totalAnimations: rawEntries.length,
    totalPacks: Array.from(new Set(rawEntries.map((e) => e.pack))).length,
    packBreakdown: {},
    categoryBreakdown: {},
    actionBreakdown: {},
    usageBreakdown: {
      AVAILABLE_AND_USED: rawEntries.filter((e) => e.status === 'AVAILABLE_AND_USED').length,
      AVAILABLE_NOT_CURRENTLY_USED: rawEntries.filter((e) => e.status === 'AVAILABLE_NOT_CURRENTLY_USED').length,
    },
    scannedAt: new Date().toISOString(),
  };

  rawEntries.forEach((e) => {
    stats.packBreakdown[e.pack] = (stats.packBreakdown[e.pack] || 0) + 1;
    stats.categoryBreakdown[e.category] = (stats.categoryBreakdown[e.category] || 0) + 1;
    e.actions.forEach((a) => {
      stats.actionBreakdown[a] = (stats.actionBreakdown[a] || 0) + 1;
    });
  });

  const registryData = {
    version: '1.0.0',
    stats,
    animations: rawEntries,
  };

  // Ensure public/data directory exists
  const dataDir = path.dirname(OUTPUT_JSON_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(registryData, null, 2), 'utf-8');
  console.log(`Saved Animation Memory JSON to: ${OUTPUT_JSON_PATH}`);

  // Ensure src/systems/animation directory exists
  const tsDir = path.dirname(OUTPUT_TS_PATH);
  if (!fs.existsSync(tsDir)) {
    fs.mkdirSync(tsDir, { recursive: true });
  }

  const tsContent = `// Auto-generated by scripts/scan-animations.js - DO NOT EDIT MANUALLY
import { AnimationRegistryData } from './types';
import rawData from '../../../public/data/animation-memory.json';

export const ANIMATION_MEMORY_DATA = rawData as AnimationRegistryData;
`;
  fs.writeFileSync(OUTPUT_TS_PATH, tsContent, 'utf-8');
  console.log(`Saved Animation Memory TS export to: ${OUTPUT_TS_PATH}`);

  console.log('\n--- SCAN COMPLETE ---');
  console.log(`Total Animations Registered: ${stats.totalAnimations}`);
  console.log(`Total Packs: ${stats.totalPacks}`);
  console.log('Categories:', stats.categoryBreakdown);
  console.log('Usage Status:', stats.usageBreakdown);

  // Generate ANIMATION_MEMORY.md
  try {
    const { generateMarkdownDoc } = await import('./generate-doc.js');
    if (typeof generateMarkdownDoc === 'function') {
      generateMarkdownDoc();
    }
  } catch (err) {
    // If ES module import direct call fallback
  }
}

runScanner().catch((err) => {
  console.error('Fatal error running scanner:', err);
  process.exit(1);
});
