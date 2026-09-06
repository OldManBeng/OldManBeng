# -*- coding: utf-8 -*-
"""链台词旁白 → 话风卡合规形态转换器"""
import io, re, sys

FILES = ['scripts', 'zhou-script', 'wang-script', 'hao-script', 'chen-script']
WRITE = '--write' in sys.argv
LEFTOVERS = []

def conv_paren(inner):
    x = inner.strip()
    if re.search(r'(一会|片刻|很久|分钟|小时|半天|停|沉默|缓|隔|半晌)', x) and len(x) <= 18:
        return (f'（{x}）', True) if x.endswith('后') else ('（片刻后）', True)
    if re.match(r'^(他给你发|他发来|发来|他拍|配图|拍照|图片|照片|他给你看|截图|他把照片|手机屏幕|他给你拍)', x):
        desc = re.sub(r'^(他给你发来一张照片|他发来一张照片|一张照片|他给你看|他拍了|他把照片|配图|他拍|发来|拍照|照片|截图|他给你拍)[：:]?', '', x).strip('。 :')
        desc = desc.rstrip('。')
        return (f'[图片: {desc}]' if desc else '[图片]', True)
    if '语音' in x and len(x) <= 30:
        m = re.search(r'(\d+)\s*(秒|分)', x)
        if m:
            secs = int(m.group(1)) * (60 if m.group(2).startswith('分') else 1)
            return (f'[语音 {secs}"]', True)
        return ('[语音 8"]', True)
    if '撤回' in x:
        return ('[撤回了一条消息]', True)
    m = re.match(r'^红包备注[：:](.+)$', x)
    if m:
        return (f'备注写了：{m.group(1).rstrip("。")}', True)
    return (None, False)

def transform_string(text):
    def repl(m):
        inner = m.group(1).strip()
        if re.match(r'^\d{1,2}:\d{2}$', inner):
            return m.group(0)
        if inner.endswith('后') and len(inner) <= 18:
            return m.group(0)
        if inner.startswith('次日'):
            return m.group(0)
        rep, ok = conv_paren(inner)
        if ok:
            return rep
        LEFTOVERS.append(inner)
        return m.group(0)
    return re.sub(r'（([^（）]{1,40})）', repl, text)

total_left = {}
for f in FILES:
    p = f'src/data/{f}.ts'
    s = io.open(p, encoding='utf-8').read()
    LEFTOVERS.clear()
    out = []
    for line in s.split('\n'):
        if "'" in line and '（' in line:
            line = re.sub(r"'([^'\n]*)'", lambda m: f"'{transform_string(m.group(1))}'", line)
        out.append(line)
    left_summary = {}
    for x in LEFTOVERS:
        key = re.sub(r'[0-9一二三四五六七八九十他她它你我]+', 'N', x)[:24]
        left_summary[key] = left_summary.get(key, 0) + 1
    total_left[f] = dict(left_summary)
    if WRITE:
        io.open(p, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))

for f, d in total_left.items():
    print(f'== {f} 剩余模式 {len(d)} 类 ==')
    for k, v in sorted(d.items(), key=lambda kv: -kv[1])[:14]:
        print(f'  {v:3d}  {k}')
print('WRITTEN' if WRITE else '报告模式——加 --write 生效')
