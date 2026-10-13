import { AgentProcessPageClient } from "@/components/agent-process/agent-process-page-client";

type AgentProcessPageProps = {
  params: Promise<{ ticketId: string }>;
};

export default async function AgentProcessPage({
  params,
}: AgentProcessPageProps) {
  const { ticketId } = await params;
  return <AgentProcessPageClient ticketId={decodeURIComponent(ticketId)} />;
}
