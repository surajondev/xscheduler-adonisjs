import scheduler from 'adonisjs-scheduler/services/main'
import PostTweet from '../commands/post_tweet.js'

scheduler.command(PostTweet).hourly().withoutOverlapping()
