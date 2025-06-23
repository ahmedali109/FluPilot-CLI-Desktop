/**
 * Model classes for Flutter Project Explorer
 */

// Token model for code syntax highlighting
class Token {
  constructor(text, type = "default") {
    this.text = text;
    this.type = type;
  }
}

// Code line model
class CodeLine {
  constructor(content = "", tokens = []) {
    this.content = content;
    this.tokens = tokens.map((token) =>
      token instanceof Token ? token : new Token(token.text, token.type)
    );
  }
}

// File model
class FileModel {
  constructor(name, extension, lines = [], previewImagePath = null) {
    this.name = name;
    this.extension = extension;
    this.fullName = `${name}.${extension}`;
    this.lines = lines.map((line) =>
      line instanceof CodeLine ? line : new CodeLine(line.content, line.tokens)
    );
    this.previewImagePath = previewImagePath;
    this.isOpen = false;
  }

  // Get file content as string
  getContent() {
    return this.lines.map((line) => line.content).join("\n");
  }

  // Get line count
  getLineCount() {
    return this.lines.length;
  }
}

// Folder model
class FolderModel {
  constructor(name, isExpanded = false) {
    this.name = name;
    this.isExpanded = isExpanded;
    this.files = new Map(); // filename -> FileModel
    this.subfolders = new Map(); // foldername -> FolderModel
  }

  // Add a file to this folder
  addFile(fileModel) {
    this.files.set(fileModel.fullName, fileModel);
  }

  // Add a subfolder
  addSubfolder(folderModel) {
    this.subfolders.set(folderModel.name, folderModel);
  }

  // Get all files recursively
  getAllFiles() {
    const allFiles = [];

    // Add files from this folder
    this.files.forEach((file) => allFiles.push(file));

    // Add files from subfolders
    this.subfolders.forEach((subfolder) => {
      allFiles.push(...subfolder.getAllFiles());
    });

    return allFiles;
  }

  // Get folder structure as tree
  getTree() {
    const tree = {
      name: this.name,
      type: "folder",
      isExpanded: this.isExpanded,
      children: [],
    };

    // Add subfolders
    this.subfolders.forEach((subfolder) => {
      tree.children.push(subfolder.getTree());
    });

    // Add files
    this.files.forEach((file) => {
      tree.children.push({
        name: file.fullName,
        type: "file",
        extension: file.extension,
        previewImagePath: file.previewImagePath,
        isOpen: file.isOpen,
      });
    });

    return tree;
  }
}

