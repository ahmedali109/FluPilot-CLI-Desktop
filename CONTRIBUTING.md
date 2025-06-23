# Contributing to FluPilot-CLI Desktop

Thank you for your interest in contributing to FluPilot-CLI Desktop! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Flutter SDK (for Flutter-related features)

### Setting up the Development Environment

1. **Fork the repository**

   - Go to [https://github.com/ahmedali109/FluPilot-CLI-Desktop](https://github.com/ahmedali109/FluPilot-CLI-Desktop)
   - Click the "Fork" button

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/FluPilot-CLI-Desktop.git
   cd FluPilot-CLI-Desktop
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/ahmedali109/FluPilot-CLI-Desktop.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Run the application**

   ```bash
   npm run electron-dev
   ```

## Development Guidelines

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript/ES6+ best practices
- Use meaningful variable and function names
- Add comments for complex logic

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in present tense (e.g., "Add", "Fix", "Update")
- Keep the first line under 50 characters
- Add detailed description if necessary

Example:

```text
Add dark theme support

- Implement theme switching functionality
- Add new color schemes for dark mode
- Update UI components to support theme changes
```

### Branch Naming

- Use descriptive branch names
- Format: `feature/feature-name` or `bugfix/issue-description`
- Examples: `feature/terminal-themes`, `bugfix/memory-leak`

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists in the [Issues](https://github.com/ahmedali109/FluPilot-CLI-Desktop/issues)
2. If not, create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node.js version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing [Issues](https://github.com/ahmedali109/FluPilot-CLI-Desktop/issues) for similar requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach

### Submitting Code Changes

1. **Create a new branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   - Write clean, well-documented code
   - Test your changes thoroughly
   - Ensure the application builds successfully

3. **Test your changes**

   ```bash
   npm run electron-dev
   npm run build
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "Add your descriptive commit message"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Provide a clear description of your changes
   - Reference any related issues

### Pull Request Guidelines

- Keep PRs focused and atomic (one feature/fix per PR)
- Update documentation if necessary
- Add tests for new features
- Ensure all existing tests pass
- Follow the existing code style

## Code Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged

## Development Tips

### Project Structure

```text
├── main.js              # Main Electron process
├── renderer.js          # Renderer process
├── preload.js           # Preload script
├── assets/              # Application assets
├── scripts/             # Shell scripts and utilities
├── src/                 # Source code
│   ├── config/          # Configuration files
│   ├── services/        # Service modules
│   └── utils/           # Utility functions
├── styles/              # CSS styles
├── themes/              # Color themes
└── ui-projects-templates/ # Flutter UI templates
```

### Building for Different Platforms

```bash
# macOS
npm run build-mac

# Windows
npm run build-win

# Linux
npm run build-linux
```

### Adding New UI Templates

1. Create a new JSON file in `ui-projects-templates/`
2. Follow the existing template structure
3. Add appropriate metadata
4. Test the template in the UI explorer

## Need Help?

- Check the [documentation](README.md)
- Look at existing [issues](https://github.com/ahmedali109/FluPilot-CLI-Desktop/issues)
- Create a new issue for questions

Thank you for contributing to FluPilot-CLI Desktop! 🚀
