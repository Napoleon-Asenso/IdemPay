#!/usr/bin/env node
'use strict';

/**
 * matisse-tokens-to-css.js
 *
 * Converts the Matisse design tokens (matisse-tokens-all.json) into CSS
 * custom properties, grouped by category. Example output:
 *
 *   :root {
 *     --typography-font-size-base: 1rem;
 *     --spacing-4: 0.875rem;
 *     ...
 *   }
 *
 * Usage:
 *   node matisse-tokens-to-css.js [input.json] [output.css]
 *
 * Defaults:
 *   input  -> ./matisse-tokens-all.json
 *   output -> ./matisse-tokens.css
 *
 * Naming rules are driven by CATEGORIES / KEY_PREFIXES below. All colors
 * (hsl()/hsla()/rgb()/named) are kept verbatim.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_INPUT = path.join(__dirname, 'matisse-tokens-all.json');
const DEFAULT_OUTPUT = path.join(__dirname, 'matisse-tokens.css');

/**
 * Category -> CSS variable prefix used in names.
 * Colors are emitted per-theme (light/dark); everything else is emitted
 * once under :root.
 */
const CATEGORIES = {
  color: 'color',
  typography: 'typography',
  spacing: 'spacing',
  borderRadius: 'radius',
  shadows: 'shadow',
  elevation: 'elevation',
};

/**
 * Category -> leading string stripped from each key so we get
 * `--spacing-1` (not `--spacing-spacing-1`), `--radius-md`, etc.
 */
const KEY_PREFIXES = {
  spacing: 'spacing-',
  borderRadius: 'radius-',
  shadows: 'shadow-',
  elevation: 'elevation-',
};

const THEME_KEYS = ['light', 'dark'];

function varName(category, key) {
  const strip = KEY_PREFIXES[category];
  const name = strip && key.startsWith(strip) ? key.slice(strip.length) : key;
  const prefix = CATEGORIES[category];
  return '--' + (prefix ? prefix + '-' : '') + name;
}

function renderBlock(entries, indent) {
  return entries
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join('\n');
}

function renderTheme(themeName, entries, indent) {
  const title = `color (${themeName})`;
  return indent + '/* ' + title + ' */\n' + renderBlock(entries, indent);
}

function main() {
  const [inputPath = DEFAULT_INPUT, outputPath = DEFAULT_OUTPUT] =
    process.argv.slice(2);

  const tokens = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  if (!tokens || typeof tokens !== 'object') {
    throw new Error(`${inputPath} does not contain a JSON object`);
  }

  const shared = [];
  const themes = { light: [], dark: [] };

  for (const category of Object.keys(tokens)) {
    const group = tokens[category];
    if (!group || typeof group !== 'object') continue;

    if (category === 'color') {
      for (const theme of THEME_KEYS) {
        const palette = group[theme];
        if (!palette || typeof palette !== 'object') continue;
        themes[theme] = Object.entries(palette).map(([key, value]) => [
          varName(category, key),
          value,
        ]);
      }
      continue;
    }

    const label =
      '  /* ' +
      category.replace(/[A-Z]/g, (c) => ' ' + c.toLowerCase()) +
      ' */';
    shared.push(label);
    for (const [key, value] of Object.entries(group)) {
      shared.push('  ' + varName(category, key) + ': ' + value + ';');
    }
  }

  const lines = [];
  lines.push('/* Auto-generated from ' + path.basename(inputPath) + '. Do not edit by hand. */');
  lines.push('');
  lines.push(':root {');
  lines.push(shared.join('\n'));
  lines.push('}');

  lines.push('');
  lines.push(':root,');
  lines.push('[data-theme="light"] {');
  lines.push(renderTheme('light', themes.light, '  '));
  lines.push('}');

  lines.push('');
  lines.push('[data-theme="dark"] {');
  lines.push(renderTheme('dark', themes.dark, '  '));
  lines.push('}');

  lines.push('');
  lines.push('@media (prefers-color-scheme: dark) {');
  lines.push('  :root {');
  lines.push(renderTheme('dark', themes.dark, '    '));
  lines.push('  }');
  lines.push('}');

  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${outputPath}`);
}

main();