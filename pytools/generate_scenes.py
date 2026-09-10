# -*- coding: utf-8 -*-
"""批量生成朋友圈照片与老头发来的照片 PNG（ComfyUI 文生图 → public/photos + public/selfies）。

用法:
    python generate_scenes.py               # 生成全部 25 张基准图（已存在的跳过）
    python generate_scenes.py --only cat      # 只重新生成某一张（id 全局唯一）
    python generate_scenes.py --variants      # 生成全部 125 张变体（{id}_v2.._v6，每张 ×5）
    python generate_scenes.py --only cat --variants   # 只生成某一张的 5 个变体
    python generate_scenes.py --variants --seed-offset 3   # 变体种子 +3（re-roll 不合格图，不动 SEEDS）
    python generate_scenes.py --force          # 忽略已存在，全部重生成
    python generate_scenes.py --dry-run        # 只打印各张 prompt + 种子，不提交

17 张照片（老头发来，public/photos/）+ 8 张自拍（女主朋友圈，public/selfies/），4:3 横构图。
基准图种子在 SEEDS（20260922..），v4.12 变体种子在 VARIANT_SEEDS（20261100..），均固定可复现。
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
PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---- 工作流节点 id ----
PROMPT_NODE = "385"
SEED_NODE = "307"
SIZE_NODE = "244"      # EmptySD3LatentImage（覆盖为 1024×768 4:3）
PREFIX_NODE = "9"
STYLE_NODE = "125"

LATENT_W = 1024
LATENT_H = 768
FINAL_W = 768
FINAL_H = 576

# 风格前缀：中性手机摄影版（去 surprising compositions / candid moments，防拼贴）。
SCENE_STYLE = """YOUR CONTEXT:
Your photograph is android phone cam-quality, candid, natural lighting.
YOUR PHOTO:
{$@}"""

# 通用底座：手机随拍质感（本就是「手机照片」设定）。
# 注：写实派提示词（guard_booth/roadside/wang_overtime 等）单独在各自描述里
# 强调「真实手机夜拍质感、非插画」，不受此底座的「半写实插画风格」约束。
BASE = (
    "通用底座：手机随拍质感，自然光或室内灯光，4:3横构图，真实生活气息，"
    "画面真实自然，无拼贴、无画中画、无水印、无边框"
)

# 17 张照片（老头发来）。wang_overtime 带人。
PHOTOS = {
    "lao_li_taxi_night": "夜班出租车内的照片：驾驶座视角，挡风玻璃外城市夜灯散景，方向盘与仪表盘幽蓝背光，47岁中年男子的手握方向盘的袖口，氛围疲惫",
    "zhou_calligraphy": "书桌俯视照片：宣纸毛笔砚台，墙上挂钟，案头写着一个「远」字，暖黄台灯，文人气",
    "wang_garage_smoke": "车库内手机夜拍照片：真实手机夜拍质感（写实摄影，非插画：噪点可见、昏暗高对比），驾驶座视角拍车窗与方向盘，一支燃着的烟搁在烟灰缸上，烟雾缭绕的层次被车内灯照出，深夜独处",
    "hao_cafe_cats": "网吧柜台照片：一排显示器墙蓝光，柜台上一杯泡面，一只橘猫蜷在显示器旁，深夜守店",
    "chen_balcony_vise": "阳台工作台照片：图纸与阳台栏杆，台钳夹着一只老式机械闹钟，零件散落，黄昏光",
    "lao_li_radio_night": "收车后驾驶座照片：车载收音机面板亮起显示 FM 87.6，后视镜上的平安符，夜色车窗外路灯",
    "zhou_flower_balcony": "阳台花架照片：茉莉与玫瑰苞，洒水壶，晨光斜照，退休生活",
    "wang_store_front": "建材店门面照片：亮起的灯箱招牌上写着大字「老王建材城」，卷帘门半开，门口瓷砖与马桶样品堆放，生意人门面",
    "hao_counter_noodles": "柜台泡面照片：泡面杯里蛋黄与筷子，旁边烟灰缸与几枚游戏币，网吧柜台台面",
    "chen_blueprint_desk": "书桌工程图纸照片：手机支架上夹着一张机械工程蓝图（淡蓝底白线，画的是齿轮减速箱装配图：轴、轴承、齿轮、剖视图剖面线、尺寸标注线与公差数字），桌面台灯，三角尺与铅笔，58岁机械工程师的桌面",
    "wang_overtime": "深夜办公室自拍照片：真实手机夜拍质感（写实摄影，非插画：噪点可见、屏幕冷光、高对比），画面里有一位50岁左右中国男老板的半身（富态圆脸、深棕油头、暗红砖纹衬衫），对着电脑显示器疲惫地挤出笑容自拍（屏幕上是电子表格），他身后白墙上一只圆形挂钟很大很清晰、时针和分针指向一点半，前摄像头广角畸变，脸被屏幕光照亮，加班独处",
    "milktea_gift": "奶茶外卖摆拍照片：一杯奶茶与一个甜品袋，附一张小票印着 ¥38，桌面上摆拍，供养礼物",
    "arch_guard_booth": "保安岗亭夜拍照片：真实手机夜拍质感（写实摄影，非插画：噪点可见、灯光眩光、高对比），岗亭窗户透出冷白日光灯光，窗上一排小监控画面屏幕，桌上一只茶杯与对讲机，夜色，无人",
    "arch_roadside": "代驾路边等单照片：真实手机夜拍质感（写实摄影，非插画：噪点可见、灯光眩光、高对比），一辆折叠电动车与头盔倚在路灯柱下，车把上手机屏幕亮着导航，背景酒吧霓虹招牌与深夜街道虚化，无人",
    "arch_fishing": "钓位照片：水面波纹与斜贯的鱼竿，立漂与漂周同心水波，鱼护，远岸芦苇，清晨",
    "arch_chess": "棋摊照片：中国象棋棋盘（楚河汉界、红帥黑將、棋子按开局一字排开），旁边一只茶杯，午后树荫",
    "arch_square": "广场舞照片：路灯杆与音箱阵列，红绸，舞动的人影虚化，华灯初上的广场夜景",
}

# 8 张自拍（女主朋友圈）。bestie 带女主+闺蜜，加美颜自拍质感。
SELFIES = {
    "bestie": "奶茶店两女自拍照片（美颜相机自拍质感）：左边一位20岁左右中国女孩（深棕色双马尾、鬓边樱花发卡、奶油色上衣），右边是闺蜜（波波头、紫色上衣），两人头凑一起微笑，举起的手臂与手机入镜，前景两杯奶茶，暖色串灯散景，皮肤干净无瑕",
    "gym": "夜跑跑道照片：弯月与亮灯的公寓窗户，跑道线，路灯锥光，前景是一位年轻女性的纤细手腕与运动手环显示 23:47（女性手臂，皮肤干净细腻），呼出的白气，冬夜",
    "pool": "女主角泳池自拍：24岁中国年轻女性穿一件式连体泳衣站在泳池边的照片（美颜相机质感，皮肤干净），正午阳光，水面波纹与泳池瓷砖格，一只红白泳圈，遮阳伞一角，健康自然",
    "cat": "橘猫蜷在沙发上的照片：暖灯与串灯散景背景，猫的肉垫与地毯纤维特写，温馨",
    "grind": "深夜办公格子间照片：画面里没有任何人，只有一台笔记本电脑屏幕上是代码编辑器（唯一光源），键盘背光，桌上一杯凉咖啡，01:47 的疲惫",
    "travel": "日落盘山公路照片（从车内向右侧车窗拍的干净视角：画面里没有后视镜、没有车门、没有旁边其他车辆），渐变天空与低垂太阳的光晕，远山剪影，下方虚线蜿蜒的盘山公路，镜头光晕，公路旅行",
    "boba": "桌上的奶茶杯照片：杯里的奶茶不要太满（液面在杯口下两指），侧光透过杯身，奶盖与杯内波纹，沉底的珍珠分三层，红色吸管，杯套素色无字，随拍",
    "sick": "病房特写照片：画面里看不到整个人，只看到一位年轻女性的纤细白皙手臂，手臂修长皮肤细腻无汗毛，前臂静脉隐约可见，手背贴着输液胶布连着输液管，输液管向上连接半空的药袋、一滴正在下落，冷走廊光与一盏暖床头灯，02:40 的孤独——绝对不要粗壮的手臂、绝对不要男性手臂、绝对不要中老年手臂、绝对不要汗毛重的皮肤",
}

# 合并去重表（id 全局唯一）。每张固定种子，记录最终采用的可复现。
SEEDS = {}
_id_order = list(PHOTOS.keys()) + list(SELFIES.keys())
for _i, _id in enumerate(_id_order):
    SEEDS[_id] = 20260922 + _i

# wang_overtime：20260932 真人质感达标但挂钟不指 01:30；20260952 仍不指；多种子试跑后采用
# 20260953（挂钟指向约 01:30，时间证据锚点满足）——raw 候选手动入库，--force 重跑不等于该图。
SEEDS["wang_overtime"] = 20260953

# arch_chess：采用主批 20260937 的 arch_chess_00001_（用户指定沿用最初版）。
SEEDS["arch_chess"] = 20260937

# ---- v4.12：每张 ×5 同主题变体（{id}_v2.._v6）种子区段 ----
# 独立区段 20261100..20261124，不撞基准种子 202609xx（基准图仍在 SEEDS）。
# 提示词逐字复用（同主题），变体差异只来自种子 → 同场景、不同构图/光影。
VARIANT_SEED_BASE = 20261100
VARIANT_SEEDS = {}
for _gi, _id in enumerate(_id_order):
    for _v in range(2, 7):  # _v2.._v6
        VARIANT_SEEDS[(_id, _v)] = VARIANT_SEED_BASE + _gi * 5 + (_v - 2)


def out_dir_for(id_):
    # v4.13：每 id 一个子目录，6 张（_v1.._v6）放一起
    return os.path.join(PROJECT, "public", "photos" if id_ in PHOTOS else "selfies", id_)


def patch_workflow(workflow, id_, seed=None, filename=None):
    body = PHOTOS[id_] if id_ in PHOTOS else SELFIES[id_]
    subdir = "photos" if id_ in PHOTOS else "selfies"
    workflow[STYLE_NODE]["inputs"]["value"] = SCENE_STYLE
    workflow[PROMPT_NODE]["inputs"]["string"] = f"{BASE}\n{body}"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[id_] if seed is None else seed
    workflow[SIZE_NODE]["inputs"]["width"] = LATENT_W
    workflow[SIZE_NODE]["inputs"]["height"] = LATENT_H
    workflow[PREFIX_NODE]["inputs"]["filename_prefix"] = f"{subdir}/{id_}/{filename or id_}"


def resize_to_final(raw_path, id_, filename=None):
    out_dir = out_dir_for(id_)
    os.makedirs(out_dir, exist_ok=True)
    final_path = os.path.join(out_dir, f"{filename or id_}.png")
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize((FINAL_W, FINAL_H), Image.LANCZOS)
        im.save(final_path, optimize=True)
    return final_path


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="批量生成朋友圈照片与自拍 PNG（基准 25 张 + v4.12 变体 125 张）")
    parser.add_argument("--server", default="192.168.1.127:8188", help="ComfyUI 地址")
    parser.add_argument("--only", choices=_id_order, help="只生成指定 id")
    parser.add_argument("--variants", action="store_true", help="生成变体 {id}_v2.._v6（每张 ×5）；不带则生成基准图 {id}.png")
    parser.add_argument("--seed-offset", type=int, default=0, help="所有变体种子 +N（re-roll 不合格图，不改 SEEDS）")
    parser.add_argument("--force", action="store_true", help="已存在也重新生成")
    parser.add_argument("--dry-run", action="store_true", help="只打印 prompt+种子 不提交")
    args = parser.parse_args()

    # 作业表：(id_, 输出文件名, 种子)。v4.13 起全部统一命名 {id}_v{v}（1..6），
    # 基准图即 _v1；旧 --force 上仍叫它「基准」只是习惯话。
    jobs = []
    for i in _id_order:
        if args.only and i != args.only:
            continue
        if args.variants:
            for v in range(2, 7):
                jobs.append((i, f"{i}_v{v}", VARIANT_SEEDS[(i, v)] + args.seed_offset))
        else:
            jobs.append((i, f"{i}_v1", SEEDS[i]))

    if args.dry_run:
        workflow = load_workflow(WORKFLOW_PATH)
        for i, stem, seed in jobs:
            patch_workflow(workflow, i, seed=seed, filename=stem)
            print(f"--- {stem}（seed={seed}）---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        return

    for i, stem, seed in jobs:
        final_path = os.path.join(out_dir_for(i), f"{stem}.png")
        if os.path.exists(final_path) and not args.force:
            print(f"{stem}: 已存在，跳过（--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        patch_workflow(workflow, i, seed=seed, filename=stem)
        client_id = f"py-scene-{stem}-{os.getpid()}"
        prompt_id = queue_prompt(args.server, workflow, client_id)
        print(f"{stem}: 已提交 {prompt_id}（seed={seed}），等待生成...")
        history = wait_for_history(args.server, prompt_id)
        images = collect_images(history)
        if not images:
            print(f"{stem}: 任务完成但没有输出图片")
            sys.exit(1)
        raw_path = download_image(args.server, images[0], RAW_DIR, prompt_id)
        saved = resize_to_final(raw_path, i, stem)
        print(f"{stem}: 已保存 {os.path.abspath(saved)}")
    print("完成")


if __name__ == "__main__":
    main()
