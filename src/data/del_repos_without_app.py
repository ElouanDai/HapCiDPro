import os
import shutil

# 定义要处理的文件夹
directories = [
    './OHRepos1021/openharmony',
    './OHRepos1021/openharmony-sig',
    './OHRepos1021/openharmony-tpc',
    # './gitee',
    # './github'
]

# 遍历每个主目录
for directory in directories:
    repo_file = os.path.join(directory, 'repo_contain_app.txt')
    
    # 如果 repo_contain_app.txt 文件存在
    if os.path.exists(repo_file):
        # 读取 repo_contain_app.txt 中需要保留的仓库
        with open(repo_file, 'r') as f:
            repos_to_keep = [repo.strip() for repo in f.readlines()]
        
        # 列出目录中的所有文件夹
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)

            # 如果是目录且不在 repo_contain_app.txt 中，则删除
            if os.path.isdir(item_path) and item not in repos_to_keep:
                print(f"删除目录: {item_path}")
                try:
                    shutil.rmtree(item_path)  # 递归删除整个目录
                    print(f"成功删除: {item_path}")
                except Exception as e:
                    print(f"删除 {item_path} 失败: {e}")
            elif os.path.isdir(item_path):
                print(f"保留目录: {item_path}")
    else:
        print(f"未找到 {repo_file}，跳过 {directory}")

print("操作完成。")
