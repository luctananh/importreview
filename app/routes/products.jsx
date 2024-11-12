import { authenticator } from "../server/auth.server.js";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { NavLink, useNavigation } from "react-router-dom";
import { useState } from "react";
import "../styles/home.css";
import "../styles/Navigation.css";
import "../styles/setting.css";
import "../styles/responsive.css";
import "../styles/review_table.css";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@nextui-org/react";
import { Link } from "@remix-run/react";
import { Tabs, Tab, Card, CardBody, Switch } from "@nextui-org/react";
import { Toaster, toast } from "sonner";
import Product_table from "./Product_table_vs2.jsx";

import { useFetcher } from "@remix-run/react";
import { getSession, commitSession } from "../server/auth.server.js";
import { action as deleteProductAction } from "./deleteproduct.jsx";
import { action as deleteReviewAction } from "./delete_review.jsx";
import { action as downloandReviews } from "./downloand_reviews.jsx";
import { useSearchParams } from "@remix-run/react";

const prisma = new PrismaClient();

export async function loader({ request }) {
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return json({ error: "User not authenticated" }, { status: 401 });
  }

  let existingUser = await prisma.user.findUnique({
    where: { email: user._json.email },
  });

  if (!existingUser) {
    existingUser = await prisma.user.create({
      data: {
        email: user._json.email,
        userName: user._json.name,
        picture: user._json.picture,
        isEmailVerified: user._json.email_verified,
      },
    });
  }

  const session = await getSession(request.headers.get("Cookie"));

  if (!session.get("userId")) {
    session.set("userId", existingUser.id);
  }

  const cookieHeader = await commitSession(session);

  const products = await prisma.product.findMany({
    where: { userId: existingUser.id },
    include: {
      reviews: true,
    },
  });

  const productsWithReviewCount = products.map((product) => ({
    ...product,
    reviewCount: product.reviews.length,
  }));

  return json(
    { user, products: productsWithReviewCount },
    { headers: { "Set-Cookie": cookieHeader } }
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const actionType = formData.get("_actionType");
  console.log("action type:" + actionType);

  if (actionType === "Delete_product") {
    return await deleteProductAction({ formData });
  } else if (actionType === "Delete_review") {
    return await deleteReviewAction({ formData });
  } else if (actionType === "download") {
    return await downloandReviews({ formData });
  }
}

export default function Home() {
  const { user, products } = useLoaderData();
  const [isVertical, setIsVertical] = useState(true);
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  const initialTab = searchParams.get("tab") || "Products";
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!user) {
    return <p>Loading...</p>;
  }
  console.log(user);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const url = new URL(window.location);
    url.searchParams.delete("tab");
    window.history.replaceState({}, document.title, url);
  };

  const fetcher = useFetcher();
  const logout = () => {
    fetcher.submit(null, { method: "post", action: "/auth/logout" });
  };

  return (
    <>
      <Navbar className="custom-navbar2">
        <div className="navbar-left">
          {/* Logo ở bên trái */}
          <NavbarBrand>
            <img className="logo_icon" src="./logo.png" alt="logo" />
          </NavbarBrand>
        </div>

        {/* Nội dung trung tâm */}
        <NavbarContent className="navbar-center hidden sm:flex gap-4">
          <NavbarItem>
            <Link color="foreground" href="#">
              {/* Features */}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#" aria-current="page">
              {/* Customers */}
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="#">
              {/* Integrations */}
            </Link>
          </NavbarItem>
        </NavbarContent>

        <div className="navbar-right">
          {/* Avatar ở bên phải */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="success"
                name={user._json.name}
                size="sm"
                src={user._json.picture}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{user._json.name}</p>
                <p className="font-semibold">{user._json.email}</p>
              </DropdownItem>
              <DropdownItem key="help_and_feedback">
                Help & Feedback
              </DropdownItem>
              <DropdownItem key="logout" color="danger">
                <Button onClick={logout}> Sign Out </Button>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </Navbar>

      <div className="card_slide">
        <div className="card_navar">
          <nav className="side-nav">
            <ul>
              <li>
                <NavLink to="/products" exact activeClassName="active">
                  <div className="nava_product">
                    <img src="/productst.svg" alt="product-icon" />
                    <p>Products</p>
                  </div>
                </NavLink>
              </li>
              <li>
                <NavLink to="/review_table" activeClassName="active">
                  <div className="nava_product">
                    <img src="/review.svg" alt="review-icon" />
                    <p>Reviews</p>
                  </div>
                </NavLink>
              </li>
              <li>
                <NavLink to="/setting" activeClassName="active">
                  <div className="nava_product">
                    <img src="/setting.svg" alt="seting-icon" />
                    <p>Setting</p>
                  </div>
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
        <div className="product_table">
          <div className="navbar-container">
            <nav>
              <ul>
                <li>
                  <NavLink to="/products" exact activeClassName="active">
                    Products
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/review_table" activeClassName="active">
                    Reviews
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/setting" activeClassName="active">
                    Setting
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>
          <div className="card_text2">
            <h1>Proructs</h1>
            <Link className="add_button" to="/Insert/product">
              <Button color="default" radius="sm" variant="faded">
                <img src="./plus.svg" alt="add_button" />
                <p>Add product</p>
              </Button>
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="no-reviews">
              No products available. Please add a product.
            </p>
          ) : (
            <Product_table />
          )}
        </div>
      </div>
    </>
  );
}
