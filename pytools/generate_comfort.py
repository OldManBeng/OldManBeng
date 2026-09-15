# -*- coding: utf-8 -*-
"""批量生成舒适圈角色头像与朋友圈场景 PNG（第二阶段 1.1.0，ComfyUI 文生图 → public/comfort/）。

产物（按类型分目录）：
- 头像 256×256 PNG：public/comfort/avatars/{key}.png
  （小满素颜 / 妈王秀兰 / 男友阿凯 / 父亲旧照—— father 建议黑白，前端会再压一层灰调；
  红娘线的阿姨/闺蜜与候选人头像也归此处 / dates/）
- 场景 560×420 JPEG q85：public/comfort/scenes/{cm|bd|bm}/{key}.jpg（v4.13.2 web 尺寸规范；
  raw 768 PNG 留 pytools/comfort_raw/{avatars|dates|cm|bd|bm}/，gitignore）

用法（与 generate_avatars.py 一致）:
    python generate_comfort.py                 # 全部（已存在跳过）
    python generate_comfort.py --only avatars  # 只生成 4 张头像
    python generate_comfort.py --only scenes   # 只生成 33 张小满朋友圈场景
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

WORKFLOW_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "amazing-z-photo_GGUF.json"
)
RAW_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "comfort_raw")
OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "comfort"
)

PROMPT_NODE = "385"
SEED_NODE = "307"
SIZE_NODE = "244"
PREFIX_NODE = "9"
STYLE_NODE = "125"

AVATAR_SIZE = 1024
AVATAR_FINAL = 256
SCENE_W, SCENE_H = 1024, 768  # 4:3 生成
SCENE_OUT = (560, 420)  # web 入库（q85 JPEG）

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

# ---- 33 张朋友圈场景（4:3 横构图，手机随拍质感——舒适圈的生活切片） ----
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
    # 扩充 1.2：生活切片（励志向）
    "cm_noodles": "出租屋小桌上的泡面加蛋：不锈钢小锅直接当碗，卧着荷包蛋，筷子搭在锅沿，深夜台灯暖光",
    "cm_ledger": "摊开的手写记账本：工整字迹记着房租伙食几行小字，计算器和一枚硬币压着页脚，暖黄灯光静物",
    "cm_running": "清晨小区环形跑道的第一视角：路灯还没熄，天刚蒙蒙亮，手臂和手机臂包一角入画，长曝光光轨感",
    "cm_haircut": "理发店座椅前地上的碎发：围布一角入画，镜子里反射出店门的灯光，从头开始的安静氛围",
    "cm_bus": "末班公交的车窗：城市灯光拖成模糊光轨，空荡车厢的蓝色座椅，深夜疲倦又安静",
    "cm_rain": "出租屋窗玻璃上的雨痕：楼下早点摊的暖灯晕开成光斑，玻璃起雾，凌晨清冷氛围",
    "cm_desk": "出租屋书桌一角：台灯、缠成团的充电线、喝了一半的水杯，便利贴边角，深夜生活痕迹特写",
    "cm_market": "收摊前的菜市场：打折处理的青菜堆成小山，红色塑料袋，傍晚白炽灯，市井烟火气",
    "cm_match": "公园相亲角的树林：一排排挂满资料纸的伞绳在风里轻晃，驻足的老人家背影，冬日阴天街拍感",
    # 扩充 1.2：家的痕迹（家庭向）
    "cm_tomato": "拆妈寄来的纸箱：胶带撕开，旧围巾塞作填充，两罐辣酱和一袋干香菇露出来，客厅地板俯拍",
    "cm_sweater": "叠在枕头上的一件旧毛衣：袖口磨得起球，酒红色洗得发白，午后窗光，樟脑味的联想",
    "cm_moon": "从出租屋天台拍的城市月亮：晾衣绳和衣架剪影横过画面，楼下万家灯火，手机夜拍噪点感",
    "cm_train": "春节前的火车站台：大包小包的人群背影，绿色车厢门开着，站台灯牌发光，归乡氛围",
    "cm_pill": "床头柜上的药盒和一杯温水：烧水壶冒着热气，被角一角，独自扛病的清晨柔光",
    "cm_pot": "出租屋公用厨房炖着的一锅汤：玻璃锅盖蒙着水汽，小火苗，窗外夜色，温暖的等待感",
    # 扩充 1.2：恋爱的痕迹（恩爱向）
    "cm_umbrella": "雨天一把伞下的两个人：只拍到并肩的肩膀，男生那边淋湿了半边，积水路面反光",
    "cm_arcade": "电玩城的游戏机台前：握着摇杆的手特写，屏幕反光和霓虹灯牌，喧闹而专注",
    "cm_night_walk": "深夜街边的并肩散步：两双鞋走在斑马线的白线上，路灯把影子拉得很长，低角度街拍",
    "cm_gift": "帆布包带上的小挂件特写：游戏赢来的金属徽章挂件，磨旧的帆布纹理，午后阳光",
    "cm_back": "从沙发拍的打游戏背影：椅背上搭着毯子，屏幕蓝光映亮肩线，泡面箱当脚凳，同居日常",
    "cm_picnic": "城市公园的简易野餐：格子野餐垫上超市买的面包和一盒草莓，可乐罐，午后树影",
    "cm_karaoke": "KTV包厢的点歌屏幕：两只话筒，果盘和饮料，霓虹灯光，姐妹聚会的热闹氛围",
}

SEEDS = {}
_seed = 20270100
for _k in AVATARS:
    SEEDS[_k] = _seed
    _seed += 1
for _k in SCENES:
    SEEDS[_k] = _seed
    _seed += 1


# ---- 分类路径 helper（public/comfort 与 raw 归档均按类型分目录） ----
def scene_rel(key: str) -> str:
    """场景入库相对路径：scenes/{cm|bd|bm}/{key}.jpg（按 key 前缀分子目录）。"""
    return os.path.join("scenes", key.split("_")[0], f"{key}.jpg")


def out_avatar_path(key: str) -> str:
    """头像入库路径：avatars/{key}.png；候选人头像 → dates/{key}.png（阿姨/闺蜜归 avatars/）。"""
    sub = (
        "dates"
        if key in DATE_AVATARS and key not in ("auntie", "bestie")
        else "avatars"
    )
    return os.path.join(OUT_DIR, sub, f"{key}.png")


def raw_subdir(key: str) -> str:
    """raw 归档子目录（pytools/comfort_raw/ 下）：avatars / dates / cm / bd / bm。"""
    if key in AVATARS or key in ("auntie", "bestie"):
        return "avatars"
    if key in DATE_AVATARS:
        return "dates"
    return key.split("_")[0]


def patch_avatar(workflow: dict, key: str) -> None:
    workflow[STYLE_NODE]["inputs"]["value"] = CLEAN_STYLE
    workflow[PROMPT_NODE]["inputs"][
        "string"
    ] = f"舒适圈头像·{key}：{AVATARS[key]} +（通用底座）"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[key]
    workflow[SIZE_NODE]["inputs"]["width"] = AVATAR_SIZE
    workflow[SIZE_NODE]["inputs"]["height"] = AVATAR_SIZE
    workflow[PREFIX_NODE]["inputs"]["filename_prefix"] = f"comfort/avatars/{key}"


def _patch_date_scene(workflow: dict, key: str) -> None:
    workflow[PROMPT_NODE]["inputs"][
        "string"
    ] = f"相亲对象朋友圈配图·{key}：{DATE_SCENES[key]}，横构图 4:3"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[key]
    workflow[SIZE_NODE]["inputs"]["width"] = SCENE_W
    workflow[SIZE_NODE]["inputs"]["height"] = SCENE_H
    workflow[PREFIX_NODE]["inputs"][
        "filename_prefix"
    ] = f"comfort/scenes/{key.split('_')[0]}/{key}"


def patch_scene(workflow: dict, key: str) -> None:
    # 场景沿用工作流默认风格前缀（手机摄影质感），不换 CLEAN_STYLE。
    workflow[PROMPT_NODE]["inputs"][
        "string"
    ] = f"舒适圈朋友圈配图·{key}：{SCENES[key]}，横构图 4:3"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[key]
    workflow[SIZE_NODE]["inputs"]["width"] = SCENE_W
    workflow[SIZE_NODE]["inputs"]["height"] = SCENE_H
    workflow[PREFIX_NODE]["inputs"][
        "filename_prefix"
    ] = f"comfort/scenes/{key.split('_')[0]}/{key}"


def save_avatar(raw_path: str, key: str) -> str:
    final_path = out_avatar_path(key)
    os.makedirs(os.path.dirname(final_path), exist_ok=True)
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize((AVATAR_FINAL, AVATAR_FINAL), Image.LANCZOS)
        im.save(final_path, optimize=True)
    return final_path


def save_scene(raw_path: str, key: str) -> str:
    final_path = os.path.join(OUT_DIR, scene_rel(key))
    os.makedirs(os.path.dirname(final_path), exist_ok=True)
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize(SCENE_OUT, Image.LANCZOS)
        im.save(final_path, quality=85, optimize=True)
    return final_path


def generate_one(server: str, workflow: dict, key: str, is_avatar: bool) -> str:
    raw_dir = os.path.join(RAW_DIR, raw_subdir(key))
    os.makedirs(raw_dir, exist_ok=True)
    if is_avatar:
        patch_avatar(workflow, key)
    else:
        patch_scene(workflow, key)
    # 与 generate_avatars.py 同一套调用口径：client_id 提交 → history 轮询 → 下载原始图。
    client_id = f"py-comfort-{key}-{os.getpid()}"
    prompt_id = queue_prompt(server, workflow, client_id)
    history = wait_for_history(server, prompt_id)
    images = collect_images(history)
    if not images:
        print(f"{key}: 任务完成但没有输出图片")
        sys.exit(1)
    raw_path = download_image(server, images[0], raw_dir, prompt_id)
    return save_avatar(raw_path, key) if is_avatar else save_scene(raw_path, key)


# ==========================================================================
# v1.1.x 红娘线：凤霞姨头像 + 10 个相亲对象头像 + 30 张候选人朋友圈图
# 产物：
#   头像 → public/comfort/avatars/auntie.png / public/comfort/dates/{key}.png
#   场景 → public/comfort/scenes/bd/bd_{key}_{1,2,3}.jpg
# ==========================================================================
DATE_AVATARS = {
    "auntie": (
        "53 岁中国热心阿姨头像，社区红娘：黑色短卷发烫小卷，红框圆眼镜，眼角笑纹深，"
        "穿藕粉色针织开衫配碎花围巾，表情热络爽利像正要拉着你介绍对象，"
        "居委会办公室背景虚化（荣誉锦旗隐约可见）"
    ),
    # 曼曼Lisa（闺蜜沈曼，25，医美顾问）：拜金的橱窗感，精致里带三分倦
    "bestie": (
        "25 岁中国年轻女性头像，时尚精致风：浅棕色大波浪卷发，妆容明显（眼线上挑、正红色唇），"
        "金色小圆环耳环，穿米色针织衫配丝巾，做了浅色美甲的手指尖轻触脸颊，"
        "表情自信带三分精明与一丝不易察觉的倦意，商场美妆区明亮灯光背景虚化"
    ),
    "chen": "29 岁中国男教师头像：清爽短发，细框方眼镜，白衬衫扣到顶，清瘦书卷气，表情温和拘谨，教室黑板绿背景虚化",
    "zhao": "31 岁中国男医生头像：黑色短发压得服帖，白大褂配听诊器，眼下淡淡熬夜青影，笑容干净可靠，医院走廊冷白背景虚化",
    "sun": "28 岁中国消防员头像：板寸头，皮肤晒成小麦色，浓眉大眼笑得憨直，深蓝色作训服，消防车红白车身边缘虚化",
    "zhou": "33 岁中国公务员头像：三七分短发一丝不苟，深色polo衫，方脸平和面相，表情规矩老实，办公室绿植背景虚化",
    "wu": "27 岁中国程序员头像：蓬乱短发，黑框眼镜，灰色连帽衫，脸色偏白偶尔熬夜，表情认真直接，双显示器代码屏背景虚化",
    "zheng": "30 岁中国健身教练头像：短寸发，下颌线分明，皮肤健康古铜色，紧身运动背心，笑容阳光自信带点自恋，健身房器械背景虚化",
    "feng": "35 岁中国汽修师傅头像：短寸头发鬓角略长，手背有旧疤，深蓝色工装外套拉链半开，表情沉静内敛带一丝沧桑，汽修厂工具墙背景虚化",
    "he": "28 岁中国摄影师头像：微卷中长发，米色亚麻衬衫，脖挂胶片相机，眼神温柔观察感，暖调婚礼背景虚化光斑",
    "xu": "31 岁中国公交司机头像：平头，制服深蓝配肩章，坐姿端正，表情沉稳朴实带一点倦，公交车驾驶位前挡玻璃街景虚化",
    "jiang": "26 岁中国创业青年头像：油头梳背，白色衬衫外搭休闲西装，笑得热情洋溢带几分表演感，奶茶店暖色灯光背景虚化",
}

DATE_SCENES = {
    "bd_chen_1": "办公桌上摊开的批改完的试卷，红笔批注工整，一杯凉了的茶，台灯光，夜晚办公室氛围",
    "bd_chen_2": "教室窗台上的粉笔盒和黑板擦，夕阳斜照进空教室，粉笔灰在光柱里飞舞",
    "bd_zhao_1": "医院儿科走廊长椅：墙上贴着卡通退烧贴广告，暖灯，寂静的深夜氛围，输液架剪影",
    "bd_zhao_2": "医院食堂早餐：一碗豆浆两个包子放在不锈钢餐盘上，蒸汽升起，清晨倦怠感",
    "bd_sun_1": "消防训练塔和拉练绳索：湿透的手套搭在栏杆上，夕阳把影子拉得很长",
    "bd_sun_2": "消防站食堂的一碗热汤面：白瓷碗冒热气，背景是红色餐盘和兄弟们的筷影",
    "bd_zhou_1": "窗台上一盆开花的君子兰：橘色花朵，瓷盆擦得锃亮，背景一尘不染的窗玻璃",
    "bd_zhou_2": "阳台上擦得锃亮的自行车车把特写：阳光反光，抹布搭在车座上，生活规律感",
    "bd_wu_1": "程序员书桌：双显示器代码界面发光，旁边一盆多肉小盆栽，机械键盘RGB微光，深夜氛围",
    "bd_wu_2": "厨房里炖着汤的砂锅：小火慢炖冒热气，旁边摊开的手写食谱笔记，温馨居家感",
    "bd_zheng_1": "清晨健身房的哑铃架和镜子：一位教练的剪影在做示范，晨光从百叶窗切进来",
    "bd_zheng_2": "健身房前台的一排奖牌和会员感谢锦旗：暖色射灯打光，专业自信氛围",
    "bd_feng_1": "汽修厂里一台老桑塔纳被缓缓升起：老师傅站在车下仰头，工具墙背景，油污与光线交错",
    "bd_feng_2": "汽修厂角落的旧工具箱：磨掉漆的抽屉，扳手排列整齐，一杯泡着枸杞的茶，午后阳光",
    "bd_he_1": "婚礼现场的抓拍视角：新娘父亲独自坐在角落，手里捏着酒杯，暖色水晶灯光斑虚化",
    "bd_he_2": "摄影师的修片桌面：双屏显示着婚纱照原片，手写便签贴满屏幕边框，凌晨咖啡杯",
    "bd_xu_1": "清晨公交车总站的车辆排班：28路公交大灯亮着，天色蒙蒙亮，站牌灯箱发光",
    "bd_xu_2": "公交车驾驶位视角：方向盘、刷卡机、挂着的的水杯，挡风玻璃外城市清晨街景",
    "bd_jiang_1": "温馨奶茶店吧台：招牌杨枝甘露放在前台，价目牌灯光暖黄，年轻店员的围裙特写",
    "bd_jiang_2": "深夜奶茶店打烊盘账：收银机屏幕亮着，账本和计算器，一杯做坏的试验品奶茶放在角落",
    # 扩充 1.2：每人的第三张朋友圈
    "bd_chen_3": "教师办公桌一角：绿萝盆栽旁边码着一摞作业本，红笔搁在翻开的教案上，午后窗光",
    "bd_zhao_3": "儿科诊室的桌面：听诊器和一盒蜡笔并排放着，蜡笔盒上还有孩子涂的彩色圆圈，暖色诊室",
    "bd_sun_3": "消防站院子里晾着的一排深蓝作训服：阳光下的衣架剪影，背景是停着消防车的车库门",
    "bd_zhou_3": "老式收音机和搪瓷杯放在窗台：调频刻度特写，窗台擦得一尘不染，午后静谧",
    "bd_wu_3": "程序员书桌旁的白板：画得工整的流程图和几张便利贴，旁边一包没拆的咖啡挂耳",
    "bd_zheng_3": "傍晚的操场跑道：红色塑胶道，一个拉伸放松的剪影，天边晚霞，运动后的松弛感",
    "bd_feng_3": "老桑塔纳的方向盘特写：磨亮的皮质，钥匙插在锁孔里，风挡外是修车厂的灯光",
    "bd_he_3": "摄影师的帆布相机包敞开在木桌上：几卷胶卷排成一行，镜头布和说明书，暖光",
    "bd_xu_3": "夜班收车后的公交场站：28路停成一排，车厢里最后一盏灯熄灭，月色下的停车场",
    "bd_jiang_3": "奶茶店新分店的装修围挡：品牌色幕布印着「开业倒计时」字样，卷尺和图纸散落一地",
    # 曼曼的朋友圈：她的橱窗（下午茶/新包/医美 + 提车/度假/晚餐）
    "bm_tea": "精致下午茶摆盘：三层点心塔，马卡龙与司康，拉花咖啡，大理石桌面，甜品店柔和暖光，手机随拍质感",
    "bm_bag": "新款女士手提包开箱：老花纹样手袋放在床上，防尘袋与丝带散在一旁，购物袋边角入画，卧室暖光",
    "bm_spa": "医美机构咨询室：干净的白色诊桌、皮肤检测仪屏幕发着光、绿植一角，明亮现代的美容诊所氛围",
    # 扩充 1.2：曼曼橱窗的第二排
    "bm_car": "新车提车：系着红色蝴蝶结的车头特写，展厅射灯，车钥匙握在手心，明亮展厅氛围",
    "bm_hotel": "度假酒店的无边泳池：拖鞋和浴巾放在躺椅上，椰林与海平线，明媚阳光度假感",
    "bm_shoes": "新款高跟鞋开箱：鞋盒烫金字样，鞋尖朝前摆在玄关，全身镜一角反射出细节",
    "bm_dinner": "西餐厅的烛光晚餐桌面：牛排与红酒杯，银质餐具摆放讲究，暖色烛光与景深虚化",
    "bm_flight": "机场贵宾厅的落地窗：登机牌与护照并排放在桌上，窗外停着白色机身的飞机，行李箱立着",
    "bm_flower": "开业花篮与花束特写：香槟色玫瑰捧花，缎带上烫金字样，美妆店门面灯光",
}

# 红娘线 seed 接续原池
for _k in DATE_AVATARS:
    SEEDS[_k] = _seed
    _seed += 1
for _k in DATE_SCENES:
    SEEDS[_k] = _seed
    _seed += 1

# 候选人头像生成到 public/comfort/dates/{key}.png


def save_date_avatar(raw_path: str, key: str) -> str:
    # 阿姨/闺蜜是主联系人，头像和小满/妈/阿凯平级归 avatars/；候选人头像 → dates/
    final_path = out_avatar_path(key)
    os.makedirs(os.path.dirname(final_path), exist_ok=True)
    with Image.open(raw_path) as im:
        im = im.convert("RGB").resize((AVATAR_FINAL, AVATAR_FINAL), Image.LANCZOS)
        im.save(final_path, optimize=True)
    return final_path


def patch_date_avatar(workflow: dict, key: str) -> None:
    workflow[STYLE_NODE]["inputs"]["value"] = CLEAN_STYLE
    workflow[PROMPT_NODE]["inputs"][
        "string"
    ] = f"相亲对象头像·{key}：{DATE_AVATARS[key]} +（通用底座）"
    workflow[SEED_NODE]["inputs"]["value"] = SEEDS[key]
    workflow[SIZE_NODE]["inputs"]["width"] = AVATAR_SIZE
    workflow[SIZE_NODE]["inputs"]["height"] = AVATAR_SIZE
    workflow[PREFIX_NODE]["inputs"][
        "filename_prefix"
    ] = f"comfort/{raw_subdir(key)}/{key}"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(
        description="批量生成舒适圈角色头像与朋友圈场景（1.1.0）"
    )
    parser.add_argument("--server", default="192.168.1.127:8188", help="ComfyUI 地址")
    parser.add_argument(
        "--only",
        choices=["avatars", "scenes", "dates"],
        help="只生成头像/场景/红娘+闺蜜线（12头像+39图）",
    )
    parser.add_argument(
        "--key", help="只生成指定 key（如 mother / cm_boba），--force 时可重跑单张"
    )
    parser.add_argument("--force", action="store_true", help="已存在也重新生成")
    parser.add_argument("--dry-run", action="store_true", help="只打印 prompt 不提交")
    args = parser.parse_args()

    avatar_keys = list(AVATARS) if args.only in (None, "avatars") else []
    date_keys = list(DATE_AVATARS) if args.only in (None, "dates") else []
    scene_keys = list(SCENES) if args.only in (None, "scenes") else []
    date_scene_keys = list(DATE_SCENES) if args.only in (None, "dates") else []
    if args.key:
        if args.key in AVATARS and args.only in (None, "avatars"):
            avatar_keys = [args.key]
        else:
            avatar_keys = []
        if args.key in DATE_AVATARS and args.only in (None, "dates"):
            date_keys = [args.key]
        else:
            date_keys = [k for k in date_keys if k != args.key]
        if args.key in SCENES and args.only in (None, "scenes"):
            scene_keys = [args.key]
        else:
            scene_keys = [k for k in scene_keys if k != args.key]
        if args.key in DATE_SCENES and args.only in (None, "dates"):
            date_scene_keys = [args.key]
        else:
            date_scene_keys = [k for k in date_scene_keys if k != args.key]

    if args.dry_run:
        workflow = load_workflow(WORKFLOW_PATH)
        for k in avatar_keys:
            patch_avatar(workflow, k)
            print(f"--- 头像 {k}（seed={SEEDS[k]}）→ comfort/avatars/{k}.png ---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        for k in date_keys:
            patch_date_avatar(workflow, k)
            print(f"--- 候选人头像 {k}（seed={SEEDS[k]}）→ {out_avatar_path(k)} ---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        for k in scene_keys:
            patch_scene(workflow, k)
            print(f"--- 场景 {k}（seed={SEEDS[k]}）→ comfort/{scene_rel(k)} ---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        for k in date_scene_keys:
            _patch_date_scene(workflow, k)
            print(f"--- 候选人场景 {k}（seed={SEEDS[k]}）→ comfort/{scene_rel(k)} ---")
            print(workflow[PROMPT_NODE]["inputs"]["string"])
            print()
        return

    for k in avatar_keys:
        out = out_avatar_path(k)
        if os.path.exists(out) and not args.force:
            print(f"skip {k}（已存在，--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        print(f"生成头像 {k} ...")
        print("→", generate_one(args.server, workflow, k, is_avatar=True))

    for k in scene_keys:
        out = os.path.join(OUT_DIR, scene_rel(k))
        if os.path.exists(out) and not args.force:
            print(f"skip {k}（已存在，--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        print(f"生成场景 {k} ...")
        print("→", generate_one(args.server, workflow, k, is_avatar=False))

    # 红娘线：候选人头像 → public/comfort/dates/（阿姨/闺蜜归 avatars/），朋友圈图 → scenes/bd/
    for k in date_keys:
        out = out_avatar_path(k)
        if os.path.exists(out) and not args.force:
            print(f"skip {k}（已存在，--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        patch_date_avatar(workflow, k)
        client_id = f"py-comfort-{k}-{os.getpid()}"
        prompt_id = queue_prompt(args.server, workflow, client_id)
        print(f"{k}: 已提交 {prompt_id}，等待生成...")
        history = wait_for_history(args.server, prompt_id)
        images = collect_images(history)
        if not images:
            print(f"{k}: 任务完成但没有输出图片")
            sys.exit(1)
        raw_path = download_image(
            args.server, images[0], os.path.join(RAW_DIR, raw_subdir(k)), prompt_id
        )
        print("→", save_date_avatar(raw_path, k))

    for k in date_scene_keys:
        out = os.path.join(OUT_DIR, scene_rel(k))
        if os.path.exists(out) and not args.force:
            print(f"skip {k}（已存在，--force 重生成）")
            continue
        workflow = load_workflow(WORKFLOW_PATH)
        patch_scene(workflow, k) if k in SCENES else _patch_date_scene(workflow, k)
        client_id = f"py-comfort-{k}-{os.getpid()}"
        prompt_id = queue_prompt(args.server, workflow, client_id)
        print(f"{k}: 已提交 {prompt_id}，等待生成...")
        history = wait_for_history(args.server, prompt_id)
        images = collect_images(history)
        if not images:
            print(f"{k}: 任务完成但没有输出图片")
            sys.exit(1)
        raw_path = download_image(
            args.server, images[0], os.path.join(RAW_DIR, raw_subdir(k)), prompt_id
        )
        print("→", save_scene(raw_path, k))


if __name__ == "__main__":
    main()
