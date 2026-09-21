import { useState } from 'react'
import { Download } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { downloadCsv, formatDateTime } from '@/lib/utils'
import type { AuditLogEntry } from '@/types'

export default function AuditLogsPage() {
  const auditLog = useDataStore((s) => s.auditLog)
  const [query, setQuery] = useState('')

  const filtered = auditLog.filter((a) => `${a.user} ${a.action} ${a.entity} ${a.description}`.toLowerCase().includes(query.toLowerCase()))

  const columns: Column<AuditLogEntry>[] = [
    { key: 'timestamp', header: 'Timestamp', render: (a) => formatDateTime(a.timestamp) },
    { key: 'user', header: 'User', render: (a) => a.user },
    { key: 'action', header: 'Action', render: (a) => <Badge variant="outline">{a.action}</Badge> },
    { key: 'entity', header: 'Entity', render: (a) => a.entity },
    { key: 'description', header: 'Description', render: (a) => a.description },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title="Audit Logs"
        description={`${filtered.length} of ${auditLog.length} entries`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => downloadCsv('audit-log.csv', filtered)}>
            <Download size={14} /> Export CSV
          </Button>
        }
      />
      <Card className="mx-4 mb-4 md:mx-6">
        <div className="border-b border-slate-100 p-3">
          <Input placeholder="Search user, action, entity…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(a) => a.id} emptyTitle="No audit entries found" />
      </Card>
    </div>
  )
}
