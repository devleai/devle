import { Button } from "@/components/ui/button";

const Page = () => {
  return (
    <div>
      <h1 className="font-bold text-rose-500">Welcome to the Devle App</h1>
      <p>This is a simple page component.</p>
      <Button variant="destructive">
        click me
      </Button>
    </div>
  );
}

export default Page;