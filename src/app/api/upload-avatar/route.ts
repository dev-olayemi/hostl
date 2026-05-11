import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate type and size (max 2MB)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Allowed formats: JPG, PNG, WebP, GIF, SVG' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

  const isGif = file.type === 'image/gif'

  // Upload to Cloudinary — store under hostl/avatars/{userId}
  const result = await cloudinary.uploader.upload(base64, {
    folder: 'hostl/avatars',
    public_id: user.id,
    overwrite: true,
    resource_type: 'image',
    // GIFs: preserve animation, just resize. Others: face-aware crop to square.
    transformation: isGif
      ? [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
      : [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
  })

  const avatarUrl = result.secure_url
  const publicId = result.public_id

  // Save to profiles table
  const admin = getAdmin()
  await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl, avatar_public_id: publicId })
    .eq('id', user.id)

  return NextResponse.json({ url: avatarUrl, public_id: publicId })
}
