import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import GenerateStudio from "@/components/GenerateStudio";
import { getBalance } from "@/lib/credits";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?returnUrl=/generate/image");
  const balance = await getBalance(userId);
  return <GenerateStudio type="image" balance={balance} />;
}
