// scripts/populate-thumbs.ts

import 'dotenv/config'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'fs/promises'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE as string
const screenshotApiKey = process.env.SCREENSHOTONE_API_KEY as string

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateThumbs() {
  console.log('🔎 Fetching resources...')
  const { data: resources, error } = await supabase
    .from('resources')
    .select('id, url')
    .is('thumbnail_url', null)

  if (error) {
    console.error('❌ Error fetching resources:', error)
    return
  }

  if (!resources || resources.length === 0) {
    console.log('✅ No missing thumbnails.')
    return
  }

  for (const resource of resources) {
    try {
      const screenshotUrl = `https://api.screenshotone.com/take?access_key=${screenshotApiKey}&url=${encodeURIComponent(resource.url)}&format=webp&block_ads=true&block_cookie_banners=true&block_trackers=true&delay=0&timeout=60&response_type=by_format&image_quality=80`

      const response = await fetch(screenshotUrl)

      if (!response.ok) {
        console.error(`❌ Failed to fetch screenshot for ${resource.url}`)
        continue
      }

      const buffer = await response.buffer()
      const fileName = `${resource.id}.webp`

      const { error: uploadError } = await supabase.storage
        .from('resource-thumbs')
        .upload(fileName, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp',
        })

      if (uploadError) {
        console.error(`❌ Failed to upload for ${resource.url}`, uploadError)
        continue
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/resource-thumbs/${fileName}`

      const { error: updateError } = await supabase
        .from('resources')
        .update({ thumbnail_url: publicUrl })
        .eq('id', resource.id)

      if (updateError) {
        console.error(`❌ Failed to update DB for ${resource.url}`, updateError)
        continue
      }

      console.log(`✅ ${resource.url}`)
    } catch (err) {
      console.error(`❌ Error processing ${resource.url}:`, err)
    }
  }

  console.log('🎉 All done.')
}

generateThumbs()
