module.exports = (api) => {
  const isTestEnv = api.env('test');

  if (!isTestEnv) {
    return {}; // Return an empty config if not in test environment
  }

  return {
    presets: [
      '@babel/preset-env',
      'next/babel'
    ],
    plugins: [
      '@babel/plugin-transform-runtime'
    ]
  };
};
