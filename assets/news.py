import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime

URLS = [
    "https://npb.jp/bis/teams/rst_t.html",
    "https://npb.jp/bis/teams/rst_yb.html",
    "https://npb.jp/bis/teams/rst_g.html",
    "https://npb.jp/bis/teams/rst_d.html",
    "https://npb.jp/bis/teams/rst_c.html",
    "https://npb.jp/bis/teams/rst_s.html",
    "https://npb.jp/bis/teams/rst_h.html",
    "https://npb.jp/bis/teams/rst_f.html",
    "https://npb.jp/bis/teams/rst_b.html",
    "https://npb.jp/bis/teams/rst_e.html",
    "https://npb.jp/bis/teams/rst_l.html",
    "https://npb.jp/bis/teams/rst_m.html"
]

TEAM_MAP = {
    "t": "阪神",
    "yb": "DeNA",
    "g": "巨人",
    "d": "中日",
    "c": "広島",
    "s": "ヤクルト",
    "h": "ソフトバンク",
    "f": "日本ハム",
    "b": "オリックス",
    "e": "楽天",
    "l": "西武",
    "m": "ロッテ"
}


def normalize_position(pos):
    return pos if pos in ["投手", "監督"] else "選手"


def normalize_name(name):
    return name.replace("　", " ")


def extract_date(note):
    m = re.match(r'(\d{1,2})/(\d{1,2})', note)
    if not m:
        return None
    return f"2026.{int(m.group(1))}.{int(m.group(2))}"


def clean_note(note):
    return re.sub(r'^\d{1,2}/\d{1,2}\s*', '', note).strip()


def convert_text(note, team_name):
    t = clean_note(note)

    if "育成選手から支配下選手へ移行" in t:
        return f"育成から支配下へ移行（{team_name}）"

    if "育成選手登録" in t:
        return f"育成選手登録（{team_name}）"

    if "移籍" in t:
        m = re.search(r'(.+?)より(.+?)へ移籍', t)
        if m:
            return f"{m.group(1)} ⇒ {m.group(2)}へ移籍"

        m = re.search(r'(.+?)へ移籍', t)
        if m:
            return f"{team_name} ⇒ {m.group(1)}へ移籍"

    return t


def parse_team(url):
    team_code = re.search(r"rst_(\w+)\.html", url).group(1)
    team_name = TEAM_MAP.get(team_code, "")

    res = requests.get(url)
    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "html.parser")

    rows = soup.select("table tr")
    current_position = None
    temp = []

    for tr in rows:
        cols = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]

        if len(cols) >= 2 and cols[1] in ["投手", "捕手", "内野手", "外野手", "監督"]:
            current_position = cols[1]
            continue

        if len(cols) == 8:
            name = normalize_name(cols[1])
            note = cols[7]

            if note:
                date = extract_date(note)
                if not date:
                    continue

                text = convert_text(note, team_name)

                temp.append({
                    "date": date,
                    "name": name,
                    "position": normalize_position(current_position),
                    "text": text
                })

    return temp


# ------------------------
# 実行
# ------------------------
all_data = []
for url in URLS:
    all_data.extend(parse_team(url))


# ------------------------
# 重複削除
# ------------------------
unique = {}
for item in all_data:
    key = (item["date"], item["name"], item["text"])
    if key not in unique:
        unique[key] = item

results = list(unique.values())


# ------------------------
# 日付で正しく降順ソート（修正箇所）
# ------------------------
def date_key(item):
    y, m, d = item["date"].split(".")
    return (int(y), int(m), int(d))

results.sort(key=date_key, reverse=True)




# ------------------------
# 先頭に追加するデータ
# ------------------------
today = datetime.now()
update_entry = {
    "date": f"{today.year}.{today.month}.{today.day}",
    "text": "データを最新に更新しました"
}

# 先頭に挿入
results.insert(0, update_entry)

# ------------------------
# 出力（ファイル保存）
# ------------------------
today_str = today.strftime("%Y%m%d")
filename = f"news{today_str}.json"

with open(filename, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"{filename} に保存しました")
