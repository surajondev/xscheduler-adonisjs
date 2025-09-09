import { BaseCommand, args } from '@adonisjs/core/ace'
import { schedule } from 'adonisjs-scheduler'
import Post from '#models/post'
import TwitterScheduler from '#models/twitter_scheduler'
import axios from 'axios'
import OAuth from 'oauth-1.0a'
import { createHmac } from 'crypto'
import encryption from '@adonisjs/core/services/encryption'

@schedule('*/5 * * * *') // Run every 5 minutes
export default class PostTweet extends BaseCommand {
  static commandName = 'post:tweet'
  static description = 'Schedule a tweet posting'

  async run() {
    const now = new Date()
    const duePosts = await Post.query()
      .where('status', 'scheduled')
      .where('scheduled_at', '<=', now.toISOString())

    console.log('Posts', duePosts)
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

      const oauth = new OAuth({
        //@ts-ignore
        consumer: { key: decryptedConsumerKey, secret: decryptedConsumerSecret },
        signature_method: 'HMAC-SHA1',
        hash_function(baseString, key) {
          return createHmac('sha1', key).update(baseString).digest('base64')
        },
      })

      const token = { key: decryptedAccessToken, secret: decryptedTokenSecret }
      const url = 'https://api.x.com/2/tweets'
      const method = 'POST'
      const data = {
        text: post.content,
      }

      //@ts-ignore
      const oauthToken = oauth.authorize({ url, method }, token)
      //@ts-ignore
      const headers: { [key: string]: string } = oauth.toHeader(oauthToken)
      headers['Content-Type'] = 'application/json'

      try {
        const res = await axios({
          method,
          url,
          data,
          headers,
        })
        this.logger.info('Tweet posted successfully:', res.data)
      } catch (error) {
        this.logger.error(
          'Error posting tweet:',
          error.response ? error.response.data : error.message
        )
      }
    }
  }
}
