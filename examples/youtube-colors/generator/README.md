

youtube-dl https://www.youtube.com/watch?v=Rb4lgOiHBZo

docker run -it --rm -v $PWD:/tmp jrottenberg/ffmpeg:4.1-alpine -i "/tmp/OK Go - Skyscrapers - Official Video-Rb4lgOiHBZo.mp4" -r 30 /tmp/frames/$filename%09d.jpg

docker run -it --rm -v $PWD:/tmp pillow-test python3 /tmp/gen_bars.py
