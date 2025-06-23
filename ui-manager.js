/**
 * Enhanced Flutter Explorer with Project Management
 */

// Global variables
let projectManager = null;
let currentProject = null;
let searchQuery = ''; // Add search state

// Initialize the application
async function initializeApp() {
  try {
    console.log('Initializing Flutter Explorer...');

    // Initialize project manager
    projectManager = new ProjectManager();

    // Load initial project from JSON
    await loadInitialProject();

    // Load sample projects for demonstration
    await loadSampleProjects();

    // Initialize search functionality
    initializeSearch();

    // Render the UI
    renderProjectsList();
    renderCurrentProject();

    console.log('Flutter Explorer initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.getElementById('menu-search');
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      searchQuery = e.target.value.toLowerCase().trim();
      renderProjectsList(); // Re-render with filtered results
    });
  }
}

// Filter projects based on search query
function filterProjects(projects) {
  if (!searchQuery) {
    return projects;
  }

  return projects.filter(project => {
    const nameMatch = project.name.toLowerCase().startsWith(searchQuery);
    const categoryMatch = (project.category || '')
      .toLowerCase()
      .startsWith(searchQuery);
    const frameworkMatch = project.framework
      .toLowerCase()
      .startsWith(searchQuery);
    const descriptionMatch = (project.description || '')
      .toLowerCase()
      .startsWith(searchQuery);

    return nameMatch || categoryMatch || frameworkMatch || descriptionMatch;
  });
}

