import { BaseCommand } from '@adonisjs/core/ace'
import env from '#start/env'

export default class PingServer extends BaseCommand {
  static commandName = 'ping:server'
  static description = 'Ping the server to keep it alive'

  static options = {}

  async run() {
    const appUrl = env.get('APP_URL')

    if (!appUrl) {
      this.logger.error('APP_URL is not defined in the environment variables')
      return
    }

    this.logger.info(`Pinging server at ${appUrl}...`)

    try {
      const response = await fetch(appUrl)
      if (response.ok) {
        this.logger.info(`Ping successful. Status: ${response.status}`)
      } else {
        this.logger.warning(`Ping failed. Status: ${response.status}`)
      }
    } catch (error) {
      this.logger.error(`Error pinging server: ${error.message}`)
    }
  }
}
