import Link from "next/link";
import { Button } from "@/components/ui/button";

function Header() {
  return (
    <nav className="border-b  sticky top-0 z-50 bg-background">
      <div className="flex h-16 items-center container mx-auto">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold">Knowledge EC</span>
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          <Button variant="default" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Header;
