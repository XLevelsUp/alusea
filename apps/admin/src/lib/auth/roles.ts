// Role definitions and the navigation each role can reach. Mirrors the RLS policies in supabase/migrations.
// This drives what the UI shows; the database decides what actually happens, so both must be changed together.

export const ROLES = ['developer', 'owner', 'accounts', 'sales', 'hr', 'staff'] as const

export type Role = (typeof ROLES)[number]

// A developer can do everything an owner can, so any check that names 'owner' lets a developer through as well.
export function roleAllowed(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role) || (role === 'developer' && allowed.includes('owner'))
}

export function isOwnerLevel(role: Role): boolean {
  return role === 'owner' || role === 'developer'
}

// The roles a given person may hand out or see on the Users page: only a developer deals in developer accounts.
export function assignableRoles(actor: Role): Role[] {
  return ROLES.filter((role) => role !== 'developer' || actor === 'developer')
}

export const ROLE_LABELS: Record<Role, string> = {
  developer: 'Developer',
  owner: 'Owner',
  accounts: 'Accounts',
  sales: 'Sales',
  hr: 'HR',
  staff: 'Staff',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  developer: 'Everything an owner has, plus document numbering, document templates, the audit log and data health.',
  owner: 'Full access to every module, including settings and user management.',
  accounts: 'Invoices, payments and expenses. Reads payroll totals but not individual salaries.',
  sales: 'Catalogue, blog and clients. Reads invoices without editing them.',
  hr: 'Employees and payroll. No access to sales or accounting.',
  staff: 'Submits expenses and views their own payslips. Nothing else.',
}

export type NavItem = {
  href: string
  label: string
  roles: readonly Role[]
}

export type NavGroup = {
  label: string
  items: readonly NavItem[]
}

// Ordered by how often each group is used: daily ERP work first, the website's content after it, settings last.
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', roles: ['owner', 'accounts'] },
      { href: '/finances', label: 'Finances', roles: ['owner', 'accounts'] },
    ],
  },
  {
    label: 'Sales',
    items: [
      // Quotations are hidden for now; the /quotes pages still exist, so restoring this line brings them back.
      { href: '/parties', label: 'Clients & Vendors', roles: ['owner', 'accounts', 'sales'] },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/invoices', label: 'Invoices', roles: ['owner', 'accounts', 'sales'] },
      { href: '/expenses', label: 'Expenses', roles: ['owner', 'accounts', 'sales', 'hr', 'staff'] },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/employees', label: 'Employees', roles: ['owner', 'hr'] },
      { href: '/payroll', label: 'Payroll', roles: ['owner', 'hr', 'accounts'] },
    ],
  },
  {
    // The public website's content, kept below the daily ERP work.
    label: 'Website',
    items: [
      // Categories are a tab of the Catalogue page.
      { href: '/catalogue', label: 'Catalogue', roles: ['owner', 'sales'] },
      { href: '/media', label: 'Page Media', roles: ['owner', 'sales'] },
      // Comments are a tab of the Blog page.
      { href: '/blog', label: 'Blog', roles: ['owner', 'sales'] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/settings/company', label: 'Company Details', roles: ['owner'] },
      { href: '/settings/users', label: 'Users & Roles', roles: ['owner'] },
    ],
  },
  {
    // Technical pages: only the developer role, not owners.
    label: 'Developer',
    items: [
      { href: '/settings/numbering', label: 'Document Numbering', roles: ['developer'] },
      { href: '/settings/documents', label: 'Document Templates', roles: ['developer'] },
      { href: '/settings/audit', label: 'Audit Log', roles: ['developer'] },
      { href: '/settings/data', label: 'Data Health', roles: ['developer'] },
    ],
  },
]

export function canAccess(role: Role, href: string): boolean {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href === href) return roleAllowed(role, item.roles)
    }
  }
  return false
}

export function navFor(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => roleAllowed(role, item.roles)),
  })).filter((group) => group.items.length > 0)
}

// Where each role lands after login: the first page in the sidebar that the role can open.
export function landingPageFor(role: Role): string {
  const groups = navFor(role)
  return groups[0]?.items[0]?.href ?? '/no-access'
}
