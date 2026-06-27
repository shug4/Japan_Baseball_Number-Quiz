import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

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

    match = re.match(r"^(\d+)\s*([^\d]+)$", text)

    if match:
        number = int(match.group(1))
        name = match.group(2).strip()

        # ------------------------
        # フィルタ条件（ここ追加）
        # ------------------------

        # 番号が異常（例: 2026など）は除外
        if number > 99:
            continue

        # 不要キーワードを含むものを除外
        NG_WORDS = ["ニュース", "年度", "シーズン", "候補者"]
        if any(ng in name for ng in NG_WORDS):
            continue

        # 名前が長すぎる（記事タイトル系を除外）
        if len(name) > 10:
            continue

        result.append({
            "team": team_name,
            "name": name,
            "number": number
        })


# ------------------------
# 出力（ファイル保存）
# ------------------------
today = datetime.now()
today_str = today.strftime("%Y%m%d")
filename = f"umpires{today_str}.json"

with open(filename, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"{filename} に保存しました")