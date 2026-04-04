import { NavLink } from '@/components/NavLink';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, FileText, CreditCard, AlertTriangle, ShieldAlert, BarChart3, Users, MessageSquare, Wrench } from 'lucide-react';
import logoSonam from '@/assets/logo-sonamvie.png';

const menuItems = [
  { title: 'Tableau de bord', url: '/admin', icon: LayoutDashboard },
  { title: 'Paramétrage Produit', url: '/admin/parametrage', icon: Settings },
  { title: 'Gestion Contrats', url: '/admin/contrats', icon: FileText },
  { title: 'Encaissements', url: '/admin/finances', icon: CreditCard },
  { title: 'Gestion Sinistres', url: '/admin/sinistres', icon: AlertTriangle },
  { title: 'Anti-fraude', url: '/admin/fraude', icon: ShieldAlert },
  { title: 'Reporting', url: '/admin/reporting', icon: BarChart3 },
  { title: 'Utilisateurs', url: '/admin/utilisateurs', icon: Users },
  { title: 'Communication', url: '/admin/communication', icon: MessageSquare },
  { title: 'Outils', url: '/admin/outils', icon: Wrench },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r-sidebar-border">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          {!collapsed && <><img src={logoSonam} alt="SONAM" className="h-8" /><span className="text-xs font-semibold text-sidebar-foreground">ADMIN</span></>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Back-Office</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/admin'} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
