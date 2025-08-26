import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class ArticleController {
  /**
   * Display a list of resource
   */
  async index({ request, auth, params }: HttpContext) {
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
  async store({ request, auth, response, params }: HttpContext) {
    const user = auth.user!
    const social_account_id = params.social_account_id
    const reqData = request.only(['content', 'status', 'scheduled_at'])
    const payload = {
      ...reqData,
      social_account_id,
    }
    return await user?.related('post').create(payload)
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
