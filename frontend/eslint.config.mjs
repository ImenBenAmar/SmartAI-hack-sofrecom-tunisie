import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next'],
    rules: {
      // Désactiver toutes les règles principales de Next.js et React
      'react/no-unescaped-entities': 'off',
      '@next/next/no-page-custom-font': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
      'no-console': 'off',
      'no-unused-expressions': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      // tu peux ajouter ici toutes les règles spécifiques que tu veux désactiver
    },
  }),
]

export default eslintConfig
