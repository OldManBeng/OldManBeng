# -*- coding: utf-8 -*-
"""通过 ComfyUI API 调用远程工作流生成图片并保存到本地 images 文件夹。

style 节点(125)以 {$@} 结尾，会被主提示词节点(385)的内容替换，二者拼接为最终提示。

用法一（命令行参数）:
    python generate_images.py --prompt "24岁中国御姐，黑长直"            # 仅自定义主提示词
    python generate_images.py --prompt "..." --style "电影胶片风格\n{$@}"  # 连风格一起改
    python generate_images.py --prompt "..." --size 1088x1600           # 指定尺寸（宽x高）
    python generate_images.py --seed 42 --prompt "..."                  # 固定种子
    python generate_images.py --server 192.168.1.127:8188 --workflow amazing-z-photo_GGUF.json

用法二（本地测试，直接编辑下方 PROMPT / STYLE / SIZE / NEGATIVE 常量后运行）:
    python generate_images.py
"""
import argparse
import json
import os
import random
import sys
import time
from urllib.parse import urlencode

import requests

# SEED 节点（PrimitiveInt，标题为 SEED），每次运行默认随机化
SEED_NODE_ID = "307"
# 主提示词节点（StringTrim，被替换进 style 的 {$@} 处）
PROMPT_NODE_ID = "385"
# 风格模板节点（PrimitiveStringMultiline，YOUR PHOTO 之前，必须以 {$@} 结尾）
STYLE_NODE_ID = "125"
# style 必须以此结尾，否则主提示词无法注入
STYLE_END_TOKEN = "{$@}"
# 最终出图的空 Latent 节点（EmptySD3LatentImage），--size / SIZE 直接覆盖其宽高
SIZE_NODE_ID = "244"
# 负面提示词节点（CLIPTextEncode，标题 CLIP文本编码）
NEGATIVE_NODE_ID = "60"

# ==================== 本地测试配置 ====================
# 直接编辑此处后运行 python generate_images.py 即可，命令行参数优先级更高
PROMPT = '''1girl, solo, female protagonist, stunning beauty, perfect symmetrical face, captivating eyes, glossy pink lips, seductive expression,
voluptuous curvy body, hourglass figure, full bust, wide hips, thick thighs, toned waist,
wearing a pink lace bra, pink sports bra, matching pink leggings or panties, revealing her cleavage, showing her curves,
dynamic athletic pose, standing in a modern gym, with fitness equipment, weights, mirrors, motivational posters,
sweaty glowing skin, motion blur, intense workout atmosphere.'''    # 主提示词，留空则必须用 --prompt 传入
STYLE = '''masterpiece, best quality, photorealistic, hyperdetailed, 8k, 
**high contrast, dramatic cinematic lighting, strong chiaroscuro, harsh shadows and bright highlights,** 
**vibrant cyan and orange neon noir style, dual-tone color palette,** 
depth of field, bokeh, sharp focus on face and body, film grain, 
**art by wlop and guweiz, with a gritty, moody atmosphere,** 
elegant composition, high fashion photography.
{$@}'''   # 风格模板；None = 用工作流内置风格；自定义时建议以 {$@} 结尾（缺省会自动追加）
SIZE = None    # 出图尺寸 "宽x高"（如 "1088x1600"，支持 x/X/* 分隔）；None = 用工作流内置尺寸
NEGATIVE = ""  # 负面提示词；留空 = 用工作流内置内容（当前为空）
# =====================================================


