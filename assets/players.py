import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

today = datetime.now().strftime("%Y%m%d")

folder_main = f"datasets{today}"
folder_ikusei = f"datasets_ikusei{today}"

os.makedirs(folder_main, exist_ok=True)
os.makedirs(folder_ikusei, exist_ok=True)

teams = {
    "横浜DeNAベイスターズ": {"url": "https://npb.jp/bis/teams/rst_db.html", "file": "baystars"},
    "オリックス・バファローズ": {"url": "https://npb.jp/bis/teams/rst_b.html", "file": "buffaloes"},
    "広島東洋カープ": {"url": "https://npb.jp/bis/teams/rst_c.html", "file": "carp"},
    "中日ドラゴンズ": {"url": "https://npb.jp/bis/teams/rst_d.html", "file": "dragons"},
    "東北楽天ゴールデンイーグルス": {"url": "https://npb.jp/bis/teams/rst_e.html", "file": "eagles"},
    "北海道日本ハムファイターズ": {"url": "https://npb.jp/bis/teams/rst_f.html", "file": "fighters"},
    "読売ジャイアンツ": {"url": "https://npb.jp/bis/teams/rst_g.html", "file": "giants"},
    "福岡ソフトバンクホークス": {"url": "https://npb.jp/bis/teams/rst_h.html", "file": "hawks"},
    "埼玉西武ライオンズ": {"url": "https://npb.jp/bis/teams/rst_l.html", "file": "lions"},
    "千葉ロッテマリーンズ": {"url": "https://npb.jp/bis/teams/rst_m.html", "file": "marines"},
    "東京ヤクルトスワローズ": {"url": "https://npb.jp/bis/teams/rst_s.html", "file": "swallows"},
    "阪神タイガース": {"url": "https://npb.jp/bis/teams/rst_t.html", "file": "tigers"}
}

for team_name, info in teams.items():
    res = requests.get(info["url"])
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "html.parser")

    shihai_players = []
    ikusei_players = []

    tables = soup.find_all("table")
    current_type = None

    for table in tables:
        # 見出しで支配下/育成切替
        prev = table.find_previous(["h2", "h3"])
        if prev:
            text = prev.text.strip()
            if "育成" in text:
                current_type = "ikusei"
            elif "支配下" in text:
                current_type = "shihai"

        rows = table.find_all("tr")

        for row in rows:
            # ✅ ★ここが最重要★
            classes = row.get("class", [])

            if "rosterPlayer" not in classes:
                continue  # 在籍選手以外は全排除

            cols = row.find_all("td")

            if len(cols) >= 2:
                number = cols[0].text.strip()
                name = cols[1].text.strip()

                if number.isdigit() or number == "00":
                    player_data = {
                        "team": team_name,
                        "name": name,
                        "number": int(number)
                    }

                    if current_type == "ikusei":
                        ikusei_players.append(player_data)
                    elif current_type == "shihai":
                        shihai_players.append(player_data)

    # 保存
    with open(os.path.join(folder_main, f"{info['file']}.json"), "w", encoding="utf-8") as f:
        json.dump(shihai_players, f, ensure_ascii=False, indent=2)

    with open(os.path.join(folder_ikusei, f"{info['file']}_ikusei.json"), "w", encoding="utf-8") as f:
        json.dump(ikusei_players, f, ensure_ascii=False, indent=2)

    print(f"{team_name} 完了")

print("✅ 完全版：在籍選手のみ＋支配下/育成分離 完了")
