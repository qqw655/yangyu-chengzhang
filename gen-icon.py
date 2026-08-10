from PIL import Image
import math
import os

S = 64
BG = (245, 238, 221)
FILL = (192, 128, 58)
LIGHT = (224, 178, 116)
SHADE = (150, 96, 36)
OUT = (82, 55, 20)
EYE = (43, 29, 14)
SHINE = (255, 255, 255)
BLUSH = (240, 160, 148)
GREEN = (99, 160, 60)
GREEN_L = (139, 200, 93)
GREEN_D = (78, 128, 44)

img = Image.new("RGB", (S, S), BG)
px = img.load()

cx, cy = 32, 34

def inside(x, y):
    rx = 20 + 1.6 * math.sin(y * 0.45 + 1.2) + (y - cy) * 0.05
    ry = 18 + 1.2 * math.sin(x * 0.4)
    return (abs(x - cx) / rx) ** 3 + (abs(y - cy) / ry) ** 3 < 1.0

def arm_in(x, y):
    # 左臂（肱二头肌鼓起）
    if 4 <= x <= 16 and 28 <= y <= 47:
        return ((x - 10) / 4.6) ** 2 + ((y - 38) / 8.4) ** 2 <= 1.0
    # 右臂
    if 48 <= x <= 60 and 28 <= y <= 47:
        return ((x - 54) / 4.6) ** 2 + ((y - 38) / 8.4) ** 2 <= 1.0
    return False

def has_neighbor_out(x, y):
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            if inside(x + dx, y + dy) or arm_in(x + dx, y + dy):
                continue
            return True
    return False

def face_px(x, y):
    # 眉毛（自信挑眉）
    if (x - 25) ** 2 + (y - 29) ** 2 <= 1.0 or (x - 26) ** 2 + (y - 29) ** 2 <= 1.0:
        return OUT
    if (x - 38) ** 2 + (y - 29) ** 2 <= 1.0 or (x - 39) ** 2 + (y - 29) ** 2 <= 1.0:
        return OUT
    # 眼睛
    if (x - 26) ** 2 + (y - 33) ** 2 <= 3.0:
        if (x - 27) ** 2 + (y - 32) ** 2 <= 1.0:
            return SHINE
        return EYE
    if (x - 38) ** 2 + (y - 33) ** 2 <= 3.0:
        if (x - 39) ** 2 + (y - 32) ** 2 <= 1.0:
            return SHINE
        return EYE
    # 腮红
    if (x - 21) ** 2 + (y - 39) ** 2 <= 3.2 or (x - 43) ** 2 + (y - 39) ** 2 <= 3.2:
        return BLUSH
    # 自信的微笑（咧嘴）
    if (x, y) in {(29, 38), (30, 39), (31, 40), (32, 40), (33, 40), (34, 39), (35, 38)}:
        return OUT
    return None

for y in range(S):
    for x in range(S):
        if inside(x, y):
            c = FILL
            if ((x - cx + 10) / 20) ** 2 + ((y - cy - 2) / 16) ** 2 < 0.62:
                c = LIGHT
            if ((x - cx - 6) / 23) ** 2 + ((y - cy + 5) / 18) ** 2 < 0.6:
                c = SHADE
            f = face_px(x, y)
            if f:
                c = f
            px[x, y] = c

# 手臂（比身体浅一点，体现肌肉）
for y in range(S):
    for x in range(S):
        if arm_in(x, y):
            if x < cx:
                c = LIGHT if ((x - 10) / 3.4) ** 2 + ((y - 38) / 6) ** 2 < 0.45 else FILL
            else:
                c = LIGHT if ((x - 54) / 3.4) ** 2 + ((y - 38) / 6) ** 2 < 0.45 else FILL
            px[x, y] = c

# 描边（身体+手臂）
for y in range(S):
    for x in range(S):
        if (inside(x, y) or arm_in(x, y)) and has_neighbor_out(x, y):
            px[x, y] = OUT

# 头顶嫩芽（长大的土豆还带着初心）
for (x, y) in [(31, 13), (32, 13), (31, 14), (32, 14)]:
    px[x, y] = GREEN
for (x, y) in [(33, 11), (33, 12), (34, 12)]:
    px[x, y] = GREEN_L
px[34, 11] = GREEN_D

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(out_dir, exist_ok=True)
for size in (512, 192, 180):
    img.resize((size, size), Image.NEAREST).save(os.path.join(out_dir, "icon-%d.png" % size))
print("saved", out_dir)
