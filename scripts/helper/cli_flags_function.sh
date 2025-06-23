#!/bin/bash

source "scripts/templates/functions/assets_function.sh"
source "scripts/templates/functions/app_icon_function.sh"
source "scripts/templates/functions/splash_function.sh"
source "scripts/templates/functions/onBoarding_function.sh"
source "scripts/templates/functions/slidable_function.sh"
source "scripts/templates/functions/pull_to_refresh.sh"
source "scripts/templates/functions/actionSlider.sh"
source "scripts/templates/functions/googleNavBar.sh"
source "scripts/templates/functions/imagePicker.sh"
source "scripts/templates/functions/audioPlayers.sh"
source "scripts/templates/functions/videoPlayers.sh"
source "scripts/templates/functions/goRouter.sh"
source "scripts/templates/functions/flutterBloc.sh"
source "scripts/templates/functions/http.sh"
source "scripts/templates/functions/dio.sh"
source "scripts/templates/functions/retrofit.sh"
source "scripts/templates/functions/cached_network_image.sh"
source "scripts/templates/functions/connectivity_plus.sh"
source "scripts/templates/functions/internet_connection_checker.sh"
source "scripts/templates/functions/internet_connection_checker_plus.sh"
source "scripts/templates/functions/json_serializable.sh"
source "scripts/templates/functions/freezed.sh"
source "scripts/templates/functions/get_it.sh"
source "scripts/templates/functions/shared_preferences.sh"
source "scripts/templates/functions/cloud_firestore.sh"
source "scripts/templates/functions/supabase_service.sh"
source "scripts/templates/functions/local_auth.sh"
source "scripts/templates/functions/easy_localization.sh"
source "scripts/templates/functions/flutter_local_notifications.sh"
source "scripts/templates/permission/ios/google_sign_in_permission.sh"


# ------------------ CLI Flags ------------------
function show_help() {
  echo "🛠️  FluPilot CLI - Flutter Project Starter"
  echo ""
  echo "Usage:"
  echo "  FluPilotCLI [command]"
  echo ""
  echo "Available Commands:"
  echo ""
  echo "General:"
  echo "  --help, -h                      Show this help message"
  echo "  --version, -v                   Show CLI version"
  echo ""
  echo "Assets & UI:"
  echo "  --assets                        Add asset management configuration"
  echo "  --app-icon                      Configure app icon setup"
  echo "  --splash                        Add splash screen configuration"
  echo "  --onboarding                    Create onboarding screen templates"
  echo ""
  echo "UI Components:"
  echo "  --slidable                      Add slidable widget functionality"
  echo "  --pull-to-refresh              Add pull-to-refresh functionality"
  echo "  --action-slider                 Add action slider component"
  echo "  --google-nav-bar               Add Google-style navigation bar"
  echo ""
  echo "Media & Pickers:"
  echo "  --image-picker                  Add image picker functionality"
  echo "  --audio-player                  Add audio player capabilities"
  echo "  --video-player                  Add video player capabilities"
  echo ""
  echo "Navigation & State Management:"
  echo "  --go-router                     Add GoRouter for navigation"
  echo "  --flutter-bloc                  Add BLoC state management"
  echo ""
  echo "Networking:"
  echo "  --http                          Add HTTP client functionality"
  echo "  --dio                           Add Dio HTTP client"
  echo "  --retrofit                      Add Retrofit for API calls"
  echo "  --cached-network-image          Add cached network image loading"
  echo "  --check-internet                Add internet connectivity checking"
  echo ""
  echo "Data & Serialization:"
  echo "  --json-serializable             Add JSON serialization support"
  echo "  --freezed                       Add Freezed for immutable classes"
  echo "  --shared-preferences            Add local storage with SharedPreferences"
  echo ""
  echo "Dependency Injection:"
  echo "  --get-it                        Add GetIt service locator"
  echo ""
  echo "Backend Integration:"
  echo "  --firebase-init                 Initialize Firebase configuration"
  echo "  --firebase-auth                 Add Firebase authentication"
  echo "  --cloud-firestore              Add Cloud Firestore database"
  echo "  --supabase-auth                 Add Supabase authentication"
  echo "  --supabase-service              Add Supabase service integration"
  echo ""
  echo "Authentication & Security:"
  echo "  --google-sign-in                Add Google Sign-In functionality"
  echo "  --local-auth                    Add biometric/PIN authentication"
  echo ""
  echo "Localization & Notifications:"
  echo "  --easy-localization             Add multi-language support"
  echo "  --flutter-local-notifications   Add local notifications"
  echo ""
}

case "${1:-}" in
  --version|-v)
    # Read from package.json
    VERSION=$(node -p "require('./package.json').version")
    echo "FluPilot CLI $VERSION"
    exit 0
    ;;
  --help|-h)
    show_help
    exit 0
    ;;
  --assets)
    assets_function
      exit 0
      ;;
  --app-icon)
    app_icon_function
    exit 0
    ;;
  --splash)
    splash_function
    exit 0
    ;;
  --onboarding)
    onBoarding_function
    exit 0
    ;;
  --slidable)
    SlidableFunction
    exit 0
    ;;
  --pull-to-refresh)
  pullToRefresh
    exit 0
    ;;
  --action-slider)
    actionSlider
    exit 0
    ;;
  --google-nav-bar)
    googleNavBar
    exit 0
    ;;
  --image-picker)
    imagePicker
    exit 0
    ;;
  --audio-player)
    audioPlayers
    exit 0
    ;;
  --video-player)
    videoPlayers
    exit 0
    ;;
  --go-router)
    goRouter
    exit 0
    ;;
  --flutter-bloc)
    flutter_bloc
    exit 0
    ;;
  --http)
    http
    exit 0
    ;;
  --dio)
    dio
    exit 0
    ;;
  --retrofit)
    retrofit
    exit 0
    ;;
  --cached-network-image)
    cached_network_image
    exit 0
    ;;
  --check-internet)
    connectivity_plus
    internet_connection_checker
    internet_connection_checker_plus
    exit 0
    ;;
  --json-serializable)
    json_serializable
    exit 0
    ;;
  --freezed)
    freezed
    exit 0
    ;;
  --get-it)
    get_it
    exit 0
    ;;
  --shared-preferences)
    shared_preferences
    exit 0
    ;;
  --firebase-init)
    source "scripts/setup/setup_firebase.sh"
    exit 0
    ;;
  --firebase-auth)
    source "scripts/templates/features/auth/create_auth_structure.sh"
    exit 0
    ;;
  --cloud-firestore)
    cloud_firestore
    exit 0
    ;;
  --supabase-auth)
    source "scripts/templates/features/auth/create_auth_structure.sh"
    exit 0
    ;;
  --supabase-service)
    supabase_service
    exit 0
    ;;
  --google-sign-in)
    add_google_signin_ios_config
    exit 0
    ;;
  --local-auth)
    local_auth
    exit 0
    ;;
  --easy-localization)
    easy_localization
    exit 0
    ;;
  --flutter-local-notifications)
    flutter_local_notifications
    exit 0
    ;;
esac
