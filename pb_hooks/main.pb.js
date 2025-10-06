// pb_hooks/main.pb.js
console.log(">>> HOOKS ENTRY LOADED (main.pb.js)");

$app.onBeforeServe((e) => {
  console.log(">>> $app.onBeforeServe from main.pb.js - registering /pbping");
  e.router.add("GET", "/pbping", (c) => c.json(200, { ok: true, from: "main.pb.js" }));
});
