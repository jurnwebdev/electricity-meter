"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAuthUser } from "@/lib/firebase/auth";
import { useEvents, deleteEvent } from "@/lib/firebase/events";
import { useMeterSetup } from "@/lib/firebase/settings";
import { EventTable } from "@/components/event-table";
import { SettingsForm } from "@/components/settings-form";
import { LogPhysicalMeter } from "@/components/log-physical-meter";
import { formatInteger } from "@/lib/format";

export default function SettingsPage() {
  const { user } = useAuthUser();
  const uid = user?.uid ?? null;
  const { events } = useEvents(uid);
  const { meterSetup } = useMeterSetup(uid);

  async function handleDelete(id: string) {
    if (!uid || !id) {
      return;
    }
    try {
      await deleteEvent(uid, id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Meter setup, reminders, and event log.
        </p>
      </div>

      {meterSetup && uid ? (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Configuration
            </h2>
            <SettingsForm uid={uid} meterSetup={meterSetup} events={events} />
          </section>
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Drift check
            </h2>
            <LogPhysicalMeter uid={uid} meterSetup={meterSetup} events={events} />
          </section>
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="py-8 text-sm text-muted-foreground">
            Finish onboarding to access meter settings.
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Event log
          </h2>
          <span className="text-xs text-muted-foreground">
            {formatInteger(events.length)} event{events.length === 1 ? "" : "s"}
          </span>
        </div>
        <EventTable events={events} onDelete={handleDelete} showActions />
      </section>
    </div>
  );
}