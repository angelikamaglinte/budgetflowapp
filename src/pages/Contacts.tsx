import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { ContactForm } from '@/components/contacts/ContactForm'
import type { ContactFormValues } from '@/components/contacts/ContactForm'
import { useContacts, useAddContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts'
import { useAuth } from '@/contexts/AuthContext'
import type { Contact } from '@/types'

export default function Contacts() {
  const { user } = useAuth()
  const { data: contacts = [], isLoading } = useContacts()
  const addContact = useAddContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.company?.toLowerCase().includes(q) ?? false) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    )
  }, [contacts, search])

  async function handleSubmit(values: ContactFormValues) {
    if (editTarget) {
      await updateContact.mutateAsync({ id: editTarget.id, ...values })
    } else {
      await addContact.mutateAsync({ ...values, user_id: user!.id })
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function openEdit(contact: Contact) {
    setEditTarget(contact)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteContact.mutateAsync(id)
    setDeleteId(null)
  }

  return (
    <AppLayout
      title="Contacts"
      subtitle="Your client directory"
      showPeriodSelector={false}
      action={
        <PrimaryButton
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </PrimaryButton>
      }
    >
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
            <p className="text-gray-500 text-sm">
              {search ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            {!search && (
              <button
                onClick={() => { setEditTarget(null); setFormOpen(true) }}
                className="text-primary-600 text-sm font-medium hover:underline"
              >
                Add contact
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden flex flex-col divide-y divide-gray-50">
              {filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                  className="p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      {c.company && <p className="text-xs text-gray-400 mt-0.5">{c.company}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {(c.email || c.phone) && (
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      {c.email && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {c.phone}</span>}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Table (tablet+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Company</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Phone</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">{c.company ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{c.email ?? '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">{c.phone ?? '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit form modal */}
      <ContactForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Delete contact?</h3>
          <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && void handleDelete(deleteId)}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
