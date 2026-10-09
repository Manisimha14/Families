export function getCloudinaryImageProps(src, widths, sizes) {
  if (!src || !Array.isArray(widths) || widths.length === 0) {
    return { src };
  }

  let imageUrl;
  try {
    imageUrl = new URL(src);
  } catch {
    return { src };
  }

  if (imageUrl.hostname !== "res.cloudinary.com") {
    return { src };
  }

  const uploadMarker = "/image/upload/";
  const uploadIndex = imageUrl.pathname.indexOf(uploadMarker);
  if (uploadIndex === -1) {
    return { src };
  }

  const uploadPathEnd = uploadIndex + uploadMarker.length;
  const assetPath = imageUrl.pathname.slice(uploadPathEnd);
  const optimizedUrl = (width) => {
    const url = new URL(imageUrl);
    url.pathname = `${imageUrl.pathname.slice(0, uploadPathEnd)}f_auto,q_auto,c_limit,w_${width}/${assetPath}`;
    return url.href;
  };

  return {
    src: optimizedUrl(widths[0]),
    srcSet: widths.map((width) => `${optimizedUrl(width)} ${width}w`).join(", "),
    sizes,
  };
}