// Load the initial project from code-content.json
async function loadInitialProject() {
  try {
    console.log('Loading initial project...');
    const response = await fetch(
      './ui-projects-templates/record-selection-screen.json'
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();
    console.log('JSON data loaded:', jsonData);

    // Create the initial project
    const project = projectManager.loadProjectFromJSON(
      jsonData,
      'Record Selection Screen',
      './assets/records-selection.png',
      'Productivity'
    );

    currentProject = project;

    // Set the first file as active
    const allFiles = project.rootFolder.getAllFiles();
    if (allFiles.length > 0) {
      project.setActiveFile(allFiles[0].fullName);
    }

    console.log('Initial project loaded:', project);
    return project;
  } catch (error) {
    console.error('Error loading initial project:', error);
    // Create a fallback empty project
    const fallbackProject = new UIProjectModel(
      'Empty Project',
      'No content available'
    );
    projectManager.addProject(fallbackProject);
    projectManager.setActiveProject(fallbackProject.id);
    currentProject = fallbackProject;
  }
}

// Load sample projects for demonstration
async function loadSampleProjects() {
  try {
    // List of JSON files to load
    const projectFiles = [
      // initial project already loaded
      // Start with Second project
      {
        file: './ui-projects-templates/simple-account-setup-screen.json',
        name: 'Simple Account Setup Screen',
        preview: './assets/simple-account-setup.png',
        category: 'Account Setup',
      },
      {
        file: './ui-projects-templates/hypelist-ai-screen.json',
        name: 'Hypelist AI Screen',
        preview: './assets/hyperlist-ai.png',
        category: 'AI',
      },
      {
        file: './ui-projects-templates/screen-time-analytics-screen.json',
        name: 'Screen Time Analytics Screen',
        preview: './assets/screntime-analytics.png',
        category: 'Analytics',
      },
      {
        file: './ui-projects-templates/weekly-calendar-screen.json',
        name: 'Weekly Calendar Screen',
        preview: './assets/weekly-calender.png',
        category: 'Calendar',
      },
      {
        file: './ui-projects-templates/edit-dates-calendar-screen.json',
        name: 'Edit Dates Calendar Screen',
        preview: './assets/edit-dates-calender.png',
        category: 'Calendar',
      },
      {
        file: './ui-projects-templates/subway-order-screen.json',
        name: 'Subway Order Screen',
        preview: './assets/subway-cart.png',
        category: 'E-commerce',
      },
      {
        file: './ui-projects-templates/dark-chat-screen.json',
        name: 'Dark Chat Screen',
        preview: './assets/dark-chat.png',
        category: 'Communication',
      },
      {
        file: './ui-projects-templates/transaction-history-screen.json',
        name: 'Transaction History Screen',
        preview: './assets/crypto-transactions.png',
        category: 'Finance',
      },
      {
        file: './ui-projects-templates/drop-feedback-screen.json',
        name: 'Drop Feedback Screen',
        preview: './assets/drop-delete-account.png',
        category: 'Feedback',
      },
      {
        file: './ui-projects-templates/nike-shop-screen.json',
        name: 'Nike Shop Screen',
        preview: './assets/nike-ecommerce.png',
        category: 'E-commerce',
      },
      {
        file: './ui-projects-templates/invalid-access-empty-state.json',
        name: 'Invalid Access Empty State',
        preview: './assets/Invalid-access.png',
        category: 'Error',
      },
      {
        file: './ui-projects-templates/markets-news-feed.json',
        name: 'Markets News Feed',
        preview: './assets/market-news-feed.png',
        category: 'News',
      },
      {
        file: './ui-projects-templates/for-you-feed.json',
        name: 'For You Feed',
        preview: './assets/for-you-feed.png',
        category: 'Social',
      },
      {
        file: './ui-projects-templates/quote-feedback-screen.json',
        name: 'Quote Feedback Screen',
        preview: './assets/quote-feedback.png',
        category: 'Feedback',
      },
      {
        file: './ui-projects-templates/simple-feedback-view.json',
        name: 'Simple Feedback View',
        preview: './assets/simple-feedback.png',
        category: 'Feedback',
      },
      {
        file: './ui-projects-templates/size-filter-screen.json',
        name: 'Size Filter Screen',
        preview: './assets/size-filter.png',
        category: 'E-commerce',
      },
      {
        file: './ui-projects-templates/restaurant-detail-food-screen.json',
        name: 'Restaurant Detail Food Screen',
        preview: './assets/restaurant-details.png',
        category: 'Food & Dining',
      },
      {
        file: './ui-projects-templates/nbaid-creation-screen.json',
        name: 'NBAID Creation Screen',
        preview: './assets/create-nba-id-form.png',
        category: 'Account Setup',
      },
      {
        file: './ui-projects-templates/netflix-help-view.json',
        name: 'Netflix Help View',
        preview: './assets/netflix-help.png',
        category: 'Help & Support',
      },
      {
        file: './ui-projects-templates/booking-options-screen.json',
        name: 'Booking Options Screen',
        preview: './assets/booking-options.png',
        category: 'Travel & Booking',
      },
      {
        file: './ui-projects-templates/substack-home-view.json',
        name: 'Substack Home View',
        preview: './assets/substack-home.png',
        category: 'News',
      },
      {
        file: './ui-projects-templates/ratings-home-view.json',
        name: 'Ratings Home View',
        preview: './assets/explore-cosmos-home.png',
        category: 'Entertainment',
      },
      {
        file: './ui-projects-templates/recipe-home-view.json',
        name: 'Recipe Home View',
        preview: './assets/recipe-home.png',
        category: 'Food & Dining',
      },
      {
        file: './ui-projects-templates/pickup-location-view.json',
        name: 'Pickup Location View',
        preview: './assets/pickup-location.png',
        category: 'Travel & Booking',
      },
      {
        file: './ui-projects-templates/todoist_login_screen.json',
        name: 'Todoist Login Screen',
        preview: './assets/TodoistLoginScreen.png',
        category: 'Productivity',
      },
      {
        file: './ui-projects-templates/crypto-notifications-view.json',
        name: 'Crypto Notifications View',
        preview: './assets/crypto-notifications.png',
        category: 'Finance',
      },
      {
        file: './ui-projects-templates/headspace-welcome-screen.json',
        name: 'Headspace Welcome Screen',
        preview: './assets/headspace-onboarding.png',
        category: 'Health & Wellness',
      },
      {
        file: './ui-projects-templates/notion-onboarding-screen.json',
        name: 'Notion Onboarding Screen',
        preview: './assets/notion-onboarding.png',
        category: 'Productivity',
      },
      {
        file: './ui-projects-templates/adidas-order-packing.json',
        name: 'Adidas Order Packing',
        preview: './assets/adidas-order-details.png',
        category: 'E-commerce',
      },
      {
        file: './ui-projects-templates/public-premium-payment-view.json',
        name: 'Public Premium Payment View',
        preview: './assets/public-premium-payments.png',
        category: 'Finance',
      },
      {
        file: './ui-projects-templates/microphone-permission-screen.json',
        name: 'Microphone Permission Screen',
        preview: './assets/microphone-permissions.png',
        category: 'Productivity',
      },
      {
        file: './ui-projects-templates/nike-reviews-view.json',
        name: 'Nike Reviews View',
        preview: './assets/nike-reviews.png',
        category: 'E-commerce',
      },
      {
        file: './ui-projects-templates/emotions-search-screen.json',
        name: 'Emotions Search Screen',
        preview: './assets/emotions-search.png',
        category: 'Health & Wellness',
      },
      {
        file: './ui-projects-templates/templates-search-view.json',
        name: 'Templates Search Screen',
        preview: './assets/templates-search.png',
        category: 'Productivity',
      },
      {
        file: './ui-projects-templates/opalAge-selection-screen.json',
        name: 'Opal Age Selection Screen',
        preview: './assets/opal-age-selection.png',
        category: 'Productivity',
      },
      {
        file: './ui-projects-templates/preferences-selection-screen.json',
        name: 'Preferences Selection Screen',
        preview: './assets/preference-selection.png',
        category: 'Productivity',
      },
      {
        file: './ui-projects-templates/profile-settings2-view.json',
        name: 'Profile Settings 2 View',
        preview: './assets/profile-settings.png',
        category: 'Productivity',
      },
      {
        file: './ui-projects-templates/otp-verification-screen2.json',
        name: 'OTP Verification Screen 2',
        preview: './assets/otp-verification-2.png',
        category: 'Productivity',
      },
    ];

    for (const projectFile of projectFiles) {
      try {
        const response = await fetch(projectFile.file);
        if (response.ok) {
          const jsonData = await response.json();

          // Create project using the JSON data
          const project = projectManager.loadProjectFromJSON(
            jsonData,
            projectFile.name,
            projectFile.preview,
            projectFile.category || 'General'
          );

          console.log(`Loaded project: ${projectFile.name}`);
        }
      } catch (error) {
        console.log(`Could not load ${projectFile.name}:`, error);
      }
    }

    console.log('Sample projects loading completed');
  } catch (error) {
    console.log('Error in loadSampleProjects:', error);
  }
}

// Toggle hamburger menu
function toggleMenu() {
  const menuPanel = document.getElementById('menu-panel');
  if (!menuPanel) return;

  const isOpen = !menuPanel.classList.contains('-translate-x-full');
  const hamburgerButton = document.querySelector(
    'button[title="Open Projects Menu"]'
  );
  let overlay = document.getElementById('menu-overlay');

  if (isOpen) {
    // Close menu - slide out
    menuPanel.classList.add('-translate-x-full');

    // Show hamburger button when menu closes
    if (hamburgerButton) {
      hamburgerButton.style.opacity = '1';
      hamburgerButton.style.pointerEvents = 'auto';
      hamburgerButton.style.transform = 'scale(1)';
    }

    // Remove overlay
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  } else {
    // Open menu - slide in
    menuPanel.classList.remove('-translate-x-full');
    renderProjectsList(); // Refresh projects list

    // Hide hamburger button when menu opens
    if (hamburgerButton) {
      hamburgerButton.style.opacity = '0';
      hamburgerButton.style.pointerEvents = 'none';
      hamburgerButton.style.transform = 'scale(0.8)';
    }

    // Add overlay
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'menu-overlay';
      overlay.className = 'menu-overlay';
      overlay.onclick = toggleMenu; // Close menu when clicking overlay
      document.body.appendChild(overlay);
    }

    // Trigger overlay fade in after a brief delay
    setTimeout(() => {
      if (overlay) {
        overlay.classList.add('active');
      }
    }, 10);
  }
}

