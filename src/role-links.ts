export type Role = "passenger" | "driver" | "office";
export function roleLinks(current: string, publicUrl = "") {
  const url = new URL(current);
  const role: Role = url.pathname.startsWith("/driver")
    ? "driver"
    : url.pathname.startsWith("/office")
      ? "office"
      : "passenger";
  const origin = new URL(publicUrl || current).origin;
  return {
    role,
    passenger: `${origin}/passenger`,
    driver: `${origin}/driver`,
    office: `${origin}/office`,
  };
}
