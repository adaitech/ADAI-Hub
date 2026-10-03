import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/**
 * Pacotes publicados só como ES Modules (react-markdown + ecossistema unified/remark/micromark)
 * precisam ser transformados pelo Jest; o padrão do next/jest ignora todo o `node_modules`.
 */
const PACOTES_ESM = [
  'react-markdown',
  'remark-.*',
  'rehype-.*',
  'unified',
  'bail',
  'trough',
  'devlop',
  'vfile.*',
  'unist-.*',
  'mdast-.*',
  'hast-.*',
  'micromark.*',
  'decode-named-character-reference',
  'character-entities.*',
  'property-information',
  'space-separated-tokens',
  'comma-separated-tokens',
  'zwitch',
  'longest-streak',
  'markdown-table',
  'ccount',
  'escape-string-regexp',
  'trim-lines',
  'html-url-attributes',
  'estree-util-.*',
  'is-plain-obj',
];

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/generated/**', '!src/app/**'],
};

export default async function jestConfig() {
  const resolvido = await createJestConfig(config)();
  return {
    ...resolvido,
    // Troca o "ignora todo node_modules" do next/jest por "ignora, menos os pacotes ESM acima".
    transformIgnorePatterns: [
      `/node_modules/(?!(${PACOTES_ESM.join('|')})/)`,
      ...resolvido.transformIgnorePatterns.filter((padrao) => !padrao.includes('node_modules')),
    ],
  };
}
