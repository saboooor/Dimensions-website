import { type RequestHandler } from '@qwik.dev/router';

async function fetchJimpImage(
  origin: string,
  relativePath: string,
  fallbackPath?: string
): Promise<any> {
  const { Jimp } = await import('jimp');
  const url = new URL(relativePath, origin).toString();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const buffer = await res.arrayBuffer();
    return await Jimp.read(Buffer.from(buffer));
  } catch (e) {
    if (fallbackPath) {
      const fallbackUrl = new URL(fallbackPath, origin).toString();
      try {
        const res = await fetch(fallbackUrl);
        const buffer = await res.arrayBuffer();
        return await Jimp.read(Buffer.from(buffer));
      } catch (err) {
        console.error('Fallback image loading failed', fallbackUrl, err);
      }
    }
    throw e;
  }
}

export const onGet: RequestHandler = async (requestEvent) => {
  const { Jimp } = await import('jimp');
  const origin = requestEvent.url.origin;
  const imagesParam = requestEvent.url.searchParams.get('images') || '';
  const ids = imagesParam.split(',').map((id) => id.trim().toLowerCase());

  // ids[0]: block texture (frame block)
  // ids[1]: inside texture (portal block)
  // ids[2]: lighter item texture
  const blockName = ids[0] || 'stone';
  const insideName = ids[1] || 'nether_portal';
  const itemName = ids[2] || 'flint_and_steel';

  const width = 4;
  const height = 5;

  try {
    // 1. Create transparent destination image
    const dest = new Jimp({
      width: width * 60,
      height: height * 60,
      color: 0x00000000,
    });

    // 2. Load and crop background
    const background = await fetchJimpImage(
      origin,
      '/editor/portal/Images/portalBackground.jpg'
    );
    const bgCropX = Math.floor(background.width / 2);
    const bgCropY = Math.floor((background.height / height) * 1.5);
    const bgCrop = background.crop({ x: bgCropX, y: bgCropY, w: 120, h: 180 });
    dest.composite(bgCrop, 60, 60);

    // 3. Cache block images to avoid redundant fetches
    let frameBlockImg: any = null;
    let insideBlockImg: any = null;

    try {
      frameBlockImg = await fetchJimpImage(
        origin,
        `/editor/portal/Images/blocks/${blockName}.png`,
        '/editor/portal/Images/noTexture.jpg'
      );
      frameBlockImg.resize({ w: 61, h: 61 });
    } catch (e) {
      console.error('Failed to load frame block image', blockName, e);
    }

    try {
      insideBlockImg = await fetchJimpImage(
        origin,
        `/editor/portal/Images/frames/${insideName}.png`,
        '/editor/portal/Images/noTexture.jpg'
      );
      insideBlockImg.resize({ w: 61, h: 61 });
      insideBlockImg.opacity(0.65); // 65% opacity
    } catch (e) {
      console.error('Failed to load inside block image', insideName, e);
    }

    // 4. Draw grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isFrame =
          y === 0 || y === height - 1 || x === 0 || x === width - 1;

        if (isFrame) {
          if (frameBlockImg) {
            dest.composite(frameBlockImg, x * 60, y * 60);
          }
        } else {
          if (insideBlockImg) {
            dest.composite(insideBlockImg, x * 60, y * 60);
          }
        }
      }
    }

    // 5. Draw lighter item in the bottom-left corner
    try {
      const itemImg = await fetchJimpImage(
        origin,
        `/editor/portal/Images/items/${itemName}.png`,
        '/editor/portal/Images/noTexture.jpg'
      );
      itemImg.resize({ w: 61, h: 61 });
      dest.composite(itemImg, 0, (height - 1) * 60);
    } catch (e) {
      console.error('Failed to load lighter item image', itemName, e);
    }

    // 6. Get PNG buffer and return
    const pngBuffer = await dest.getBuffer('image/png');

    requestEvent.headers.set('Content-Type', 'image/png');
    requestEvent.headers.set('Cache-Control', 'public, max-age=86400'); // cache for 1 day
    requestEvent.send(200, pngBuffer);
  } catch (err) {
    console.error('Portal image stitching failed', err);
    requestEvent.send(500, 'Internal Server Error');
  }
};
