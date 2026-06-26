import requests
from bs4 import BeautifulSoup
import json
import re

url = "https://npb.jp/umpires/2026/roster_umpire.html"

res = requests.get(url)
res.encoding = res.apparent_encoding
soup = BeautifulSoup(res.text, "html.parser")

team_name = "審判"

result = []

# 審判は <a> タグの中に「番号 + 名前」が入っている
links = soup.find_all("a")

for a in links:
    text = a.get_text(strip=True)

    # 「数字 + 名前」になってるものだけ抽出
    # 例: "8郡司真里"
    match = re.match(r"^(\d+)\s*([^\d]+)$", text)

    if match:
        number = int(match.group(1))
        name = match.group(2).strip()

        result.append({
            "team": team_name,
            "name": name,
            "number": number
        })

# JSON出力
with open("umpires.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(json.dumps(result, ensure_ascii=False, indent=2))