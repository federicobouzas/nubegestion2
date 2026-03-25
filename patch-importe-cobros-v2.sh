#!/bin/bash
set -e

node << 'JSEOF'
const fs = require('fs')

const path = 'lib/cobros.ts'
let c = fs.readFileSync(path, 'utf8')

// importe_abonado → importe en todos lados
c = c.replaceAll('importe_abonado', 'importe')

fs.writeFileSync(path, c)
console.log('✅ lib/cobros.ts actualizado')

// types/cobros.ts
const path2 = 'types/cobros.ts'
let c2 = fs.readFileSync(path2, 'utf8')
c2 = c2.replaceAll('importe_abonado', 'importe')
fs.writeFileSync(path2, c2)
console.log('✅ types/cobros.ts actualizado')

// ReciboCobroForm.tsx
const path3 = 'components/cobros/ReciboCobroForm.tsx'
let c3 = fs.readFileSync(path3, 'utf8')
c3 = c3.replaceAll('importe_abonado', 'importe')
fs.writeFileSync(path3, c3)
console.log('✅ ReciboCobroForm.tsx actualizado')

// ver page
const path4 = 'app/(dashboard)/cobros/[id]/page.tsx'
let c4 = fs.readFileSync(path4, 'utf8')
c4 = c4.replaceAll('importe_abonado', 'importe')
fs.writeFileSync(path4, c4)
console.log('✅ cobros/[id]/page.tsx actualizado')

// imprimir page
const path5 = 'app/(dashboard)/cobros/[id]/imprimir/page.tsx'
let c5 = fs.readFileSync(path5, 'utf8')
c5 = c5.replaceAll('importe_abonado', 'importe')
fs.writeFileSync(path5, c5)
console.log('✅ cobros/[id]/imprimir/page.tsx actualizado')
JSEOF