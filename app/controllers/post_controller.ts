import { TwitterApi } from 'twitter-api-v2'
import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
import TwitterScheduler from '#models/twitter_scheduler'
import encryption from '@adonisjs/core/services/encryption'
import axios from 'axios'
import OAuth from 'oauth-1.0a'
import { createHmac } from 'node:crypto'

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
    const reqData = request.only(['content', 'status', 'scheduled_at', 'attachments'])

    const mediaIds: string[] = []

    if (reqData.attachments && reqData.attachments.length > 0) {
      const twitterScheduler = await TwitterScheduler.query()
        .orderBy('created_at', 'desc')
        .where('social_account_id', social_account_id)
        .where('user_id', user?.id)
        .first()

      if (twitterScheduler) {
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

        for (const attachment of reqData.attachments as { data: string; type: string }[]) {
          const base64Data = attachment.data.split(',')[1] || attachment.data
          const mediaData = Buffer.from(base64Data, 'base64')

          try {
            const mediaId = await client.v1.uploadMedia(mediaData, { mimeType: attachment.type })
            mediaIds.push(mediaId)
          } catch (error) {
            console.error('Error uploading media:', error)
          }
        }
      }
    }

    const payload = {
      content: reqData.content,
      status: reqData.status,
      scheduled_at: reqData.scheduled_at,
      social_account_id,
      media_id: mediaIds.join(','),
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

    const client = new TwitterApi({
      //@ts-ignore
      appKey: decryptedConsumerKey,
      appSecret: decryptedConsumerSecret,
      accessToken: decryptedAccessToken,
      accessSecret: decryptedTokenSecret,
    })

    try {
      const tweet = await client.v2.tweet(request.input('content'))
      console.log('Tweet created:', tweet)

      const reqData = request.only(['content', 'status', 'scheduled_at'])
      const payload = {
        ...reqData,
        social_account_id,
      }
      return await user?.related('post').create(payload)
    } catch (error) {
      console.error('Error posting tweet:', error)
      return response.status(401).json({
        error: 'Unauthorized',
        details: error.message || 'Failed to post tweet',
      })
    }
  }

  async post_media({ request, auth, params, response }: HttpContext) {
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

    const client = new TwitterApi({
      //@ts-ignore
      appKey: decryptedConsumerKey,
      appSecret: decryptedConsumerSecret,
      accessToken: decryptedAccessToken,
      accessSecret: decryptedTokenSecret,
    })

    const mediaData = Buffer.from(request.input('media'), 'base64')
    const mediaId = await client.v1.uploadMedia(mediaData, { mimeType: 'image/png' })

    const payload = {
      content: request.input('content'),
      status: request.input('status'),
      scheduled_at: request.input('scheduled_at'),
      social_account_id,
      media_id: mediaId,
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
