import { BaseCommand } from '@adonisjs/core/ace'
import { schedule } from 'adonisjs-scheduler'
import TwitterScheduler from '#models/twitter_scheduler'
import axios from 'axios'
import OAuth from 'oauth-1.0a'
import { createHmac } from 'crypto'
import encryption from '@adonisjs/core/services/encryption'

@schedule('0 0 * * *') // every day at midnight (00:00)
export default class TweetAnalytics extends BaseCommand {
  static commandName = 'analytics:tweet'
  static description = 'Get Analytics for Tweets'

  async run() {
    this.logger.info('Twitter analytics started')
    const schedulers = await TwitterScheduler.query().orderBy('created_at', 'desc')

    if (!schedulers.length) {
      this.logger.error('No Twitter scheduler configuration found')
      return
    }

    for (const twitter of schedulers) {
      // Decrypt sensitive fields
      const decryptedConsumerKey = encryption.decrypt(twitter.consumerKey)
      const decryptedConsumerSecret = encryption.decrypt(twitter.consumerSecret)
      const decryptedAccessToken = encryption.decrypt(twitter.accessToken)
      const decryptedTokenSecret = encryption.decrypt(twitter.tokenSecret)

      const oauth = new OAuth({
        //@ts-ignore
        consumer: { key: decryptedConsumerKey, secret: decryptedConsumerSecret },
        signature_method: 'HMAC-SHA1',
        hash_function(baseString, key) {
          return createHmac('sha1', key).update(baseString).digest('base64')
        },
      })

      const token = { key: decryptedAccessToken, secret: decryptedTokenSecret }
      const url = 'https://api.x.com/2/tweets/analytics' // ⚠️ replace with correct endpoint
      const method = 'GET'

      //@ts-ignore
      const oauthToken = oauth.authorize({ url, method }, token)
      //@ts-ignore
      const headers: { [key: string]: string } = oauth.toHeader(oauthToken)
      headers['Content-Type'] = 'application/json'

      try {
        const res = await axios({
          method,
          url,
          headers,
        })

        this.logger.info(`Analytics updated for ${twitter.username}:`, res.data)

        // ✅ Save analytics JSON into twitter_schedulers.analytics column
        await twitter
          .merge({
            analytics: res.data, // assuming you added jsonb column
          })
          .save()
      } catch (error) {
        this.logger.error(
          `Error fetching analytics for ${twitter.username}: ${error}`,
          error.response ? error.response.data : error.message
        )
      }
    }
  }
}