// Get category color for banner styling
function getCategoryColor(category) {
  const categoryColors = {
    'Account Setup': 'bg-gradient-to-r from-blue-500 to-blue-600',
    AI: 'bg-gradient-to-r from-purple-500 to-purple-600',
    Analytics: 'bg-gradient-to-r from-green-500 to-green-600',
    Calendar: 'bg-gradient-to-r from-orange-500 to-orange-600',
    'E-commerce': 'bg-gradient-to-r from-pink-500 to-pink-600',
    Communication: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
    Finance: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    Feedback: 'bg-gradient-to-r from-red-500 to-red-600',
    Error: 'bg-gradient-to-r from-red-600 to-red-700',
    News: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    Social: 'bg-gradient-to-r from-blue-400 to-blue-500',
    'Food & Dining': 'bg-gradient-to-r from-amber-500 to-amber-600',
    'Help & Support': 'bg-gradient-to-r from-gray-500 to-gray-600',
    'Travel & Booking': 'bg-gradient-to-r from-teal-500 to-teal-600',
    Entertainment: 'bg-gradient-to-r from-violet-500 to-violet-600',
    'Health & Wellness': 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    Productivity: 'bg-gradient-to-r from-slate-500 to-slate-600',
    Permissions: 'bg-gradient-to-r from-rose-500 to-rose-600',
    General: 'bg-gradient-to-r from-gray-400 to-gray-500',
  };
  return (
    categoryColors[category] || 'bg-gradient-to-r from-gray-400 to-gray-500'
  );
}

