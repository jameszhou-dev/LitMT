import { redirect } from "next/navigation";
import Landing from "./Landing";
import AddBook from "./_components/AddBook";
import ManageBooks from "./_components/ManageBooks";

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const seg = slug?.[0] || "";

  // Root path: show landing page
  if (!seg) {
    return <Landing />;
  }

  // Legacy top-level route: redirect /addbook -> /managebooks/addbook
  if (seg === "addbook") {
    redirect("/managebooks/addbook");
  }

  // Nested route: /managebooks/addbook
  if (seg === "managebooks" && slug?.[1] === "addbook") {
    return <AddBook />;
  }
  if (seg === "managebooks") {
    return <ManageBooks />;
  }

  // Unknown path: keep URLs clean
  redirect("/");
}
