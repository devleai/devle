import { CommunityProjects } from "@/modules/home/ui/components/CommunityProjects";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";
import Image from "next/image";

const Page = () => {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh" }}>
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundImage: "url('/landscape.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      />
      {/* Content */}
      <div
        className="flex flex-col max-w-5xl mx-auto w-full"
        style={{ position: "relative", zIndex: 2 }}
      >
        <section className="space-y-6 py-[16vh] 2xl:py-48">
          <div className="flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="Devle"
              width={50}
              height={50}
              className="hidden md:block"
            />
          </div>
          <h1 className="text-2xl text-5xl font-bold text-center text-white">
            Build something with Devle
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center text-white">
            Create apps and websites by chatting with AI
          </p>

          <div className="max-w-3xl mx-auto w-full">
            <ProjectForm />
          </div>
        </section>
        <ProjectsList />
        <CommunityProjects />
      </div>
    </div>
  );
};

export default Page;