// Render projects list in the hamburger menu
function renderProjectsList() {
  const projectsList = document.getElementById('projects-list');
  if (!projectsList || !projectManager) return;

  const allProjects = projectManager.getAllProjects();
  const projects = filterProjects(allProjects);

  if (projects.length === 0) {
    projectsList.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <p class="text-lg">No components found</p>
        <p class="text-sm mt-2">Try adjusting your search terms</p>
      </div>
    `;
    return;
  }

  projectsList.innerHTML = projects
    .map(
      project => `
    <div class="project-card mb-4 p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-accent transition-colors relative ${
      currentProject && currentProject.id === project.id
        ? 'border-accent bg-dark-bg'
        : 'bg-code-bg'
    }"
         onclick="selectProject('${project.id}')">
      <!-- Category Banner -->
      <div class="absolute top-2 left-2 ${getCategoryColor(
        project.category || 'General'
      )} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/20 backdrop-blur-sm">
        ${project.category || 'General'}
      </div>

      <div class="flex items-start space-x-3 mt-8">
        ${
          project.previewImagePath
            ? `
          <img src="${project.previewImagePath}" alt="${project.name}"
               class="w-[110px] h-[200px] object-cover rounded border border-gray-600" />
        `
            : `
          <div class="w-12 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
            <span class="text-xl">${getFrameworkIcon(project.framework)}</span>
          </div>
        `
        }
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-white truncate">${project.name}</h3>
          <p class="text-sm text-gray-400 mt-1">${project.framework}</p>
          <p class="text-xs text-gray-500 mt-1">${
            project.rootFolder.getAllFiles().length
          } files</p>
          ${
            project.description
              ? `
            <p class="text-xs text-gray-400 mt-2 line-clamp-2">${project.description}</p>
          `
              : ''
          }
        </div>
        ${
          currentProject && currentProject.id === project.id
            ? `
          <div class="text-accent">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `
    )
    .join('');
}

// Get framework icon
function getFrameworkIcon(framework) {
  const icons = {
    flutter: '📱',
  };
  return icons[framework] || '📄';
}

// Select a project
function selectProject(projectId) {
  console.log('Selecting project:', projectId);
  const project = projectManager.setActiveProject(projectId);
  if (project) {
    console.log('Project selected:', project.name);
    currentProject = project;

    // Set the first file as active if no file is currently active
    const allFiles = project.rootFolder.getAllFiles();
    console.log(
      'Project files:',
      allFiles.map(f => f.fullName)
    );

    if (allFiles.length > 0) {
      const activeFile = project.setActiveFile(allFiles[0].fullName);
      console.log(
        'Active file set:',
        activeFile ? activeFile.fullName : 'none'
      );
    }

    renderCurrentProject();
    renderProjectsList(); // Refresh to show current selection

    // Close the menu after project selection
    toggleMenu();
  } else {
    console.error('Failed to select project:', projectId);
  }
}

// Render current project in the main UI
function renderCurrentProject() {
  if (!currentProject) return;

  // Update header
  updateProjectHeader();

  // Update sidebar
  updateSidebar();

  // Update main content
  updateMainContent();
}

