<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

// Makes the abstract demo clip of the base theme (decision 0177): soft
// circles of light drifting over a dark gradient, drawn frame by frame
// with GD and joined to WebM (VP9) by the ffmpeg Playwright brings along.
// Only for development, the clip itself is part of the theme (MIT).
//
//     php tools/demo-video.php [target.webm]
//
// The first frame goes next to it as JPEG, as poster image.
// FFMPEG overrides the path of ffmpeg.

$target = $argv[1] ?? __DIR__ . '/../packages/themes/base/assets/examples/roasting.webm';
$ffmpeg = getenv('FFMPEG');
$ffmpeg = is_string($ffmpeg) && '' !== $ffmpeg ? $ffmpeg : (glob((string) getenv('HOME') . '/Library/Caches/ms-playwright/ffmpeg-*/ffmpeg-mac')[0] ?? (glob((string) getenv('HOME') . '/.cache/ms-playwright/ffmpeg-*/ffmpeg-linux')[0] ?? ''));

if ('' === $ffmpeg || !is_executable($ffmpeg)) {
    fwrite(STDERR, "No ffmpeg found. Run npx playwright install ffmpeg or set FFMPEG.\n");

    exit(1);
}

/**
 * @return int<0, 255>
 */
function channel(float $value): int
{
    return max(0, min(255, (int) round($value)));
}

const WIDTH = 640;
const HEIGHT = 360;
const FPS = 24;
const SECONDS = 4;

// This ffmpeg reads no pipes, so the frames go to one file of JPEGs first.
$frames = (string) tempnam(sys_get_temp_dir(), 'fb-frames');
$output = fopen($frames, 'wb');

if (false === $output) {
    fwrite(STDERR, "No temporary file for the frames.\n");

    exit(1);
}

// Each light: colour, size, start and path, all in shares of the frame.
$lights = [
    [[240, 160, 30], 0.42, [0.30, 0.62], [0.10, -0.05]],
    [[200, 90, 40], 0.30, [0.72, 0.30], [-0.08, 0.06]],
    [[250, 220, 170], 0.18, [0.62, 0.72], [0.05, -0.10]],
];
$count = FPS * SECONDS;

for ($frame = 0; $frame < $count; ++$frame) {
    // Once around the loop, so the end meets the start.
    $angle = 2 * M_PI * $frame / $count;
    $image = imagecreatetruecolor(WIDTH, HEIGHT);
    imagealphablending($image, true);

    for ($y = 0; $y < HEIGHT; ++$y) {
        $share = $y / HEIGHT;
        imageline($image, 0, $y, WIDTH, $y, (int) imagecolorallocate($image, channel(70 - 40 * $share), channel(32 - 14 * $share), channel(22 - 8 * $share)));
    }

    foreach ($lights as [$colour, $radius, $start, $path]) {
        $x = (int) (WIDTH * ($start[0] + $path[0] * sin($angle)));
        $y = (int) (HEIGHT * ($start[1] + $path[1] * cos($angle)));
        $size = (int) (HEIGHT * $radius * 2);

        // Many faint rings make a soft edge.
        for ($step = 24; $step > 0; --$step) {
            $diameter = (int) ($size * $step / 24);
            imagefilledellipse($image, $x, $y, $diameter, $diameter, (int) imagecolorallocatealpha($image, $colour[0], $colour[1], $colour[2], 122));
        }
    }

    ob_start();
    imagejpeg($image, null, 92);
    $jpeg = (string) ob_get_clean();
    fwrite($output, $jpeg);

    if (0 === $frame) {
        file_put_contents(preg_replace('/\.webm$/', '', $target) . '.jpg', $jpeg);
    }
}

fclose($output);
passthru(sprintf(
    '%s -hide_banner -loglevel error -y -f image2pipe -c:v mjpeg -framerate %d -i %s -vf format=yuv420p -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 %s',
    escapeshellarg($ffmpeg),
    FPS,
    escapeshellarg($frames),
    escapeshellarg($target),
), $exitCode);
unlink($frames);

if (0 !== $exitCode) {
    exit($exitCode);
}

echo $target, ': ', filesize($target), " bytes\n";
