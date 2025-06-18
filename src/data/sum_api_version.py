import os
import json5
from collections import Counter
import sys

def find_build_profiles(root_dir):
    """Find all build-profile.json5 files in the immediate subdirectories of the root directory."""
    build_profiles = []
    for entry in os.scandir(root_dir):
        if entry.is_dir():  # Only check subdirectories
            profile_path = os.path.join(entry.path, "build-profile.json5")
            if os.path.isfile(profile_path):
                build_profiles.append(profile_path)
    return build_profiles

def find_key_recursively(data, key):
    """Recursively search for a key in a nested dictionary."""
    if isinstance(data, dict):
        if key in data:
            return data[key]
        for value in data.values():
            result = find_key_recursively(value, key)
            if result is not None:
                return result
    elif isinstance(data, list):
        for item in data:
            result = find_key_recursively(item, key)
            if result is not None:
                return result
    return None

def extract_sdk_version(file_path):
    """Extract compileSdkVersion or compatibleSdkVersion from a build-profile.json5 file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json5.load(file)
            # Try to find compileSdkVersion first
            version = find_key_recursively(data, "compileSdkVersion")
            if version is None:
                # If not found, try compatibleSdkVersion
                version = find_key_recursively(data, "compatibleSdkVersion")
            if version is not None:
                return str(version)  # Ensure version is a string
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return None

def main():
    # Get the target directory from command-line arguments
    if len(sys.argv) > 1:
        root_dir = sys.argv[1]
    else:
        root_dir = os.getcwd()  # Default to current directory

    if not os.path.isdir(root_dir):
        print(f"Error: {root_dir} is not a valid directory.")
        return

    build_profiles = find_build_profiles(root_dir)
    sdk_versions = []
    unrecognized_files = []

    for profile in build_profiles:
        version = extract_sdk_version(profile)
        if version is not None:
            sdk_versions.append(version)
        else:
            sdk_versions.append("None")  # Record as None if not recognized
            unrecognized_files.append(profile)

    # Count occurrences of each API version
    version_counts = Counter(sdk_versions)

    # Print the results sorted by dictionary order
    for version, count in sorted(version_counts.items(), key=lambda x: x[0]):
        print(f"{version}: {count}")

    # Output unrecognized files
    if unrecognized_files:
        print("\nUnrecognized files (missing compileSdkVersion and compatibleSdkVersion):")
        for file_path in unrecognized_files:
            print(file_path)

if __name__ == "__main__":
    main()