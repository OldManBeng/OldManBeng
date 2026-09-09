# -*- coding: utf-8 -*-
"""通过 ComfyUI API 调用远程工作流生成图片并保存到本地 images 文件夹。

用法:
    python generate_images.py                 # 随机种子生成一张
    python generate_images.py --seed 42      # 指定种子
    python generate_images.py --server 192.168.1.127:8188 --workflow amazing-z-photo_GGUF.json
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


def load_workflow(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


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
    args = parser.parse_args()

    workflow_path = os.path.abspath(args.workflow)
    workflow = load_workflow(workflow_path)

    seed = args.seed if args.seed is not None else random.randint(0, 2**32 - 1)
    if SEED_NODE_ID in workflow:
        workflow[SEED_NODE_ID]["inputs"]["value"] = seed
    print(f"使用种子: {seed}")

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
