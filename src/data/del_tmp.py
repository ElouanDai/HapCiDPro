import os
import shutil

def delete_non_matching_directories(path, prefix):
    """删除不以指定前缀开始的所有目录"""
    for item in os.listdir(path):
        item_path = os.path.join(path, item)
        if os.path.isdir(item_path) and not item.startswith(prefix):
            print(f"Deleting directory: {item_path}")
            shutil.rmtree(item_path)
        else:
            print(f"Skipping: {item_path}")

def main():
    directory_path = './openharmony'
    prefix = 'openharmony__'
    delete_non_matching_directories(directory_path, prefix)

if __name__ == '__main__':
    main()
