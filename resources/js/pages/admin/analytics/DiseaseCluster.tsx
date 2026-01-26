import AppLayout from "@/layouts/app-layout";
import { Card } from "@/components/ui/card";

export default function DiseaseClusters({ clusters }: any) {
  return (
    <AppLayout title="Disease Clusters">
      <div className="p-6 space-y-6">

        <h1 className="text-2xl font-bold">Disease Pattern Clusters</h1>

        {clusters.map((cluster: any) => (
          <Card key={cluster.cluster} className="p-5 space-y-3">
            <h2 className="text-lg font-semibold">
              Cluster {cluster.cluster + 1}
            </h2>

            <p className="text-sm text-muted-foreground">
              Total consultations: {cluster.total_consultations}
            </p>

            <div>
              <p className="font-medium mb-2">Most common diseases:</p>
              <ul className="list-disc ml-6 space-y-1">
                {Object.entries(cluster.top_diseases).map(
                  ([name, count]: any) => (
                    <li key={name}>
                      {name} <span className="text-muted-foreground">({count})</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </Card>
        ))}

      </div>
    </AppLayout>
  );
}
