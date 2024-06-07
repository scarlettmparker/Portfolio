module.exports = {
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
  pageExtensions: ['index/ArrowButton.tsx', 'index/MusicScene.tsx', 'index/SceneCleanup.tsx', 'index/SceneUtils.tsx', 'index/SpiderScene.tsx']
};