from sys import argv
from os import listdir, path
from PIL import Image, ImageStat, ImageDraw

INPUT_DIR = argv[1]
OUTPUT_PNG = argv[2]

frames = sorted(listdir(INPUT_DIR))

print("Input directory: ", INPUT_DIR)
print("Output PNG: ", OUTPUT_PNG)
print("Number of frames: %d" % len(frames))

height = int(len(frames) * 9 / 16)
out_img = Image.new('RGB', (len(frames), height))
draw = ImageDraw.Draw(out_img)

for i, frame_relpath in enumerate(frames):

    frame_abspath = path.join(INPUT_DIR, frame_relpath)

    frame = Image.open(frame_abspath)

    stat = ImageStat.Stat(frame)
    draw.line((i, 0, i, height), fill=tuple(map(lambda x: int(x), stat.mean)))

print("saving...")
out_img.save(OUTPUT_PNG, 'PNG')
