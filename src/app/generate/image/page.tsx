import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import GenerateStudio from "@/components/GenerateStudio";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?returnUrl=/generate/image");
  return <GenerateStudio type="image" />;
}
