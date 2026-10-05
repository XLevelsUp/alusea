import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { assignableRoles, canAccess, navFor, roleAllowed } from './roles.ts'

const DEVELOPER_PAGES = ['/settings/numbering', '/settings/documents', '/settings/audit', '/settings/data']

describe('roleAllowed', () => {
  test('a developer passes any check an owner passes', () => {
    assert.equal(roleAllowed('developer', ['owner']), true)
    assert.equal(roleAllowed('developer', ['owner', 'accounts']), true)
  })

  test('an owner does not pass a developer-only check', () => {
    assert.equal(roleAllowed('owner', ['developer']), false)
  })

  test('a developer gets nothing extra from checks that exclude owners', () => {
    assert.equal(roleAllowed('developer', ['hr']), false)
  })

  test('other roles pass only checks that name them', () => {
    assert.equal(roleAllowed('accounts', ['owner', 'accounts']), true)
    assert.equal(roleAllowed('staff', ['owner', 'accounts']), false)
  })
})

describe('developer pages', () => {
  test('only a developer can reach them', () => {
    for (const href of DEVELOPER_PAGES) {
      assert.equal(canAccess('developer', href), true, href)
      for (const role of ['owner', 'accounts', 'sales', 'hr', 'staff'] as const) {
        assert.equal(canAccess(role, href), false, `${role} ${href}`)
      }
    }
  })

  test('an owner menu has no Developer group and a developer menu has one', () => {
    assert.equal(navFor('owner').some((group) => group.label === 'Developer'), false)
    assert.equal(navFor('developer').some((group) => group.label === 'Developer'), true)
  })

  test('a developer still sees everything an owner sees', () => {
    const ownerLinks = navFor('owner').flatMap((group) => group.items.map((item) => item.href))
    const developerLinks = navFor('developer').flatMap((group) => group.items.map((item) => item.href))
    for (const href of ownerLinks) assert.ok(developerLinks.includes(href), href)
  })
})

describe('assignableRoles', () => {
  test('only a developer can hand out the developer role', () => {
    assert.equal(assignableRoles('developer').includes('developer'), true)
    assert.equal(assignableRoles('owner').includes('developer'), false)
  })
})
