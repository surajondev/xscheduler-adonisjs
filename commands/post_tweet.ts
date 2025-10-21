import { TwitterApi } from 'twitter-api-v2'
import { BaseCommand } from '@adonisjs/core/ace'
import { schedule } from 'adonisjs-scheduler'
import Post from '#models/post'
import TwitterScheduler from '#models/twitter_scheduler'
import encryption from '@adonisjs/core/services/encryption'

@schedule('0 * * * *') // every hour at 00 minutes
export default class PostTweet extends BaseCommand {
  static commandName = 'post:tweet'
  static description = 'Schedule a tweet posting'

  async run() {
    this.logger.info('Twitter scheduler started')
    const now = new Date()
    const duePosts = await Post.query()
      .where('status', 'scheduled')
      .where('scheduled_at', '<=', now.toISOString())

    for (const post of duePosts) {
      const twitterScheduler = await TwitterScheduler.query()
        .orderBy('created_at', 'desc')
        .where('social_account_id', post?.social_account_id)
        .first()
      if (!twitterScheduler) {
        this.logger.error('No Twitter scheduler configuration found')
        return
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

      try {
        //@ts-ignore
        const res = await client.v2.tweet(tweetData)
        //@ts-ignore
        this.logger.info('Tweet posted successfully:', res.data)
        await post.merge({ status: 'posted' }).save()
      } catch (error) {
        this.logger.error('Error posting tweet:', error)
      }
    }
  }
}
