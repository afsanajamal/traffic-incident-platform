import math
import os
import random
import struct
import zlib
from pathlib import Path


WIDTH = 1280
HEIGHT = 720
OUT_DIR = Path("dashboard/public/snapshots")


SCENES = [
    ("stopped_vehicle", "shoulder", "day"),
    ("stopped_vehicle", "live_lane", "overcast"),
    ("debris", "center_lane", "day"),
    ("debris", "shoulder", "rain"),
    ("congestion", "multi_lane", "day"),
    ("congestion", "ramp", "overcast"),
    ("wrong_way_driver", "divided_highway", "night"),
    ("pedestrian", "shoulder", "day"),
    ("accident", "two_vehicle", "day"),
    ("accident", "rear_end", "rain"),
    ("vehicle_fire", "shoulder", "day"),
    ("vehicle_fire", "live_lane", "night"),
    ("vehicle_fire", "parking_lot", "night"),
    ("smoke_hazard", "overpass", "overcast"),
    ("hit_and_run", "crosswalk", "day"),
    ("hit_and_run", "shoulder", "night"),
    ("injured_person", "roadside", "rain"),
    ("parking_theft", "parking_lot", "day"),
    ("parking_theft", "parking_lot", "night"),
    ("suspicious_activity", "parking_lot", "overcast"),
    ("fleeing_suspects", "roadside", "night"),
    ("weapon_alert", "parking_lot", "night"),
    ("lane_blockage", "ramp", "day"),
    ("emergency_response", "shoulder", "night"),
    ("minor_crash", "intersection", "overcast"),
]


class Canvas:
    def __init__(self, width: int, height: int, bg: tuple[int, int, int]) -> None:
        self.width = width
        self.height = height
        self.pixels = bytearray(bg * width * height)

    def set_pixel(self, x: int, y: int, color: tuple[int, int, int], alpha: float = 1) -> None:
        if x < 0 or y < 0 or x >= self.width or y >= self.height:
            return
        i = (y * self.width + x) * 3
        if alpha >= 1:
            self.pixels[i : i + 3] = bytes(color)
            return
        inv = 1 - alpha
        self.pixels[i] = int(self.pixels[i] * inv + color[0] * alpha)
        self.pixels[i + 1] = int(self.pixels[i + 1] * inv + color[1] * alpha)
        self.pixels[i + 2] = int(self.pixels[i + 2] * inv + color[2] * alpha)

    def rect(self, x1: int, y1: int, x2: int, y2: int, color: tuple[int, int, int], alpha: float = 1) -> None:
        x1, x2 = sorted((max(0, x1), min(self.width - 1, x2)))
        y1, y2 = sorted((max(0, y1), min(self.height - 1, y2)))
        for y in range(y1, y2 + 1):
            for x in range(x1, x2 + 1):
                self.set_pixel(x, y, color, alpha)

    def circle(self, cx: int, cy: int, radius: int, color: tuple[int, int, int], alpha: float = 1) -> None:
        r2 = radius * radius
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                    self.set_pixel(x, y, color, alpha)

    def line(self, x1: int, y1: int, x2: int, y2: int, color: tuple[int, int, int], width: int = 1) -> None:
        dx = x2 - x1
        dy = y2 - y1
        steps = max(abs(dx), abs(dy), 1)
        for step in range(steps + 1):
            x = round(x1 + dx * step / steps)
            y = round(y1 + dy * step / steps)
            self.circle(x, y, width, color)

    def polygon(self, points: list[tuple[int, int]], color: tuple[int, int, int], alpha: float = 1) -> None:
        min_y = max(min(y for _, y in points), 0)
        max_y = min(max(y for _, y in points), self.height - 1)
        for y in range(min_y, max_y + 1):
            nodes: list[int] = []
            j = len(points) - 1
            for i, point in enumerate(points):
                xi, yi = point
                xj, yj = points[j]
                if (yi < y <= yj) or (yj < y <= yi):
                    nodes.append(int(xi + (y - yi) / (yj - yi) * (xj - xi)))
                j = i
            nodes.sort()
            for i in range(0, len(nodes), 2):
                if i + 1 < len(nodes):
                    for x in range(max(nodes[i], 0), min(nodes[i + 1], self.width - 1) + 1):
                        self.set_pixel(x, y, color, alpha)

    def save_png(self, path: Path) -> None:
        rows = bytearray()
        stride = self.width * 3
        for y in range(self.height):
            rows.append(0)
            rows.extend(self.pixels[y * stride : (y + 1) * stride])

        def chunk(kind: bytes, data: bytes) -> bytes:
            return (
                struct.pack(">I", len(data))
                + kind
                + data
                + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
            )

        payload = b"\x89PNG\r\n\x1a\n"
        payload += chunk(b"IHDR", struct.pack(">IIBBBBB", self.width, self.height, 8, 2, 0, 0, 0))
        payload += chunk(b"IDAT", zlib.compress(bytes(rows), level=6))
        payload += chunk(b"IEND", b"")
        path.write_bytes(payload)


