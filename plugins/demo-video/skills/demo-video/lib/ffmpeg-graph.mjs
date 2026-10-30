// Pure builders for ffmpeg argv. Nothing here spawns a process or touches disk.

const CARD_SECONDS = 2.5;

// Escape a value for a filter option (\, : and '), then quote it for the
// filtergraph level so commas and brackets in paths stay literal.
function filterValue(value) {
  const option = value.replace(/[\\:']/g, (c) => `\\${c}`);
  return `'${option.replace(/'/g, "'\\''")}'`;
}

function drawtext(fontFile, textPath, position, extra = '') {
  return (
    `drawtext=fontfile=${filterValue(fontFile)}:textfile=${filterValue(textPath)}:expansion=none` +
    `:${position}${extra}`
  );
}

const CAPTION_WIDTH = 60;
const MARKER_MIN_SPEED = 1.5;

// Breaks text into lines of at most `width` characters on word boundaries; drawtext honours
// the newlines. A single word longer than `width` stays on its own line.
export function wrapCaption(text, width = CAPTION_WIDTH) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

// One frame of drawtext with the glyphs the speed marker needs, for the preflight check.
export function fontCheckArgs(fontFile) {
  return [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x180:d=0.1',
    '-vf', `drawtext=fontfile=${filterValue(fontFile)}:text='▶▶ 10×':fontsize=24:fontcolor=white`,
    '-frames:v', '1', '-f', 'null', '-',
  ];
}

const CAPTION_STYLE = ':fontsize=40:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=14';
const MARKER_STYLE = ':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=10';
const CARD_STYLE = ':fontsize=72:fontcolor=white';

export function buildChapterArgs({
  segments,
  titleCard,
  endCard,
  captionDir,
  fontFile,
  out,
  width = 1920,
  height = 1080,
  fps = 30,
}) {
  if (segments.length === 0 && !titleCard && !endCard) {
    throw new Error('Nothing to render: no segments and no cards');
  }
  const files = [...new Set(segments.map((s) => s.file))];
  const uses = new Map(files.map((f) => [f, segments.filter((s) => s.file === f).length]));
  const textFiles = [];
  const addText = (name, text) => {
    const path = `${captionDir}/${name}`;
    if (!textFiles.some((t) => t.path === path)) textFiles.push({ path, text });
    return path;
  };

  const inputArgs = files.flatMap((f) => ['-i', f]);
  const cardInput = `color=c=black:s=${width}x${height}:r=${fps}:d=${CARD_SECONDS}`;
  const cardIndex = new Map();
  for (const card of [titleCard && 'title', endCard && 'end']) {
    if (!card) continue;
    cardIndex.set(card, files.length + cardIndex.size);
    inputArgs.push('-f', 'lavfi', '-i', cardInput);
  }

  const parts = [];
  const sources = new Map();
  files.forEach((f, i) => {
    if (uses.get(f) > 1) {
      const labels = Array.from({ length: uses.get(f) }, (_, k) => `[s${i}_${k}]`);
      parts.push(`[${i}:v]split=${labels.length}${labels.join('')}`);
      sources.set(f, labels);
    } else {
      sources.set(f, [`[${i}:v]`]);
    }
  });

  const fit =
    `scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${fps},setsar=1`;

  const labels = [];
  const addCard = (kind, text) => {
    const textPath = addText(`card-${kind}.txt`, text);
    const draw = drawtext(fontFile, textPath, 'x=(w-text_w)/2:y=(h-text_h)/2', CARD_STYLE);
    parts.push(`[${cardIndex.get(kind)}:v]${draw},format=yuv420p[v${labels.length}]`);
    labels.push(`[v${labels.length}]`);
  };
  if (titleCard) addCard('title', titleCard);
  const nextUse = new Map(files.map((f) => [f, 0]));
  segments.forEach((s, i) => {
    const src = sources.get(s.file)[nextUse.get(s.file)];
    nextUse.set(s.file, nextUse.get(s.file) + 1);
    const chain = [
      `trim=start=${s.from}:end=${s.to}`,
      `setpts=(PTS-STARTPTS)/${s.speed}`,
      fit,
    ];
    if (s.caption) {
      const path = addText(`caption-${i}.txt`, wrapCaption(s.caption));
      chain.push(drawtext(fontFile, path, 'x=(w-text_w)/2:y=h-text_h-60', CAPTION_STYLE));
    }
    if (s.marker && s.speed >= MARKER_MIN_SPEED) {
      const rounded = Math.round(s.speed);
      const path = addText(`marker-${rounded}.txt`, `▶▶ ${rounded}×`);
      chain.push(drawtext(fontFile, path, 'x=w-text_w-40:y=40', MARKER_STYLE));
    }
    chain.push('format=yuv420p');
    parts.push(`${src}${chain.join(',')}[v${labels.length}]`);
    labels.push(`[v${labels.length}]`);
  });
  if (endCard) addCard('end', endCard);
  parts.push(`${labels.join('')}concat=n=${labels.length}:v=1:a=0[out]`);

  const args = [
    ...inputArgs,
    '-filter_complex', parts.join(';'),
    '-map', '[out]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y', out,
  ];
  return { args, textFiles };
}

export function buildConcatArgs(files, listFile, out) {
  const list = files.map((f) => `file '${f.replace(/'/g, "'\\''")}'\n`).join('');
  return {
    args: ['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-y', out],
    list,
  };
}

export function buildGifArgs(mp4, out) {
  return [
    '-i', mp4,
    '-vf', 'fps=12,scale=1280:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse',
    '-y', out,
  ];
}
