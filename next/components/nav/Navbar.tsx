"use client";

import Link from "next/link";
import NavItem, { NavItemProps } from "./NavItem";
import MobileNavDropdown from "./MobileNavDropdown";
import SSELogoFull from "../common/SSELogoFull";
import SSELogoSmall from "../common/SSELogoSmall";
import AuthButton from "./AuthButton";


const navItems: NavItemProps[] = [
    {
        title: "Home",
        route: "/",
    },
    {
        title: "About",
        subItems: [
            {
                title: "About Us",
                route: "/about",
            },
            {
                title: "Get Involved",
                route: "/about/get-involved",
            },
            {
                title: "Leadership",
                route: "/about/leadership",
            },
            {
                title: "Committees",
                route: "/about/committees",
            },
            {
                title: "Constitution",
                route: "/about/constitution",
            },
            {
                title: "Primary Officer's Policy",
                route: "/about/primary-officers-policy",
            }
        ],
    },
    {
        title: "Mentoring",
        route: "#",
    },
    {
        title: "Events",
        subItems: [
            {
                title: "View Calendar",
                route: "/events/calendar",
            },
            {
                title: "Winter Ball",
                route: "#",
            },
            {
                title: "Spring Fling",
                route: "#",
            },
        ],
    },
    {
        title: "Projects",
        route: "#",
    },
    { // Go links dropdown should be extracted to it's own component since the nav items are dynamic (depending on what's pinned)
        title: "Go Links",
        subItems: [
            {
                title: "View All",
                route: "#",
            },
            {
                title: "Go Link 1",
                route: "#",
            },
            {
                title: "Go Link 2",
                route: "#",
            },
            {
                title: "Go Link 3",
                route: "#",
            },
        ],
    }
];

const Navbar: React.FC = () => {
    const blurOnClick = (e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).blur();
    };

    return (
        <nav
            id="navbar"
            className="sticky top-0 z-50 flex items-center justify-center bg-base-100 bg-opacity-0 filter backdrop-blur-sm"
        >
            <div
                id="nav-content"
                className="flex flex-row flex-nowrap justify-between text-center items-center 
                           w-full h-auto px-8 lg:px-24 xl:px-40 py-2"
            >
                <Link
                    onClick={blurOnClick}
                    href="/"
                    className="flex flex-row items-center justify-center group focus:outline-offset-8 rounded-md  "
                >
                    {/* Responsively display either the small or full logo depending on screen width */}
                    <div className="xl:hidden">
                        <SSELogoSmall />
                    </div>
                    <div className="hidden xl:block xl:visible">
                        <SSELogoFull />
                    </div>
                </Link>
                <div className="hidden md:visible md:inline-flex">
                    <ul className="inline-flex flex-row flex-nowrap justify-between text-center text-lg">
                        {navItems.map((navItem, index) => (
                            <NavItem key={index} {...navItem} onClickFunc={blurOnClick} />
                        ))}
                        <li className="flex flex-row justify-center items-center">
                            <AuthButton />
                        </li>
                    </ul>
                </div>
                <div className="dropdown dropdown-end md:hidden">
                    <div className="flex flex-row">
                        <Hamburger />
                    </div>
                    <MobileNavDropdown navItems={navItems} onClickFunc={blurOnClick} />
                </div>
            </div>
        </nav>
    );
};

const Hamburger: React.FC = () => {
    return (
        <label
            title="Open Menu"
            tabIndex={0}
            role="button"
            className="hover:cursor-pointer"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                />
            </svg>
        </label>
    );
};

export default Navbar;
