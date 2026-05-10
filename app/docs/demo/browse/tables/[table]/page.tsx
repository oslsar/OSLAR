import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;

  redirect(`/demo/browse/tables/${table}/columns`);
}
