import type { HttpContext } from '@adonisjs/core/http'
import TwitterScheduler from '#models/twitter_scheduler'

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
    const reqData = request.only(['token', 'username'])
    const payload = {
      ...reqData,
      user_id: user.id,
      social_account_id,
    }
    const twitter = await TwitterScheduler.create(payload)
    return response.json({ twitter })
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    return await TwitterScheduler.findByOrFail('id', params?.id)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.user!
    const socialAccount = await TwitterScheduler.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .first()
    if (!socialAccount) {
      response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    const reqData = request.only(['token', 'username'])
    socialAccount?.merge(reqData)
    await socialAccount?.save()
    return socialAccount
  }

  /**
   * Delete record
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    const socialAccount = await TwitterScheduler.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .where('social_account_id', social_account_id)
      .first()
    if (!socialAccount) {
      return response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    await socialAccount?.delete()
    return response.json({ message: 'TwitterScheduler Deleted succesfully' })
  }
}
