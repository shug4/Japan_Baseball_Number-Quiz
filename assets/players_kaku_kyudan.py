import requests
from bs4 import BeautifulSoup
import json

url = "https://npb.jp/bis/teams/rst_s.html"

res = requests.get(url)
res.encoding = res.apparent_encoding
soup = BeautifulSoup(res.text, "html.parser")

team_name = "東京ヤクルトスワローズ"

players = []

# 全テーブル取得
tables = soup.find_all("table")

for table in tables:
    rows = table.find_all("tr")

    for row in rows:
        cols = row.find_all("td")

        # データ行は8列ある（No, 名前, 生年月日, ...）
        if len(cols) >= 2:
            number = cols[0].text.strip()
            name = cols[1].text.strip()

            # ヘッダーや監督除外
            if number.isdigit() or number == "00":
                players.append({
                    "team": team_name,
                    "name": name,
                    "number": int(number)
                })

# JSON表示
print(json.dumps(players, ensure_ascii=False, indent=2))