import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  Plus,
  Car,
  Wrench,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
} from "lucide-react";
import { CUSTOMER_TYPE } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCustomer,
  useCustomerVehicles,
  useCustomerServices,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/features/customers/hooks/useCustomers";
import { serviceStatusVariant } from "@/lib/enums";
import { PageSpinner } from "@/components/PageSpinner";

export default function CustomerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id!);
  const { data: vehicles = [] } = useCustomerVehicles(id!);
  const [servicesPage, setServicesPage] = useState(0);
  const { data: servicesResult } = useCustomerServices(id!, servicesPage);
  const services = servicesResult?.data ?? [];
  const servicesTotalPages = servicesResult?.totalPages ?? 0;
  const updateMutation = useUpdateCustomer(id!);
  const deleteCustomerMutation = useDeleteCustomer();

  const [editingNotes, setEditingNotes] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  if (isLoading || !customer) {
    return <PageSpinner />;
  }

  const startEditNotes = () => {
    setNotesValue(customer.notes ?? "");
    setEditingNotes(true);
  };

  const saveNotes = () => {
    updateMutation.mutate({ notes: notesValue || null });
    setEditingNotes(false);
  };

  return (
    <div className="space-y-6">
      {/* Back + Edit row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("common.back")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link to={`/customers/${id}/edit`} />}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            {t("common.edit")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
            {t("common.delete")}
          </Button>
        </div>
      </div>

      {/* Customer info + Notes side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Contact info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{customer.full_name}</h2>
              <Badge variant="secondary" className="shrink-0">
                {customer.customer_type === CUSTOMER_TYPE.COMPANY ? (
                  <Building2 className="mr-1 h-3 w-3" />
                ) : (
                  <User className="mr-1 h-3 w-3" />
                )}
                {t(
                  `customers.${customer.customer_type === CUSTOMER_TYPE.COMPANY ? "company" : "person"}`,
                )}
              </Badge>
            </div>
            <div className="mt-3 space-y-2">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </a>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{t("customers.notes")}</CardTitle>
            {!editingNotes && (
              <Button variant="ghost" size="icon-sm" onClick={startEditNotes}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveNotes}>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    {t("common.save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNotes(false)}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {customer.notes || t("customers.noNotes")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Car className="h-5 w-5" />
            {t("customers.vehicles")}
          </h3>
          <Button
            size="sm"
            render={<Link to={`/vehicles/new?customer=${id}`} />}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("customers.addVehicle")}
          </Button>
        </div>
        {vehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("customers.noVehicles")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => {
              const lastService = v.last_service as {
                service_date: string;
              } | null;
              return (
                <Link key={v.id} to={`/vehicles/${v.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <p className="font-mono font-bold text-base">
                        {v.plate_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {v.brand} {v.model}
                        {v.engine_capacity != null
                          ? ` ${v.engine_capacity.toFixed(1)}L`
                          : ""}
                        {v.engine_designation
                          ? ` (${v.engine_designation})`
                          : ""}
                        {v.year ? ` — ${v.year}` : ""}
                      </p>
                      <Separator className="my-2" />
                      <p className="text-xs text-muted-foreground">
                        {t("customers.lastService")}:{" "}
                        {lastService
                          ? new Date(
                              lastService.service_date,
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Service History */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Wrench className="h-5 w-5" />
          {t("customers.serviceHistory")}
        </h3>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("customers.noServices")}
          </p>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("customers.date")}</TableHead>
                    <TableHead>{t("customers.vehicle")}</TableHead>
                    <TableHead>{t("customers.description")}</TableHead>
                    <TableHead>{t("customers.status")}</TableHead>
                    <TableHead className="text-right">
                      {t("customers.total")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("customers.balance")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => {
                    const vehicle = s.vehicles as {
                      plate_number: string;
                      brand: string;
                      model: string;
                    } | null;
                    return (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/services/${s.id}`)}
                      >
                        <TableCell>
                          {new Date(s.service_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          {vehicle?.plate_number ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {s.notes ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={serviceStatusVariant(s.status)}>
                            {t(`customers.statuses.${s.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.service_total != null
                            ? `${s.service_total.toLocaleString()} ден`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.balance_due != null && s.balance_due > 0 ? (
                            <span className="text-destructive">{`${s.balance_due.toLocaleString()} ден`}</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {servicesTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t("common.page", {
                    current: servicesPage + 1,
                    total: servicesTotalPages,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={servicesPage === 0}
                    onClick={() => setServicesPage((p) => p - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t("common.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={servicesPage >= servicesTotalPages - 1}
                    onClick={() => setServicesPage((p) => p + 1)}
                  >
                    {t("common.next")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.delete")}</DialogTitle>
            <DialogDescription>
              {t("customers.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCustomerMutation.mutate(id!)}
              loading={deleteCustomerMutation.isPending}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
