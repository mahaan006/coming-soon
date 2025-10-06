/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3472538485")

  // update collection data
  unmarshal({
    "createRule": "",
    "updateRule": "id = @request.auth.id",
    "viewRule": "id = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3472538485")

  // update collection data
  unmarshal({
    "createRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
