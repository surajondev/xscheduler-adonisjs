import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import SocialAccount from './social_account.js'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare content: string

  @column()
  declare status: string

  @column()
  declare scheduledAt: DateTime

  @column()
  declare userId: string

  @column()
  declare social_account_id: string

  @column()
  declare media_id: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SocialAccount)
  declare social_account: BelongsTo<typeof SocialAccount>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
