#!/bin/bash

# Get the absolute path to the real script location, resolving symlinks
# If SCRIPT_DIR is already set (from parent script), use that instead
if [ -z "$SCRIPT_DIR" ]; then
  SOURCE="${BASH_SOURCE[0]}"
  while [ -h "$SOURCE" ]; do
    DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
  done
  SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
fi

#Show ASCII BANNER
source "scripts/setup/ascii_banner.sh"

#Create Flutter project
source "scripts/setup/init_flutter_project.sh"

#Choose form package manager
source "scripts/setup/select_packages.sh"

#Add packages and dependencies
source "scripts/setup/add_packages.sh"

#Generate templates
source "scripts/templates/main_template.sh"

#Choose IDE to open
source "scripts/pickers/pick_ide.sh"
