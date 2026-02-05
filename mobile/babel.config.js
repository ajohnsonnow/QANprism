module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@utils': './src/utils',
          '@crypto': './src/crypto',
          '@api': './src/api',
          '@theme': './src/theme',
          '@types': './src/types',
        },
      },
    ],
  ],
};
