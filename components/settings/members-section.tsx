'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus, Users } from 'lucide-react'
import {
  useOrganizationMembers,
  useInviteMember,
  useUpdateMemberRole,
  type OrgMember,
} from '@/lib/react-query/hooks/use-organization-members'
import { useUserRole } from '@/lib/react-query/hooks/use-user-role'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  staff: 'Employé',
}

export function MembersSection() {
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'staff'>('staff')

  const { data: roleData } = useUserRole()
  const currentRole = roleData ?? 'admin'
  const isAdmin = currentRole === 'admin'

  const { data: membersData, isLoading } = useOrganizationMembers()
  const members = membersData?.members ?? []
  const forbidden = membersData?.forbidden

  const inviteMember = useInviteMember()
  const updateRole = useUpdateMemberRole()

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    inviteMember.mutate(
      { email: email.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setEmail('')
          setInviteRole('staff')
        },
      }
    )
  }

  const handleRoleChange = (userId: string, newRole: 'admin' | 'manager' | 'staff') => {
    updateRole.mutate({ userId, role: newRole })
  }

  if (forbidden) {
    return null
  }

  return (
    <Card className="rounded-xl border shadow-sm bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center" aria-hidden="true">
            <Users className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold" id="members-section-title">
            Membres
          </CardTitle>
        </div>
        <CardDescription className="mt-1" aria-describedby="members-section-title">
          Gérez les membres de votre organisation et leurs rôles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAdmin && (
          <form onSubmit={handleInvite} className="space-y-4 p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Inviter un membre
            </h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={inviteMember.isPending}
                />
              </div>
              <div className="w-full sm:w-40 space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as 'admin' | 'manager' | 'staff')}
                  disabled={inviteMember.isPending}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                    <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
                    <SelectItem value="staff">{ROLE_LABELS.staff}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={inviteMember.isPending || !email.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {inviteMember.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Inviter'
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Liste des membres</h4>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun membre</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {members.map((m) => (
                <MemberRow
                  key={m.userId}
                  member={m}
                  isAdmin={isAdmin}
                  onRoleChange={handleRoleChange}
                  isUpdating={updateRole.isPending}
                />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MemberRow({
  member,
  isAdmin,
  onRoleChange,
  isUpdating,
}: {
  member: OrgMember
  isAdmin: boolean
  onRoleChange: (userId: string, role: 'admin' | 'manager' | 'staff') => void
  isUpdating: boolean
}) {
  const name =
    [member.firstName, member.lastName].filter(Boolean).join(' ') ||
    member.email ||
    'Utilisateur'
  const userId = member.userId

  if (!userId) return null

  return (
    <li className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="font-medium">{name}</p>
        {member.email && member.email !== name && (
          <p className="text-sm text-muted-foreground">{member.email}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Select
            value={member.role}
            onValueChange={(v) => onRoleChange(userId, v as 'admin' | 'manager' | 'staff')}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
              <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
              <SelectItem value="staff">{ROLE_LABELS.staff}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground px-3 py-1.5 rounded-md bg-muted">
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
        )}
      </div>
    </li>
  )
}
