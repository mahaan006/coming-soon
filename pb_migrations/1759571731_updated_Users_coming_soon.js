/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3472538485")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_izmt2g4irr` ON `users` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_izmt2g4irr` ON `users` (`email`) WHERE `email` != ''",
      "CREATE UNIQUE INDEX `idx_xW7eiy5gV3` ON `users` (`username`)",
      "CREATE UNIQUE INDEX `idx_CrttZ9xM0e` ON `users` (`phone`)"
    ],
    "name": "users"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3472538485")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_izmt2g4irr` ON `Users_coming_soon` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_izmt2g4irr` ON `Users_coming_soon` (`email`) WHERE `email` != ''",
      "CREATE UNIQUE INDEX `idx_xW7eiy5gV3` ON `Users_coming_soon` (`username`)",
      "CREATE UNIQUE INDEX `idx_CrttZ9xM0e` ON `Users_coming_soon` (`phone`)"
    ],
    "name": "Users_coming_soon"
  }, collection)

  return app.save(collection)
})
