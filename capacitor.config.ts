import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'de.rohandhanawade.subscriptions',
  appName: 'Subscriptions',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#7c6bff',
    },
  },
}

export default config
