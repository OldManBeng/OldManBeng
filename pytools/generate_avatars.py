# -*- coding: utf-8 -*-
"""批量生成女主角 10 款头像 PNG（ComfyUI 文生图 → public/avatars/）。

用法:
    python generate_avatars.py               # 生成全部 10 款（已存在的跳过）
    python generate_avatars.py --only 3      # 只重新生成 3 号
    python generate_avatars.py --force       # 忽略已存在，全部重生成
    python generate_avatars.py --dry-run     # 只打印各款 prompt，不提交

提示词注入工作流节点 385（经节点 31 替换进节点 125 的 {$@}）；
latent 节点 244 覆盖为 1024×1024（1:1，原工作流是 1088×1600）；SEED 节点 307。
生成的 1024 原图落在 pytools/avatar_raw/，LANCZOS 缩到 256 入库 public/avatars/。
换种子：改 SEEDS 里对应款，--only 重跑那一款。
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

# 每款描述：1 御姐款逐字沿用节点 385 已定稿文案；2-10 按 AVATAR_PRESETS
# （src/components/character-art.tsx）的发色×发型×瞳型×唇色×配饰×衣领×背景 同款格式撰写。
PRESET_LINES = {
    1: "御姐款：24 岁中国年轻女性头像，冷艳御姐气质，深棕黑长直发中分贴顺带光泽，细长丹凤眼、眼神锐利自信、眼线自然平直不上扬，渐变正红咬唇妆，深色 V 领上衣，身材火辣，表情淡漠中带一点笑意",
    2: "学妹款：20 岁中国年轻女性头像，元气学妹气质，深棕色双马尾、发梢微翘，圆亮杏眼、眼神灵动无辜，珊瑚橘渐变咬唇妆，鬓边别一朵樱花发卡，白色衬衫领，深蓝色系散景，表情明亮带笑",
    3: "姐姐款：27 岁中国年轻女性头像，温柔知性气质，深棕色低丸子头、碎发服帖，温软杏眼、眼神体贴善意，豆沙色渐变咬唇妆，燕麦色针织衫，深绿色系散景，表情温和带浅笑",
    4: "文青款：22 岁中国年轻女性头像，安静文艺气质，灰黑色波波头、齐刘海，平静细长眼、眼神淡淡的诗意，玫瑰豆沙渐变咬唇妆，深紫色贝雷帽，深灰连帽卫衣，暗紫色系散景，表情平静若有所思",
    5: "栗发耳坠：23 岁中国年轻女性头像，暖甜邻家气质，栗色长直发、发尾内扣带光泽，温软杏眼、眼神柔和，橘红渐变咬唇妆，金色小耳坠，燕麦色连帽卫衣，暖棕色系散景，表情温暖含笑",
    6: "冷淡波波：24 岁中国年轻女性头像，清冷气质，雾蓝灰色波波头、中分内扣，圆亮杏眼、眼神清亮淡淡的，西柚色渐变咬唇妆，深色 V 领上衣，深蓝色系散景，表情淡然高冷",
    7: "紫调马尾：25 岁中国年轻女性头像，飒爽气质，紫棕色高马尾、发丝顺滑，细长眼、眼神锐利自信、眼线平直不上扬，玫瑰色渐变咬唇妆，浅灰针织衫，暗紫色系散景，表情冷淡带一点笑意",
    8: "棕丸子：24 岁中国年轻女性头像，慵懒复古气质，暖棕色丸子头、留几缕碎发，平静杏眼、眼神淡淡温柔，蜜桃色渐变咬唇妆，鬓边樱花发卡，白衬衫领，暖棕色系散景，表情慵懒浅笑",
    9: "长直文艺：23 岁中国年轻女性头像，清新文艺气质，墨绿色调黑长直、中分贴顺，圆亮杏眼、眼神清澈好奇，豆沙色渐变咬唇妆，墨绿色贝雷帽，燕麦色针织衫，深绿色系散景，表情清新微笑",
    10: "复古波波：26 岁中国年轻女性头像，复古港风气质，深金棕色波波头、发尾外翻微卷，温软杏眼、眼神慵懒迷人，砖红色渐变咬唇妆，黄铜色小耳坠，白衬衫领，暗金色系散景，表情复古含笑",
}

# 每款固定种子：记录最终采用的种子保证可复现；某款不满意就换这里的值 --only 重跑。
# 注：5 号最终采用第一批（旧风格前缀）+ 种子 20260905 的成图（preset_5_00001_，
# 半写实插画质感优于净化前缀重跑的 _00002_）；该图已手动入库 avatar-5.png。
SEEDS = {
    1: 20260901, 2: 20260902, 3: 20260903, 4: 20260904, 5: 20260905,
    6: 20260906, 7: 20260907, 8: 20260908, 9: 20260909, 10: 20260910,
}


def patch_workflow(workflow: dict, preset_id: int) -> None:
    """按款 patch：风格前缀（单人纯净版）/ 主体描述 / 种子 / 1:1 尺寸 / 输出前缀。"""
    prompt = f"{BASE}\n{PRESET_LINES[preset_id]} +（通用底座）"
    workflow[STYLE_NODE]["inputs"]["value"] = CLEAN_STYLE
    workflow[PROMPT_NODE]["inputs"]["string"] = prompt
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[preset_id]
    workflow[SIZE_NODE]["inputs"]["width"] = AVATAR_SIZE
    workflow[SIZE_NODE]["inputs"]["height"] = AVATAR_SIZE
    workflow[PREFIX_NODE]["inputs"]["filename_prefix"] = f"avatars/preset_{preset_id}"


def resize_to_final(raw_path: str, preset_id: int) -> str:
    """LANCZOS 缩到 256×256，存 public/avatars/avatar-{id}.png。"""
    os.makedirs(OUT_DIR, exist_ok=True)
    final_path = os.path.join(OUT_DIR, f"avatar-{preset_id}.png")
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize((FINAL_SIZE, FINAL_SIZE), Image.LANCZOS)
        im.save(final_path, optimize=True)
    return final_path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="批量生成女主角头像 PNG")
    parser.add_argument("--server", default="192.168.1.127:8188", help="ComfyUI 地址")
    parser.add_argument("--only", type=int, choices=sorted(PRESET_LINES), help="只生成指定款")
    parser.add_argument("--force", action="store_true", help="已存在也重新生成")
    parser.add_argument("--dry-run", action="store_true", help="只打印 prompt 不提交")
    args = parser.parse_args()

    ids = [args.only] if args.only else sorted(PRESET_LINES)

    if args.dry_run:
        workflow = load_workflow(WORKFLOW_PATH)
        for i in ids:
            patch_workflow(workflow, i)
            print(f"--- 头像 {i}（seed={SEEDS[i]}）---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        return

    for i in ids:
        final_path = os.path.join(OUT_DIR, f"avatar-{i}.png")
        if os.path.exists(final_path) and not args.force:
            print(f"头像 {i}: 已存在，跳过（--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        patch_workflow(workflow, i)
        client_id = f"py-avatar-{i}-{os.getpid()}"
        prompt_id = queue_prompt(args.server, workflow, client_id)
        print(f"头像 {i}: 已提交 {prompt_id}（seed={SEEDS[i]}），等待生成...")
        history = wait_for_history(args.server, prompt_id)
        images = collect_images(history)
        if not images:
            print(f"头像 {i}: 任务完成但没有输出图片")
            sys.exit(1)
        raw_path = download_image(args.server, images[0], RAW_DIR, prompt_id)
        saved = resize_to_final(raw_path, i)
        print(f"头像 {i}: 已保存 {os.path.abspath(saved)}")
    print("完成")


if __name__ == "__main__":
    main()
