
exports.up = function(knex, Promise) {
    return knex.schema.createTable('subscription_list', (table) => {
      table.increments();
      table.string('store_url').notNullable();
      table.string('subscription_id').notNullable();
      table.integer('trial_count').notNullable();
      table.specificType('stringarray', 'text ARRAY');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('subscription_list');
  };
  