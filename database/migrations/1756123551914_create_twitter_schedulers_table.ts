import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'twitter_schedulers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('username')
      table.text('consumer_key')
      table.text('consumer_secret')
      table.text('access_token')
      table.text('token_secret')
      table.uuid('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('social_account_id')
        .unsigned()
        .references('id')
        .inTable('social_accounts')
        .unique()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
