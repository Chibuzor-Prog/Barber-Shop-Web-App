
//  "Est. Wait"       → "Service Duration"      = service.expectedDuration  (per row)
//  "Estimated Wait"  → "Total Estimated Wait"  = sum over all user services of
//                        (people waiting in that service × service.expectedDuration)
//                        where "people waiting" = all entries with status != served
//                        that joined BEFORE the current user's check-in time
//  "Based on service duration" → "Check-in Time: HH:MM" = time of the first service joined

import React, { useMemo } from "react";
import { useQueue } from "../../context/QueueContext";
import { useAuth } from "../../context/AuthContext";
import { useServices } from "../../hooks/useServices";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

/** Format an ISO timestamp as HH:MM (local time). */
function fmt(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return "—"; }
}

const Dashboard: React.FC = () => {
  const { queue }    = useQueue();
  const { user }     = useAuth();
  const { services } = useServices();

  const userData = useMemo(() => {
    if (!user) return {
      totalQueues: 0, totalEstimatedWait: 0,
      checkInTime: undefined as string | undefined,
      activeServices: [] as {
        serviceId: string;
        serviceName: string;
        position: number;
        serviceDuration: number;   // expectedDuration of the service
        joinedAt: string;
      }[],
    };

    const activeServices: {
      serviceId: string;
      serviceName: string;
      position: number;
      serviceDuration: number;
      joinedAt: string;
    }[] = [];

    services.forEach(service => {
      // All non-cancelled, non-served entries for this service, sorted by join time
      const waitingInService = queue
        .filter(q => q.serviceId === service.id && q.status !== "cancelled")
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      // Find current user's entry in this service
      const myEntryIndex = waitingInService.findIndex(
        q => String(q.userId) === String(user.id)
      );

      if (myEntryIndex !== -1) {
        const myEntry = waitingInService[myEntryIndex];
        activeServices.push({
          serviceId:       service.id,
          serviceName:     service.name,
          position:        myEntryIndex + 1,
          serviceDuration: service.expectedDuration,
          joinedAt:        myEntry.joinedAt,
        });
      }
    });

    // Check-in Time = time of the FIRST service the user joined
    const checkInTime = activeServices.length > 0
      ? activeServices.reduce((earliest, s) =>
          new Date(s.joinedAt).getTime() < new Date(earliest.joinedAt).getTime()
            ? s : earliest
        ).joinedAt
      : undefined;

    // Total Estimated Wait = sum over each of the user's services of:
    //   (number of people who joined BEFORE the user in that service) × service.expectedDuration
    let totalEstimatedWait = 0;
    activeServices.forEach(myService => {
      const svcQueue = queue
        .filter(q => q.serviceId === myService.serviceId && q.status !== "cancelled")
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      // People ahead = those who joined strictly before the user
      const myJoinTime = new Date(myService.joinedAt).getTime();
      const peopleAhead = svcQueue.filter(
        q => new Date(q.joinedAt).getTime() < myJoinTime
      ).length;

      totalEstimatedWait += peopleAhead * myService.serviceDuration;
    });

    return {
      totalQueues:        activeServices.length,
      totalEstimatedWait,
      checkInTime,
      activeServices,
    };
  }, [queue, user, services]);

  return (
    <UserPageLayout title="User Dashboard">
      <div className="p-6 space-y-6">

        {/* ── Top Stats ─────────────────────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="Queues Joined"
            value={userData.totalQueues}
            sub="Active queues"
          />
          <StatCard
            label="Total Estimated Wait"
            value={`${userData.totalEstimatedWait} min`}
            sub="People ahead × service duration"
          />
          <StatCard
            label="Services Available"
            value={services.length}
            sub="All services"
          />
        </div>

        {/* ── Service Breakdown Table ────────────────────────────────────── */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Queue Status</h2>
            {/* Check-in Time: time of the first service selected */}
            <p className="text-sm text-gray-500">
              Check-in Time: {userData.checkInTime ? fmt(userData.checkInTime) : "—"}
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Service</span>
              <span className="text-center">Position</span>
              {/* "Est. Wait" renamed to "Service Duration" */}
              <span className="text-right">Service Duration</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 bg-white">
              {userData.activeServices.map(svc => (
                <div
                  key={svc.serviceId}
                  className="grid grid-cols-3 items-center px-4 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{svc.serviceName}</p>
                    <p className="text-xs text-gray-400">
                      Checked in: {fmt(svc.joinedAt)}
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                      #{svc.position}
                    </span>
                  </div>

                  {/* Service Duration = expectedDuration of the service */}
                  <p className="text-right text-sm text-gray-700 font-medium">
                    {svc.serviceDuration} min
                  </p>
                </div>
              ))}

              {userData.activeServices.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">
                  You are not in any queues.
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default Dashboard;
