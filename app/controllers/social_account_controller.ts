import type { HttpContext } from '@adonisjs/core/http'
import SocialAccount from '#models/social_account'

export default class ArticleController {
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {
    return await SocialAccount.query().orderBy('created_at', 'desc')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, auth }: HttpContext) {
    const user = auth.user
    const reqData = request.only(['name'])
    return await user?.related('social_account').create(reqData)
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    return await SocialAccount.findByOrFail('id', params?.id)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.user!
    const socialAccount = await SocialAccount.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .first()
    if (!socialAccount) {
      response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    const reqData = request.only(['name'])
    socialAccount?.merge(reqData)
    await socialAccount?.save()
    return socialAccount
  }

  /**
   * Delete record
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const socialAccount = await SocialAccount.query()
      .where('id', params?.id)
      .where('user_id', user.id)
      .first()
    if (!socialAccount) {
      return response.unauthorized({ message: 'Not permitted to perform the action' })
    }
    await socialAccount?.delete()
    return response.json({ message: 'SocialAccount Deleted succesfully' })
  }
}
