export function getMemberPhotoUrl(photo, name = "M") {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=28B295&color=fff&size=256`;

  if (!photo) return fallback;

  if (photo.includes("res.cloudinary.com") && photo.includes("/upload/")) {
    return photo.replace(
      "/upload/",
      "/upload/c_thumb,g_face,z_0.85,w_800,h_800/"
    );
  }

  return photo;
}
