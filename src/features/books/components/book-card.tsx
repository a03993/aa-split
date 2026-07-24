"use client"

import Link from "next/link"

import { format, parseISO } from "date-fns"

import { MemberAvatar } from "@/components/member-avatar"
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { isSettled } from "@/domain/book"
import type { BookWithMembers } from "@/types/app.types"

interface BookCardProps {
  book: BookWithMembers
  href: `/group/${string}`
}

const MAX_VISIBLE_MEMBERS = 4

export function BookCard({ book, href }: BookCardProps) {
  const visibleMembers = book.members.slice(0, MAX_VISIBLE_MEMBERS)

  return (
    <Link
      href={href}
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-background px-4 py-3 active:opacity-80"
    >
      <div className="flex w-full items-start justify-between">
        <p className="font-semibold leading-snug text-foreground">{book.name}</p>
        {isSettled(book) && <Badge variant="secondary">已結算</Badge>}
      </div>

      <div className="flex w-full items-center justify-between">
        <AvatarGroup>
          {visibleMembers.map((member) => (
            <MemberAvatar key={member.id} member={member} size="sm" />
          ))}
          {book.members.length > MAX_VISIBLE_MEMBERS && (
            <AvatarGroupCount>+{book.members.length - MAX_VISIBLE_MEMBERS}</AvatarGroupCount>
          )}
        </AvatarGroup>

        <p className="text-xs text-muted-foreground">
          {format(parseISO(book.created_at), "yyyy/MM/dd")}
        </p>
      </div>
    </Link>
  )
}
