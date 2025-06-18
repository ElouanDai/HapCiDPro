import requests

# 配置
GITEE_API_BASE_URL = "https://gitee.com/api/v5"
ACCESS_TOKEN = "8d1ff4065ea113709e5517ff1119aeb0"  # 在Gitee个人账户生成Access Token
SEARCH_KEYWORD = "openharmony"  # 要搜索的关键词
PER_PAGE = 20  # 每页结果数
TOTAL_PAGES = 10  # 要获取的总页数（如10页）

def search_gitee_repositories(keyword, page, per_page, access_token):
    url = f"{GITEE_API_BASE_URL}/search/repositories"
    params = {
        "q": keyword,
        "page": page,
        "per_page": per_page,
        "access_token": access_token
    }
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        return response.json()  # 返回搜索结果的JSON
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return []

def main():
    all_repo_links = []  # 存储所有仓库链接

    # 分页获取仓库信息
    for page in range(1, TOTAL_PAGES + 1):
        print(f"Fetching page {page}...")
        repos = search_gitee_repositories(SEARCH_KEYWORD, page, PER_PAGE, ACCESS_TOKEN)
        
        # 提取仓库链接
        for repo in repos:
            repo_link = repo.get('html_url')
            if repo_link:
                all_repo_links.append(repo_link)
        
        # 打印每页获取的链接
        print(f"Page {page} results:")
        for link in all_repo_links[-PER_PAGE:]:
            print(link)

    # 打印总共获取的链接数量
    print(f"Total repositories found: {len(all_repo_links)}")
    
    # 返回所有仓库链接
    return all_repo_links

if __name__ == "__main__":
    repo_links = main()
