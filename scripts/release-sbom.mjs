#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

/**
 * Writes `<tarball>.cdx.json`, the CycloneDX SBOM `release.yml` attests and attaches to a release.
 *
 *   node scripts/release-sbom.mjs <tarball> <version>
 *
 * The version is the release's, without a leading `v`. The design version comes from `design/README.md`.
 */
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildSbom, designVersionOf } from './lib/sbom.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [tarball, version] = process.argv.slice(2)

if (!tarball || !/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('usage: node scripts/release-sbom.mjs <tarball> <version>   (version like 1.2.0, no leading v)')
  process.exit(2)
}

const designVersion = designVersionOf(readFileSync(join(root, 'design/README.md'), 'utf8'))
if (designVersion === null) {
  console.error('design/README.md has no "Version copied" line')
  process.exit(1)
}

const digest = createHash('sha256').update(readFileSync(tarball)).digest('hex')
const sbom = buildSbom({ version, digest, designVersion, timestamp: new Date().toISOString(), serial: randomUUID() })
writeFileSync(`${tarball}.cdx.json`, `${JSON.stringify(sbom, null, 2)}\n`)
console.log(`wrote ${tarball}.cdx.json (sha256 ${digest})`)
