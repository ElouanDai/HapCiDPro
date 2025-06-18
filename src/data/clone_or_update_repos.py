import os

# Define a function to clone or update repositories
def clone_or_update_repos(input_file, output_dir):
    with open(input_file, 'r') as file:
        for line in file:
            repo_url = line.strip()
            repo_name = repo_url.split('/')[-1].replace('.git', '')  # Extract repository name from URL
            
            # Extract the username from the repository URL
            if 'github.com' in repo_url:
                username = repo_url.split('/')[3]
            elif 'gitee.com' in repo_url:
                username = repo_url.split('/')[3]
            else:
                username = "unknown"
            
            folder_name = f'{username}__{repo_name}'  # Construct the target folder name
            repo_path = os.path.join(output_dir, folder_name)  # Full path to the repository
            
            # Check if the repository directory already exists
            if os.path.exists(repo_path):
                # If it exists, update the repository
                print(f'Updating existing repository: {repo_path}')
                os.system(f'cd {repo_path} && git pull')
            else:
                # If it does not exist, clone the repository
                print(f'Cloning repository: {repo_url} into {repo_path}')
                os.makedirs(repo_path, exist_ok=True)  # Create the directory if it doesn't exist
                os.system(f'git clone {repo_url} {repo_path}')  # Clone the repository into the directory

# Clone or update openharmony-sig repositories
# clone_or_update_repos('openharmony-sig_repos_links-250220.txt', 'OHRepos250220/openharmony-sig')

# Clone or update openharmony-tpc repositories
# clone_or_update_repos('openharmony-tpc_repos_links-250220.txt', 'OHRepos250220/openharmony-tpc')

# Clone or update openharmony repositories
# clone_or_update_repos('openharmony_repos_links-250220.txt', 'OHRepos250220/openharmony')

# # Clone or update gitee repositories
# clone_or_update_repos('gitee_openharmony_links.txt', 'OHRepos250220/gitee')

# # Clone or update github repositories
clone_or_update_repos('github_openharmony_links.txt', 'OHRepos250220/github')
