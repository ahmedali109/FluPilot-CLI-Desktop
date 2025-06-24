#!/bin/bash
source "scripts/templates/gen/app_regex.sh"
source "scripts/templates/gen/extensions.sh"
source "scripts/templates/gen/spacing.sh"
source "scripts/templates/gen/app_strings.sh"
source "scripts/templates/gen/theme.sh"

function create_helpers() {
  appRegex
  extensions
  spacing
  appStrings
  themeConfigure
}

export -f create_helpers
