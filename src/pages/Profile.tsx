import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { motion } from 'motion/react'
import { Camera, Check } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getDisplayName, getAvatarUrl } from '@/lib/utils'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function Profile() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileFormValues>,
    values: { full_name: getDisplayName(user) },
  })

  const avatarUrl = getAvatarUrl(user)
  const initial = getDisplayName(user).charAt(0).toUpperCase()

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const path = `${user.id}/avatar`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error: updateErr } = await supabase.auth.updateUser({
        data: { avatar_url: `${data.publicUrl}?v=${Date.now()}` },
      })
      if (updateErr) throw updateErr
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    setSaved(false)
    const { error } = await supabase.auth.updateUser({ data: { full_name: values.full_name } })
    if (!error) setSaved(true)
  }

  return (
    <AppLayout title="Profile" subtitle="Your personal account details" showPeriodSelector={false}>
      <div className="max-w-2xl flex flex-col gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Photo</h2>
          <div className="flex items-center gap-4">
            <div className="relative group w-20 h-20 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={getDisplayName(user)} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-600">{initial}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:text-gray-900 hover:border-gray-300 transition disabled:opacity-60"
              >
                {uploading ? 'Uploading...' : 'Upload photo'}
              </button>
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, WEBP or GIF. Max 5MB.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void handleAvatarChange(e)}
          />
          {uploadError && <p className="mt-3 text-xs text-red-600">{uploadError}</p>}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] p-5"
        >
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Details</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                {...register('full_name')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Member since</label>
              <p className="text-sm text-gray-500 px-1">
                {user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <PrimaryButton type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-sm font-medium">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </PrimaryButton>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-sm text-[#548164]"
              >
                <Check className="w-4 h-4" /> Saved
              </motion.span>
            )}
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
