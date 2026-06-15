import { Users } from "lucide-react";

/** Desktop right-pane prompt when no client is selected. (On mobile this is
 *  hidden behind the directory, which is the home screen.) */
export default function ClientsIndexPage() {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <Users className="size-10 opacity-40" />
      <div>
        <p className="text-foreground font-medium">Select a client</p>
        <p className="text-sm">
          Pick someone from the directory to see their context and take action.
        </p>
      </div>
    </div>
  );
}
