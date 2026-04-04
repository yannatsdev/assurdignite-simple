import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, CreditCard, Users, AlertTriangle, HeadphonesIcon, FolderOpen, User, PlusCircle } from 'lucide-react';
import logoSonam from '@/assets/logo-sonamvie.png';
import logoAssurDignite from '@/assets/logo-assurdignite.png';

const menuItems = [
  { title: 'Tableau de bord', url: '/client', icon: LayoutDashboard },
  { title: 'Souscrire', url: '/client/souscrire', icon: PlusCircle },
  { title: 'Mes Contrats', url: '/client/contrats', icon: FileText },
  { title: 'Paiements', url: '/client/paiements', icon: CreditCard },
  { title: 'Bénéficiaires', url: '/client/beneficiaires', icon: Users },
  { title: 'Sinistre', url: '/client/sinistre', icon: AlertTriangle },
  { title: 'Assistance', url: '/client/assistance', icon: HeadphonesIcon },
  { title: 'Documents', url: '/client/documents', icon: FolderOpen },
  { title: 'Profil', url: '/client/profil', icon: User },
];

export function ClientSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          {!collapsed && (
            <>
              <img src={logoSonam} alt="SONAM" className="h-8" />
              <img src={logoAssurDignite} alt="AssurDignité" className="h-6" />
            </>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/client'} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
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
