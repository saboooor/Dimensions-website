import { type RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async (requestEvent) => {
  const { Jimp } = await import("jimp");
  const origin = requestEvent.url.origin;
  const colorParam = requestEvent.url.searchParams.get("color") || "255,255,255";
  const rgb = colorParam.split(",").map(val => parseInt(val.trim(), 10) || 0);

  const r = rgb[0] !== undefined ? rgb[0] : 255;
  const g = rgb[1] !== undefined ? rgb[1] : 255;
  const b = rgb[2] !== undefined ? rgb[2] : 255;

  try {
    const url = new URL("/editor/portal/Images/particles.png", origin).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch particles.png");
    const arrayBuffer = await res.arrayBuffer();
    const image = await Jimp.read(Buffer.from(arrayBuffer));

    // Colorize greyscale particles image by multiplying with target RGB
    image.scan(0, 0, image.width, image.height, (x, y, idx) => {
      const origR = image.bitmap.data[idx];
      const origG = image.bitmap.data[idx + 1];
      const origB = image.bitmap.data[idx + 2];
      
      // Calculate grayscale value
      const gray = (origR + origG + origB) / 3;

      image.bitmap.data[idx] = Math.min(255, Math.max(0, Math.round((gray * r) / 255)));
      image.bitmap.data[idx + 1] = Math.min(255, Math.max(0, Math.round((gray * g) / 255)));
      image.bitmap.data[idx + 2] = Math.min(255, Math.max(0, Math.round((gray * b) / 255)));
    });

    const pngBuffer = await image.getBuffer("image/png");

    requestEvent.headers.set("Content-Type", "image/png");
    requestEvent.headers.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    requestEvent.send(200, pngBuffer);
  } catch (err) {
    console.error("Particle colorization failed", err);
    requestEvent.send(500, "Internal Server Error");
  }
};
