import os
import subprocess

# 定义要处理的文件夹
directories = [
    # './openharmony',
    # './openharmony-sig',
    # './openharmony-tpc',
    # './gitee',
    './github'
]

# 遍历每个目录
for directory in directories:
    # 遍历该目录下的所有子文件夹（仓库）
    for root, dirs, files in os.walk(directory):
        for subdir in dirs:
            repo_path = os.path.join(root, subdir)
            # 进入仓库目录
            os.chdir(repo_path)
            print(f"处理仓库: {repo_path}")
            try:
                # 执行 git add .
                subprocess.run(['git', 'add', '.'], check=True)
                print(f"已执行 git add . 在 {repo_path}")
                
                # 执行 git reset --hard
                subprocess.run(['git', 'reset', '--hard'], check=True)
                print(f"已执行 git reset --hard 在 {repo_path}")
            except subprocess.CalledProcessError as e:
                print(f"在 {repo_path} 执行 git 命令失败: {e}")
            # 返回上一级目录
            os.chdir('../../')

print("操作完成。")
