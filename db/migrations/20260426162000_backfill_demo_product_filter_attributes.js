exports.up = async function up(knex) {
  const updates = [
    {
      slug: "quiet-pearl-ring",
      filters: {
        filter_type: "Ring",
        filter_metal: "Rose Gold",
        filter_stone_type: "Emerald",
        filter_stone_shape: "Princess",
        filter_stone_color: "Green",
        filter_stone_size: "2 ct",
        filter_ring_size: "17",
        filter_ring_type: "Fashion",
        filter_bracelet_length: null
      }
    },
    {
      slug: "moon-bracelet",
      filters: {
        filter_type: "Bracelet",
        filter_metal: "Gold",
        filter_stone_type: "Sapphire",
        filter_stone_shape: "Oval",
        filter_stone_color: "Blue",
        filter_stone_size: "1 ct",
        filter_ring_size: null,
        filter_ring_type: null,
        filter_bracelet_length: "18 cm"
      }
    },
    {
      slug: "white-diamond-earrings",
      filters: {
        filter_type: "Earrings",
        filter_metal: "Gold",
        filter_stone_type: "Diamond",
        filter_stone_shape: "Round",
        filter_stone_color: "White",
        filter_stone_size: "1 ct",
        filter_ring_size: null,
        filter_ring_type: null,
        filter_bracelet_length: null
      }
    },
    {
      slug: "silver-heart-pendant",
      filters: {
        filter_type: "Earrings",
        filter_metal: "Silver",
        filter_stone_type: "None",
        filter_stone_shape: null,
        filter_stone_color: null,
        filter_stone_size: null,
        filter_ring_size: null,
        filter_ring_type: null,
        filter_bracelet_length: null
      }
    }
  ];

  for (const update of updates) {
    await knex("products").where({ slug: update.slug }).update(update.filters);
  }
};

exports.down = async function down(knex) {
  await knex("products")
    .whereIn("slug", ["quiet-pearl-ring", "moon-bracelet", "white-diamond-earrings", "silver-heart-pendant"])
    .update({
      filter_type: null,
      filter_metal: null,
      filter_stone_type: null,
      filter_stone_shape: null,
      filter_stone_color: null,
      filter_stone_size: null,
      filter_ring_size: null,
      filter_ring_type: null,
      filter_bracelet_length: null
    });
};
