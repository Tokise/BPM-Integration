"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProcurementPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900">Procurement</h2>
            <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50">
                <CardHeader>
                    <CardTitle>Supplier Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Manage supplier orders and purchase requisitions.</p>
                </CardContent>
            </Card>
        </div>
    );
}
