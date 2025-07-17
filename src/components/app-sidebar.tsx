import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar";

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <h1 className="text-2xl">Magma</h1>
        </SidebarHeader>
        <SidebarFooter>
          <p>Footer</p>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
