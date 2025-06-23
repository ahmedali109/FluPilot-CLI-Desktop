import { AppStrings } from './appStrings.js';

let terminalNav = null;
let flutterCode = null;

function navigateToTerminal() {
  if (window.electronAPI && window.electronAPI.navigateToPage) {
    window.electronAPI.navigateToPage(AppStrings.navigation.terminal.name);
    updateNavigationState(AppStrings.navigation.terminal.name);
  }
}

function navigateToflutterCode() {
  if (window.electronAPI && window.electronAPI.navigateToPage) {
    window.electronAPI.navigateToPage(AppStrings.navigation.flutterCode.name);
    updateNavigationState(AppStrings.navigation.flutterCode.name);
  }
}

function updateNavigationState(activePage) {
  if (!terminalNav || !flutterCode) return;

  if (activePage === AppStrings.navigation.terminal.name) {
    terminalNav.classList.add('active');
    flutterCode.classList.remove('active');
  } else if (activePage === AppStrings.navigation.flutterCode.name) {
    flutterCode.classList.add('active');
    terminalNav.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', function () {
  terminalNav = document.getElementById('terminal-nav');
  flutterCode = document.getElementById('flutterCode-nav');

  if (terminalNav) {
    terminalNav.addEventListener('click', function (e) {
      navigateToTerminal();
    });
  }

  if (flutterCode) {
    flutterCode.addEventListener('click', function (e) {
      navigateToflutterCode();
    });
  }

  const currentPage = window.location.pathname;
  if (currentPage.includes(AppStrings.navigation.terminal.path)) {
    updateNavigationState(AppStrings.navigation.flutterCode.name);
  } else {
    updateNavigationState(AppStrings.navigation.terminal.name);
  }
});

document.addEventListener('keydown', function (e) {
  // Ctrl/Cmd + 1 for Terminal
  if ((e.ctrlKey || e.metaKey) && e.key === '1') {
    e.preventDefault();
    if (terminalNav) {
      navigateToTerminal();
    }
  }

  // Ctrl/Cmd + 2 for flutterCode
  if ((e.ctrlKey || e.metaKey) && e.key === '2') {
    e.preventDefault();
    if (flutterCode) {
      navigateToflutterCode();
    }
  }

  // Handle escape key to close menu
  if (e.key === 'Escape') {
    const menuPanel = document.getElementById('menu-panel');
    if (menuPanel && !menuPanel.classList.contains('-translate-x-full')) {
      toggleMenu();
    }
  }
});

// Prevent menu from closing when clicking inside it
document.addEventListener('DOMContentLoaded', function () {
  const menuPanel = document.getElementById('menu-panel');
  if (menuPanel) {
    menuPanel.addEventListener('click', function (event) {
      event.stopPropagation();
    });
  }
});

// Handle window resize for responsive layout
function handleWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Adjust sidebar width based on window size
  const sidebar = document.querySelector(
    '.flex.flex-col.border-r.border-gray-700.bg-dark-surface'
  );
  if (sidebar) {
    if (width < 768) {
      sidebar.style.width = 'clamp(150px, 25vw, 200px)';
    } else if (width < 1024) {
      sidebar.style.width = 'clamp(200px, 25vw, 250px)';
    } else {
      sidebar.style.width = 'clamp(200px, 25vw, 300px)';
    }
  }

  // Handle preview panel visibility
  const previewPanel = document.querySelector('.bg-gray-800.flex-shrink-0');
  if (previewPanel) {
    if (width < 1024) {
      previewPanel.style.display = 'none';
    } else {
      previewPanel.style.display = 'block';
    }
  }

  // Adjust navigation layout for very small windows
  const navButtons = document.querySelector('.flex.gap-1.mx-2');
  if (navButtons && width < 480) {
    navButtons.style.flexDirection = 'column';
    navButtons.style.gap = '0.25rem';
  } else if (navButtons) {
    navButtons.style.flexDirection = 'row';
    navButtons.style.gap = '0.25rem';
  }
}

// Debounce function to limit resize calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add smooth transitions for layout changes
function addLayoutTransitions() {
  const sidebar = document.querySelector(
    '.flex.flex-col.border-r.border-gray-700.bg-dark-surface'
  );
  const previewPanel = document.querySelector('.bg-gray-800.flex-shrink-0');

  if (sidebar) {
    sidebar.style.transition = 'width 0.3s ease';
  }

  if (previewPanel) {
    previewPanel.style.transition = 'width 0.3s ease, opacity 0.3s ease';
  }
}

// Enhanced window resize handler with smooth transitions
function handleWindowResizeSmooth() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Add transitions first
  addLayoutTransitions();

  // Then apply changes
  setTimeout(() => {
    handleWindowResize();
  }, 10);
}

// Replace the existing resize listener
window.removeEventListener('resize', debounce(handleWindowResize, 100));
window.addEventListener('resize', debounce(handleWindowResizeSmooth, 100));

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  addLayoutTransitions();
  handleWindowResize();
});
