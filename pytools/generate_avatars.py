# -*- coding: utf-8 -*-
"""批量生成女主角头像 PNG（ComfyUI 文生图 → public/avatars/{personaId}/）。

v4.13：每人设 10 款头像（同该人设脸标准，只换穿搭）。4 人设 × 10 = 40 张。
- #1 = 该人设默认脸，从旧扁平 avatar-1..4.png 拷贝（零质量损失复用）。
- #2-10 = 新绘，每人设定制 9 套穿搭，提示词 = 人设脸标准 FACE_STD + 穿搭。

用法:
    python generate_avatars.py                       # 全部 40 款（#1 拷贝、#2-10 生成；已存在跳过）
    python generate_avatars.py --persona wise_sister # 只生成某人设的 10 款
    python generate_avatars.py --only 5              # 各人设的 5 号
    python generate_avatars.py --persona wise_sister --only 5
    python generate_avatars.py --force               # 忽略已存在，全部重生成（#1 也走 ComfyUI）
    python generate_avatars.py --dry-run             # 只打印各款 prompt，不提交

提示词注入工作流节点 385（经节点 31 替换进节点 125 的 {$@}）；
latent 节点 244 覆盖为 1024×1024（1:1，原工作流是 1088×1600）；SEED 节点 307。
生成的 1024 原图落在 pytools/avatar_raw/，LANCZOS 缩到 256 入库 public/avatars/{personaId}/。
换种子：改 SEEDS[(persona,n)]，--persona X --only N 重跑那一款。
"""
import argparse
import os
import shutil
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
RAW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "avatar_raw")
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "avatars")

# ---- 工作流节点 id（见 amazing-z-photo_GGUF.json）----
PROMPT_NODE = "385"   # StringTrim：每款头像的主体描述（被替换进 125 的 {$@} 占位符）
SEED_NODE = "307"     # PrimitiveInt SEED
SIZE_NODE = "244"     # EmptySD3LatentImage（活动 latent，默认 1088x1600 非正方形）
PREFIX_NODE = "9"     # SaveImage filename_prefix
STYLE_NODE = "125"    # PrimitiveStringMultiline：手机摄影风格前缀（含 {$@} 占位符）

AVATAR_SIZE = 1024    # 1:1 生成尺寸
FINAL_SIZE = 256      # 入库尺寸（UI 最大用到 64px，256 足够 4x）

# 风格前缀净化版：原版（节点 125）里的 "surprising compositions" + "candid moments"
# 会诱发拼贴/多脸构图（2/3 号成图左上长出残脸），头像批量生成时替换为单人纯净版。
CLEAN_STYLE = """YOUR CONTEXT:
Your photograph is android phone cam-quality.
Your photograph shows exactly one person: a single head-and-shoulders portrait, centered, filling the frame.
Background is softly blurred bokeh in one matching color family. Natural soft lighting.
YOUR PHOTO:
{$@}"""

# 通用底座：逐字沿用工作流节点 385 现有文案（美颜自拍质感 + 圆形头像裁切 + 半写实插画）
# 末尾追加「单人无拼贴」硬约束——原工作流拼贴构图问题的第二道保险。
BASE = (
    "通用底座：1.美颜相机自拍质感：左上 45° 柔光，背景为同色系虚化光斑散景，皮肤干净无瑕（无痣、无雀斑），渐变咬唇妆，眼下卧蚕，"
    "2.雾状柔眉，头肩构图、适配圆形头像裁切，半写实插画风格，正方形 1:1，"
    "画面里只有一位年轻女性：单人头像，无拼贴、无倒影、无画中画，除她之外没有任何第二张脸或五官局部"
)

# ---- v4.13：4 人设 × 10 款 ----
PERSONA_ORDER = ["femme_fatale", "sweet_daughter", "wise_sister", "artistic_soul"]
PERSONA_NAME = {"femme_fatale": "御姐", "sweet_daughter": "学妹", "wise_sister": "姐姐", "artistic_soul": "文青"}
# #1 从旧扁平文件拷贝：人设 → 旧 avatar-N.png 编号
PERSONA_OLD_FLAT = {"femme_fatale": 1, "sweet_daughter": 2, "wise_sister": 3, "artistic_soul": 4}

