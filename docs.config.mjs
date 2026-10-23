// SPDX-FileCopyrightText: Copyright the m3l-prompt-optimizer contributors
// SPDX-License-Identifier: MIT

// Docs kit config. The kit is design/source/docs-kit/ (vendored from m3l-design);
// its README documents every key. Every tracked *.md file must be a page or be
// excluded with a reason, or `node design/source/docs-kit/build.mjs --check` fails.
export default {
  title: 'm3l-prompt-optimizer',
  repo: 'https://github.com/monte3l/m3l-prompt-optimizer',
  siteUrl: 'https://prompt-optimizer.monte3l.com',
  designDir: 'design',
  // Its homepage must equal siteUrl.
  manifest: '.claude-plugin/plugin.json',
  navGroups: ['Start', 'Project', 'Security', 'Internals'],
  pages: [
    { src: 'README.md', out: 'index.html', group: 'Start', label: 'Overview' },
    { src: 'CONTRIBUTING.md', out: 'CONTRIBUTING.html', group: 'Project', label: 'Contributing' },
    { src: 'GOVERNANCE.md', out: 'GOVERNANCE.html', group: 'Project', label: 'Governance' },
    { src: 'ROADMAP.md', out: 'ROADMAP.html', group: 'Project', label: 'Roadmap' },
    { src: 'CODE_OF_CONDUCT.md', out: 'CODE_OF_CONDUCT.html', group: 'Project', label: 'Code of conduct' },
    { src: 'UNVERIFIED.md', out: 'UNVERIFIED.html', group: 'Project', label: 'Open items' },
    { src: 'SECURITY.md', out: 'SECURITY.html', group: 'Security', label: 'Security policy' },
    { src: 'docs/architecture.md', out: 'docs/architecture.html', group: 'Internals', label: 'Architecture' },
    { src: 'docs/assurance-case.md', out: 'docs/assurance-case.html', group: 'Security', label: 'Assurance case' },
    { src: 'docs/research-notes.md', out: 'docs/research-notes.html', group: 'Internals', label: 'Research notes' },
    { src: 'evals/results.md', out: 'evals/results.html', group: 'Internals', label: 'Eval results' },
    { src: 'design/README.md', out: 'design/README.html', group: 'Internals', label: 'Design system' },
  ],
  exclude: [
    { glob: 'CHANGELOG.md', reason: 'release notes live on the GitHub releases page' },
    { glob: 'docs/research/*.md', reason: 'living trackers for the harness and TypeScript guidance skills, written for maintainers' },
    { glob: '.claude/**', reason: 'instructions, skills and agents for coding agents, not reader-facing' },
    { glob: '.groundwork/**', reason: 'm3l-groundwork adoption and customization reports, a record for maintainers' },
    { glob: '.github/pull_request_template.md', reason: 'GitHub pull request template, shown in the PR form' },
  ],
  parity: ['scripts/doc-parity.mjs'],
}
