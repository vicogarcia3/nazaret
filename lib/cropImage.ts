import type { Area } from "react-easy-crop";

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("No se pudo cargar la imagen."))
    );

    image.crossOrigin = "anonymous";
    image.src = source;
  });
}

export async function createCroppedImage(
  imageSource: string,
  cropArea: Area,
  fileName = "imagen-recortada.png"
): Promise<File> {
  const image = await loadImage(imageSource);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo crear el recorte.");
  }

  const width = Math.max(1, Math.round(cropArea.width));
  const height = Math.max(1, Math.round(cropArea.height));

  canvas.width = width;
  canvas.height = height;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    width,
    height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo crear la imagen."));
          return;
        }

        resolve(blob);
      },
      "image/png"
    );
  });

  return new File([blob], fileName, {
    type: "image/png",
    lastModified: Date.now(),
  });
}