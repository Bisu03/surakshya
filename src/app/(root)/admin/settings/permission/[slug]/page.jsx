"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Heading from "@/components/Heading";
import Loading from "@/components/Loading";
import {
  normalizePermissions,
  PERMISSION_RESOURCES,
} from "@/lib/permissions";
import { isHiddenResource } from "@/lib/features";

export default function PermissionPage() {
  const { slug } = useParams();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`/api/v1/admin/user/${slug}`)
      .then(({ data }) => {
        setUser(data.data);
        setPermissions(
          normalizePermissions(data.data.permissions, data.data.pageAccess)
        );
      })
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to load user")
      );
  }, [slug]);

  if (!user) return <Loading />;

  const checked = (resource, action) =>
    permissions.some(
      (permission) =>
        permission.resource === resource && permission.actions.includes(action)
    );

  const toggle = (resource, action) => {
    setPermissions((current) => {
      const existing = current.find((item) => item.resource === resource);
      if (!existing) return [...current, { resource, actions: [action] }];
      const actions = existing.actions.includes(action)
        ? existing.actions.filter((item) => item !== action)
        : [...existing.actions, action];
      return actions.length
        ? current.map((item) =>
            item.resource === resource ? { ...item, actions } : item
          )
        : current.filter((item) => item.resource !== resource);
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`/api/v1/admin/user/${slug}`, {
        permissions,
      });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full p-4">
      <Heading heading={`Permissions: ${user.username}`}>
        <Link href="/admin/settings/users" className="btn btn-ghost">Back</Link>
      </Heading>
      {user.role === "Admin" && (
        <div className="alert alert-info my-4">
          Administrators always have every permission.
        </div>
      )}
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Section</th>
              <th>Allowed actions</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_RESOURCES.filter((resource) => !isHiddenResource(resource.key)).map((resource) => (
              <tr key={resource.key}>
                <td className="font-medium">{resource.label}</td>
                <td>
                  <div className="flex flex-wrap gap-4">
                    {resource.actions.map((action) => (
                      <label key={action} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={user.role === "Admin" || checked(resource.key, action)}
                          disabled={user.role === "Admin"}
                          onChange={() => toggle(resource.key, action)}
                        />
                        <span className="capitalize">
                          {action.replaceAll("_", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {user.role !== "Admin" && (
        <div className="mt-4 flex justify-end">
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save permissions"}
          </button>
        </div>
      )}
    </div>
  );
}
