import { ClientDetailView } from "@/components/dashboard/ClientDetailView";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return <ClientDetailView clientId={clientId} />;
}
