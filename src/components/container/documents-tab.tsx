import { Download, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Container } from '@/types'

export function DocumentsTab({ container }: { container: Container }) {
  const docs = [
    { name: 'Bill of Lading', file: `BL-${container.number}.pdf` },
    { name: 'Packing List', file: `PL-${container.number}.pdf` },
    { name: 'Delivery Order (DO)', file: `DO-${container.number}.pdf` },
    { name: 'Customs Declaration', file: `PIB-${container.number}.pdf` },
    { name: 'Seal Certificate', file: `SEAL-${container.number}.pdf` },
  ]
  return (
    <Card>
      <CardContent className="divide-y divide-slate-100">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <FileText size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-navy-800">{d.name}</p>
                <p className="text-xs text-slate-500">{d.file}</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" disabled>
              <Download size={14} /> Download
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
