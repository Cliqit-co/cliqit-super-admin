import { NhostClient } from '@nhost/nextjs'

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN
const region = process.env.NEXT_PUBLIC_NHOST_REGION

if (!subdomain || !region) {
  // Warn but do not crash so the app can boot and show the sign-in UI
  // Replace with real values in .env.local
  console.warn('Nhost env vars missing: NEXT_PUBLIC_NHOST_SUBDOMAIN or NEXT_PUBLIC_NHOST_REGION')
}

const nhost = new NhostClient({
  subdomain: subdomain || 'your-subdomain',
  region: region || 'us-east-1',
})

export { nhost }