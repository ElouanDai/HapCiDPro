import os
import shutil

def delete_non_matching_dirs(base_path):
    """
    Delete all directories in the specified path that do not start with 'openharmony__'.
    
    :param base_path: The path to the directory to clean up.
    """
    # Iterate through all items in the base directory
    for item in os.listdir(base_path):
        item_path = os.path.join(base_path, item)
        
        # Check if the item is a directory and does not start with 'openharmony__'
        if os.path.isdir(item_path) and not item.startswith('openharmony__'):
            print(f"Deleting directory: {item_path}")
            shutil.rmtree(item_path)  # Delete the directory and its contents

if __name__ == "__main__":
    # Define the base path
    base_directory = "/home/daihang/hdd/Data/ArkCiD/OHRepos250220/openharmony"
    
    # Call the function to delete non-matching directories
    delete_non_matching_dirs(base_directory)