import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all drafts for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: drafts, error } = await supabase
      .from('drafts')
      .select(`
        *,
        draft_attachments(
          attachments(id, file_name, file_size, mime_type, storage_url)
        )
      `)
      .eq('profile_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Fetch drafts error:', error)
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
    }

    // Transform attachments structure
    const transformedDrafts = drafts?.map((draft: any) => ({
      ...draft,
      attachments: draft.draft_attachments?.map((da: any) => da.attachments).filter(Boolean) || []
    })) || []

    return NextResponse.json({ drafts: transformedDrafts })
  } catch (error) {
    console.error('GET drafts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update draft
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      draftId, 
      toHandles, 
      ccHandles, 
      subject, 
      messageBody, 
      bodyMode, 
      contentType,
      attachmentIds 
    } = body

    if (draftId) {
      // Update existing draft
      const { data: draft, error } = await supabase
        .from('drafts')
        .update({
          to_handles: toHandles || [],
          cc_handles: ccHandles || [],
          subject: subject || '',
          body: messageBody || '',
          body_mode: bodyMode || 'rich',
          content_type: contentType || 'text',
        })
        .eq('id', draftId)
        .eq('profile_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Update draft error:', error)
        return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 })
      }

      // Update attachments if provided
      if (attachmentIds && attachmentIds.length > 0) {
        // Delete existing attachments
        await supabase
          .from('draft_attachments')
          .delete()
          .eq('draft_id', draftId)

        // Insert new attachments
        const draftAttachments = attachmentIds.map((attachmentId: string) => ({
          draft_id: draftId,
          attachment_id: attachmentId,
        }))

        await supabase
          .from('draft_attachments')
          .insert(draftAttachments)
      }

      return NextResponse.json({ success: true, draft })
    } else {
      // Create new draft
      const { data: draft, error } = await supabase
        .from('drafts')
        .insert({
          profile_id: user.id,
          to_handles: toHandles || [],
          cc_handles: ccHandles || [],
          subject: subject || '',
          body: messageBody || '',
          body_mode: bodyMode || 'rich',
          content_type: contentType || 'text',
        })
        .select()
        .single()

      if (error) {
        console.error('Create draft error:', error)
        return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 })
      }

      // Add attachments if provided
      if (attachmentIds && attachmentIds.length > 0) {
        const draftAttachments = attachmentIds.map((attachmentId: string) => ({
          draft_id: draft.id,
          attachment_id: attachmentId,
        }))

        await supabase
          .from('draft_attachments')
          .insert(draftAttachments)
      }

      return NextResponse.json({ success: true, draft })
    }
  } catch (error) {
    console.error('POST draft error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete draft
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const draftId = searchParams.get('id')

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', draftId)
      .eq('profile_id', user.id)

    if (error) {
      console.error('Delete draft error:', error)
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE draft error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
