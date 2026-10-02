export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const file = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
    const href = /\.[a-z0-9]+$/i.test(file.pathname) ? file.href : `${file.href}.ts`;
    return nextResolve(href, context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[a-z0-9]+$/i.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
