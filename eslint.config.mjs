import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'unused-imports/no-unused-vars': 'warn',
    'node/prefer-global/process': 'off',
  },
})
