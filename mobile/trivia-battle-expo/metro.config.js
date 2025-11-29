const { getDefaultConfig, mergeConfig } = require('expo/metro-config');
const nodeLibsReactNative = require('node-libs-react-native');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    extraNodeModules: {
      ...nodeLibsReactNative,
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
