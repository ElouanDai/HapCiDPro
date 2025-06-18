import os
import time
import subprocess

source_dirs = [
    # './openharmony',
    # './openharmony-sig',
    # './openharmony-tpc',
    # './gitee',
    './github'
]
target_dir = './TraceUpdateHistory'

def get_tags(repo_path):
    print(f'Getting tags for repository: {repo_path}')
    
    result = subprocess.run(['git', 'tag', '--sort=-creatordate'], cwd=repo_path, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if result.returncode != 0:
        print(f"Error retrieving tags: {result.stderr.decode()}")
        return []
    
    tags = result.stdout.decode().splitlines()
    
    total_tags = len(tags)
    print(f'Total tags: {total_tags}')
    print(tags)
    
    return tags

def checkout_and_copy(repo_path, tag, target_repo_path):
    print(f'Checking out tag {tag} in {repo_path}')
    
    os.makedirs(target_repo_path, exist_ok=True)
    
    subprocess.run(['git', 'checkout', f'tags/{tag}'], cwd=repo_path, check=True)
    
    print(f'Copying contents from {repo_path} to {target_repo_path}')

    subprocess.run(['cp', '-r', os.path.join(repo_path, '.'), target_repo_path], check=True)
    print(f'Tag {tag} copied to {target_repo_path}')

def process_repo(repo_path, target_repo_dir):
    repo_name = os.path.basename(repo_path)
    print(f'Processing repository: {repo_name}')
    
    tags = get_tags(repo_path)
    
    if not tags:
        print(f"No tags found for {repo_name}")
        return
    
    for i, tag in enumerate(tags):
        target_repo_name = f"{i+1}_{tag}"
        target_repo_path = os.path.join(target_repo_dir, target_repo_name)
        checkout_and_copy(repo_path, tag, target_repo_path)
        print(f'Repository {target_repo_name} is ready.')

def process_source_dirs(source_dirs, target_dir):
    print(f'Creating target directory: {target_dir}')
    os.makedirs(target_dir, exist_ok=True)
    
    for source_dir in source_dirs:
        source_name = os.path.basename(source_dir.rstrip('/'))  # 删除尾随的斜杠，避免路径错误
        print(f'Processing repositories in source directory: {source_dir}')
        
        # 遍历 source_dir 中的每个仓库
        for repo_name in os.listdir(source_dir):
            repo_path = os.path.join(source_dir, repo_name)
            if os.path.isdir(repo_path):
                # 目标文件夹 ./TraceUpdateHistory/source_name/repo_name
                repo_target_dir = os.path.join(target_dir, source_name, repo_name)
                
                # 避免源目录和目标目录冲突，防止嵌套
                if os.path.commonpath([repo_path, target_dir]) == target_dir:
                    print(f"Skipping target directory to avoid circular copy: {repo_path}")
                    continue
                
                os.makedirs(repo_target_dir, exist_ok=True)
                
                # 处理仓库
                process_repo(repo_path, repo_target_dir)

if __name__ == "__main__":
    print('Starting repository processing...')
    process_source_dirs(source_dirs, target_dir)
    print('Repository processing completed.')
