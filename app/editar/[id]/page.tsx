import EditarClient from "./EditarClient";

export const dynamic = "force-dynamic";

export default function EditarPage({ params }: { params: Promise<{ id: string }> }) {
    return <EditarClient params={params} />;
}
