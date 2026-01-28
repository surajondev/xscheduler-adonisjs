import { TwitterApi } from 'twitter-api-v2'
import { BaseCommand } from '@adonisjs/core/ace'
import { schedule } from 'adonisjs-scheduler'
import Post from '#models/post'
import TwitterScheduler from '#models/twitter_scheduler'
import encryption from '@adonisjs/core/services/encryption'
import env from '#start/env'

@schedule('*/5 * * * *') // every 5 minutes
export default class PostTweet extends BaseCommand {
  static commandName = 'post:tweet'
  static description = 'Schedule a tweet posting'

  static options = {
    startApp: true,
  }

  async run() {
    this.logger.info('Twitter scheduler started')
    const now = new Date()
    this.logger.info('--- All Posts in DB ---')
    this.logger.info(`Checking for due posts at ${now.toISOString()}`)
    try {
      const duePosts = await Post.query()
        .where('status', 'scheduled')
        .where('scheduled_at', '<=', now.toISOString())

      this.logger.info(`Found ${duePosts.length} due posts`)

      for (const post of duePosts) {
        try {
          this.logger.info(`Processing post ${post.id}`)

          const twitterScheduler = await TwitterScheduler.query()
            .orderBy('created_at', 'desc')
            .where('social_account_id', post?.social_account_id)
            .first()

          if (!twitterScheduler) {
            this.logger.error(`No Twitter scheduler found for account ${post.social_account_id}`)
            continue
          }

          // Decrypt sensitive fields
          const decryptedConsumerKey = encryption.decrypt(twitterScheduler.consumerKey)
          const decryptedConsumerSecret = encryption.decrypt(twitterScheduler.consumerSecret)
          const decryptedAccessToken = encryption.decrypt(twitterScheduler.accessToken)
          const decryptedTokenSecret = encryption.decrypt(twitterScheduler.tokenSecret)

          const client = new TwitterApi({
            //@ts-ignore
            appKey: decryptedConsumerKey,
            appSecret: decryptedConsumerSecret,
            accessToken: decryptedAccessToken,
            accessSecret: decryptedTokenSecret,
          })

          const tweetData: { text: string; media?: { media_ids: string[] } } = {
            text: post.content,
          }

          if (post.media_id) {
            tweetData.media = { media_ids: post.media_id.split(',') }
          }

          //@ts-ignore
          const res = await client.v2.tweet(tweetData)
          //@ts-ignore
          this.logger.info('Tweet posted successfully:', res.data)
          await post.merge({ status: 'posted' }).save()
        } catch (error) {
          this.logger.error(`Error processing post ${post.id}: ${error.message || error}`)
          this.logger.error(error.stack)
        }
      }
    } catch (error) {
      this.logger.error(`Error querying due posts or connecting to DB: ${error.message}`)
      this.logger.error(error.stack)
      // Debug info
      const dbHost = env.get('DB_HOST')
      this.logger.info(`Debug: DB_HOST is ${dbHost ? 'defined' : 'undefined'} (${dbHost})`)
    }
  }
}
