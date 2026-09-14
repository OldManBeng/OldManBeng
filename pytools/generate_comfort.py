# -*- coding: utf-8 -*-
"""批量生成舒适圈角色头像与朋友圈场景 PNG（第二阶段 1.1.0，ComfyUI 文生图 → public/comfort/）。

产物：
- 头像 256×256 PNG：public/comfort/{xiaoman_plain|mother|boyfriend|father}.png
  （小满素颜 / 妈王秀兰 / 男友阿凯 / 父亲旧照—— father 建议黑白，前端会再压一层灰调）
- 场景 560×420 JPEG q85：public/comfort/scenes/cm_*.jpg（v4.13.2 web 尺寸规范；
  raw 768 PNG 留 pytools/avatar_raw/comfort_raw/，gitignore）

用法（与 generate_avatars.py 一致）:
    python generate_comfort.py                 # 全部（已存在跳过）
    python generate_comfort.py --only avatars  # 只生成 4 张头像
    python generate_comfort.py --only scenes   # 只生成 11 张场景
    python generate_comfort.py --key mother --force
    python generate_comfort.py --dry-run       # 只打印 prompt 不提交

提示词注入工作流节点 385；STYLE_NODE 125 头像用单人纯净版（CLEAN_STYLE），
场景沿用工作流默认手机摄影风格；SEED 节点 307；latent 节点 244 控尺寸。
"""
import argparse
import os
import sys

from PIL import Image

from generate_images import (
    collect_images,
    download_image,
    load_workflow,
    queue_prompt,
    wait_for_history,
)

WORKFLOW_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "amazing-z-photo_GGUF.json")
RAW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "avatar_raw", "comfort_raw")
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "comfort")

PROMPT_NODE = "385"
SEED_NODE = "307"
SIZE_NODE = "244"
PREFIX_NODE = "9"
STYLE_NODE = "125"

AVATAR_SIZE = 1024
AVATAR_FINAL = 256
SCENE_W, SCENE_H = 1024, 768          # 4:3 生成
SCENE_OUT = (560, 420)                # web 入库（q85 JPEG）

# 头像：单人纯净版风格前缀（同 generate_avatars.py 的 CLEAN_STYLE）
CLEAN_STYLE = """YOUR CONTEXT:
Your photograph is android phone cam-quality.
Your photograph shows exactly one person: a single head-and-shoulders portrait, centered, filling the frame.
Background is softly blurred bokeh in one matching color family. Natural soft lighting.
YOUR PHOTO:
{$@}"""

AVATAR_BASE = (
    "通用底座：手机前置摄像质感，头肩构图适配圆形头像裁切，半写实插画风格，正方形 1:1，"
    "画面里只有一个人：单人头像，无拼贴、无倒影、无画中画，除他/她之外没有任何第二张脸或五官局部"
)

# ---- 4 张角色头像（人脸标准逐字锁定设定） ----
AVATARS = {
    # 素颜小满：和 ten 头像同一张脸的卸妆版——马尾、眼镜、无妆、倦、真
    "xiaoman_plain": (
        "24 岁中国年轻女性头像，素颜日常版：普通黑发低马尾，碎刘海，戴细框圆眼镜，"
        "皮肤真实质感（淡雀斑、轻微黑眼圈、无美颜无妆容、唇色浅淡），表情平静里带一点倦意，"
        "穿旧针织家居服，米白色背景虚化"
    ),
    # 妈：55 岁家政保洁员——手上的活儿和眼里的暖都在
    "mother": (
        "55 岁中国中年女性头像，家政保洁员：烫过的黑色短卷发花白掺半，慈祥的杏眼带笑纹，"
        "眼袋与法令纹真实可见，肤色偏黄真实，穿薄荷绿保洁围裙领的工装，"
        "表情温暖踏实像刚要叮嘱女儿好好吃饭，暖黄色背景虚化"
    ),
    # 男友：27 岁游手好闲的游戏宅——帅得不用心，甜得有问题
    "boyfriend": (
        "27 岁中国年轻男性头像，电竞宅男：黑色乱发睡醒感，熬夜黑眼圈，皮肤出油光泽，"
        "穿深灰色连帽卫衣，挂颈式耳机，表情玩世不恭带三分讨好的笑，"
        "冷调屏幕光从侧面打脸，蓝灰色背景虚化"
    ),
    # 父亲：纪念位旧照——建议黑白（前端再压灰调）
    "father": (
        "50 多岁中国男性头像，老式证件照质感：短寸头花白两鬓，方正朴实面孔，皱纹深刻，"
        "穿深色旧夹克，表情老实木讷带一点笨拙的慈爱，"
        "胶片颗粒感，灰白褪色旧照片氛围，单色背景"
    ),
}

# ---- 11 张朋友圈场景（4:3 横构图，手机随拍质感——舒适圈的生活切片） ----
SCENES = {
    "cm_soy": "清晨早餐店的热豆浆特写：白瓷碗冒热气，油条一角入画，木桌，晨光斜射，手机随手拍质感",
    "cm_sunrise": "出租屋窗台的日出：手机架在窗框拍的，晾着的袜子一角入画，城市楼群剪影，暖橙色天空",
    "cm_road": "清晨上班路上的斑马线：低角度手机抓拍，行人虚影，洒水车的水迹反光",
    "cm_quilt": "床上摊开的一床旧棉花被：弹过棉花的被面有点起球，一角绣着褪色的红字，午后自然光",
    "cm_video": "和妈妈的微信视频通话截图质感：屏幕里是烫短发的中年女性在厨房，屏幕反光与环境融合",
    "cm_crab": "中秋家宴的清蒸螃蟹：两只最肥的红壳蟹摆在白盘里，醋碟姜丝，家庭餐桌热闹感",
    "cm_old_phone": "一部老式按键功能机放在抽屉里：屏幕贴膜起泡，旁边一张旧全家福照片边角入画，怀旧静物",
    "cm_boba": "一杯三分糖奶茶放在电脑键盘旁：杯套素色无字，吸管纸撕开一半，深夜屏幕光照亮杯壁",
    "cm_couple": "年轻情侣的休闲合照：男生穿深灰卫衣比着游戏手势，女生素颜马尾笑得眼睛弯弯，出租屋暖灯",
    "cm_chicken": "分一半的炸鸡外卖：打开的纸盒、两双筷子、可乐罐，深夜追剧的茶几视角俯拍",
    "cm_game": "电竞少年的游戏战绩截图氛围：显示器特写，大段位徽章高亮，键帽磨损的机械键盘一角",
}

