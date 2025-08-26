/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.on('/').render('pages/home')

router
  .group(() => {
    // --- Social Accounts Routes ---
    router.get('social_accounts', '#controllers/social_account_controller.index')
    router.post('social_accounts', '#controllers/social_account_controller.store')
    router.get('social_accounts/:id', '#controllers/social_account_controller.show')
    router.put('social_accounts/:id', '#controllers/social_account_controller.update')
    router.delete('social_accounts/:id', '#controllers/social_account_controller.destroy')

    // --- Twitter Scheduler Routes ---
    router.get(
      'social_accounts/:social_account_id/twitter_scheduler',
      '#controllers/twitter_scheduler_controller.index'
    )
    router.post(
      'social_accounts/:social_account_id/twitter_scheduler',
      '#controllers/twitter_scheduler_controller.store'
    )
    router.get(
      'social_accounts/:social_account_id/twitter_scheduler/:id',
      '#controllers/twitter_scheduler_controller.show'
    )
    router.put('twitter_scheduler/:id', '#controllers/twitter_scheduler_controller.update')
    router.delete('twitter_scheduler/:id', '#controllers/twitter_scheduler_controller.destroy')

    router.get('social_accounts/:social_account_id/posts', '#controllers/post_controller.index')
    router.post('social_accounts/:social_account_id/posts', '#controllers/post_controller.store')
    router.get('social_accounts/:social_account_id/posts/:id', '#controllers/post_controller.show')
    router.put(
      'social_accounts/:social_account_id/posts/:id',
      '#controllers/post_controller.update'
    )
    router.delete(
      'social_accounts/:social_account_id/posts/:id',
      '#controllers/post_controller.destroy'
    )
  })
  .use(middleware.auth())

router
  .group(() => {
    router.post('/auth/logout', '#controllers/auth_controller.logout')
    router.get('/auth/me', '#controllers/auth_controller.me')
  })
  .use(middleware.auth())

router.post('/auth/register', '#controllers/auth_controller.register')
router.post('/auth/login', '#controllers/auth_controller.login')
