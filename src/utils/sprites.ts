// 8-Bit Pixel Art Sprites represented as coordinate string grids

export const SPRITES = {
  // Dino Idle (Waiting to start)
  dino_idle: [
    "........XXXXXX....",
    "........XXXXXXXX..",
    "........XX.XXXXX..",
    "........XXXXXXXX..",
    "........XXXX......",
    "XX......XXXXXX....",
    "XXXX..XXXXXXXX....",
    "XXXXXXXXXXXXX.....",
    ".XXXXXXXXXXX......",
    "..XXXXXXXXX.......",
    "...XXXXXXX........",
    "....XXXXXX........",
    ".....XXXX.........",
    ".....X..X.........",
    ".....X..X.........",
    "....XX..XX........"
  ],

  // Dino Running Frame 1
  dino_run_1: [
    "........XXXXXX....",
    "........XXXXXXXX..",
    "........XX.XXXXX..",
    "........XXXXXXXX..",
    "........XXXX......",
    "XX......XXXXXX....",
    "XXXX..XXXXXXXX....",
    "XXXXXXXXXXXXX.....",
    ".XXXXXXXXXXX......",
    "..XXXXXXXXX.......",
    "...XXXXXXX........",
    "....XXXXXX........",
    ".....XXXX.........",
    ".....X..XX........",
    ".....X............",
    "....XX............"
  ],

  // Dino Running Frame 2
  dino_run_2: [
    "........XXXXXX....",
    "........XXXXXXXX..",
    "........XX.XXXXX..",
    "........XXXXXXXX..",
    "........XXXX......",
    "XX......XXXXXX....",
    "XXXX..XXXXXXXX....",
    "XXXXXXXXXXXXX.....",
    ".XXXXXXXXXXX......",
    "..XXXXXXXXX.......",
    "...XXXXXXX........",
    "....XXXXXX........",
    ".....XXXX.........",
    "......X.X.........",
    "......X.X.........",
    "......XX.X........"
  ],

  // Dino Crouch Frame 1
  dino_crouch_1: [
    "...........XXXXXXXXXX..",
    "...........XX.XXXXXXX..",
    "...........XXXXXXXXXX..",
    "...........XXXX........",
    "XX.........XXXXXX......",
    "XXXX.....XXXXXXXX......",
    "XXXXXXXXXXXXXX.........",
    ".XXXXXXXXXXXX..........",
    "..XXXXXXXXXX...........",
    "...XXXXXXXX............",
    "....XXXXXX.............",
    ".....X..XX.............",
    ".....X.................",
    "....XX................."
  ],

  // Dino Crouch Frame 2
  dino_crouch_2: [
    "...........XXXXXXXXXX..",
    "...........XX.XXXXXXX..",
    "...........XXXXXXXXXX..",
    "...........XXXX........",
    "XX.........XXXXXX......",
    "XXXX.....XXXXXXXX......",
    "XXXXXXXXXXXXXX.........",
    ".XXXXXXXXXXXX..........",
    "..XXXXXXXXXX...........",
    "...XXXXXXXX............",
    "....XXXXXX.............",
    ".....XX.X..............",
    ".......X...............",
    ".......XX.............."
  ],

  // Dino Dead
  dino_dead: [
    "........XXXXXX....",
    "........XXOXXXXX..",
    "........XXOXXXXX..",
    "........XXXXXX....",
    "........XXXX......",
    "XX......XXXXXX....",
    "XXXX..XXXXXXXX....",
    "XXXXXXXXXXXXX.....",
    ".XXXXXXXXXXX......",
    "..XXXXXXXXX.......",
    "...XXXXXXX........",
    "....XXXXXX........",
    ".....XXXX.........",
    ".....X..X.........",
    ".....X..X.........",
    "....XX..XX........"
  ],

  // Small Cactus
  cactus_small: [
    "....XX....",
    "....XX....",
    "..XXXXXX..",
    ".XXXXXXX..",
    "XX..XX.X..",
    "XX..XX.X..",
    "XX..XX.X..",
    "XXXXXX.X..",
    ".XXXXXXX..",
    "....XX....",
    "....XX....",
    "....XX....",
    "....XX....",
    "....XX....",
    "....XX...."
  ],

  // Large Cactus
  cactus_large: [
    "......XX......",
    "......XX......",
    "......XX......",
    "....XXXXXX....",
    "..XXXXXXXXXX..",
    ".XX...XX...XX.",
    ".XX...XX...XX.",
    ".XX...XX...XX.",
    ".XX...XX...XX.",
    ".XXXXXXXXXXXX.",
    "..XXXXXXXXXX..",
    "......XX......",
    "......XX......",
    "......XX......",
    "......XX......",
    "......XX......",
    "......XX......",
    "......XX......"
  ],

  // Double Cactus (Combo)
  cactus_double: [
    "....XX......XX....",
    "....XX......XX....",
    "..XXXXXX..XXXXXX..",
    ".XXXXXXX.XXXXXXX..",
    "XX..XX.X.X..XX.X..",
    "XX..XX.X.X..XX.X..",
    "XX..XX.X.X..XX.X..",
    "XXXXXX.X.XXXXX.X..",
    ".XXXXXXX..XXXXXX..",
    "....XX......XX....",
    "....XX......XX....",
    "....XX......XX....",
    "....XX......XX....",
    "....XX......XX....",
    "....XX......XX...."
  ],

  // Bird flying flap up
  bird_up: [
    "...XXXXXX.......",
    "..XXXXXXXXX.....",
    ".XX.XX.XXXXX....",
    "XXXXXXXXXXXX....",
    "XXXXXXXXX.......",
    "..XXXXXXX.XX....",
    "....XXXX.XXXX...",
    ".....XX.XXXXXX..",
    ".......XXXXXXX..",
    "........XXXXX...",
    ".........XXX....",
    "..........X....."
  ],

  // Bird flying flap down
  bird_down: [
    "...XXXXXX.......",
    "..XXXXXXXXX.....",
    ".XX.XX.XXXXX....",
    "XXXXXXXXXXXX....",
    "XXXXXXXXX.......",
    "..XXXXX.........",
    "....XX..........",
    "....XX.XX.......",
    "....XXXXXX......",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    "......XXXX......"
  ],

  // Classic Retro coin with shining highlight
  coin_frame_1: [
    "....XXXX....",
    "..XXYYYYXX..",
    ".XYYYYYYYYX.",
    "XYYYWWYYYYX",
    "XYYYWYYYYYX",
    "XYYYYYYYYYX",
    "XYYYYWWYYYX",
    "XYYYYYYYYYX",
    ".XYYYYYYYYX.",
    "..XXYYYYXX..",
    "....XXXX...."
  ],
  
  coin_frame_2: [
    ".....XX.....",
    "...XXYYXX...",
    "..XYYYYYX..",
    ".XYYWWYYX.",
    ".XYYWYYYX.",
    ".XYYYYYYX.",
    ".XYYWYYYY.",
    "..XYYYYYX..",
    "...XXYYXX...",
    ".....XX....."
  ],
  
  coin_frame_3: [
    "......X......",
    "....XXYXX....",
    "...XYYYYX...",
    "...XYWWYX...",
    "...XYWYYX...",
    "...XYYYYX...",
    "...XYYYYX...",
    "....XXYXX....",
    "......X......"
  ],

  // 8-bit Fluffy cloud
  cloud: [
    "......XXXXXX......",
    "....XXXXXXXXXX....",
    "..XXXXXXXXXXXXXX..",
    "XXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXX"
  ],

  // Left high mountain (Retro jagged background)
  mountain_jagged: [
    ".......XX.......",
    "......XXXX......",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "...XXXX.XXXXX...",
    "..XXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXX"
  ]
};

