import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('content')
      table.string('status')
      table.timestamp('scheduled_at').nullable()
      table.specificType('platform', 'text[]').defaultTo('{}')
      table.uuid('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('social_account_id')
        .unsigned()
        .references('id')
        .inTable('social_accounts')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
