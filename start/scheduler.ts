import scheduler from 'adonisjs-scheduler/services/main'
import PostTweet from '../commands/post_tweet.js'
// import TweetAnalytics from '../commands/twitter_analytics.js'

scheduler.command(PostTweet).everyFifteenMinutes().withoutOverlapping()
// scheduler.command(TweetAnalytics).everyMinute().withoutOverlapping()
