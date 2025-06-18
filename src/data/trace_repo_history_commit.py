import os
import shutil
import subprocess

source_dir = '/home/daihang/hdd/Data/ArkCiD/github'
target_dir = '/home/daihang/hdd/Data/ArkCiD/TraceUpdateHistory/github'

def get_commit_hashes(repo_path, num_commits=20):
    print(f'Getting commit hashes for repository: {repo_path}')
    # 移除 shell=True，并将命令以列表形式传递
    result = subprocess.run(['git', 'rev-list', '--reverse', 'HEAD'], cwd=repo_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if result.returncode != 0:
        print(f"Error getting commit hashes: {result.stderr.decode()}")
        return []
    
    commits = result.stdout.decode().split()
    
    total_commits = len(commits)
    print(f'Total commits: {total_commits}')
    
    if total_commits <= num_commits:
        print(f'Less than or equal to {num_commits} commits, taking all commits.')
        return commits
    else:
        step = total_commits // num_commits
        print(f'Using step size: {step}')
        return [commits[i * step] for i in range(num_commits)]

def clone_and_checkout(repo_path, target_repo_path, commit_hash):
    print(f'Cloning repository from {repo_path} to {target_repo_path}')
    shutil.copytree(repo_path, target_repo_path)
    
    print(f'Checking out commit {commit_hash} in {target_repo_path}')
    subprocess.run(['git', 'checkout', commit_hash], cwd=target_repo_path)
    print(f'Checked out commit {commit_hash[:7]}')

def process_repos(source_dir, target_dir, num_commits=20):
    print(f'Creating target directory: {target_dir}')
    os.makedirs(target_dir, exist_ok=True)

    # 获取source_dir下所有的子目录，表示所有的git仓库
    repos_to_process = [repo for repo in os.listdir(source_dir) if os.path.isdir(os.path.join(source_dir, repo))]

    for repo_name in repos_to_process:
        repo_path = os.path.join(source_dir, repo_name)
        if os.path.isdir(repo_path):
            print(f'Processing repository: {repo_name}')
            repo_target_dir = os.path.join(target_dir, repo_name)
            os.makedirs(repo_target_dir, exist_ok=True)

            commit_hashes = get_commit_hashes(repo_path, num_commits)
            
            for i, commit_hash in enumerate(commit_hashes):
                target_repo_name = f"{repo_name}_{i+1}_{commit_hash[:7]}"
                target_repo_path = os.path.join(repo_target_dir, target_repo_name)
                clone_and_checkout(repo_path, target_repo_path, commit_hash)
                print(f'Repository {target_repo_name} is ready.')

if __name__ == "__main__":
    print('Starting repository processing...')
    process_repos(source_dir, target_dir)
    print('Repository processing completed.')