// Update project header
function updateProjectHeader() {
  const projectTitle = document.getElementById('project-title');
  const projectLogo = document.getElementById('project-logo');

  if (projectTitle) {
    projectTitle.textContent = currentProject.name;
  }

  if (projectLogo) {
    // Update logo based on framework
    const logoUrls = {
      flutter: 'assets/flutter-original.svg',
    };

    projectLogo.src = logoUrls[currentProject.framework] || logoUrls['flutter'];
    projectLogo.alt = `${currentProject.framework} Logo`;
  }
}

// Update sidebar with current project structure
function updateSidebar() {
  if (!currentProject) return;

  // Update the project name in sidebar
  const projectNameElement = document.querySelector('.font-medium');
  if (projectNameElement) {
    projectNameElement.textContent = currentProject.name.toUpperCase();
  }

  // Render the file tree based on current project
  renderFileTree();
}

// Render file tree from project model
function renderFileTree() {
  if (!currentProject) return;

  const projectFilesContainer = document.getElementById('project-files');
  if (!projectFilesContainer) return;

  // Clear existing files
  projectFilesContainer.innerHTML = '';

  // Get all files from the project
  const allFiles = currentProject.rootFolder.getAllFiles();

  if (allFiles.length === 0) {
    projectFilesContainer.innerHTML = `
      <div class="flex items-center p-1 text-sm text-gray-400">
        <span class="mr-2">📄</span>
        <span>No files in this project</span>
      </div>
    `;
    return;
  }

  // Group files by their folder structure
  const filesByFolder = {};

  allFiles.forEach(file => {
    // For now, we'll put all files in the root
    // In a more complex implementation, you'd parse the folder structure
    if (!filesByFolder['root']) {
      filesByFolder['root'] = [];
    }
    filesByFolder['root'].push(file);
  });

  // Render files
  filesByFolder['root'].forEach(file => {
    const isActive =
      currentProject.activeFile &&
      currentProject.activeFile.fullName === file.fullName;

    const fileDiv = document.createElement('div');
    fileDiv.className = `flex items-center p-1 text-sm rounded cursor-pointer hover:text-white hover:bg-gray-700 file-item ${
      isActive ? 'text-blue-400 bg-gray-700 active' : 'text-gray-400'
    }`;

    fileDiv.onclick = () => selectFileFromProject(file.fullName);

    // Get file icon based on extension
    const fileIcon = getFileIcon(file.extension);

    fileDiv.innerHTML = `
      <span class="mr-2">${fileIcon}</span>
      <span>${file.fullName}</span>
    `;

    projectFilesContainer.appendChild(fileDiv);
  });
}

// Get file icon based on extension
function getFileIcon(extension) {
  const iconMap = {
    dart: '📄',
  };

  return iconMap[extension] || '📄';
}

// Select file from current project
function selectFileFromProject(filename) {
  if (!currentProject) return;

  const file = currentProject.setActiveFile(filename);
  if (file) {
    renderCodeFromFile(file);

    // Update the file selection visual state
    updateFileSelection(filename);
  }
}

// Update file selection visual state
function updateFileSelection(selectedFilename) {
  // Remove active state from all files
  const allFileItems = document.querySelectorAll('.file-item');
  allFileItems.forEach(item => {
    item.classList.remove('active', 'text-blue-400', 'bg-gray-700');
    item.classList.add('text-gray-400');
  });

  // Add active state to selected file
  allFileItems.forEach(item => {
    const filename = item.querySelector('span:last-child').textContent;
    if (filename === selectedFilename) {
      item.classList.add('active', 'text-blue-400', 'bg-gray-700');
      item.classList.remove('text-gray-400');
    }
  });
}

// Update main content area
function updateMainContent() {
  if (!currentProject) return;

  const activeFile = currentProject.getActiveFile();
  if (activeFile) {
    renderCodeFromFile(activeFile);
  }

  // Update preview image if available
  updatePreviewImage();
}

// Update preview image
function updatePreviewImage() {
  const previewImg = document.getElementById('preview-image');
  if (previewImg && currentProject && currentProject.previewImagePath) {
    previewImg.src = currentProject.previewImagePath;
    previewImg.alt = `${currentProject.name} Preview`;
    previewImg.style.display = 'block';
  } else if (previewImg) {
    // Set a default image if no preview is available
    previewImg.src = './assets/records-selection.png';
    previewImg.alt = 'Flutter App Preview';
    previewImg.style.display = 'block';
  }
}

