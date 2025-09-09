import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import axios from 'axios'
import OAuth from 'oauth-1.0a'
import { createHmac } from 'crypto' // Import crypto for ES Modules
import TwitterScheduler from '#models/twitter_scheduler'
import encryption from '@adonisjs/core/services/encryption'

export default class ArticleController {
  /**
   * Display a list of resource
   */
  async index({ auth, params }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    return await Post.query()
      .orderBy('created_at', 'desc')
      .where('user_id', user.id)
      .where('social_account_id', social_account_id)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, auth, params }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    const reqData = request.only(['content', 'status', 'scheduled_at'])
    const payload = {
      ...reqData,
      social_account_id,
    }
    return await user?.related('post').create(payload)
  }

  async post({ request, auth, params, response }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    const twitterScheduler = await TwitterScheduler.query()
      .orderBy('created_at', 'desc')
      .where('social_account_id', social_account_id)
      .where('user_id', user?.id)
      .first()
    if (!twitterScheduler) {
      return response.status(400).json({ error: 'No Twitter scheduler configuration found' })
    }
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
      text: request.input('content'),
    }

    // Authorize without including data in OAuth parameters
    //@ts-ignore
    const oauthToken = oauth.authorize({ url, method }, token)
    //@ts-ignore
    const headers: { [key: string]: string } = oauth.toHeader(oauthToken)
    headers['Content-Type'] = 'application/json'

    console.log('OAuth Token:', oauthToken)
    console.log('Headers:', headers)

    try {
      await axios({
        method,
        url,
        data, // Data is sent as the request body
        headers,
      })
      const reqData = request.only(['content', 'status', 'scheduled_at'])
      const payload = {
        ...reqData,
        social_account_id,
      }
      return await user?.related('post').create(payload)
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message)
      return response.status(401).json({
        error: 'Unauthorized',
        details: error.response ? error.response.data : error.message,
      })
    }
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    return await Post.findByOrFail('id', params?.id)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id

    const post = await Post.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .where('social_account_id', social_account_id)
      .first()
    if (!post) {
      response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    const reqData = request.only(['content', 'status', 'scheduled_at'])
    post?.merge(reqData)
    await post?.save()
    return post
  }

  /**
   * Delete record
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id

    const post = await Post.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .where('social_account_id', social_account_id)
      .first()
    if (!post) {
      return response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    await post?.delete()
    return response.json({ message: 'Post Deleted succesfully' })
  }
}
