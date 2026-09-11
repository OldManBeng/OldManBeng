# -*- coding: utf-8 -*-
"""v4.13.2 场景图瘦身：raw 768×576 PNG → web 560×420 JPEG q85。

背景：dist 95M 里 photos(62M)+selfies(29M) 占 91M——150 张 768×576 PNG
每张 ~600KB，而 UI 里照片显示宽度最大 ~420px（移动视口气泡内 ~300-400px）。
560×420（约 1.5× 显示尺寸，兼顾平板 2x）+ JPEG q85 实测 600KB→46KB（13×）。

结构：
- raw 保留：pytools/raw_scenes/{photos|selfies}/{id}/{id}_v{1..6}.png（768 原图）
- web 入库：public/{photos|selfies}/{id}/{id}_v{1..6}.jpg（560×420 JPEG q85）
- 渲染器（character-art.tsx variantUrl）URL 用 .jpg；404 落 SVG 兜底不变。

用法：
    python shrink_scenes.py            # 全部（已存在的 .jpg 跳过）
    python shrink_scenes.py --force    # 已存在也重生成
    python shrink_scenes.py --only lao_li_taxi_night   # 只处理一个主题
"""
import argparse
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
RAW_ROOT = os.path.join(HERE, "raw_scenes")
PUB_ROOT = os.path.join(PROJECT, "public")

WEB_W, WEB_H = 560, 420   # 4:3 保持原比例
QUALITY = 85


def shrink_one(png_path: str, jpg_path: str) -> int:
    with Image.open(png_path) as im:
        im = im.convert("RGB").resize((WEB_W, WEB_H), Image.LANCZOS)
        im.save(jpg_path, "JPEG", quality=QUALITY, optimize=True)
    return os.path.getsize(jpg_path)


def main() -> None:
    if hasattr(__import__("sys").stdout, "reconfigure"):
        import sys
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="raw PNG → web JPEG（v4.13.2 瘦身）")
    parser.add_argument("--force", action="store_true", help="已存在也重生成")
    parser.add_argument("--only", help="只处理指定主题 id（子目录名）")
    args = parser.parse_args()

    total_in = 0
    total_out = 0
    n = 0
    for sub in ["photos", "selfies"]:
        raw_sub = os.path.join(RAW_ROOT, sub)
        if not os.path.isdir(raw_sub):
            continue
        for theme in sorted(os.listdir(raw_sub)):
            if args.only and theme != args.only:
                continue
            theme_dir = os.path.join(raw_sub, theme)
            if not os.path.isdir(theme_dir):
                continue
            out_dir = os.path.join(PUB_ROOT, sub, theme)
            os.makedirs(out_dir, exist_ok=True)
            for fn in sorted(os.listdir(theme_dir)):
                if not fn.endswith(".png"):
                    continue
                jpg_name = fn[: -len(".png")] + ".jpg"
                jpg_path = os.path.join(out_dir, jpg_name)
                if os.path.exists(jpg_path) and not args.force:
                    continue
                size = shrink_one(os.path.join(theme_dir, fn), jpg_path)
                total_in += os.path.getsize(os.path.join(theme_dir, fn))
                total_out += size
                n += 1
    if n:
        print(f"已转换 {n} 张：{total_in // 1024}KB → {total_out // 1024}KB（{total_out / total_in:.1%}）")
    else:
        print("没有需要转换的（全部已存在；--force 重生成）")


if __name__ == "__main__":
    main()
