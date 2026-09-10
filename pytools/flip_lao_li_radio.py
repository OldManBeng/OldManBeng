"""v4.12 后处理：lao_li_radio_night 部分变体右舵→左舵水平翻转。
用户检查 raw 图后确认：

  需要翻转（右舵）：v2, v3, v5, v6
  不需要（左舵/正确）：v1（基准图）, v4

用法：python pytools/flip_lao_li_radio.py
应在全部批量生成完成后调用。"""

import os
from PIL import Image, ImageOps

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(PROJECT, "public", "photos")

# 用户确认的右舵变体（需要水平翻转）
RHD_FILES = {
    "lao_li_radio_night_v2.png",
    "lao_li_radio_night_v3.png",
    "lao_li_radio_night_v5.png",
    "lao_li_radio_night_v6.png",
}


def main():
    flipped = 0
    for fn in sorted(os.listdir(TARGET)):
        if fn in RHD_FILES:
            path = os.path.join(TARGET, fn)
            with Image.open(path) as im:
                ImageOps.mirror(im).save(path, optimize=True)
            flipped += 1
            print(f"已翻转：{fn}")
    print(f"完成：共翻转 {flipped} 张")
    if flipped < len(RHD_FILES):
        missing = RHD_FILES - set(os.listdir(TARGET))
        if missing:
            print(f"警告：以下文件尚未存在（可能批次未完成）：{missing}")


if __name__ == "__main__":
    main()