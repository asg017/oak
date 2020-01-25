from os import listdir, path
from PIL import Image, ImageStat, ImageDraw

frames_dir = '/tmp/frames'
frames = sorted(listdir('/tmp/frames'))

height = int(len(frames) * 9 / 16)
out_img = Image.new('RGB', (len(frames), height))
draw = ImageDraw.Draw(out_img)

for i, frame_relpath in enumerate(frames):

    frame_abspath = path.join(frames_dir, frame_relpath)

    frame = Image.open(frame_abspath)

    stat = ImageStat.Stat(frame)
    draw.line((i, 0, i, height), fill=tuple(map(lambda x: int(x), stat.mean)))

out_img.save('/tmp/a.png', 'PNG')