/**
 * Draws an 8-bit sprite with pixel scaling onto the 2D canvas context.
 * Adapts to Day and Night themes dynamically!
 */
export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  spriteName: keyof typeof SPRITES,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: 'light' | 'dark',
  colorOverride?: string
) {
  const spriteRows = SPRITES[spriteName];
  if (!spriteRows) return;

  const rows = spriteRows.length;
  const cols = spriteRows[0].length;

  const pixelSizeX = w / cols;
  const pixelSizeY = h / rows;

  // Choose colors based on theme and role
  const mainColor = theme === 'light' ? '#22252a' : '#eceff4';
  const detailColor = theme === 'light' ? '#eceff4' : '#22252a';
  const accentColor = '#bf616a'; // Nord Red for details
  const goldColor = '#ebcb8b'; // Retro Coin Gold

  ctx.save();
  
  for (let r = 0; r < rows; r++) {
    const rowStr = spriteRows[r];
    for (let c = 0; c < rowStr.length; c++) {
      const char = rowStr[c];
      if (char === '.') continue; // transparent pixel

      let pixelColor = colorOverride || mainColor;

      if (char === 'X') {
        pixelColor = colorOverride || mainColor;
      } else if (char === 'O') {
        // Skull dead eyes!
        pixelColor = accentColor;
      } else if (char === 'W') {
        // Eye whites or reflections
        pixelColor = detailColor;
      } else if (char === 'Y') {
        // Gold Coin pixels
        pixelColor = goldColor;
      }

      ctx.fillStyle = pixelColor;
      // Use math to prevent fuzzy subpixel drawing gaps
      const drawX = Math.floor(x + c * pixelSizeX);
      const drawY = Math.floor(y + r * pixelSizeY);
      const drawW = Math.ceil(pixelSizeX);
      const drawH = Math.ceil(pixelSizeY);

      ctx.fillRect(drawX, drawY, drawW, drawH);
    }
  }

  ctx.restore();
}
