import os
import shutil

def is_harmony_app(dir_path):
    required_files = ['build-profile.json5']
    required_dir = 'entry'
    has_files = all(os.path.exists(os.path.join(dir_path, f)) for f in required_files)
    has_dir = os.path.exists(os.path.join(dir_path, required_dir))
    return has_files and has_dir

def copy_harmony_apps(source_dirs, target_base_dir):
    for source_dir in source_dirs:
        apps_index = {}
        repos_with_apps = []
        target_dir = os.path.join(target_base_dir, os.path.basename(source_dir))
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
        repo_contain_app_file = os.path.join(source_dir, 'repo_contain_app.txt')
        
        for repo_dir in os.listdir(source_dir):
            repo_path = os.path.join(source_dir, repo_dir)
            if not os.path.isdir(repo_path):
                continue  # Skip files
            for root, dirs, files in os.walk(repo_path):
                if is_harmony_app(root):
                    if repo_dir not in repos_with_apps:
                        repos_with_apps.append(repo_dir)
                    app_name = os.path.basename(root)
                    original_target_app_dir = os.path.join(target_dir, app_name)
                    target_app_dir = original_target_app_dir
                    counter = 1
                    while os.path.exists(target_app_dir):
                        target_app_dir = f"{original_target_app_dir}({counter})"
                        app_name = f"{os.path.basename(original_target_app_dir)}({counter})"
                        counter += 1
                    shutil.copytree(root, target_app_dir)
                    print(f"Copied: {os.path.basename(original_target_app_dir)} to {target_app_dir}")
                    apps_index[app_name] = os.path.abspath(root)
        
        # Write apps index
        with open(os.path.join(target_dir, 'harmony_apps_list.txt'), 'w') as file:
            for app_name, app_path in apps_index.items():
                file.write(f"{app_name}: {app_path}\n")
        
        # Write repos with apps
        with open(repo_contain_app_file, 'w') as file:
            for repo in repos_with_apps:
                file.write(f"{repo}\n")

def main():
    # source_dirs = ['./gitee', './github', './openharmony', './openharmony-tpc', './openharmony-sig']
    # source_dirs = ['./OHRepos250220/openharmony', './OHRepos250220/openharmony-tpc', './OHRepos250220/openharmony-sig', './OHRepos250220/gitee']
    source_dirs = ['./OHRepos250220/github']
    target_base_dir = "./OHApps250220"
    copy_harmony_apps(source_dirs, target_base_dir)

    print('Completed. Check the OHApps directory and repo_contain_app.txt files for details.')

if __name__ == "__main__":
    main()
