import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddAnalyticsToTwitterSchedulers extends BaseSchema {
  protected tableName = 'twitter_schedulers'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add analytics column as JSONB (best for structured JSON data in Postgres)
      table.jsonb('analytics').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('analytics')
    })
  }
}
