// import "../styles/Home.css";
import { useState } from "react";
import { Button, ButtonGroup } from "@nextui-org/react";
import { Link } from "@nextui-org/react";
import { Form } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import "../styles/index.css";
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
// import { action as LoginSite } from "./auth.auth0";
export const meta = () => {
  return [
    { title: "importify" },
    { name: "import review aliexpress", content: "crawl review aliexpress" },
  ];
};

export default function Index() {
  const fetcher = useFetcher();
  const fetcher2 = useFetcher();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleAuth0Login = () => {
    fetcher.load("/auth/auth0?prompt=login");
  };
  const logout = () => {
    fetcher2.submit(null, { method: "post", action: "/auth/logout" });
  };

  const toggleDropdown = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = ["Dashboard", "Team Settings", "Help & Feedback"];
  return (
    <>
      <header>
        <Navbar className="custom-navbar" onMenuOpenChange={setIsMenuOpen}>
          <NavbarContent>
            <NavbarMenuToggle
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              className="sm:hidden"
            />
            <NavbarBrand>
              <img src="./logo.png" alt="logo" height={"70px"} width={"70px"} />
            </NavbarBrand>
          </NavbarContent>

          <NavbarContent className="hidden sm:flex gap-4" justify="center">
            <NavbarItem>
              <Link color="foreground" href="#">
                {/* //them vao day */}
              </Link>
            </NavbarItem>
            <NavbarItem isActive>
              <Link href="#" aria-current="page">
                {/* //them vao day */}
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link color="foreground" href="#">
                {/* //them vao day */}
              </Link>
            </NavbarItem>
          </NavbarContent>
          <NavbarContent justify="end">
            <NavbarItem>
              <Button onClick={handleAuth0Login} color="primary" variant="flat">
                Sign Up
              </Button>
            </NavbarItem>
          </NavbarContent>
          <NavbarMenu>
            {menuItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  color={
                    index === 2
                      ? "primary"
                      : index === menuItems.length - 1
                      ? "danger"
                      : "foreground"
                  }
                  className="w-full"
                  href="#"
                  size="lg"
                >
                  {item}
                </Link>
              </NavbarMenuItem>
            ))}
          </NavbarMenu>
        </Navbar>
      </header>
      <body>
        <div className="background">
          <img src="./banner.jpg" alt="banner" />
        </div>
      </body>
    </>
  );
}
