import { Menu } from "lucide-react";

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <>
  <header>
    Kopora
  </header>

    <button type="button" onClick={onMenuClick} aria-label="Buka menu navigasi">
      <Menu size={22} />
    </button>
  </>
  );
  
}
