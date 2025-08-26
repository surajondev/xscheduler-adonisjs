import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import TwitterScheduler from './twitter_scheduler.js'
import Post from './post.js'

export default class SocialAccount extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ isPrimary: true })
  declare name: string

  @column()
  declare userId: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasOne(() => TwitterScheduler)
  declare twitter: HasOne<typeof TwitterScheduler>

  @hasOne(() => Post)
  declare post: HasOne<typeof Post>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
