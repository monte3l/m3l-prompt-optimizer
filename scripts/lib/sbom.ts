// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

/**
 * Pure helpers for `scripts/release-sbom.mjs`, which writes the CycloneDX SBOM that ships beside each release
 * tarball. Node loads this file directly (type stripping) and the engine's test runner imports it as `./sbom.js`.
 */

export type SbomInput = {
  version: string
  /** SHA-256 of the release tarball, in hex. */
  digest: string
  /** The m3l-design release vendored under `design/`, like `v1.2.0`. */
  designVersion: string
  timestamp: string
  serial: string
}

const REPO = 'https://github.com/monte3l/m3l-prompt-optimizer'
const PURL = (version: string): string => `pkg:github/monte3l/m3l-prompt-optimizer@${version}`
const DESIGN_PURL = (version: string): string => `pkg:github/monte3l/m3l-design@${version}`

/** The version `design/README.md` records as copied, or null when the marker is missing. */
export const designVersionOf = (readme: string): string | null => /^- \*\*Version copied:\*\* `(v\d+\.\d+\.\d+)`/m.exec(readme)?.[1] ?? null

/**
 * A CycloneDX 1.6 document for the release: the mod as the root component with the tarball's hash, and the
 * vendored design system and its two fonts as the only components. The mod has no package manifest and ships
 * no npm dependencies, so there is nothing else to list. The engine that loads it is the host, not part of it.
 */
export const buildSbom = (input: SbomInput) => {
  const root = PURL(input.version)
  const design = DESIGN_PURL(input.designVersion)
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: `urn:uuid:${input.serial}`,
    version: 1,
    metadata: {
      timestamp: input.timestamp,
      lifecycles: [{ phase: 'build' }],
      authors: [{ name: 'Enrico Lionello' }],
      supplier: { name: 'monte3l', url: ['https://github.com/monte3l'] },
      component: {
        type: 'application',
        'bom-ref': root,
        name: 'm3l-prompt-optimizer',
        version: input.version,
        description: 'A Claude Code mod that refines the prompts you type.',
        licenses: [{ license: { id: 'MIT' } }],
        purl: root,
        hashes: [{ alg: 'SHA-256', content: input.digest }],
        externalReferences: [{ type: 'vcs', url: REPO }],
      },
    },
    components: [
      {
        type: 'library',
        'bom-ref': design,
        name: 'm3l-design',
        version: input.designVersion,
        description: 'The monte3l design system, copied into design/ and never hand-edited.',
        licenses: [{ license: { id: 'MIT' } }],
        purl: design,
        externalReferences: [{ type: 'vcs', url: 'https://github.com/monte3l/m3l-design' }],
      },
      {
        type: 'data',
        'bom-ref': 'font:atkinson-hyperlegible-next',
        name: 'Atkinson Hyperlegible Next',
        description: 'WOFF2 font vendored with m3l-design under design/source/fonts/.',
        licenses: [{ license: { id: 'OFL-1.1' } }],
      },
      {
        type: 'data',
        'bom-ref': 'font:atkinson-hyperlegible-mono',
        name: 'Atkinson Hyperlegible Mono',
        description: 'WOFF2 font vendored with m3l-design under design/source/fonts/.',
        licenses: [{ license: { id: 'OFL-1.1' } }],
      },
    ],
    dependencies: [
      { ref: root, dependsOn: [design] },
      { ref: design, dependsOn: [] },
    ],
  }
}