// UI/Project model - represents a complete UI project
class UIProjectModel {
  constructor(
    name,
    description = "",
    previewImagePath = null,
    framework = "flutter",
    tokenTypes = null,
    category = "General"
  ) {
    this.id = this.generateId();
    this.name = name;
    this.description = description;
    this.previewImagePath = previewImagePath;
    this.framework = framework;
    this.category = category;
    this.rootFolder = new FolderModel(name);
    this.activeFile = null;
    this.createdAt = new Date();
    this.tokenTypes = tokenTypes || this.getDefaultTokenTypes();
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get default token types
  getDefaultTokenTypes() {
    return {
      text: "text-red-300",
      keyword: "text-purple-400",
      string: "text-green-400",
      widget: "text-blue-400",
      class: "text-yellow-400",
      method: "text-green-400",
      property: "text-yellow-400",
      number: "text-orange-400",
      annotation: "text-gray-500",
      comment: "text-gray-500",
      operator: "text-purple-400",
      function: "text-yellow-400",
      variable: "text-white",
      default: "text-gray-300",
    };
  }

  // Set active file
  setActiveFile(filename) {
    // First, mark all files as not open
    this.rootFolder.getAllFiles().forEach((file) => (file.isOpen = false));

    // Find and open the specified file
    const allFiles = this.rootFolder.getAllFiles();
    const targetFile = allFiles.find((file) => file.fullName === filename);

    if (targetFile) {
      targetFile.isOpen = true;
      this.activeFile = targetFile;
      return targetFile;
    }

    return null;
  }

  // Get active file
  getActiveFile() {
    return this.activeFile;
  }

  // Add file to root or specific folder path
  addFile(fileModel, folderPath = []) {
    let targetFolder = this.rootFolder;

    // Navigate to target folder
    for (const folderName of folderPath) {
      if (!targetFolder.subfolders.has(folderName)) {
        targetFolder.addSubfolder(new FolderModel(folderName));
      }
      targetFolder = targetFolder.subfolders.get(folderName);
    }

    targetFolder.addFile(fileModel);
  }

  // Get project structure as JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      previewImagePath: this.previewImagePath,
      framework: this.framework,
      category: this.category,
      structure: this.rootFolder.getTree(),
      activeFile: this.activeFile ? this.activeFile.fullName : null,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

// Project Manager - manages multiple UI projects
class ProjectManager {
  constructor() {
    this.projects = new Map(); // projectId -> UIProjectModel
    this.activeProject = null;
  }

  // Add a new project
  addProject(projectModel) {
    this.projects.set(projectModel.id, projectModel);
    return projectModel.id;
  }

  // Set active project
  setActiveProject(projectId) {
    if (this.projects.has(projectId)) {
      this.activeProject = this.projects.get(projectId);
      return this.activeProject;
    }
    return null;
  }

  // Get active project
  getActiveProject() {
    return this.activeProject;
  }

  // Get all projects
  getAllProjects() {
    return Array.from(this.projects.values());
  }

  // Remove project
  removeProject(projectId) {
    if (this.activeProject && this.activeProject.id === projectId) {
      this.activeProject = null;
    }
    return this.projects.delete(projectId);
  }

  // Load project from JSON data (like your current code-content.json)
  loadProjectFromJSON(
    jsonData,
    projectName = "Flutter Project",
    previewImagePath = null,
    category = "General"
  ) {
    // Extract tokenTypes from JSON if available
    const tokenTypes = jsonData.tokenTypes || null;

    const project = new UIProjectModel(
      projectName,
      "",
      previewImagePath,
      "flutter",
      tokenTypes,
      category
    );

    // Process each language/framework
    Object.keys(jsonData).forEach((framework) => {
      if (framework === "tokenTypes") return; // Skip token types

      const files = jsonData[framework];
      Object.keys(files).forEach((filename) => {
        const fileData = files[filename];

        // Extract name and extension
        const lastDotIndex = filename.lastIndexOf(".");
        const name =
          lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
        const extension =
          lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "";

        // Create code lines
        const lines = fileData.lines || [];
        const codeLines = lines.map(
          (lineData) => new CodeLine(lineData.content, lineData.tokens)
        );

        // Create file model
        const fileModel = new FileModel(name, extension, codeLines);

        // Add to project (you could organize by framework folder)
        project.addFile(fileModel, [framework]);
      });
    });

    // Add the project to manager
    const projectId = this.addProject(project);
    this.setActiveProject(projectId);

    return project;
  }

  // Export all projects to JSON
  exportToJSON() {
    const exported = {
      projects: [],
      activeProjectId: this.activeProject ? this.activeProject.id : null,
      exportedAt: new Date().toISOString(),
    };

    this.projects.forEach((project) => {
      exported.projects.push(project.toJSON());
    });

    return exported;
  }
}

// Export for use in other files
if (typeof window !== "undefined") {
  window.Token = Token;
  window.CodeLine = CodeLine;
  window.FileModel = FileModel;
  window.FolderModel = FolderModel;
  window.UIProjectModel = UIProjectModel;
  window.ProjectManager = ProjectManager;
}

// For Node.js environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    Token,
    CodeLine,
    FileModel,
    FolderModel,
    UIProjectModel,
    ProjectManager,
  };
}
