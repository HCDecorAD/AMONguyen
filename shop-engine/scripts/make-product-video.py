#!/usr/bin/env python3
"""Dung slideshow video tu anh san pham (fade + zoom nhe, ~2s/anh), khong co nhac.
Dung trong workflow .github/workflows/product-video.yml (GitHub Actions co san ffmpeg).

Cach dung: python3 make-product-video.py <thu_muc_anh> <file_video_dau_ra.mp4>
  thu_muc_anh phai chua anh da danh so thu tu (001.jpg, 002.jpg, ...).
"""
import subprocess, sys, os, glob, tempfile, shutil

SIZE = 1080           # video vuong 1080x1080, khop ty le hien tai cua gallery AMO
FPS = 25
IMG_SECONDS = 2.0      # moi anh hien ~2s
FADE_SECONDS = 0.5     # thoi gian mo chuyen giua 2 anh
MAX_IMAGES = 12         # gioi han de video va thoi gian build khong qua dai


def run(cmd):
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if r.returncode != 0:
        print(r.stdout)
        raise SystemExit("Lenh ffmpeg loi: " + " ".join(cmd))
    return r.stdout


def make_clip(src, dst, duration):
    frames = int(duration * FPS)
    vf = (
        f"scale={SIZE}:{SIZE}:force_original_aspect_ratio=increase,"
        f"crop={SIZE}:{SIZE},"
        f"zoompan=z='min(zoom+0.0018,1.08)':d={frames}:s={SIZE}x{SIZE}:fps={FPS}"
    )
    run(["ffmpeg", "-y", "-loop", "1", "-i", src, "-vf", vf, "-t", str(duration),
         "-pix_fmt", "yuv420p", dst])


def build(img_dir, out_path):
    imgs = sorted(glob.glob(os.path.join(img_dir, "*")))[:MAX_IMAGES]
    if not imgs:
        raise SystemExit("Khong tim thay anh nao de dung video")
    tmp = tempfile.mkdtemp(prefix="pv_")
    try:
        clips = []
        clip_dur = IMG_SECONDS + FADE_SECONDS  # du bien de xfade khong cat cut cuoi clip
        for i, src in enumerate(imgs):
            dst = os.path.join(tmp, f"clip_{i:03d}.mp4")
            make_clip(src, dst, clip_dur)
            clips.append(dst)

        if len(clips) == 1:
            shutil.copy(clips[0], out_path)
            return

        inputs = []
        for c in clips:
            inputs += ["-i", c]

        filters = []
        running = clip_dur
        prev_label = "0:v"
        for k in range(1, len(clips)):
            offset = running - FADE_SECONDS
            out_label = f"v{k}" if k < len(clips) - 1 else "vout"
            filters.append(f"[{prev_label}][{k}:v]xfade=transition=fade:duration={FADE_SECONDS}:offset={offset:.3f}[{out_label}]")
            prev_label = out_label
            running = running + clip_dur - FADE_SECONDS

        filter_complex = ";".join(filters)
        run(["ffmpeg", "-y", *inputs, "-filter_complex", filter_complex,
             "-map", "[vout]", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
             "-an", out_path])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    build(sys.argv[1], sys.argv[2])
    print("OK", sys.argv[2], os.path.getsize(sys.argv[2]), "bytes")
