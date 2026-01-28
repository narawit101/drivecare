import BottomNavbar from "@/components/navigation-menu/bottom-navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return ( 
    <div className="flex flex-col min-h-screen bg-surface-dim">
      {children}
      <BottomNavbar />
    </div>
  );
}