# 人设脸标准（年龄/气质/发色发型/眼型/唇型/标志配饰/表情）——该人设 10 款共用，只换穿搭。
# 逐字沿用旧 PRESET_LINES[1..4] 中"脸"的部分（剔除穿搭），保证 #2-10 与 #1 是同一张脸。
FACE_STD = {
    "femme_fatale": "24 岁中国年轻女性头像，冷艳御姐气质，深棕黑长直发中分贴顺带光泽，细长丹凤眼、眼神锐利自信、眼线自然平直不上扬，渐变正红咬唇妆，身材火辣，表情淡漠中带一点笑意",
    "sweet_daughter": "20 岁中国年轻女性头像，元气学妹气质，深棕色双马尾、发梢微翘，圆亮杏眼、眼神灵动无辜，珊瑚橘渐变咬唇妆，鬓边别一朵樱花发卡，表情明亮带笑",
    "wise_sister": "27 岁中国年轻女性头像，温柔知性气质，深棕色低丸子头、碎发服帖，温软杏眼、眼神体贴善意，豆沙色渐变咬唇妆，表情温和带浅笑",
    "artistic_soul": "22 岁中国年轻女性头像，安静文艺气质，灰黑色波波头、齐刘海，平静细长眼、眼神淡淡的诗意，玫瑰豆沙渐变咬唇妆，深紫色贝雷帽，表情平静若有所思",
}

# 每人设 10 套穿搭（#1 = 默认脸那套，与现有 avatar-1..4.png 一致；#2-10 新绘，按人设性格定调）
OUTFITS = {
    "femme_fatale": [
        "深色 V 领上衣",                          # 1 默认（=现有御姐款）
        "酒红色丝绒修身连衣裙，锁骨精致",          # 2
        "黑色细吊带约会装，肩颈线条优美",          # 3
        "黑色修身职场西装外套，内搭白丝衬衫",      # 4
        "黑色皮衣夹克，内搭深色抹胸",              # 5
        "真丝酒红色居家长袍，慵懒性感",            # 6
        "金色亮片派对短裙，闪耀迷人",              # 7
        "度假风泳装外搭白色薄纱罩衫",              # 8
        "复古黑底白波点裹身裙",                    # 9
        "深 V 领酒红色针织毛衣，锁骨若隐若现",      # 10
    ],
    "sweet_daughter": [
        "白色衬衫领",                              # 1 默认
        "学院 JK 格裙配白衬衫",                    # 2
        "牛仔背带裙内搭白 T 恤",                   # 3
        "运动卫衣双马尾活力装",                    # 4
        "可爱毛绒居家套装",                        # 5
        "软糯粉色蛋糕裙",                          # 6
        "夏日少女泳装",                            # 7
        "复古背带裤",                              # 8
        "奶黄色宽松针织毛衣",                      # 9
        "白色荷叶边学院上衣",                      # 10
    ],
    "wise_sister": [
        "燕麦色针织衫",                            # 1 默认
        "米色宽松针织居家套装",                    # 2
        "浅色围裙厨装，内搭家居服",                # 3
        "邻家棉麻长衬衫",                          # 4
        "温柔米色西装外套",                        # 5
        "居家浴袍松松挽起",                        # 6
        "早起运动装拉链卫衣",                      # 7
        "串门碎花衬衫裙",                          # 8
        "度假长裙配草帽",                          # 9
        "复古格纹衬衫",                            # 10
    ],
    "artistic_soul": [
        "深灰连帽卫衣",                            # 1 默认
        "棉麻素色长裙",                            # 2
        "卡其风衣内搭白衬衫",                      # 3
        "书店毛衣开衫",                            # 4
        "复古棕色西装外套",                        # 5
        "素色高领毛衣",                            # 6
        "帆布文艺外套",                            # 7
        "居家宽松棉麻套装",                        # 8
        "度假亚麻长衫",                            # 9
        "怀旧格纹衬衫",                            # 10
    ],
}

# 组装 PRESET_LINES[(persona, n)] = prompt。#1 加人设名前缀（与旧 prompt 风格一致），
# #2-10 前缀 "御姐款·N" 便于 dry-run 辨识。提示词 = 标签 + 脸标准 + 穿搭。
PRESET_LINES = {}
for _p in PERSONA_ORDER:
    for _n in range(1, 11):
        _label = f"{PERSONA_NAME[_p]}款" if _n == 1 else f"{PERSONA_NAME[_p]}款·{_n}"
        PRESET_LINES[(_p, _n)] = f"{_label}：{FACE_STD[_p]}，{OUTFITS[_p][_n - 1]}"

# 种子：#1 沿用旧 20260901..04（--force 重跑能复现现有默认脸）；#2-10 新区段 202612xx
# （不撞旧头像 202609xx，也不撞照片变体 202611xx）。
SEEDS = {}
_OLD_BASE = {"femme_fatale": 20260901, "sweet_daughter": 20260902, "wise_sister": 20260903, "artistic_soul": 20260904}
for _pi, _p in enumerate(PERSONA_ORDER):
    SEEDS[(_p, 1)] = _OLD_BASE[_p]                       # #1 复用旧种子（仅 --force 时用到）
    for _n in range(2, 11):
        SEEDS[(_p, _n)] = 20261200 + _pi * 10 + _n        # 御姐 20261202..10 / 学妹 12..20 / 姐姐 22..30 / 文青 32..40


