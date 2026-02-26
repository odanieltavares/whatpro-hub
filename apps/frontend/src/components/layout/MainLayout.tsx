import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import AppSidebar from "@/components/layout/AppSidebar";

export default function MainLayout() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get("embed") === "1";

  if (isEmbed) {
    return (
      <main className="w-full h-screen">
        <div className="h-full">
          <Outlet />
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-border" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  {location.pathname.split('/').filter(Boolean).map((path, index, array) => (
                    <div key={path} className="flex items-center gap-2">
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {index === array.length - 1 ? (
                          <BreadcrumbPage className="capitalize">{path}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={`/${array.slice(0, index + 1).join('/')}`} className="capitalize">
                            {path}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <ModeToggle />
          </div>
          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