def load_workflow(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_size(text: str):
    """解析 '宽x高' 格式尺寸（支持 x/X/* 分隔），返回 (width, height)。"""
    import re
    m = re.fullmatch(r"\s*(\d+)\s*[xX*]\s*(\d+)\s*", text)
    if not m:
        raise ValueError(f"尺寸格式错误: {text!r}，应为 '宽x高'，如 1088x1600")
    w, h = int(m.group(1)), int(m.group(2))
    if w <= 0 or h <= 0:
        raise ValueError(f"尺寸必须为正整数: {text!r}")
    return w, h


def queue_prompt(server: str, workflow: dict, client_id: str) -> str:
    resp = requests.post(
        f"http://{server}/prompt",
        json={"prompt": workflow, "client_id": client_id},
        timeout=30,
    )
    if resp.status_code == 400:
        # 工作流校验失败，打印节点错误详情
        try:
            print("工作流校验失败:", json.dumps(resp.json(), ensure_ascii=False, indent=2))
        except Exception:
            print("工作流校验失败:", resp.text)
        sys.exit(1)
    resp.raise_for_status()
    return resp.json()["prompt_id"]


def wait_for_history(server: str, prompt_id: str, timeout: int = 3600) -> dict:
    """轮询 /history 直到任务完成，返回该 prompt 的历史记录。"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = requests.get(f"http://{server}/history/{prompt_id}", timeout=30)
        resp.raise_for_status()
        history = resp.json().get(prompt_id)
        if history is not None:
            status = history.get("status", {})
            if status.get("status_str") == "error":
                msgs = status.get("messages", [])
                print("执行出错:", json.dumps(msgs, ensure_ascii=False, indent=2))
                sys.exit(1)
            if status.get("completed"):
                return history
        time.sleep(1.0)
    raise TimeoutError(f"等待任务 {prompt_id} 超时（{timeout}s）")


def collect_images(history: dict) -> list:
    images = []
    for node_output in history.get("outputs", {}).values():
        for img in node_output.get("images", []):
            if img.get("type", "output") == "output":
                images.append(img)
    return images


def download_image(server: str, img: dict, save_dir: str, prompt_id: str) -> str:
    params = {
        "filename": img["filename"],
        "subfolder": img.get("subfolder", ""),
        "type": img.get("type", "output"),
    }
    resp = requests.get(f"http://{server}/view?{urlencode(params)}", timeout=120)
    resp.raise_for_status()

    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, img["filename"])
    if os.path.exists(save_path):  # 避免重名覆盖，加 prompt_id 前缀
        save_path = os.path.join(save_dir, f"{prompt_id[:8]}_{img['filename']}")
    with open(save_path, "wb") as f:
        f.write(resp.content)
    return save_path


def main():
    parser = argparse.ArgumentParser(description="调用远程 ComfyUI 生成图片")
    parser.add_argument("--server", default="192.168.1.127:8188", help="ComfyUI 地址")
    parser.add_argument("--workflow", default="amazing-z-photo_GGUF.json", help="工作流 JSON 文件")
    parser.add_argument("--out", default="images", help="图片保存目录")
    parser.add_argument("--seed", type=int, default=None, help="随机种子（默认每次随机）")
    parser.add_argument("--prompt", default=None, help="主提示词（不传则使用文件顶部 PROMPT 常量）")
    parser.add_argument("--style", default=None, help="风格模板（不传则使用文件顶部 STYLE 常量，均未设置时用工作流内置风格）")
    parser.add_argument("--size", default=None, help="出图尺寸 宽x高，如 1088x1600（不传则使用文件顶部 SIZE 常量，均未设置时用工作流内置尺寸）")
    parser.add_argument("--negative", default=None, help="负面提示词（不传则使用文件顶部 NEGATIVE 常量，均未设置时用工作流内置内容）")
    args = parser.parse_args()

    # 命令行参数优先，其次文件顶部常量
    prompt = args.prompt if args.prompt is not None else PROMPT
    if not prompt.strip():
        parser.error("请通过 --prompt 参数或文件顶部 PROMPT 常量设置主提示词")
    style = args.style if args.style is not None else STYLE
    negative = args.negative if args.negative is not None else NEGATIVE
    size_text = args.size if args.size is not None else SIZE
    size = None
    if size_text:
        try:
            size = parse_size(size_text)
        except ValueError as e:
            parser.error(str(e))

    workflow_path = os.path.abspath(args.workflow)
    workflow = load_workflow(workflow_path)

    seed = args.seed if args.seed is not None else random.randint(0, 2**32 - 1)
    if SEED_NODE_ID in workflow:
        workflow[SEED_NODE_ID]["inputs"]["value"] = seed
    print(f"使用种子: {seed}")

    # 主提示词：节点 385 的 string，会被注入风格模板的 {$@} 处
    if PROMPT_NODE_ID in workflow:
        workflow[PROMPT_NODE_ID]["inputs"]["string"] = prompt
    else:
        print(f"警告：工作流中找不到主提示词节点 {PROMPT_NODE_ID}")
        sys.exit(1)

    # 风格模板：节点 125，必须以 {$@} 结尾，否则主提示词无法注入
    if style is not None:
        if STYLE_NODE_ID not in workflow:
            print(f"警告：工作流中找不到风格节点 {STYLE_NODE_ID}")
            sys.exit(1)
        style = style.rstrip()
        if not style.endswith(STYLE_END_TOKEN):
            print(f"警告：style 未以 {STYLE_END_TOKEN} 结尾，已自动追加")
            style += "\n" + STYLE_END_TOKEN
        workflow[STYLE_NODE_ID]["inputs"]["value"] = style
    else:
        print(f"使用工作流内置默认风格（节点 {STYLE_NODE_ID}）")

    # 出图尺寸：直接覆盖节点 244（EmptySD3LatentImage）的宽高
    if size is not None:
        if SIZE_NODE_ID not in workflow:
            print(f"警告：工作流中找不到尺寸节点 {SIZE_NODE_ID}")
            sys.exit(1)
        workflow[SIZE_NODE_ID]["inputs"]["width"] = size[0]
        workflow[SIZE_NODE_ID]["inputs"]["height"] = size[1]
        print(f"使用尺寸: {size[0]}x{size[1]}")
    else:
        print(f"使用工作流内置默认尺寸（节点 {SIZE_NODE_ID}）")

    # 负面提示词：节点 60（CLIP文本编码）
    if negative.strip():
        if NEGATIVE_NODE_ID not in workflow:
            print(f"警告：工作流中找不到负面提示词节点 {NEGATIVE_NODE_ID}")
            sys.exit(1)
        workflow[NEGATIVE_NODE_ID]["inputs"]["text"] = negative
        print(f"使用负面提示词: {negative[:60]}{'...' if len(negative) > 60 else ''}")
    else:
        print(f"使用工作流内置负面提示词（节点 {NEGATIVE_NODE_ID}，当前为空）")

    client_id = f"py-{random.randint(0, 1 << 30)}"
    prompt_id = queue_prompt(args.server, workflow, client_id)
    print(f"任务已提交: {prompt_id}，等待生成...")

    history = wait_for_history(args.server, prompt_id)
    images = collect_images(history)
    if not images:
        print("任务完成但没有输出图片")
        sys.exit(1)

    for img in images:
        path = download_image(args.server, img, args.out, prompt_id)
        print(f"已保存: {os.path.abspath(path)}")
    print(f"完成，共 {len(images)} 张图片")


if __name__ == "__main__":
    main()