def patch_workflow(workflow: dict, persona: str, n: int) -> None:
    """按款 patch：风格前缀（单人纯净版）/ 主体描述 / 种子 / 1:1 尺寸 / 输出前缀。"""
    prompt = f"{BASE}\n{PRESET_LINES[(persona, n)]} +（通用底座）"
    workflow[STYLE_NODE]["inputs"]["value"] = CLEAN_STYLE
    workflow[PROMPT_NODE]["inputs"]["string"] = prompt
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[(persona, n)]
    workflow[SIZE_NODE]["inputs"]["width"] = AVATAR_SIZE
    workflow[SIZE_NODE]["inputs"]["height"] = AVATAR_SIZE
    workflow[PREFIX_NODE]["inputs"]["filename_prefix"] = f"avatars/{persona}/preset_{n}"


def resize_to_final(raw_path: str, persona: str, n: int) -> str:
    """LANCZOS 缩到 256×256，存 public/avatars/{persona}/avatar-{n}.png。"""
    out_dir = os.path.join(OUT_DIR, persona)
    os.makedirs(out_dir, exist_ok=True)
    final_path = os.path.join(out_dir, f"avatar-{n}.png")
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize((FINAL_SIZE, FINAL_SIZE), Image.LANCZOS)
        im.save(final_path, optimize=True)
    return final_path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="批量生成女主角头像 PNG（v4.13：每人设 10 款）")
    parser.add_argument("--server", default="192.168.1.127:8188", help="ComfyUI 地址")
    parser.add_argument("--persona", choices=PERSONA_ORDER, help="只生成指定人设的 10 款")
    parser.add_argument("--only", type=int, choices=range(1, 11), help="只生成指定序号（1-10），可叠加 --persona")
    parser.add_argument("--force", action="store_true", help="已存在也重新生成（#1 也走 ComfyUI 而非拷贝）")
    parser.add_argument("--dry-run", action="store_true", help="只打印 prompt 不提交")
    args = parser.parse_args()

    personas = [args.persona] if args.persona else PERSONA_ORDER
    ns = [args.only] if args.only else list(range(1, 11))
    jobs = [(p, n) for p in personas for n in ns]

    if args.dry_run:
        workflow = load_workflow(WORKFLOW_PATH)
        for p, n in jobs:
            patch_workflow(workflow, p, n)
            print(f"--- {PERSONA_NAME[p]}款·{n}（seed={SEEDS[(p, n)]}）→ avatars/{p}/avatar-{n}.png ---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        return

    for p, n in jobs:
        out_dir = os.path.join(OUT_DIR, p)
        os.makedirs(out_dir, exist_ok=True)
        final_path = os.path.join(out_dir, f"avatar-{n}.png")
        if os.path.exists(final_path) and not args.force:
            print(f"{PERSONA_NAME[p]}款·{n}: 已存在，跳过（--force 重生成）")
            continue
        # #1 默认从旧扁平文件拷贝（复用已审过的默认脸，零质量损失）
        if n == 1 and not args.force:
            old_flat = os.path.join(OUT_DIR, f"avatar-{PERSONA_OLD_FLAT[p]}.png")
            if os.path.exists(old_flat):
                shutil.copyfile(old_flat, final_path)
                print(f"{PERSONA_NAME[p]}款·1: 已从 avatar-{PERSONA_OLD_FLAT[p]}.png 拷贝")
                continue
        # #2-10 或 --force：走 ComfyUI
        workflow = load_workflow(WORKFLOW_PATH)
        patch_workflow(workflow, p, n)
        client_id = f"py-avatar-{p}-{n}-{os.getpid()}"
        prompt_id = queue_prompt(args.server, workflow, client_id)
        print(f"{PERSONA_NAME[p]}款·{n}: 已提交 {prompt_id}（seed={SEEDS[(p, n)]}），等待生成...")
        history = wait_for_history(args.server, prompt_id)
        images = collect_images(history)
        if not images:
            print(f"{PERSONA_NAME[p]}款·{n}: 任务完成但没有输出图片")
            sys.exit(1)
        raw_path = download_image(args.server, images[0], RAW_DIR, prompt_id)
        saved = resize_to_final(raw_path, p, n)
        print(f"{PERSONA_NAME[p]}款·{n}: 已保存 {os.path.abspath(saved)}")
    print("完成")


if __name__ == "__main__":
    main()
