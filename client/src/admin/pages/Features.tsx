import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardBody, Table, Td, Button, FilterInput,
  SectionHeader, Notice, Badge,
} from '../components/ui';
import { adminApi } from '@/lib/api/adminClient';
import type { AdminBillableFeatureRow } from '@/lib/api/adminTypes';

const FEATURE_KEY_RE = /^[a-z][a-z0-9_]*$/;

function clampCost(n: number): number {
  return Math.min(999999, Math.max(0, Math.trunc(n)));
}

const Features: React.FC = () => {
  const qc = useQueryClient();
  const listQ = useQuery({
    queryKey: ['admin', 'features'],
    queryFn: () => adminApi.getFeatures(),
  });

  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('0');
  const [newActive, setNewActive] = useState(true);

  const [editing, setEditing] = useState<AdminBillableFeatureRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    if (editing) {
      setEditName(editing.name);
      setEditCost(String(editing.credit_cost));
      setEditActive(editing.is_active);
    }
  }, [editing]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'features'] });

  const createM = useMutation({
    mutationFn: () => {
      const key = newKey.trim();
      const name = newName.trim();
      const cost = clampCost(parseInt(newCost, 10));
      if (!FEATURE_KEY_RE.test(key)) {
        throw new Error('Key must match ^[a-z][a-z0-9_]*$ (lowercase snake, start with letter).');
      }
      if (!name) throw new Error('Name is required.');
      if (Number.isNaN(cost)) throw new Error('Credit cost must be a number.');
      return adminApi.createFeature({
        key,
        name,
        credit_cost: cost,
        is_active: newActive,
      });
    },
    onSuccess: () => {
      invalidate();
      setNewKey('');
      setNewName('');
      setNewCost('0');
      setNewActive(true);
    },
  });

  const updateM = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('No row selected.');
      const name = editName.trim();
      const cost = clampCost(parseInt(editCost, 10));
      if (Number.isNaN(cost)) throw new Error('Credit cost must be a number.');
      const body: { name?: string; credit_cost?: number; is_active?: boolean } = {};
      if (name !== editing.name) body.name = name;
      if (cost !== editing.credit_cost) body.credit_cost = cost;
      if (editActive !== editing.is_active) body.is_active = editActive;
      if (Object.keys(body).length === 0) {
        throw new Error('Change at least one of name, credit cost, or active.');
      }
      return adminApi.updateFeature(editing.id, body);
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const rows = listQ.data?.data ?? [];

  return (
    <div>
      <SectionHeader title="Features & pricing" subtitle="GET/POST/PATCH /api/admin/features · no delete" />

      <div style={{ marginBottom: 16 }}>
        <Notice type="info">
          Rows define credit costs in the database. Charging on HTTP routes still requires the feature <strong>key</strong> in
          billing config / middleware (e.g. Laravel <code style={{ fontSize: 11 }}>config/billing.php</code>).
        </Notice>
      </div>

      {listQ.isError && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>
          {(listQ.error as Error).message}
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <CardHeader title="Create feature" subtitle="POST — key is immutable after create" />
        <CardBody>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>key</div>
              <FilterInput placeholder="my_feature" value={newKey} onChange={(e) => setNewKey(e.target.value)} style={{ width: 180 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>name</div>
              <FilterInput placeholder="Display name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: 200 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>credit_cost</div>
              <FilterInput value={newCost} onChange={(e) => setNewCost(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{ width: 100 }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={newActive} onChange={(e) => setNewActive(e.target.checked)} />
              active
            </label>
            <Button
              variant="primary"
              size="sm"
              disabled={createM.isPending}
              onClick={() => createM.mutate()}
            >
              Create
            </Button>
          </div>
          {createM.isError && (
            <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 10 }}>{(createM.error as Error).message}</div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="All features" subtitle="Ordered by key" />
        <Table
          cols={['ID', 'Key', 'Name', 'Credits', 'Active', 'Updated', '']}
          rows={rows}
          renderRow={(f) => (
            <>
              <Td mono>{f.id}</Td>
              <Td mono>{f.key}</Td>
              <Td>{f.name}</Td>
              <Td mono>{f.credit_cost}</Td>
              <Td>
                <Badge color={f.is_active ? 'green' : 'gray'}>{f.is_active ? 'yes' : 'no'}</Badge>
              </Td>
              <Td mono>{f.updated_at ? new Date(f.updated_at).toLocaleString() : '—'}</Td>
              <Td>
                <Button size="sm" onClick={() => setEditing(f)} disabled={updateM.isPending}>
                  Edit
                </Button>
              </Td>
            </>
          )}
        />
        {listQ.isLoading && (
          <div style={{ padding: 16, color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
        )}
      </Card>

      {editing && (
        <Card style={{ marginTop: 16 }}>
          <CardHeader title={`Edit feature #${editing.id}`} subtitle={`key: ${editing.key} (immutable)`} />
          <CardBody>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>name</div>
                <FilterInput value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: 220 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>credit_cost</div>
                <FilterInput value={editCost} onChange={(e) => setEditCost(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{ width: 100 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                active
              </label>
              <Button variant="primary" size="sm" disabled={updateM.isPending} onClick={() => updateM.mutate()}>
                Save
              </Button>
              <Button size="sm" disabled={updateM.isPending} onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
            {updateM.isError && (
              <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 10 }}>{(updateM.error as Error).message}</div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default Features;
