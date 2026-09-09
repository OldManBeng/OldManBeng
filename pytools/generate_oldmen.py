# -*- coding: utf-8 -*-
"""批量生成老头头像 11 款 PNG（ComfyUI 文生图 → public/oldmen/）。

用法:
    python generate_oldmen.py               # 生成全部 11 款（已存在的跳过）
    python generate_oldmen.py --only zhou    # 只重新生成 zhou
    python generate_oldmen.py --force        # 忽略已存在，全部重生成
    python generate_oldmen.py --dry-run      # 只打印各款 prompt，不提交

11 款 = 6 真脸（zhou/wang/hao/chen/chess/dance）+ 5 照片型场景（lao_li/driver/guard/fish/dance2），
覆盖全部 50 目标（库内按预设共享）。种子固定可复现，换种子改 SEEDS 再 --only 重跑。
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
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "oldmen")

# ---- 工作流节点 id ----
PROMPT_NODE = "385"   # StringTrim：主体描述（替换进 125 的 {$@}）
SEED_NODE = "307"     # PrimitiveInt SEED
SIZE_NODE = "244"     # EmptySD3LatentImage（覆盖为 1024² 1:1）
PREFIX_NODE = "9"     # SaveImage filename_prefix
STYLE_NODE = "125"    # PrimitiveStringMultiline：手机摄影风格前缀

AVATAR_SIZE = 1024
FINAL_SIZE = 256

# 风格前缀：中性版——老头照片型里有无脸场景照，不能像女主那样强制「single head-and-shoulders portrait」。
# 去掉原工作流的 "surprising compositions / candid moments"（会诱发拼贴多脸）。
OLDMAN_STYLE = """YOUR CONTEXT:
Your photograph is android phone cam-quality, candid, natural lighting, slightly careless framing.
YOUR PHOTO:
{$@}"""

# 通用底座：直男手机摄影质感（与女主美颜自拍成对照）。
BASE = (
    "通用底座：1.直男手机摄影质感：前置硬闪光，T区与鼻尖轻微油光，随手构图略歪，"
    "皮肤不讲究（可有痣、轻度不对称、毛孔可见），半写实插画风格，正方形 1:1，适配圆形头像裁切，"
    "2.画面真实自然，无拼贴、无画中画、无多宫格"
)

# 11 款描述。真脸款写「单人半身正脸头像，画面中只有一位…」；照片型场景款写场景，主体居中。
LOOKS = {
    # ---- 真脸款 ----
    "zhou": "周老师：单人半身正脸头像，画面中只有一位63岁中国退休男教师，清瘦尖脸、细眉、花白背头梳理整齐、方框眼镜、白皙皮肤，书房暖黄台灯背景虚化、书脊与宣纸毛笔暗示，棕灰开衫，表情温和克制，额纹可见",
    "wang": "王总：单人半身正脸头像，画面中只有一位52岁中国建材店老板，富态圆脸双下巴、浓眉、深棕油头全后梳、无眼镜、常年日晒皮肤，深夜车库搁架纵深背景虚化、嘴角叼一支烟，暗红砖纹衬衫，表情生意人式的精明自得，T区油光",
    "hao": "阿豪：单人半身正脸头像，画面中只有一位35岁中国网吧老板（90后），年轻短圆脸、细眉、深黑蓬乱密发、下巴山羊胡茬、白皙皮肤偏熬夜暗沉，网吧柜台背景显示器排蓝光虚化、手边游戏手柄，深青绿T恤，表情慵懒带点皮",
    "chen": "陈工：单人半身正脸头像，画面中只有一位58岁中国退休机械工程师，瘦长脸人中长、细眉、灰棕三七分厚发、方框眼镜、常年日晒皮肤，阳台栏杆背景盆栽与暮色远楼虚化，蓝灰工装衬衫，表情严谨寡言",
    "chess": "棋友：单人半身正脸头像，画面中只有一位65岁左右中国棋摊大爷，清瘦尖脸、细眉、灰白稀疏分头梳理整齐、方框眼镜、白皙皮肤，面前石桌摆一副中国象棋：木制棋盘十条横线九条纵线、中间空白的楚河汉界，棋子按标准开局摆好——红黑双方底线上各一排车马相（象）士帅（将）士相（象）马车共九子，双炮各在底线前方两路，五个兵（卒）各一字排开在河界前，红黑两色隔河对峙、秩序井然，背景午后树荫光斑，灰棕衬衫中山装，表情较真专注",
    "dance": "广场舞大爷：单人半身正脸头像，画面中只有一位63岁左右中国广场舞大爷，富态圆脸、浓眉、花银背头、无眼镜、常年日晒皮肤，广场夜景背景华灯初上与音箱一角红绸虚化，暗玫红运动衫，表情带劲自得",
    "guard": "保安帽照：单人半身正脸头像，画面中只有一位50岁左右中国夜班保安，国字方脸、浓眉、黑色板寸、胡茬、黝黑皮肤，戴保安大檐帽、帽檐投影横压眉眼，岗亭墙面与日光灯辉光背景，藏蓝制服肩章，表情疲惫警觉",
    # ---- 照片型场景款（场景照，主体居中，无脸或侧影/背影）----
    "lao_li": "老李方向盘照：夜间出租车驾驶舱照片（非人脸照），画面主体是倾斜的方向盘与握方向盘的一只手和袖口，仪表盘幽蓝背光，挡风玻璃外城市灯火散景，47岁中年男子的手，深蓝灰夹克袖口，氛围疲惫",
    "driver": "代驾路边照：深夜路边等单的场景照，画面主体是一位40多岁中国代驾司机的半身侧影、身旁折叠电动车、穿反光背心，板寸胡茬黝黑皮肤，背景路灯锥光与残月、城市深夜散景，无正脸特写，卡其土黄外套，氛围疲惫守候",
    "fish": "钓鱼照：清晨水边的场景照，画面主体是斜贯画面的锥形鱼竿与水面立漂、漂周同心水波纹，远岸晨雾与芦苇剪影、黎明天空渐变，可见一位60岁左右中国钓友的背影或侧影（板寸、方框眼镜、山羊胡、深绿迷彩钓鱼服），无正脸特写，氛围专注宁静",
    "dance2": "精致摆拍照：中老年男性朋友圈摆拍的场景照，暖光木桌面，白瓷盘上一块蛋糕与草莓，拿铁杯心形拉花，盘边一副折起来的老花镜（暗示这份精致是租来的），可见一位60岁左右中国男性的手与袖口（暗酒红衬衫），无正脸，氛围刻意精致暖光池",
}

# 每款固定种子：记录最终采用的种子保证可复现。
# chess：最终采用 20260915 的第 2 张成图（服务端 chess_00002_.png，已手动入库）；
# --force 重跑会得到不同的随机成图（同一批次第 3 张 chess_00003_ 棋子摆位已被否掉）。
SEEDS = {
    "zhou": 20260911, "wang": 20260912, "hao": 20260913, "chen": 20260914,
    "chess": 20260915, "dance": 20260916, "guard": 20260917,
    "lao_li": 20260918, "driver": 20260919, "fish": 20260920, "dance2": 20260921,
}

LOOK_ORDER = ["zhou", "wang", "hao", "chen", "chess", "dance", "guard", "lao_li", "driver", "fish", "dance2"]


def patch_workflow(workflow: dict, slug: str) -> None:
    """按款 patch：风格前缀 / 主体描述 / 种子 / 1:1 尺寸 / 输出前缀。"""
    workflow[STYLE_NODE]["inputs"]["value"] = OLDMAN_STYLE
    workflow[PROMPT_NODE]["inputs"]["string"] = f"{BASE}\n{LOOKS[slug]}"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[slug]
    workflow[SIZE_NODE]["inputs"]["width"] = AVATAR_SIZE
    workflow[SIZE_NODE]["inputs"]["height"] = AVATAR_SIZE
    workflow[PREFIX_NODE]["inputs"]["filename_prefix"] = f"oldmen/{slug}"


def resize_to_final(raw_path: str, slug: str) -> str:
    os.makedirs(OUT_DIR, exist_ok=True)
    final_path = os.path.join(OUT_DIR, f"{slug}.png")
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize((FINAL_SIZE, FINAL_SIZE), Image.LANCZOS)
        im.save(final_path, optimize=True)
    return final_path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="批量生成老头头像 PNG")
    parser.add_argument("--server", default="192.168.1.127:8188", help="ComfyUI 地址")
    parser.add_argument("--only", choices=LOOK_ORDER, help="只生成指定款")
    parser.add_argument("--force", action="store_true", help="已存在也重新生成")
    parser.add_argument("--dry-run", action="store_true", help="只打印 prompt 不提交")
    args = parser.parse_args()

    slugs = [args.only] if args.only else LOOK_ORDER

    if args.dry_run:
        workflow = load_workflow(WORKFLOW_PATH)
        for s in slugs:
            patch_workflow(workflow, s)
            print(f"--- {s}（seed={SEEDS[s]}）---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        return

    for s in slugs:
        final_path = os.path.join(OUT_DIR, f"{s}.png")
        if os.path.exists(final_path) and not args.force:
            print(f"{s}: 已存在，跳过（--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        patch_workflow(workflow, s)
        client_id = f"py-oldman-{s}-{os.getpid()}"
        prompt_id = queue_prompt(args.server, workflow, client_id)
        print(f"{s}: 已提交 {prompt_id}（seed={SEEDS[s]}），等待生成...")
        history = wait_for_history(args.server, prompt_id)
        images = collect_images(history)
        if not images:
            print(f"{s}: 任务完成但没有输出图片")
            sys.exit(1)
        raw_path = download_image(args.server, images[0], RAW_DIR, prompt_id)
        saved = resize_to_final(raw_path, s)
        print(f"{s}: 已保存 {os.path.abspath(saved)}")
    print("完成")


if __name__ == "__main__":
    main()
