import { describe, expect, test } from 'claude-code/testing'

import { buildSbom, designVersionOf } from '../scripts/lib/sbom.js'

const input = { version: '1.2.0', digest: 'ab'.repeat(32), designVersion: 'v1.2.0', timestamp: '2026-10-23T00:00:00.000Z', serial: 'x' }

describe('designVersionOf', () => {
  test('reads the version design/README.md records', () => {
    expect(designVersionOf('- **Source:** x\n- **Version copied:** `v1.2.0`\n- **Last re-synced:** y\n')).toBe('v1.2.0')
  })

  test('returns null when the marker is missing or malformed', () => {
    expect(designVersionOf('- **Version adopted:** `v1.2.0`')).toBe(null)
    expect(designVersionOf('- **Version copied:** `1.2`')).toBe(null)
    expect(designVersionOf('')).toBe(null)
  })
})

describe('buildSbom', () => {
  const sbom = buildSbom(input)

  test('is a CycloneDX 1.6 document with a serial number', () => {
    expect(sbom.bomFormat).toBe('CycloneDX')
    expect(sbom.specVersion).toBe('1.6')
    expect(sbom.serialNumber).toBe('urn:uuid:x')
  })

  test('names the release as the root component, with its licence and tarball hash', () => {
    const root = sbom.metadata.component
    expect(root.name).toBe('m3l-prompt-optimizer')
    expect(root.version).toBe('1.2.0')
    expect(root.purl).toBe('pkg:github/monte3l/m3l-prompt-optimizer@1.2.0')
    expect(root.licenses).toEqual([{ license: { id: 'MIT' } }])
    expect(root.hashes).toEqual([{ alg: 'SHA-256', content: 'ab'.repeat(32) }])
  })

  test('lists the vendored design system and nothing from npm', () => {
    expect(sbom.components.map(c => c.name)).toEqual(['m3l-design', 'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible Mono'])
    expect(sbom.components[0]?.purl).toBe('pkg:github/monte3l/m3l-design@v1.2.0')
    expect(sbom.components.some(c => (c.purl ?? '').startsWith('pkg:npm/'))).toBe(false)
  })

  test('has a dependency entry whose refs all exist', () => {
    const refs = new Set([sbom.metadata.component['bom-ref'], ...sbom.components.map(c => c['bom-ref'])])
    for (const dep of sbom.dependencies) {
      expect(refs.has(dep.ref)).toBe(true)
      for (const child of dep.dependsOn) expect(refs.has(child)).toBe(true)
    }
  })
})
