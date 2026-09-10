---
name: lao-li-radio-note
description: lao_li_radio_night 系列照片的右舵/左舵问题——部分生成右舵车需手动检查后选择性翻转
metadata:
  type: reference
  subtype: image-generation
---

**lao_li_radio_night 右舵车问题（v4.12 变体批次）：**

- SD 模型生成驾驶座视角时有时输出右舵车（方向盘在右侧），但国内是左舵。
- 并非 100% 的图都是右舵——需要逐张人工审查后决定哪些需要 `PIL ImageOps.mirror` 水平翻转。
- **处理方法**：已在 `pytools/flip_lao_li_radio.py` 写了批量翻转脚本，但**不在批次结束时自动跑**——等人工审查后只翻右舵的。
- **提示词改进方向**（供下次重跑用）：在 prompt 中加 `左侧驾驶位` 或 `方向盘在左边` 约束，但从 v4.10 基准图经验看，SD 对"中国道路"的方向理解不稳定，人工翻转是更可靠的兜底。

关联：[[lao-li-mirror]]（v4.10 的 lao_li_taxi_night 也曾镜像翻转右舵→左舵）