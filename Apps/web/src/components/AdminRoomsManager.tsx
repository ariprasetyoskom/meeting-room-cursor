"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch, type Room } from "@/lib/client-api";

type AdminRoom = Room & { isActive?: boolean };

type FormState = {
  code: string;
  name: string;
  floor: string;
  capacity: string;
  amenities: string;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  floor: "",
  capacity: "4",
  amenities: "",
};

export function AdminRoomsManager() {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ rooms: AdminRoom[] }>("/api/v1/admin/rooms");
      setRooms(res.rooms);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat ruang.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setModal("create");
  }

  function openEdit(room: AdminRoom) {
    setForm({
      code: room.code,
      name: room.name,
      floor: room.floor ?? "",
      capacity: String(room.capacity),
      amenities: room.amenities?.join(", ") ?? "",
    });
    setEditId(room.id);
    setModal("edit");
  }

  function parseAmenities(raw: string) {
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      code: form.code,
      name: form.name,
      floor: form.floor || undefined,
      capacity: Number(form.capacity),
      amenities: parseAmenities(form.amenities),
    };
    try {
      if (modal === "create") {
        await apiFetch("/api/v1/admin/rooms", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else if (editId) {
        await apiFetch(`/api/v1/admin/rooms/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Simpan gagal.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(room: AdminRoom) {
    try {
      await apiFetch(`/api/v1/admin/rooms/${room.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !room.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update status gagal.");
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Master ruang</h1>
          <p className="text-muted">CRUD ruang meeting (F-08).</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Tambah ruang
        </button>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading && <p className="text-muted">Memuat…</p>}

      {!loading && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Lantai</th>
                <th>Kapasitas</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.code}</td>
                  <td>{room.name}</td>
                  <td>{room.floor ?? "—"}</td>
                  <td>{room.capacity}</td>
                  <td>
                    <span
                      className={`badge ${room.isActive !== false ? "badge-success" : "badge-muted"}`}
                    >
                      {room.isActive !== false ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(room)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleActive(room)}
                    >
                      {room.isActive !== false ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div
            className="modal modal-wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="room-admin-title"
          >
            <h2 id="room-admin-title">
              {modal === "create" ? "Tambah ruang" : "Edit ruang"}
            </h2>
            <form onSubmit={handleSubmit} className="form-stack">
              <label>
                Kode *
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  disabled={modal === "edit"}
                />
              </label>
              <label>
                Nama *
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <div className="form-row">
                <label>
                  Lantai
                  <input
                    className="input"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  />
                </label>
                <label>
                  Kapasitas *
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <label>
                Fasilitas (pisahkan koma)
                <input
                  className="input"
                  value={form.amenities}
                  onChange={(e) =>
                    setForm({ ...form, amenities: e.target.value })
                  }
                  placeholder="tv, vc, whiteboard"
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModal(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
