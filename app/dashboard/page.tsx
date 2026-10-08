"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  History,
  Loader2,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";

type VehicleStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "SUSPENDED";

type Vehicle = {
  id: string;
  name: string | null;
  vehicleNumber: string | null;
  phoneNumber: string | null;
  email?: string | null;
  startDate: string | null;
  endDate: string | null;
  status: VehicleStatus;
  renewalCount: number;
  createdAt: string;
  updatedAt: string;
};

type Renewal = {
  id: string;
  vehicleId: string;
  renewalNumber: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

type FormData = {
  name: string;
  vehicleNumber: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
};

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "SUSPENDED";

const emptyForm: FormData = {
  name: "",
  vehicleNumber: "",
  phoneNumber: "",
  startDate: "",
  endDate: "",
};

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: VehicleStatus) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "EXPIRING_SOON":
      return "Expiring Soon";
    case "EXPIRED":
      return "Expired";
    case "SUSPENDED":
      return "Suspended";
    default:
      return status;
  }
}

function getStatusClasses(status: VehicleStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "EXPIRING_SOON":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "EXPIRED":
      return "bg-red-50 text-red-700 border-red-200";
    case "SUSPENDED":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getStatusIcon(status: VehicleStatus) {
  switch (status) {
    case "ACTIVE":
      return <CheckCircle2 size={14} />;
    case "EXPIRING_SOON":
      return <Clock3 size={14} />;
    case "EXPIRED":
      return <XCircle size={14} />;
    case "SUSPENDED":
      return <AlertCircle size={14} />;
    default:
      return <Activity size={14} />;
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] =
    useState(false);
  const [showHistoryModal, setShowHistoryModal] =
    useState(false);

  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [renewalsLoading, setRenewalsLoading] =
    useState(false);

  const [formData, setFormData] =
    useState<FormData>(emptyForm);

  const [renewalStartDate, setRenewalStartDate] =
    useState("");
  const [renewalEndDate, setRenewalEndDate] =
    useState("");

  const [formError, setFormError] = useState("");
  const [historyError, setHistoryError] =
    useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);
  const [vehicleToDelete, setVehicleToDelete] =
    useState<Vehicle | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  async function loadVehicles() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/vehicles?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load passes");
      }

      const data = await response.json();

      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load vehicles error:", error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVehicles();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  async function handleAddPass(e: React.FormEvent) {
    e.preventDefault();

    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Pass holder name is required.");
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          vehicleNumber:
            formData.vehicleNumber.trim() || null,
          phoneNumber:
            formData.phoneNumber.trim() || null,
          startDate:
            formData.startDate || null,
          endDate:
            formData.endDate || null,
        }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add pass"
        );
      }

      setShowAddModal(false);
      setFormData(emptyForm);
      await loadVehicles();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to add pass"
      );
    } finally {
      setActionLoading(false);
    }
  }

  function openRenewalModal(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setRenewalStartDate("");
    setRenewalEndDate("");
    setFormError("");
    setShowRenewalModal(true);
  }

  async function handleAddRenewal(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!selectedVehicle) return;

    setFormError("");

    if (!renewalStartDate || !renewalEndDate) {
      setFormError(
        "Renewal start date and end date are required."
      );
      return;
    }

    if (renewalEndDate < renewalStartDate) {
      setFormError(
        "Renewal end date cannot be before the start date."
      );
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/vehicles/${selectedVehicle.id}/renewal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            startDate: renewalStartDate,
            endDate: renewalEndDate,
          }),
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add renewal"
        );
      }

      setShowRenewalModal(false);
      setSelectedVehicle(null);
      setRenewalStartDate("");
      setRenewalEndDate("");

      await loadVehicles();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to add renewal"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function openRenewalHistory(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setRenewals([]);
    setHistoryError("");
    setShowHistoryModal(true);
    setRenewalsLoading(true);

    try {
      const response = await fetch(
        `/api/vehicles/${vehicle.id}/renewals`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load renewal history"
        );
      }

      setRenewals(Array.isArray(data) ? data : []);
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Failed to load renewal history"
      );
    } finally {
      setRenewalsLoading(false);
    }
  }

  async function handleStatusChange(
    vehicle: Vehicle
  ) {
    const newStatus =
      vehicle.status === "SUSPENDED"
        ? "ACTIVE"
        : "SUSPENDED";

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/vehicles/${vehicle.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to change status"
        );
      }

      await loadVehicles();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to change status"
      );
    } finally {
      setActionLoading(false);
    }
  }

  function confirmDelete(vehicle: Vehicle) {
    setVehicleToDelete(vehicle);
    setShowDeleteConfirm(true);
  }

  async function handleDelete() {
    if (!vehicleToDelete) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/vehicles/${vehicleToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete pass"
        );
      }

      setShowDeleteConfirm(false);
      setVehicleToDelete(null);

      await loadVehicles();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete pass"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/login");
    }
  }

  const stats = useMemo(() => {
    return {
      total: vehicles.length,
      active: vehicles.filter(
        (v) => v.status === "ACTIVE"
      ).length,
      expiring: vehicles.filter(
        (v) => v.status === "EXPIRING_SOON"
      ).length,
      expired: vehicles.filter(
        (v) => v.status === "EXPIRED"
      ).length,
      suspended: vehicles.filter(
        (v) => v.status === "SUSPENDED"
      ).length,
    };
  }, [vehicles]);

  const statusOptions: {
    value: StatusFilter;
    label: string;
  }[] = [
    { value: "ALL", label: "All Status" },
    { value: "ACTIVE", label: "Active" },
    {
      value: "EXPIRING_SOON",
      label: "Expiring Soon",
    },
    { value: "EXPIRED", label: "Expired" },
    { value: "SUSPENDED", label: "Suspended" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                Pass Validity Manager
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Pass & validity administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadVehicles()}
              disabled={loading}
              className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:flex"
            >
              <RefreshCw
                size={15}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:flex"
            >
              <LogOut size={15} />
              Logout
            </button>

            <button
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 sm:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  loadVehicles();
                  setMobileMenuOpen(false);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium"
              >
                <RefreshCw size={15} />
                Refresh
              </button>

              <button
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Page heading */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">
              Administration
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Pass Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage validity, renewals and pass status.
            </p>
          </div>

          <button
            onClick={() => {
              setFormData(emptyForm);
              setFormError("");
              setShowAddModal(true);
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Add Pass
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Total Passes"
            value={stats.total}
            icon={<Users size={18} />}
          />

          <StatCard
            title="Active"
            value={stats.active}
            icon={<CheckCircle2 size={18} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Expiring Soon"
            value={stats.expiring}
            icon={<Clock3 size={18} />}
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Expired"
            value={stats.expired}
            icon={<XCircle size={18} />}
            iconClass="bg-red-50 text-red-600"
          />

          <StatCard
            title="Suspended"
            value={stats.suspended}
            icon={<AlertCircle size={18} />}
            iconClass="bg-slate-100 text-slate-600"
          />
        </div>

        {/* Main card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by name, vehicle number or phone..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as StatusFilter
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:w-48"
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="block divide-y divide-slate-100 md:hidden">
            {loading ? (
              <LoadingState />
            ) : vehicles.length === 0 ? (
              <EmptyState />
            ) : (
              vehicles.map((vehicle) => (
                <MobileVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onRenew={() =>
                    openRenewalModal(vehicle)
                  }
                  onHistory={() =>
                    openRenewalHistory(vehicle)
                  }
                  onStatus={() =>
                    handleStatusChange(vehicle)
                  }
                  onDelete={() =>
                    confirmDelete(vehicle)
                  }
                />
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pass Holder
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle Number
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Valid Until
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Renewals
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16"
                    >
                      <LoadingState />
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16"
                    >
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <VehicleRow
                      key={vehicle.id}
                      vehicle={vehicle}
                      onRenew={() =>
                        openRenewalModal(vehicle)
                      }
                      onHistory={() =>
                        openRenewalHistory(vehicle)
                      }
                      onStatus={() =>
                        handleStatusChange(vehicle)
                      }
                      onDelete={() =>
                        confirmDelete(vehicle)
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && vehicles.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 sm:px-5">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {vehicles.length}
              </span>{" "}
              pass{vehicles.length !== 1 ? "es" : ""}
            </div>
          )}
        </section>
      </main>

      {/* Add Pass Modal */}
      {showAddModal && (
        <Modal
          title="Add New Pass"
          subtitle="Create a new pass validity record."
          onClose={() => {
            if (!actionLoading) {
              setShowAddModal(false);
              setFormError("");
            }
          }}
        >
          <form
            onSubmit={handleAddPass}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Pass Holder Name"
                required
                value={formData.name}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    name: value,
                  })
                }
                placeholder="Enter name"
              />

              <FormField
                label="vehicle Number"
                value={formData.vehicleNumber}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    vehicleNumber: value,
                  })
                }
                placeholder="Enter Vehicle Number"
              />

              <FormField
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    phoneNumber: value,
                  })
                }
                placeholder="Enter phone number"
              />

              <div />

              <DateField
                label="Start Date"
                value={formData.startDate}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    startDate: value,
                  })
                }
              />

              <DateField
                label="Valid Until"
                value={formData.endDate}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    endDate: value,
                  })
                }
              />
            </div>

            {formError && (
              <ErrorMessage message={formError} />
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setShowAddModal(false);
                  setFormError("");
                }}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}
                Add Pass
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renewal Modal */}
      {showRenewalModal && selectedVehicle && (
        <Modal
          title="Add Renewal"
          subtitle={`Renewal #${
            selectedVehicle.renewalCount + 1
          } for ${
            selectedVehicle.name || "this pass"
          }`}
          onClose={() => {
            if (!actionLoading) {
              setShowRenewalModal(false);
              setSelectedVehicle(null);
              setFormError("");
            }
          }}
        >
          <form
            onSubmit={handleAddRenewal}
            className="space-y-5"
          >
            {/* Pass summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedVehicle.name ||
                      "Unnamed pass"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedVehicle.vehicleNumber ||
                      "No vehicle number"}
                  </p>
                </div>

                <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Renewal
                  </p>

                  <p className="text-lg font-bold text-slate-900">
                    #{selectedVehicle.renewalCount + 1}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DateField
                label="Renewal Start Date"
                required
                value={renewalStartDate}
                onChange={setRenewalStartDate}
              />

              <DateField
                label="Renewal End Date"
                required
                value={renewalEndDate}
                onChange={setRenewalEndDate}
              />
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-700">
              Adding this renewal will make it the current
              validity period, reactivate the pass, and
              reset the expiry reminder cycle.
            </div>

            {formError && (
              <ErrorMessage message={formError} />
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setShowRenewalModal(false);
                  setSelectedVehicle(null);
                  setFormError("");
                }}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={actionLoading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                <RefreshCw size={15} />
                Add Renewal
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renewal History Modal */}
      {showHistoryModal && selectedVehicle && (
        <Modal
          title="Renewal History"
          subtitle={`Complete renewal history for ${
            selectedVehicle.name ||
            "this pass"
          }`}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedVehicle(null);
            setRenewals([]);
          }}
          wide
        >
          <div>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <InfoBox
                label="Pass Holder"
                value={
                  selectedVehicle.name || "—"
                }
              />

              <InfoBox
                label="Vehicle Number"
                value={
                  selectedVehicle.vehicleNumber ||
                  "—"
                }
              />

              <InfoBox
                label="Total Renewals"
                value={String(
                  selectedVehicle.renewalCount
                )}
              />
            </div>

            {renewalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={24}
                  className="animate-spin text-slate-500"
                />
              </div>
            ) : historyError ? (
              <ErrorMessage message={historyError} />
            ) : renewals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                <History
                  size={28}
                  className="mx-auto mb-3 text-slate-300"
                />

                <p className="text-sm font-medium text-slate-700">
                  No renewals yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  This pass is still using its
                  original validity.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Renewal
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Start Date
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          End Date
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Added On
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {renewals.map((renewal) => (
                        <tr
                          key={renewal.id}
                          className="bg-white"
                        >
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                              <RefreshCw
                                size={13}
                              />
                              Renewal #
                              {renewal.renewalNumber}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-700">
                            {formatDate(
                              renewal.startDate
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm font-medium text-slate-900">
                            {formatDate(
                              renewal.endDate
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-500">
                            {formatDate(
                              renewal.createdAt
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedVehicle(null);
                  setRenewals([]);
                }}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && vehicleToDelete && (
        <Modal
          title="Delete Pass"
          subtitle="This action cannot be undone."
          onClose={() => {
            if (!actionLoading) {
              setShowDeleteConfirm(false);
              setVehicleToDelete(null);
            }
          }}
        >
          <div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <Trash2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Delete{" "}
                    {vehicleToDelete.name ||
                      "this pass"}
                    ?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-700">
                    The pass and its complete renewal
                    history will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                disabled={actionLoading}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setVehicleToDelete(null);
                }}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                disabled={actionLoading}
                onClick={handleDelete}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoading && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}
                <Trash2 size={15} />
                Delete Pass
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  iconClass = "bg-slate-100 text-slate-600",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function VehicleRow({
  vehicle,
  onRenew,
  onHistory,
  onStatus,
  onDelete,
}: {
  vehicle: Vehicle;
  onRenew: () => void;
  onHistory: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="group transition hover:bg-slate-50/70">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <UserRound size={17} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {vehicle.name || "Unnamed"}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Added {formatDate(vehicle.createdAt)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm font-medium text-slate-700">
          {vehicle.vehicleNumber || "—"}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm text-slate-600">
          {vehicle.phoneNumber || "—"}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <CalendarDays
            size={15}
            className="text-slate-400"
          />
          {formatDate(vehicle.endDate)}
        </div>
      </td>

      <td className="px-5 py-4 text-center">
        <button
          onClick={onHistory}
          className="inline-flex min-w-9 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          title="View renewal history"
        >
          <History size={14} />
          {vehicle.renewalCount}
        </button>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            vehicle.status
          )}`}
        >
          {getStatusIcon(vehicle.status)}
          {getStatusLabel(vehicle.status)}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={onRenew}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            title="Add renewal"
          >
            <RefreshCw size={13} />
            Renew
          </button>

          <button
            onClick={onStatus}
            className={`inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold transition ${
              vehicle.status === "SUSPENDED"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
            title={
              vehicle.status === "SUSPENDED"
                ? "Activate"
                : "Suspend"
            }
          >
            {vehicle.status === "SUSPENDED"
              ? "Activate"
              : "Suspend"}
          </button>

          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileVehicleCard({
  vehicle,
  onRenew,
  onHistory,
  onStatus,
  onDelete,
}: {
  vehicle: Vehicle;
  onRenew: () => void;
  onHistory: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <UserRound size={18} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {vehicle.name || "Unnamed"}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {vehicle.vehicleNumber || "No vehicle number"}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusClasses(
            vehicle.status
          )}`}
        >
          {getStatusIcon(vehicle.status)}
          {getStatusLabel(vehicle.status)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Phone
          </p>
          <p className="mt-1 text-xs font-medium text-slate-700">
            {vehicle.phoneNumber || "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Valid Until
          </p>
          <p className="mt-1 text-xs font-medium text-slate-700">
            {formatDate(vehicle.endDate)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Renewals
          </p>
          <button
            onClick={onHistory}
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-700"
          >
            <History size={13} />
            {vehicle.renewalCount}
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          onClick={onRenew}
          className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
        >
          <RefreshCw size={13} />
          Renew
        </button>

        <button
          onClick={onStatus}
          className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold ${
            vehicle.status === "SUSPENDED"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {vehicle.status === "SUSPENDED"
            ? "Activate"
            : "Suspend"}
        </button>

        <button
          onClick={onDelete}
          className="flex h-9 items-center justify-center gap-1 rounded-lg bg-red-50 text-xs font-semibold text-red-600"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type="date"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-base font-bold text-slate-950 sm:text-lg">
              {title}
            </h3>

            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle
        size={17}
        className="mt-0.5 shrink-0"
      />
      <span>{message}</span>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Loader2
        size={25}
        className="animate-spin text-slate-400"
      />

      <p className="mt-3 text-sm text-slate-500">
        Loading pass records...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <FileText size={22} />
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-700">
        No pass records found
      </p>

      <p className="mt-1 max-w-sm text-xs text-slate-400">
        Try changing your search or status filter,
        or add a new pass.
      </p>
    </div>
  );
}