"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { FaEdit, FaKey, FaTrash, FaUserShield } from "react-icons/fa";
import Heading from "@/components/Heading";
import FixedLayout from "@/components/ui/FixedLayout";
import Loading from "@/components/Loading";
import {
  hasPermission,
  normalizePermissions,
  PERMISSION_RESOURCES,
} from "@/lib/permissions";
import { isHiddenResource } from "@/lib/features";

const emptyForm = {
  username: "",
  email: "",
  role: "Staff",
  isActive: true,
  permissions: [],
};

function PermissionEditor({ permissions, onChange, disabled }) {
  const toggle = (resource, action) => {
    const existing = permissions.find((item) => item.resource === resource);
    if (!existing) {
      onChange([...permissions, { resource, actions: [action] }]);
      return;
    }
    const actions = existing.actions.includes(action)
      ? existing.actions.filter((item) => item !== action)
      : [...existing.actions, action];
    onChange(
      actions.length
        ? permissions.map((item) =>
            item.resource === resource ? { ...item, actions } : item
          )
        : permissions.filter((item) => item.resource !== resource)
    );
  };

  return (
    <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border p-3">
      {PERMISSION_RESOURCES.filter((resource) => !isHiddenResource(resource.key)).map((resource) => (
        <div key={resource.key}>
          <p className="text-sm font-semibold">{resource.label}</p>
          <div className="mt-1 flex flex-wrap gap-3">
            {resource.actions.map((action) => (
              <label key={action} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  disabled={disabled}
                  checked={
                    disabled ||
                    permissions.some(
                      (item) =>
                        item.resource === resource.key &&
                        item.actions.includes(action)
                    )
                  }
                  onChange={() => toggle(resource.key, action)}
                />
                <span className="capitalize">{action.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const response = await axios.get("/api/v1/admin/user");
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (user) => {
    setForm({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: normalizePermissions(user.permissions, user.pageAccess),
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = form._id
        ? await axios.put("/api/v1/admin/user", form)
        : await axios.post("/api/v1/admin/user", form);
      toast[response.data.emailSent === false ? "error" : "success"](
        response.data.message
      );
      setOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save user");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (user) => {
    if (!window.confirm(`Send a new temporary password to ${user.email}?`)) return;
    try {
      const response = await axios.put("/api/v1/admin/user", {
        _id: user._id,
        resetPassword: true,
      });
      toast[response.data.emailSent === false ? "error" : "success"](
        response.data.message
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
    }
  };

  const toggleActive = async (user) => {
    try {
      await axios.put("/api/v1/admin/user", {
        _id: user._id,
        isActive: !user.isActive,
      });
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update user");
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.username}? This cannot be undone.`)) return;
    try {
      const response = await axios.delete(`/api/v1/admin/user?id=${user._id}`);
      toast.success(response.data.message);
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete user");
    }
  };

  if (!users) return <Loading />;

  return (
    <div className="w-full p-4">
      <Heading heading="Users">
        {hasPermission(session?.user, "users", "create") && (
          <button onClick={openCreate} className="btn btn-primary">Add user</button>
        )}
      </Heading>

      <FixedLayout isOpen={open} onClose={() => setOpen(false)}>
        <div className="w-full max-w-4xl space-y-4 p-5">
          <h2 className="text-xl font-semibold">
            {form._id ? "Edit user" : "Add user"}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className="input input-bordered"
              placeholder="Username"
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
            />
            <input
              className="input input-bordered"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <select
              className="select select-bordered"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
            >
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
          </div>
          <PermissionEditor
            permissions={form.permissions}
            disabled={form.role === "Admin"}
            onChange={(permissions) =>
              setForm((current) => ({ ...current, permissions }))
            }
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </FixedLayout>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    onClick={() => toggleActive(user)}
                    disabled={!hasPermission(session?.user, "users", "edit")}
                    className={`badge ${user.isActive ? "badge-success" : "badge-error"}`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <div className="flex gap-2">
                    {hasPermission(session?.user, "users", "edit") && (
                      <>
                        <button onClick={() => openEdit(user)} className="btn btn-ghost btn-sm" title="Edit">
                          <FaEdit />
                        </button>
                        <button onClick={() => resetPassword(user)} className="btn btn-ghost btn-sm" title="Reset password">
                          <FaKey />
                        </button>
                      </>
                    )}
                    {hasPermission(session?.user, "users", "manage_permissions") && (
                      <Link href={`/admin/settings/permission/${user._id}`} className="btn btn-ghost btn-sm" title="Permissions">
                        <FaUserShield />
                      </Link>
                    )}
                    {hasPermission(session?.user, "users", "delete") &&
                      user._id !== session?.user?.id && (
                        <button onClick={() => remove(user)} className="btn btn-ghost btn-sm text-error" title="Delete">
                          <FaTrash />
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
