import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";

export default function TopBar() {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background px-4 py-3">
      <div className="flex-1" />
      <GlobalSearch />
      <div className="flex flex-1 justify-end">
        <NotificationBell />
      </div>
    </div>
  );
}
