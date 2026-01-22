type SidebarItem = {
  type: "item";
  label: string;
  icon: string;
  href: string;
};

type SidebarSection = {
  type: "section";
  title: string;
};

export type SidebarMenu = SidebarItem | SidebarSection;