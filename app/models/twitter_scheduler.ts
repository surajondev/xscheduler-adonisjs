import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SocialAccount from './social_account.js'

export default class TwitterScheduler extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare username: string

  @column()
  declare accessToken: string

  @column()
  declare consumerKey: string

  @column()
  declare consumerSecret: string

  @column()
  declare tokenSecret: string

  @column()
  declare user_id: string

  @column()
  declare social_account_id: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SocialAccount)
  declare social_account: BelongsTo<typeof SocialAccount>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
