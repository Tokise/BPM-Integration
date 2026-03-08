import { Map } from "lucide-react";

export default function LogisticDashboard() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="flex flex-col items-center gap-6 text-slate-400 p-8 text-center max-w-sm">
        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
          <Map className="h-8 w-8 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-700 tracking-tight">
            Logistics Workspace
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Please select a module from the
            sidebar menu to continue.
          </p>
        </div>
      </div>
    </div>
  );
}
