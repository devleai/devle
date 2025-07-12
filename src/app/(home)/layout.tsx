import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <main className="flex flex-col min-h-screen max-h-screen relative">
      <Navbar />
      <div className="absolute inset-0 -z-10 h-full w-full bg-background" />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </main>
  );
};

export default Layout;