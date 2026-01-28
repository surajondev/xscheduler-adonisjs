import scheduler from 'adonisjs-scheduler/services/main'
import PostTweet from '../commands/post_tweet.js'
// import TweetAnalytics from '../commands/twitter_analytics.js'

import PingServer from '../commands/ping_server.js'

scheduler.command(PostTweet).everyFiveMinutes().withoutOverlapping()
scheduler.command(PingServer).everyTenMinutes().withoutOverlapping()
// scheduler.command(TweetAnalytics).everyMinute().withoutOverlapping()
