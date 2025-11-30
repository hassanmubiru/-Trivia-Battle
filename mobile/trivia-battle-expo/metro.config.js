const { getDefaultConfig } = require('expo/metro-config');
const nodeLibsReactNative = require('node-libs-react-native');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      ...nodeLibsReactNative,
      // Explicit crypto polyfills for MetaMask SDK compatibility
      'crypto': require.resolve('crypto-browserify'),
      'stream': require.resolve('stream-browserify'),
      'buffer': require.resolve('buffer'),
    },
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
    // Handle node: protocol imports
    resolveRequest: (context, moduleName, platform) => {
      // Redirect node: protocol imports to actual modules
      if (moduleName.startsWith('node:')) {
        const actualModule = moduleName.slice(5);
        return context.resolveRequest(context, actualModule, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = config;
