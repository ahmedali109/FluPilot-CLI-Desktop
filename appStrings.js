const currentDateYear = new Date().getFullYear();

const pagesName = {
  terminal: 'Terminal',
  flutterCode: 'Flutter Code Explorer',
};

const pagesPath = {
  terminal: './index.html',
  flutterCode: './flutter_explorer.html',
};

const operatingSystem = {
  windows: 'win32',
  mac: 'darwin',
  linux: 'linux',
};

const AppStrings = {
  appName: 'FluPilot-cli',
  appVersion: '1.0.0',
  appDescription: 'A CLI tool for Flutter development',
  appAuthor: 'Ahmed Naguib',
  appCopyright: `© ${currentDateYear} Ahmed Naguib`,
  appLicense: 'MIT License',
  appIcon: 'assets/Icon.png',
  appCredits: 'Built with ❤️ using Electron.js',

  navigation: {
    terminal: {
      name: pagesName.terminal,
      path: pagesPath.terminal,
    },
    flutterCode: {
      name: pagesName.flutterCode,
      path: pagesPath.flutterCode,
    },
  },

  os: {
    windows: operatingSystem.windows,
    mac: operatingSystem.mac,
    linux: operatingSystem.linux,
  },

  welcomeMessage: () => 'Welcome to FluPilot-cli!',
  goodbyeMessage: () => 'Thank you for using FluPilot-cli!',
};

// Export for both CommonJS (Node.js) and ES6 modules (browser)
export { AppStrings, pagesName, pagesPath, operatingSystem };
