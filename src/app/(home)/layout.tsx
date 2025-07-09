import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
<main className="flex flex-col min-h-screen relative overflow-hidden">
  {/* container with overflow-hidden to stop side shadows */}
  <div className="absolute inset-0 -z-10 overflow-hidden">
    {/* background gradient with blur */}
    <div className="w-full h-full
      bg-[linear-gradient(to_bottom,white_30%,#9333ea_60%,#ec4899_100%)]
      dark:bg-[linear-gradient(to_bottom,#0f0f0f_30%,#9333ea_60%,#ec4899_100%)]
      blur-2xl opacity-90
    "/>

    {/* stars layer */}
    <div className="absolute inset-0 
      bg-[radial-gradient(white_0.5px,transparent_0.5px)] 
      [background-size:20px_20px] 
      opacity-20 pointer-events-none"
    />

    {/* subtle grain layer */}
    <div className="absolute inset-0 
      bg-[radial-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] 
      [background-size:4px_4px]
      opacity-10 pointer-events-none"
    />
  </div>

  <Navbar />
  <div className="flex-1 flex flex-col px-4 pb-4">
    {children}
  </div>
</main>


  );
};

export default Layout;
