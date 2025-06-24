#!/bin/bash

source "scripts/templates/functions/connectivity_plus.sh"
source "scripts/templates/functions/internet_connection_checker.sh"
source "scripts/templates/functions/internet_connection_checker_plus.sh"

function internet_connection() {
  echo "🛠️ Adding Internet Connection Checker files in your Flutter project"

  # Call the functions from the sourced scripts
  connectivity_plus
  internet_connection_checker
  internet_connection_checker_plus

  echo "✅ Internet Connection Checker files added successfully."
}

export -f internet_connection
