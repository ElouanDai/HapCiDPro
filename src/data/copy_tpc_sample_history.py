import os
import shutil

def move_folders(source_directory, destination_directory):
    # 创建目标目录，如果不存在的话
    if not os.path.exists(destination_directory):
        os.makedirs(destination_directory)

    # 遍历源目录下的所有文件夹
    for folder in os.listdir(source_directory):
        folder_path = os.path.join(source_directory, folder)

        if os.path.isdir(folder_path):
            try:
                # 提取文件夹名开头的数字
                number = int(folder.split('_')[0])
            except ValueError:
                # 如果不能转换为 int 类型，跳过该文件夹
                continue

            # 检查数字是否能被10整除
            if number % 10 != 0:
                # 移动文件夹到目标文件夹
                shutil.move(folder_path, os.path.join(destination_directory, folder))

if __name__ == "__main__":
    source_dir = "./TraceUpdateHistory/openharmony-tpc/openharmony-tpc__openharmony_tpc_samples"
    dest_dir = "./TraceUpdateHistory/tpc_sample_copies"
    move_folders(source_dir, dest_dir)