// Render code from file model
function renderCodeFromFile(fileModel) {
  console.log('Rendering code from file model:', fileModel);

  const codeContainer = document.querySelector('#flutter-code .line-numbers');
  if (!codeContainer) return;

  // Clear existing content
  codeContainer.innerHTML = '';

  // Render each line
  fileModel.lines.forEach((lineData, index) => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'line';

    if (lineData.tokens.length === 0) {
      lineDiv.innerHTML = '&nbsp;';
    } else {
      let lineHTML = '';
      lineData.tokens.forEach(token => {
        const className = getTokenClassName(token.type);
        lineHTML += `<span class="${className}">${escapeHtml(
          token.text
        )}</span>`;
      });
      lineDiv.innerHTML = lineHTML;
    }

    codeContainer.appendChild(lineDiv);
  });
}

// Get CSS class for token type
function getTokenClassName(tokenType) {
  // Use current project's tokenTypes if available, otherwise fall back to defaults
  if (currentProject && currentProject.tokenTypes) {
    return (
      currentProject.tokenTypes[tokenType] ||
      currentProject.tokenTypes['default'] ||
      'text-white-300'
    );
  }

  // Fallback token classes if no project is loaded
  const defaultTokenClasses = {
    keyword: 'text-blue-400',
    string: 'text-green-400',
    comment: 'text-gray-500',
    number: 'text-orange-400',
    operator: 'text-purple-400',
    function: 'text-yellow-400',
    class: 'text-cyan-400',
    variable: 'text-white',
    default: 'text-gray-300',
  };

  return defaultTokenClasses[tokenType] || defaultTokenClasses['default'];
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// File selection function (keeping backward compatibility)
function selectFile(filename, language) {
  if (currentProject) {
    const file = currentProject.setActiveFile(filename);
    if (file) {
      renderCodeFromFile(file);
    }
  }
}

// Copy code function - now returns the content for other functions to use
function copyCode(event) {
  if (!currentProject) return null;

  const activeFile = currentProject.getActiveFile();
  if (activeFile) {
    const content = activeFile.getContent();

    // Copy to clipboard if this is called from a button click
    if (event) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          // Show success message
          const button = event.target.closest('button');
          if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '✓ Copied!';
            button.classList.add('bg-green-600');

            setTimeout(() => {
              button.innerHTML = originalText;
              button.classList.remove('bg-green-600');
            }, 2000);
          }
        })
        .catch(err => {
          console.error('Failed to copy code:', err);
        });
    }

    return content;
  }
  return null;
}

