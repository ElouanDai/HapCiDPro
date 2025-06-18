import requests

# 定义请求的URL模板和关键词
base_url = "https://api.github.com/search/repositories"
keyword = "openharmony"  # 你想要搜索的关键词
headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": "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"  # 将YOUR_GITHUB_TOKEN替换为你的GitHub访问令牌
}

# 存储仓库链接的列表
repository_links = []

# 请求前10页数据
for page in range(1, 11):
    params = {
        "q": keyword,
        "per_page": 30,  # 每页30个结果
        "page": page     # 第page页
    }
    
    print(f"正在获取第 {page} 页的数据...")  # 添加控制台输出
    
    # 发送GET请求
    response = requests.get(base_url, headers=headers, params=params)
    
    # 检查响应状态
    if response.status_code == 200:
        data = response.json()
        items = data.get("items", [])
        
        # 获取每个仓库的链接并添加到列表
        for item in items:
            repository_links.append(item["html_url"])
    else:
        print(f"请求失败，状态码: {response.status_code}")
        break

# 对仓库链接按字典序排序
repository_links.sort()

# 保存到文件
with open("github_openharmony_links.txt", "w") as file:
    for link in repository_links:
        file.write(link + "\n")

print(f"\n共获取到 {len(repository_links)} 个仓库链接，并已保存到 'github_openharmony_links.txt'")
