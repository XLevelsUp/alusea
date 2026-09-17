// Role definitions and the navigation each role can reach. Mirrors the RLS policies in supabase/migrations.
// This drives what the UI shows; the database decides what actually happens, so both must be changed together.

export const ROLES = ['owner', 'accounts', 'sales', 'hr', 'staff'] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  accounts: 'Accounts',
  sales: 'Sales',
  hr: 'HR',
  staff: 'Staff',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full access to every module, including settings and user management.',
  accounts: 'Invoices, payments and expenses. Reads payroll totals but not individual salaries.',
  sales: 'Catalogue, blog, quotes and clients. Reads invoices without editing them.',
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

// Phase 1 ships the Content and Settings groups. ERP groups are added by the phase that builds each module.
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', roles: ['owner', 'accounts'] },
      { href: '/reports', label: 'Reports', roles: ['owner', 'accounts'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/catalogue', label: 'Catalogue Items', roles: ['owner', 'sales'] },
      { href: '/categories', label: 'Categories', roles: ['owner', 'sales'] },
      { href: '/media', label: 'Page Media', roles: ['owner', 'sales'] },
      { href: '/blog', label: 'Blog', roles: ['owner', 'sales'] },
      { href: '/blog/comments', label: 'Comments', roles: ['owner', 'sales'] },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/quotes', label: 'Quotations', roles: ['owner', 'accounts', 'sales'] },
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
    label: 'Settings',
    items: [
      { href: '/settings/company', label: 'Company Details', roles: ['owner'] },
      { href: '/settings/numbering', label: 'Document Numbering', roles: ['owner'] },
      { href: '/settings/documents', label: 'Document Templates', roles: ['owner'] },
      { href: '/settings/users', label: 'Users & Roles', roles: ['owner'] },
      { href: '/settings/audit', label: 'Audit Log', roles: ['owner'] },
      { href: '/settings/data', label: 'Data Health', roles: ['owner'] },
    ],
  },
]

export function canAccess(role: Role, href: string): boolean {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href === href) return item.roles.includes(role)
    }
  }
  return false
}

export function navFor(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

// Where each role lands after login, since not every role can see the catalogue.
export function landingPageFor(role: Role): string {
  const groups = navFor(role)
  return groups[0]?.items[0]?.href ?? '/no-access'
}
