// The HSN codes offered on an invoice line, grouped the way the business thinks about its materials.
// Several products share a code, so each option has its own key; only the code is stored and printed.

export type HsnOption = { key: string; product: string; code: string }
export type HsnGroup = { label: string; options: HsnOption[] }

function group(label: string, prefix: string, rows: [product: string, code: string][]): HsnGroup {
  return { label, options: rows.map(([product, code], index) => ({ key: `${prefix}-${index}`, product, code })) }
}

export const HSN_GROUPS: HsnGroup[] = [
  group('Aluminium', 'al', [
    ['Aluminium unwrought / primary aluminium', '7601'],
    ['Aluminium bars & rods', '7604'],
    ['Aluminium profiles / sections', '7604'],
    ['Aluminium wire', '7605'],
    ['Aluminium plates, sheets & strips', '7606'],
    ['Aluminium foil', '7607'],
    ['Aluminium tubes & pipes', '7608'],
    ['Aluminium tube/pipe fittings', '7609'],
    ['Aluminium structures & parts of structures', '7610'],
    ['Aluminium reservoirs, tanks & containers', '7611'],
    ['Aluminium casks, drums, cans & similar containers', '7612'],
    ['Aluminium household/kitchen articles', '7615'],
    ['Other aluminium articles', '7616'],
  ]),
  group('Glass', 'gl', [
    ['Glass in balls, rods, tubes', '7002'],
    ['Cast / rolled glass', '7003'],
    ['Drawn / blown glass', '7004'],
    ['Float glass & surface-ground/polished glass', '7005'],
    ['Glass sheets / plates, worked glass', '7006'],
    ['Safety glass – toughened / tempered', '7007'],
    ['Laminated safety glass', '7007'],
    ['Glass mirrors', '7009'],
    ['Glass containers / bottles', '7010'],
    ['Glass tableware / kitchenware', '7013'],
    ['Glass ornaments / decorative articles', '7013'],
    ['Glass fibres', '7019'],
    ['Other glass articles', '7020'],
  ]),
  group('Hardware', 'hw', [
    ['Door hinges', '8302'],
    ['Window hinges', '8302'],
    ['Door/window fittings & mountings', '8302'],
    ['Door handles / knobs', '8302'],
    ['Window handles', '8302'],
    ['Door bolts', '8302'],
    ['Door closers', '8302'],
    ['Metal brackets / fittings', '8302'],
    ['Furniture fittings', '8302'],
    ['Locks', '8301'],
    ['Padlocks', '8301'],
    ['Base-metal keys', '8301'],
    ['Latches', '8301'],
    ['Fasteners / screws', '7318'],
    ['Nuts', '7318'],
    ['Bolts', '7318'],
    ['Washers', '7318'],
    ['Iron/steel nails', '7317'],
    ['Aluminium screws/fasteners', '7616'],
    ['Stainless-steel hardware', '8302'],
    ['Curtain fittings', '8302'],
    ['Castors', '8302'],
    ['Architectural hardware', '8302'],
  ]),
]

const ALL_OPTIONS = HSN_GROUPS.flatMap((hsnGroup) => hsnGroup.options)
const VALID_CODES = new Set(ALL_OPTIONS.map((option) => option.code))

export function hsnCodeForKey(key: string): string {
  return ALL_OPTIONS.find((option) => option.key === key)?.code ?? ''
}

// A saved line only remembers the code, so reopening it selects the first product listed under that code.
export function hsnKeyForCode(code: string): string {
  return ALL_OPTIONS.find((option) => option.code === code)?.key ?? ''
}

export function isKnownHsnCode(code: string): boolean {
  return VALID_CODES.has(code)
}
