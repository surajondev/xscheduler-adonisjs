import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import SocialAccount from '#models/social_account'

export default class AuthController {
  public async register({ request, response }: HttpContext) {
    const data = request.only(['first_name', 'last_name', 'email', 'password'])
    const user = await User.create(data)
    await SocialAccount.create({
      name: `${user?.firstName?.toLocaleLowerCase()}-${user?.lastName?.toLowerCase()}`,
      userId: user?.id,
    })
    return response.ok({
      user: user.serialize(),
    })
  }

  public async login({ request, auth, response }: HttpContext) {
    const email = request.input('email')
    const password = request.input('password')

    console.log(email, password)

    try {
      const user = await User.verifyCredentials(email, password)
      const token = await auth.use('api').createToken(user)
      const social_account = await SocialAccount.query().where('user_id', user.id).first()
      return response.json({
        message: 'Login successful',
        user,
        token,
        social_account,
      })
    } catch (error) {
      console.log(error)
      return response.unauthorized({ error: 'Invalid credentials' })
    }
  }

  public async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
    return response.json({ message: 'Logged out' })
  }

  /**
   * Get authenticated user (session check)
   */
  public async me({ auth, response }: HttpContext) {
    return response.json({ user: auth.user })
  }
}
