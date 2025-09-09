import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterPostsContentColumn extends BaseSchema {
  protected tableName = 'posts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Change content column from varchar(255) to text
      table.text('content').alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Rollback: set it back to varchar(255)
      table.string('content', 255).alter()
    })
  }
}
