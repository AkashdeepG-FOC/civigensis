import fs from 'fs';
import path from 'path';

const JSON_PATH = path.resolve('public/data/animation-memory.json');
const MD_PATH = path.resolve('ANIMATION_MEMORY.md');

export function generateMarkdownDoc() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error('JSON file not found:', JSON_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(JSON_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const { stats, animations } = data;

  const lines = [];

  lines.push('# CiviGenis — Persistent Animation Memory Registry');
  lines.push('');
  lines.push('> Centralized, persistent animation knowledge system registering every animation asset available under `public/assets/animations/`.');
  lines.push('');
  lines.push('## Executive Summary & Totals');
  lines.push('');
  lines.push('| Metric | Count / Value |');
  lines.push('| :--- | :--- |');
  lines.push(`| **Total animations** | **${stats.totalAnimations}** |`);
  lines.push(`| **Total packs** | **${stats.totalPacks}** |`);
  lines.push(`| **Total farming animations** | **${stats.categoryBreakdown['FARMING'] || 0}** |`);
  lines.push(`| **Total injured animations** | **${stats.categoryBreakdown['INJURED'] || 0}** |`);
  lines.push(`| **Total locomotion animations** | **${stats.categoryBreakdown['LOCOMOTION'] || 0}** |`);
  lines.push(`| **Total social animations** | **${stats.categoryBreakdown['SOCIAL'] || 0}** |`);
  lines.push(`| **Total survival animations** | **${stats.categoryBreakdown['SURVIVAL'] || 0}** |`);
  lines.push(`| **Total interaction animations** | **${stats.categoryBreakdown['INTERACTION'] || 0}** |`);
  lines.push(`| **Total swimming animations** | **${stats.categoryBreakdown['SWIMMING'] || 0}** |`);
  lines.push(`| **Total transition animations** | **${stats.categoryBreakdown['TRANSITION'] || 0}** |`);
  lines.push(`| **Total currently used animations** | **${stats.usageBreakdown['AVAILABLE_AND_USED']}** |`);
  lines.push(`| **Total unused-but-available animations** | **${stats.usageBreakdown['AVAILABLE_NOT_CURRENTLY_USED']}** |`);
  lines.push('');

  lines.push('## Pack Breakdown');
  lines.push('');
  lines.push('| Pack Name | Animations Count |');
  lines.push('| :--- | :--- |');
  Object.entries(stats.packBreakdown).forEach(([pack, count]) => {
    lines.push(`| **${pack}** | ${count} |`);
  });
  lines.push('');

  lines.push('## Action System Mapping Matrix');
  lines.push('');
  lines.push('High-level AI Intention Actions map to the following registered animation IDs/files in Animation Memory:');
  lines.push('');
  lines.push('| High-Level Action | Registered Animations (Variants) |');
  lines.push('| :--- | :--- |');

  const actionToAnims = {};
  animations.forEach((anim) => {
    anim.actions.forEach((act) => {
      if (!actionToAnims[act]) actionToAnims[act] = [];
      actionToAnims[act].push(anim.name);
    });
  });

  Object.entries(actionToAnims).forEach(([action, names]) => {
    lines.push(`| \`${action}\` | ${names.map((n) => `\`${n}\``).join(', ')} |`);
  });
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('## Complete Animation Registry (All Discovered Animations)');
  lines.push('');

  animations.forEach((anim, idx) => {
    lines.push(`### ${idx + 1}. ${anim.name}`);
    lines.push('');
    lines.push(`- **ID**: \`${anim.id}\``);
    lines.push(`- **File**: \`${anim.file}\``);
    lines.push(`- **Pack**: \`${anim.pack}\``);
    lines.push(`- **Name**: ${anim.name}`);
    lines.push(`- **Description**: ${anim.description}`);
    lines.push(`- **Category**: \`${anim.category}\``);
    lines.push(`- **Tags**: ${anim.tags.map((t) => `\`${t}\``).join(', ')}`);
    lines.push(`- **Action Mappings**: ${anim.actions.map((a) => `\`${a}\``).join(', ')}`);
    lines.push(`- **Character States**: ${anim.states.map((s) => `\`${s}\``).join(', ')}`);
    lines.push(`- **Loop / Type**: ${anim.loop ? '`LOOP` (Continuous)' : '`ONE_SHOT` (Single execution)'} (\`${anim.loopType}\`)`);
    lines.push(`- **Duration**: \`${anim.duration}s\``);
    lines.push(`- **FPS**: \`${anim.fps}\``);
    lines.push(`- **Root Motion**: \`${anim.rootMotion}\` (In-place movement optimized)`);
    lines.push(`- **Skeleton**: ${anim.skeleton} (\`${anim.boneCount} bones parsed\`)`);
    lines.push(`- **Ben Compatibility**: \`${anim.characterCompatibility.Ben}\``);
    lines.push(`- **Julie Compatibility**: \`${anim.characterCompatibility.Julie}\``);
    lines.push(`- **NPC Compatibility**: \`${anim.characterCompatibility.NPC}\``);
    lines.push(`- **Current Usage**: \`${anim.status}\``);
    lines.push(`- **Alternative / Variant Animations**: ${anim.variants.length > 0 ? anim.variants.map((v) => `\`${v}\``).join(', ') : '*None*'}`);
    lines.push('');
  });

  fs.writeFileSync(MD_PATH, lines.join('\n'), 'utf-8');
  console.log(`Successfully generated ${MD_PATH} with ${animations.length} animations registered.`);
}

generateMarkdownDoc();
