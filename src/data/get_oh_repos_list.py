import requests

def get_openharmony_repos(page=1, per_page=100):
    """
    获取OpenHarmony组织下的所有仓库
    :param page: 当前页码
    :param per_page: 每页的仓库数量
    :return: 仓库列表
    """
    access_token = "8d1ff4065ea113709e5517ff1119aeb0"
    api_url = f"https://gitee.com/api/v5/orgs/openharmony/repos?type=all&page={page}&per_page={per_page}"
    headers = {'Authorization': f'Bearer {access_token}'}
    print(f"Fetching repositories from page {page}...")
    response = requests.get(api_url, headers=headers)
    
    if response.status_code == 200:
        print(f"Successfully fetched page {page} with {len(response.json())} repositories.")
        return response.json()
    else:
        print(f"Error fetching repositories: {response.status_code} on page {page}")
        return []

def main():
    repos = []
    page = 1
    total_repos_fetched = 0
    
    # 持续获取所有仓库直到没有新数据
    while True:
        current_repos = get_openharmony_repos(page=page)
        if not current_repos:
            print("No more repositories found.")
            break
        repos.extend(current_repos)
        total_repos_fetched += len(current_repos)
        print(f"Total repositories fetched so far: {total_repos_fetched}")
        page += 1

    # 准备三个分类的列表
    openharmony_repos = []
    sig_repos = []
    tpc_repos = []
    
    # 对仓库进行分类
    for repo in repos:
        repo_url = repo['html_url']
        repo_full_name = repo['full_name']
        
        if repo_full_name.startswith("openharmony/"):
            openharmony_repos.append(repo_url)
        elif repo_full_name.startswith("openharmony-sig/"):
            sig_repos.append(repo_url)
        elif repo_full_name.startswith("openharmony-tpc/"):
            tpc_repos.append(repo_url)

    # 将所有仓库链接字典排序
    all_repos_sorted = sorted([repo['html_url'] for repo in repos])
    openharmony_repos_sorted = sorted(openharmony_repos)
    sig_repos_sorted = sorted(sig_repos)
    tpc_repos_sorted = sorted(tpc_repos)

    # 写入文件并分类存储链接
    print("Writing repository links to files in alphabetical order...")
    with open("openharmony_repos_links-250220.txt", "w", encoding="utf-8") as file_oh, \
         open("openharmony-sig_repos_links-250220.txt", "w", encoding="utf-8") as file_sig, \
         open("openharmony-tpc_repos_links-250220.txt", "w", encoding="utf-8") as file_tpc, \
         open("openharmony_all_repos_links-250220.txt", "w", encoding="utf-8") as file_all:
        
        # 写入字典排序后的所有仓库链接
        for repo_url in all_repos_sorted:
            file_all.write(repo_url + "\n")
        
        # 写入字典排序后的分类仓库链接
        for repo_url in openharmony_repos_sorted:
            file_oh.write(repo_url + "\n")
        
        for repo_url in sig_repos_sorted:
            file_sig.write(repo_url + "\n")
        
        for repo_url in tpc_repos_sorted:
            file_tpc.write(repo_url + "\n")

    print(f"Total {len(repos)} repositories have been written to their respective files in alphabetical order.")
    print("Process completed successfully.")

if __name__ == "__main__":
    main()
