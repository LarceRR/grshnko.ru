export const setFavicon = (path: string) => {
  const faviconElement = document.getElementById("favicon") as HTMLLinkElement | null;
  if (faviconElement) {
    faviconElement.href = `${path}?v=${Date.now()}`;
  }
};