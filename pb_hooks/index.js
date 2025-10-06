// entrypoint (must be index.js)
console.log(">>> HOOKS INDEX LOADED");

onBeforeServe((e) => {
  console.log(">>> onBeforeServe from index.js");
  e.router.add("GET", "/pbping", (c) => c.json(200, { ok: true, from: "index.js" }));
});
