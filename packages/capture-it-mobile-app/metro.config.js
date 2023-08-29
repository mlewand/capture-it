const {getDefaultConfig} = require('@react-native/metro-config');
const path = require('path');

// Standard Metro config needs to be adjusted to account for monorepo structure.
// Based on https://docs.expo.dev/guides/monorepos/ guide.

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

/*
This is diverged from a referenced guide. Without it after running `yarn ios` you'd get an error:

```
Unable to resolve module react-native from /Users/mlewand/workspace/mlewand/capture-it/packages/capture-it-mobile-app/index.js: react-native could not be found within the project or in these directories:
  node_modules
  ../../node_modules
  4 |
> 5 | import {AppRegistry} from 'react-native';
    |                            ^
  6 | import App from './App';
  7 | import {name as appName} from './app.json';
  8 | AppRegistry.registerComponent(appName, () => App);
```

So it turns out that React Native lib needs a bit of extra love here.
*/
config.resolver.extraNodeModules = {
  'react-native': path.resolve(__dirname, '../../node_modules/react-native'),
};

module.exports = config;
