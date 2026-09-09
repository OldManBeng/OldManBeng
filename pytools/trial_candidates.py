# -*- coding: utf-8 -*-
"""多种子试跑：把候选成图先落到 pytools/avatar_raw/（gitignored）供人眼挑选，
选定后再用 generate_scenes.py --only <id> --force 落库。不改 public/。
用法: python trial_candidates.py <id> <seed> [<seed> ...]
"""
import os
import sys

from generate_images import collect_images, download_image, load_workflow, queue_prompt, wait_for_history

import generate_scenes as gs

SERVER = "192.168.1.127:8188"


def main() -> None:
    id_ = sys.argv[1]
    seeds = [int(a) for a in sys.argv[2:]]
    for seed in seeds:
        workflow = load_workflow(gs.WORKFLOW_PATH)
        gs.patch_workflow(workflow, id_, seed=seed)
        prefix = f"raw_try/{id_}_s{seed}"
        workflow[gs.PREFIX_NODE]["inputs"]["filename_prefix"] = prefix
        pid = queue_prompt(SERVER, workflow, f"py-try-{id_}-{seed}")
        print(f"{id_} seed={seed}: 已提交 {pid}", flush=True)
        hist = wait_for_history(SERVER, pid)
        imgs = collect_images(hist)
        if not imgs:
            print(f"{id_} seed={seed}: 无输出")
            sys.exit(1)
        saved = download_image(SERVER, imgs[0], gs.RAW_DIR, f"{id_}_s{seed}")
        print(f"{id_} seed={seed}: 候选 {os.path.abspath(saved)}", flush=True)


if __name__ == "__main__":
    main()