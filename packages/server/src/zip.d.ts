// Bun embeds files imported with { type: "file" } and resolves the import to a
// path string at runtime; this declaration only exists so tsc understands it.
declare module "*.zip" {
  const path: string;
  export default path;
}