// Show notification helper function
function showWorkspaceNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);

  // Try to use existing notification system if available
  if (typeof showNotification === 'function') {
    showNotification(message, type);
    return;
  }

  // Create a simple notification element
  const notification = document.createElement('div');
  notification.className = `workspace-notification workspace-notification-${type}`;
  notification.textContent = message;

  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 350px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideInFromRight 0.3s ease-out;
    background-color: ${
      type === 'success'
        ? '#10b981'
        : type === 'error'
        ? '#ef4444'
        : type === 'warning'
        ? '#f59e0b'
        : '#3b82f6'
    };
  `;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutToRight 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Select project directory function
async function selectProjectDirectory() {
  try {
    // Use electron dialog to select directory
    if (window.electronAPI && window.electronAPI.showOpenDialog) {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Select Project Directory',
        properties: ['openDirectory'],
        buttonLabel: 'Select Folder',
      });

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
    }

    // Fallback: prompt for directory path
    const directoryPath = prompt(
      'Enter the project directory path:',
      process.cwd ? process.cwd() : '/Users'
    );
    if (directoryPath && directoryPath.trim()) {
      return directoryPath.trim();
    }

    throw new Error('No directory selected');
  } catch (error) {
    console.error('Failed to select project directory:', error);
    showWorkspaceNotification('Failed to select directory', 'error');
    return null;
  }
}

// Generate dart filename from current project
function generateDartFilename() {
  if (!currentProject) {
    return 'generated_code.dart';
  }

  // Get project name and clean it for filename
  const projectName = currentProject.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  return `${projectName}.dart`;
}

// Create new file function
async function createNewFile(projectDir, content) {
  if (!projectDir || !content) {
    throw new Error('Project directory and content are required');
  }

  try {
    // Generate filename
    const filename = generateDartFilename();
    const filePath = `${projectDir}/${filename}`;

    // Check if window.electronAPI is available for file operations
    if (window.electronAPI && window.electronAPI.createFile) {
      // Use IPC to create the file
      const result = await window.electronAPI.createFile(filePath, content);

      if (result.success) {
        showWorkspaceNotification(
          `File created successfully: ${filename}`,
          'success'
        );

        // Add to recent files if available
        if (window.electronAPI.addRecentFile) {
          await window.electronAPI.addRecentFile(filePath);
        }

        return {
          path: filePath,
          name: filename,
          success: true,
          setContent: newContent => {
            // Update file content
            return window.electronAPI.writeFileContent(filePath, newContent);
          },
        };
      } else {
        throw new Error('Failed to create file via IPC');
      }
    } else {
      // Fallback: show info about where the file would be created
      showWorkspaceNotification(
        `File would be created at: ${filePath}`,
        'info'
      );
      console.log('File content:', content);

      return {
        path: filePath,
        name: filename,
        success: true,
        setContent: newContent => {
          console.log('Would update file content:', newContent);
          return Promise.resolve({ success: true });
        },
      };
    }
  } catch (error) {
    console.error('Failed to create file:', error);
    showWorkspaceNotification(
      `Failed to create file: ${error.message}`,
      'error'
    );
    throw error;
  }
}

// Main function - Add Code To Workspace IDE
async function AddCodeToWorkSpaceIDE(event) {
  try {
    showWorkspaceNotification('Starting code export to workspace...', 'info');

    // Step 1: Copy current code
    const copiedCode = copyCode();
    if (!copiedCode) {
      throw new Error(
        'No code available to export. Please select a project file first.'
      );
    }

    console.log('Code copied successfully, length:', copiedCode.length);

    // Step 2: Select a project directory
    showWorkspaceNotification('Please select project directory...', 'info');
    const projectDir = await selectProjectDirectory();
    if (!projectDir) {
      throw new Error('No project directory selected');
    }

    console.log('Project directory selected:', projectDir);

    // Step 3: Create a new .dart file
    showWorkspaceNotification('Creating Dart file...', 'info');
    const newFile = await createNewFile(projectDir, copiedCode);

    if (newFile && newFile.success) {
      // Step 4: Optionally open the directory in terminal
      if (window.electronAPI && window.electronAPI.sendCommand) {
        // Change to the project directory in terminal
        const cdCommand = `cd "${projectDir}"`;
        await window.electronAPI.sendCommand(cdCommand);

        // List files to show the newly created file
        setTimeout(() => {
          if (window.electronAPI && window.electronAPI.sendCommand) {
            window.electronAPI.sendCommand('ls -la *.dart');
          }
        }, 500);
      }

      showWorkspaceNotification(
        `✅ Successfully exported code file ${newFile.name}!`,
        'success'
      );

      // Show success details in console
      console.log('File export completed successfully:', {
        path: newFile.path,
        name: newFile.name,
        codeLength: copiedCode.length,
        projectDirectory: projectDir,
      });
    } else {
      throw new Error('Failed to create the file');
    }
  } catch (error) {
    console.error('AddCodeToWorkSpaceIDE failed:', error);
    showWorkspaceNotification(`❌ Export failed: ${error.message}`, 'error');
  }
}

// Folder toggle function (keeping backward compatibility)
function toggleFolder(folderId) {
  const icon = document.getElementById(`${folderId}-icon`);
  const content = document.getElementById(`${folderId}-content`);

  if (icon && content) {
    const isExpanded = !content.classList.contains('hidden');

    if (isExpanded) {
      content.classList.add('hidden');
      icon.textContent = '📁';
    } else {
      content.classList.remove('hidden');
      icon.textContent = '📂';
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Legacy function for backward compatibility
async function loadCodeContent() {
  return await loadInitialProject();
}

// Legacy function for backward compatibility
function renderCode(language, filename) {
  selectFile(filename, language);
}