SEEDS = {}
_seed = 20270100
for _k in AVATARS:
    SEEDS[_k] = _seed
    _seed += 1
for _k in SCENES:
    SEEDS[_k] = _seed
    _seed += 1


def patch_avatar(workflow: dict, key: str) -> None:
    workflow[STYLE_NODE]["inputs"]["value"] = CLEAN_STYLE
    workflow[PROMPT_NODE]["inputs"]["string"] = f"舒适圈头像·{key}：{AVATARS[key]} +（通用底座）"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[key]
    workflow[SIZE_NODE]["inputs"]["width"] = AVATAR_SIZE
    workflow[SIZE_NODE]["inputs"]["height"] = AVATAR_SIZE
    workflow[PREFIX_NODE]["inputs"]["filename_prefix"] = f"comfort/{key}"


def patch_scene(workflow: dict, key: str) -> None:
    # 场景沿用工作流默认风格前缀（手机摄影质感），不换 CLEAN_STYLE。
    workflow[PROMPT_NODE]["inputs"]["string"] = f"舒适圈朋友圈配图·{key}：{SCENES[key]}，横构图 4:3"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[key]
    workflow[SIZE_NODE]["inputs"]["width"] = SCENE_W
    workflow[SIZE_NODE]["inputs"]["height"] = SCENE_H
    workflow[PREFIX_NODE]["inputs"]["filename_prefix"] = f"comfort/scenes/{key}"


def save_avatar(raw_path: str, key: str) -> str:
    os.makedirs(OUT_DIR, exist_ok=True)
    final_path = os.path.join(OUT_DIR, f"{key}.png")
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize((AVATAR_FINAL, AVATAR_FINAL), Image.LANCZOS)
        im.save(final_path, optimize=True)
    return final_path


def save_scene(raw_path: str, key: str) -> str:
    scenes_dir = os.path.join(OUT_DIR, "scenes")
    os.makedirs(scenes_dir, exist_ok=True)
    final_path = os.path.join(scenes_dir, f"{key}.jpg")
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize(SCENE_OUT, Image.LANCZOS)
        im.save(final_path, quality=85, optimize=True)
    return final_path


def generate_one(server: str, workflow: dict, key: str, is_avatar: bool) -> str:
    os.makedirs(RAW_DIR, exist_ok=True)
    if is_avatar:
        patch_avatar(workflow, key)
    else:
        patch_scene(workflow, key)
    image_paths = queue_prompt(server, workflow)
    history = wait_for_history(server, image_paths)
    raw_files = collect_images(server, history)
    raw_path = os.path.join(RAW_DIR, os.path.basename(raw_files[0]))
    download_image(server, raw_files[0], raw_path)
    return save_avatar(raw_path, key) if is_avatar else save_scene(raw_path, key)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="批量生成舒适圈角色头像与朋友圈场景（1.1.0）")
    parser.add_argument("--server", default="192.168.1.127:8188", help="ComfyUI 地址")
    parser.add_argument("--only", choices=["avatars", "scenes"], help="只生成头像或场景")
    parser.add_argument("--key", help="只生成指定 key（如 mother / cm_boba），--force 时可重跑单张")
    parser.add_argument("--force", action="store_true", help="已存在也重新生成")
    parser.add_argument("--dry-run", action="store_true", help="只打印 prompt 不提交")
    args = parser.parse_args()

    avatar_keys = list(AVATARS) if args.only in (None, "avatars") else []
    if args.key:
        if args.key in AVATARS and (args.only in (None, "avatars")):
            avatar_keys = [args.key]
        else:
            avatar_keys = []
    scene_keys = list(SCENES) if args.only in (None, "scenes") else []
    if args.key:
        scene_keys = [args.key] if args.key in SCENES else ([] if avatar_keys else scene_keys)

    if args.dry_run:
        workflow = load_workflow(WORKFLOW_PATH)
        for k in avatar_keys:
            patch_avatar(workflow, k)
            print(f"--- 头像 {k}（seed={SEEDS[k]}）→ comfort/{k}.png ---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        for k in scene_keys:
            patch_scene(workflow, k)
            print(f"--- 场景 {k}（seed={SEEDS[k]}）→ comfort/scenes/{k}.jpg ---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        return

    for k in avatar_keys:
        out = os.path.join(OUT_DIR, f"{k}.png")
        if os.path.exists(out) and not args.force:
            print(f"skip {k}（已存在，--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        print(f"生成头像 {k} ...")
        print("→", generate_one(args.server, workflow, k, is_avatar=True))

    for k in scene_keys:
        out = os.path.join(OUT_DIR, "scenes", f"{k}.jpg")
        if os.path.exists(out) and not args.force:
            print(f"skip {k}（已存在，--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        print(f"生成场景 {k} ...")
        print("→", generate_one(args.server, workflow, k, is_avatar=False))


if __name__ == "__main__":
    main()