def sky_color(weather: str) -> tuple[int, int, int]:
    return {
        "day": (158, 179, 188),
        "overcast": (138, 148, 154),
        "rain": (94, 104, 112),
        "night": (28, 35, 48),
    }[weather]


def draw_background(c: Canvas, location: str, weather: str, rng: random.Random) -> None:
    c.rect(0, 0, WIDTH, HEIGHT, sky_color(weather))
    horizon = 230 if location != "parking_lot" else 300
    c.rect(0, horizon, WIDTH, HEIGHT, (64, 82, 72))
    if location == "parking_lot":
        c.rect(0, 310, WIDTH, HEIGHT, (72, 76, 78))
        for x in range(80, WIDTH, 140):
            c.line(x, 350, x + 80, HEIGHT, (170, 176, 164), 2)
        for y in range(410, HEIGHT, 110):
            c.line(0, y, WIDTH, y + 10, (170, 176, 164), 2)
    else:
        road = [(0, HEIGHT), (WIDTH, HEIGHT), (900, horizon), (380, horizon)]
        c.polygon(road, (58, 62, 64))
        for lane in [-240, 0, 240]:
            c.line(WIDTH // 2 + lane, HEIGHT, WIDTH // 2 + lane // 4, horizon, (210, 204, 158), 3)
        c.line(180, HEIGHT, 420, horizon, (210, 210, 200), 3)
        c.line(1100, HEIGHT, 850, horizon, (210, 210, 200), 3)
    if weather == "rain":
        for _ in range(520):
            x = rng.randrange(WIDTH)
            y = rng.randrange(HEIGHT)
            c.line(x, y, x - 8, y + 24, (180, 194, 202), 1)
    if weather == "night":
        for x in range(100, WIDTH, 240):
            c.circle(x, 250, 34, (245, 230, 170), 0.22)


def draw_vehicle(c: Canvas, x: int, y: int, scale: float, color: tuple[int, int, int], angle: float = 0) -> None:
    w = int(120 * scale)
    h = int(58 * scale)
    c.rect(x - w // 2, y - h // 2, x + w // 2, y + h // 2, color)
    c.rect(x - w // 4, y - h // 2 - int(24 * scale), x + w // 4, y - h // 2, tuple(max(0, v - 25) for v in color))
    c.circle(x - w // 3, y + h // 2, int(12 * scale), (22, 24, 26))
    c.circle(x + w // 3, y + h // 2, int(12 * scale), (22, 24, 26))
    if angle:
        c.line(x - w // 2, y - h // 2, x + w // 2, y + h // 2, (30, 30, 30), 2)


def draw_person(c: Canvas, x: int, y: int, scale: float, color: tuple[int, int, int], lying: bool = False) -> None:
    if lying:
        c.rect(x - int(34 * scale), y - int(8 * scale), x + int(34 * scale), y + int(8 * scale), color)
        c.circle(x + int(42 * scale), y, int(10 * scale), (70, 52, 42))
        return
    c.circle(x, y - int(30 * scale), int(10 * scale), (70, 52, 42))
    c.rect(x - int(9 * scale), y - int(20 * scale), x + int(9 * scale), y + int(18 * scale), color)
    c.line(x, y + int(18 * scale), x - int(14 * scale), y + int(42 * scale), (28, 28, 30), 3)
    c.line(x, y + int(18 * scale), x + int(14 * scale), y + int(42 * scale), (28, 28, 30), 3)


def draw_fire(c: Canvas, x: int, y: int, scale: float) -> None:
    for i in range(8):
        c.circle(x + i * 12 - 42, y - int(abs(math.sin(i)) * 24), int(24 * scale), (230, 78, 28), 0.75)
        c.circle(x + i * 12 - 40, y - 8, int(12 * scale), (255, 190, 46), 0.7)
    for i in range(10):
        c.circle(x + i * 18 - 80, y - 70 - i * 6, int((34 + i * 4) * scale), (55, 58, 58), 0.28)


def draw_scene(index: int, incident: str, location: str, weather: str) -> Canvas:
    rng = random.Random(index * 991)
    c = Canvas(WIDTH, HEIGHT, sky_color(weather))
    draw_background(c, location, weather, rng)

    colors = [(156, 40, 42), (42, 92, 145), (225, 222, 205), (44, 128, 88), (120, 116, 126)]
    for i in range(5 if location != "parking_lot" else 9):
        draw_vehicle(c, rng.randrange(170, 1110), rng.randrange(340, 650), rng.uniform(0.55, 1.0), rng.choice(colors))

    if incident in {"stopped_vehicle", "lane_blockage"}:
        draw_vehicle(c, 640, 480, 1.2, (190, 190, 180))
        c.rect(560, 540, 720, 555, (230, 160, 48))
    elif incident == "debris":
        for _ in range(18):
            c.rect(rng.randrange(520, 760), rng.randrange(430, 560), rng.randrange(770, 800), rng.randrange(565, 590), (86, 72, 52))
    elif incident == "congestion":
        for y in [360, 430, 500, 570, 640]:
            for x in [420, 560, 700, 840]:
                draw_vehicle(c, x + rng.randrange(-20, 20), y, 0.75, rng.choice(colors))
    elif incident == "wrong_way_driver":
        draw_vehicle(c, 610, 430, 1.0, (215, 215, 210))
        c.line(610, 370, 610, 310, (244, 215, 88), 7)
    elif incident == "pedestrian":
        draw_person(c, 760, 500, 1.3, (220, 150, 42))
    elif incident in {"accident", "minor_crash"}:
        draw_vehicle(c, 590, 500, 1.1, (160, 38, 38), 1)
        draw_vehicle(c, 700, 485, 1.1, (44, 86, 142), 1)
        c.circle(650, 510, 45, (70, 70, 70), 0.25)
    elif incident == "vehicle_fire":
        draw_vehicle(c, 620, 500, 1.2, (120, 118, 110))
        draw_fire(c, 660, 470, 1.0)
    elif incident == "smoke_hazard":
        for i in range(12):
            c.circle(520 + i * 32, 470 - i * 14, 54 + i * 4, (58, 62, 64), 0.2)
    elif incident in {"hit_and_run", "injured_person"}:
        draw_person(c, 660, 520, 1.5, (210, 66, 52), lying=True)
        draw_vehicle(c, 880, 430, 0.75, (52, 90, 150))
    elif incident == "parking_theft":
        draw_vehicle(c, 620, 500, 1.3, (35, 75, 125))
        draw_person(c, 555, 510, 1.2, (40, 42, 44))
        draw_person(c, 680, 510, 1.2, (80, 80, 84))
    elif incident == "suspicious_activity":
        draw_vehicle(c, 650, 500, 1.2, (25, 25, 28))
        for x in [560, 615, 710, 770]:
            draw_person(c, x, 520 + rng.randrange(-20, 20), 1.1, (45, 45, 48))
    elif incident == "fleeing_suspects":
        draw_vehicle(c, 520, 520, 1.1, (32, 70, 116))
        for x in [670, 720, 775]:
            draw_person(c, x, 510 + rng.randrange(-15, 15), 1.0, (36, 36, 38))
    elif incident == "weapon_alert":
        draw_vehicle(c, 620, 500, 1.1, (42, 42, 45))
        draw_person(c, 720, 520, 1.0, (34, 34, 36))
        c.line(732, 500, 770, 490, (28, 28, 30), 4)
    elif incident == "emergency_response":
        draw_vehicle(c, 610, 500, 1.1, (150, 35, 35))
        draw_vehicle(c, 760, 500, 1.1, (245, 245, 235))
        c.circle(730, 440, 48, (40, 90, 230), 0.25)
        c.circle(790, 440, 48, (230, 40, 40), 0.25)

    c.rect(0, 0, WIDTH, 54, (18, 25, 32), 0.5)
    for x in range(0, WIDTH, 7):
        for y in range(0, HEIGHT, 7):
            if (x + y + index) % 19 == 0:
                c.set_pixel(x, y, (230, 230, 230), 0.09)
    return c


def main() -> None:
    os.chdir(Path(__file__).resolve().parents[1])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for index, scene in enumerate(SCENES, start=1):
        canvas = draw_scene(index, *scene)
        canvas.save_png(OUT_DIR / f"incident-{index:03}.png")


if __name__ == "__main__":
    main()
