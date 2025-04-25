import { redirect } from "next/navigation";

export default function IDEPage() {
	// Redirect to a default file or view
	redirect("/editor/home");
}
