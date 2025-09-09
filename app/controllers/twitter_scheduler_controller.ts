import type { HttpContext } from '@adonisjs/core/http'
import TwitterScheduler from '#models/twitter_scheduler'
import encryption from '@adonisjs/core/services/encryption' // Use the service directly

export default class ArticleController {
  /**
   * Display a list of resource
   */
  async index({ auth, params }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    return await TwitterScheduler.query()
      .orderBy('created_at', 'desc')
      .where('user_id', user.id)
      .where('social_account_id', social_account_id)
      .first()
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, auth, response, params }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    const reqData = request.only([
      'access_token',
      'consumer_key',
      'consumer_secret',
      'token_secret',
      'username',
    ])
    const payload = {
      ...reqData,
      user_id: user.id,
      social_account_id,
    }
    payload.consumer_key = encryption.encrypt(payload.consumer_key)
    payload.consumer_secret = encryption.encrypt(payload.consumer_secret)
    payload.access_token = encryption.encrypt(payload.access_token)
    payload.token_secret = encryption.encrypt(payload.token_secret)
    const twitter = await TwitterScheduler.create(payload)
    return response.json({ twitter })
  }
  /**
   * Show individual record
   */
  async show({ params, auth }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    const twitter = await TwitterScheduler.query()
      .orderBy('created_at', 'desc')
      .where('user_id', user.id)
      .where('social_account_id', social_account_id)
      .first()

    return twitter
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.user!
    const twitterScheduler = await TwitterScheduler.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .first()
    if (!twitterScheduler) {
      response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    const reqData = request.only([
      'access_token',
      'consumer_key',
      'consumer_secret',
      'token_secret',
      'username',
    ])
    const updatedData = {
      ...reqData,
      consumer_key: reqData.consumer_key
        ? encryption.encrypt(reqData.consumer_key)
        : twitterScheduler?.consumerKey,
      consumer_secret: reqData.consumer_secret
        ? encryption.encrypt(reqData.consumer_secret)
        : twitterScheduler?.consumerSecret,
      access_token: reqData.access_token
        ? encryption.encrypt(reqData.access_token)
        : twitterScheduler?.accessToken,
      token_secret: reqData.token_secret
        ? encryption.encrypt(reqData.token_secret)
        : twitterScheduler?.tokenSecret,
    }
    twitterScheduler?.merge(updatedData)
    await twitterScheduler?.save()
    return twitterScheduler
  }

  /**
   * Delete record
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    const twitterScheduler = await TwitterScheduler.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .where('social_account_id', social_account_id)
      .first()
    if (!twitterScheduler) {
      return response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    await twitterScheduler?.delete()
    return response.json({ message: 'TwitterScheduler Deleted succesfully' })
  }
}
