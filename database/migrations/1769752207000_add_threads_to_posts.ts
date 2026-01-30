import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddThreadsToPosts extends BaseSchema {
  protected tableName = 'posts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('threads').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('threads')
    })
  }
}
